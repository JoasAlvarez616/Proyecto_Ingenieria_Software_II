import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, FileText, CheckCircle, Users, Clock, LogIn, LogOut } from 'lucide-react';
import { CheckInOutWizard } from '../components/CheckInOutWizard';
import { authService } from '../services/auth';

const PIE_COLORS = ['#4F46E5', '#3730A3', '#818CF8'];

export function Dashboard() {
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('sgh_dashboard_startDate');
    if (saved) return saved;
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem('sgh_dashboard_endDate');
    if (saved) return saved;
    return new Date().toISOString().split('T')[0];
  });
  
  const [kpis, setKpis] = useState({
    ingresos_periodo: 0,
    reservas_activas: 0,
    huespedes_hoy: 0,
    saldos_pendientes: 0,
    promedio_noches: 0
  });
  
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [chartDataPayments, setChartDataPayments] = useState<any[]>([]);
  const [chartDataReservations, setChartDataReservations] = useState<any[]>([]);
  const [chartDataRooms, setChartDataRooms] = useState<any[]>([]);
  const [chartDataMethods, setChartDataMethods] = useState<any[]>([]);
  
  const [topRooms, setTopRooms] = useState<any[]>([]);
  const [checkinsHoy, setCheckinsHoy] = useState<any[]>([]);
  const [checkoutsHoy, setCheckoutsHoy] = useState<any[]>([]);
  
  const [clientAnalytics, setClientAnalytics] = useState({
    ultimos: [] as any[],
    frecuentes: [] as any[],
    por_salir: [] as any[]
  });
  
  const [clientTab, setClientTab] = useState<'ultimos' | 'frecuentes' | 'por_salir'>('ultimos');
  
  const [loading, setLoading] = useState(true);

  // Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardAction, setWizardAction] = useState<'checkin'|'checkout'|null>(null);
  const [wizardResId, setWizardResId] = useState<number|null>(null);

  const openWizard = (id: number, action: 'checkin' | 'checkout') => {
    setWizardResId(id);
    setWizardAction(action);
    setWizardOpen(true);
  };

  // Save to localStorage whenever dates change and fetch data
  useEffect(() => {
    if (startDate) localStorage.setItem('sgh_dashboard_startDate', startDate);
    if (endDate) localStorage.setItem('sgh_dashboard_endDate', endDate);
    
    if (startDate && endDate) {
      fetchDashboardData();
    }
  }, [startDate, endDate, chartPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.fecha_inicio = startDate;
      if (endDate) params.fecha_fin = endDate;

      // Promise.all to fetch ALL data simultaneously
      const [ingresosRes, ocupacionRes, reservasRes, pagosRes, clientsRes] = await Promise.all([
        api.get('/reports/ingresos', { params }),
        api.get('/reports/ocupacion', { params }),
        api.get('/reservations/', { params: { limit: 5000 } }),
        api.get('/payments/', { params: { limit: 5000 } }),
        api.get('/clients/', { params: { limit: 5000 } })
      ]);

      const ingresosData = ingresosRes.data;
      const ocupacionData = ocupacionRes.data;
      const reservasData = reservasRes.data.data;
      const pagosData = pagosRes.data.data;
      const clientsData = clientsRes.data.data;

      // --- 1. Calcular KPIs ---
      let reservas_activas = 0;
      let saldos_pendientes = 0;
      let huespedes_hoy = 0;
      
      reservasData.forEach((res: any) => {
        if (res.estado === 'en_curso' || res.estado === 'confirmada') reservas_activas++;
        
        if (res.estado !== 'cancelada') {
          const saldo = res.costo_total - res.monto_pagado;
          if (saldo > 0) saldos_pendientes += saldo;
        }
        
        if (res.estado === 'en_curso') huespedes_hoy += res.numero_huespedes;
      });

      setKpis({
        ingresos_periodo: ingresosData.resumen_ingresos.ingresos_brutos,
        reservas_activas,
        huespedes_hoy,
        saldos_pendientes,
        promedio_noches: ingresosData.estadisticas.promedio_noches_por_reserva
      });

      // --- 2. Gráficos de Tendencias ---
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");
      
      const pagosEnRango = pagosData.filter((p: any) => {
        const d = new Date(p.fecha_pago);
        return d >= start && d <= end && p.tipo_pago !== 'devolucion';
      });

      const groupDataByPeriod = (data: any[], dateField: string, valueField: string | null, period: string) => {
        const grouped = data.reduce((acc: any, item: any) => {
          const dateObj = new Date(item[dateField]);
          if (isNaN(dateObj.getTime())) return acc;
          
          let key = '';
          if (period === 'day') {
            key = dateObj.toISOString().split('T')[0];
          } else if (period === 'week') {
            const firstDayOfYear = new Date(dateObj.getFullYear(), 0, 1);
            const pastDaysOfYear = (dateObj.getTime() - firstDayOfYear.getTime()) / 86400000;
            const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            key = `${dateObj.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
          } else if (period === 'month') {
            key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
          } else if (period === 'year') {
            key = `${dateObj.getFullYear()}`;
          }
          
          if (!acc[key]) acc[key] = 0;
          acc[key] += valueField ? item[valueField] : 1;
          return acc;
        }, {});

        return Object.keys(grouped).sort().map(key => ({
          fecha: key,
          monto: grouped[key] // Usamos 'monto' como key para reutilizar el tooltip en ambos gráficos
        }));
      };

      setChartDataPayments(groupDataByPeriod(pagosEnRango, 'fecha_pago', 'monto', chartPeriod));

      const reservasEnRango = reservasData.map((r:any) => ({ ...r, trend_date: r.fecha_creacion || r.fecha_entrada })).filter((r: any) => {
        const d = new Date(r.trend_date);
        return d >= start && d <= end && r.estado !== 'cancelada';
      });
      
      setChartDataReservations(groupDataByPeriod(reservasEnRango, 'trend_date', null, chartPeriod));

      // --- 3. Gráfico de Barras: Ocupación por tipo ---
      setChartDataRooms(ingresosData.ingresos_por_tipo_habitacion.map((item: any) => ({
        tipo: item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1),
        reservas: item.total_reservas
      })));

      // --- 4. Gráfico Circular: Métodos de Pago ---
      const metodos = ingresosData.ingresos_por_metodo_pago;
      setChartDataMethods([
        { name: 'Efectivo', value: metodos.efectivo },
        { name: 'Tarjeta', value: metodos.tarjeta },
        { name: 'Transferencia', value: metodos.transferencia }
      ].filter(m => m.value > 0));

      // --- 5. Top 5 Habitaciones Rentables ---
      // ocupacion_por_habitacion ya viene ordenado por ingresos desde el backend
      setTopRooms(ocupacionData.ocupacion_por_habitacion.slice(0, 5));

      // --- 6. Acciones de Hoy (Check-ins / Check-outs) ---
      const todayStr = new Date().toISOString().split('T')[0];
      const getClientName = (id: number) => clientsData.find((c: any) => c.id === id)?.nombre_completo || 'Desconocido';
      
      setCheckinsHoy(reservasData
        .filter((r: any) => r.fecha_entrada === todayStr && (r.estado === 'confirmada' || r.estado === 'pendiente'))
        .map((r: any) => ({ ...r, cliente_nombre: getClientName(r.cliente_id) }))
      );
      
      setCheckoutsHoy(reservasData
        .filter((r: any) => r.fecha_salida === todayStr && r.estado === 'en_curso')
        .map((r: any) => ({ ...r, cliente_nombre: getClientName(r.cliente_id) }))
      );

      // --- 7. Analítica de Clientes ---
      // Últimos registrados
      const ultimos = [...clientsData].reverse().slice(0, 5);
      
      // Más frecuentes
      const conteoReservas = reservasData.reduce((acc: any, r: any) => {
        if (r.estado !== 'cancelada') {
          acc[r.cliente_id] = (acc[r.cliente_id] || 0) + 1;
        }
        return acc;
      }, {});
      
      const frecuentes = Object.keys(conteoReservas)
        .map(id => {
          const cid = parseInt(id);
          const c = clientsData.find((x: any) => x.id === cid);
          return c ? { ...c, total_reservas: conteoReservas[cid] } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.total_reservas - a.total_reservas)
        .slice(0, 5);

      // Por terminar estadía (Check-out mañana o pasado)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const por_salir = reservasData
        .filter((r: any) => r.estado === 'en_curso' && r.fecha_salida === tomorrowStr)
        .map((r: any) => ({ 
          cliente_nombre: getClientName(r.cliente_id), 
          habitacion_id: r.habitacion_id, 
          saldo: r.costo_total - r.monto_pagado 
        }))
        .slice(0, 5);

      setClientAnalytics({ ultimos, frecuentes, por_salir });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const user = authService.getCurrentUser();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="page-container">
      {/* Header y Filtros */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">¡{greeting}, {user?.nombre_completo?.split(' ')[0] || 'Bienvenido al sistema'}!</h1>
          <p className="page-subtitle">Panel de Control SGH - Analítica avanzada y estado operativo.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Desde:</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hasta:</label>
            <input 
              type="date" 
              className="form-control" 
              style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={fetchDashboardData} style={{ padding: '0.25rem 1rem' }}>
            Filtrar
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando inteligencia de negocio...</div>
      ) : (
        <>
          {/* Fila 1: Tarjetas KPI Profesionales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Ingresos</h3>
                <p style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>${kpis.ingresos_periodo.toLocaleString('es-ES')}</p>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <DollarSign size={20} color="var(--text-secondary)" />
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldos Pendientes</h3>
                <p style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>${kpis.saldos_pendientes.toLocaleString('es-ES')}</p>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <FileText size={20} color="var(--text-secondary)" />
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reservas Activas</h3>
                <p style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{kpis.reservas_activas}</p>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <CheckCircle size={20} color="var(--text-secondary)" />
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem' }}>
              <div>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Huéspedes de Hoy</h3>
                <p style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{kpis.huespedes_hoy}</p>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <Users size={20} color="var(--text-secondary)" />
              </div>
            </div>
          </div>

          {/* Fila 2: Tendencias de Análisis (Ancho completo) */}
          <div className="card" style={{ marginBottom: 'var(--space-xl)', padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>Análisis de Tendencias</h3>
              <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                {['day', 'week', 'month', 'year'].map((period) => (
                  <button 
                    key={period}
                    onClick={() => setChartPeriod(period as any)}
                    style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.8rem', 
                      borderRadius: 'var(--radius-sm)', 
                      backgroundColor: chartPeriod === period ? 'var(--bg-secondary)' : 'transparent', 
                      boxShadow: chartPeriod === period ? 'var(--shadow-sm)' : 'none', 
                      color: chartPeriod === period ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textTransform: 'capitalize',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                    {period === 'day' ? 'Días' : period === 'week' ? 'Semanas' : period === 'month' ? 'Meses' : 'Años'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', backgroundColor: 'var(--border-light)' }}>
              
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>Ingresos Recaudados</h4>
                <div style={{ width: '100%', height: 220 }}>
                  {chartDataPayments.length > 0 ? (
                    <ResponsiveContainer>
                      <AreaChart data={chartDataPayments} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="ingresoGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818CF8" stopOpacity={0.9} />
                            <stop offset="40%" stopColor="#4F46E5" stopOpacity={0.6} />
                            <stop offset="75%" stopColor="#3730A3" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#1E1B4B" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#A5B4FC" />
                            <stop offset="50%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#4F46E5" />
                          </linearGradient>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                              <feMergeNode in="coloredBlur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="fecha" stroke="var(--text-muted)" fontSize={10} tickMargin={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickFormatter={(val) => `$${val}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
                          formatter={(value: any) => [`$${value.toLocaleString('es-ES')}`, 'Ingresos']}
                          cursor={{ stroke: '#818CF8', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="monto"
                          stroke="url(#lineGradient)"
                          strokeWidth={3}
                          fill="url(#ingresoGradient)"
                          dot={{ r: 4, fill: '#6366F1', stroke: '#A5B4FC', strokeWidth: 2, filter: 'url(#glow)' }}
                          activeDot={{ r: 7, fill: '#818CF8', stroke: '#fff', strokeWidth: 2, filter: 'url(#glow)' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin datos en el período</div>
                  )}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>Volumen de Reservas</h4>
                <div style={{ width: '100%', height: 220 }}>
                  {chartDataReservations.length > 0 ? (
                    <ResponsiveContainer>
                      <AreaChart data={chartDataReservations} margin={{ top: 10, right: 10, bottom: 0, left: -30 }}>
                        <defs>
                          <linearGradient id="reservaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#A5B4FC" stopOpacity={0.8} />
                            <stop offset="50%" stopColor="#818CF8" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="fecha" stroke="var(--text-muted)" fontSize={10} tickMargin={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
                          formatter={(value: any) => [value, 'Reservas']}
                          cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="monto"
                          stroke="#6366F1"
                          strokeWidth={3}
                          fill="url(#reservaGradient)"
                          dot={{ r: 4, fill: '#818CF8', stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin datos en el período</div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Fila 3: Gráficos Auxiliares */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>Ocupación por Tipo</h3>
              <div style={{ width: '100%', height: 250 }}>
                {chartDataRooms.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={chartDataRooms} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="tipo" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
                        cursor={{ fill: 'var(--bg-tertiary)' }}
                      />
                      <Bar dataKey="reservas" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin datos</div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>Medios de Pago</h3>
              <div style={{ width: '100%', height: 250 }}>
                {chartDataMethods.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={chartDataMethods} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {chartDataMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${value.toLocaleString('es-ES')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin datos</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {chartDataMethods.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 3: Operativa y Tablas Analíticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
            
            {/* Panel de Recepción (Check-ins / Check-outs) */}
            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Acciones de Hoy</h3>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--status-success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Llegadas (Check-ins)</h4>
                {checkinsHoy.length > 0 ? checkinsHoy.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Hab. {r.habitacion_id}</span>
                      <span style={{ fontWeight: 500, marginLeft: '0.5rem' }}>{r.cliente_nombre}</span>
                    </div>
                    <button 
                      className="btn-action" 
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => openWizard(r.id, 'checkin')}
                    >
                      <LogIn size={16} strokeWidth={1.5} /> Entrada
                    </button>
                  </div>
                )) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>No hay llegadas programadas para hoy.</p>}

                <h4 style={{ fontSize: '0.85rem', color: 'var(--status-error)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Salidas (Check-outs)</h4>
                {checkoutsHoy.length > 0 ? checkoutsHoy.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Hab. {r.habitacion_id}</span>
                      <span style={{ fontWeight: 500, marginLeft: '0.5rem' }}>{r.cliente_nombre}</span>
                    </div>
                    <button 
                      className="btn-action" 
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => openWizard(r.id, 'checkout')}
                    >
                      <LogOut size={16} strokeWidth={1.5} /> Salida
                    </button>
                  </div>
                )) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay salidas programadas para hoy.</p>}
              </div>
            </div>

            {/* Top Habitaciones Rentables */}
            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Top Habitaciones Rentables</h3>
              </div>
              <table className="data-table" style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent', borderTop: 'none', padding: '0.75rem 1.25rem' }}>Habitación</th>
                    <th style={{ background: 'transparent', borderTop: 'none', padding: '0.75rem 1.25rem', textAlign: 'right' }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {topRooms.length > 0 ? topRooms.map(h => (
                    <tr key={h.habitacion_id}>
                      <td style={{ padding: '0.75rem 1.25rem' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Nº {h.numero}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.tipo.toUpperCase()}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 500, color: 'var(--status-success)' }}>
                        ${h.ingresos_generados.toLocaleString('es-ES')}
                      </td>
                    </tr>
                  )) : <tr><td colSpan={2} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Sin datos</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Analítica de Clientes (Tabs) */}
            <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Analítica de Clientes</h3>
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                  <button 
                    onClick={() => setClientTab('ultimos')}
                    style={{ flex: 1, padding: '0.25rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', backgroundColor: clientTab === 'ultimos' ? 'var(--bg-secondary)' : 'transparent', boxShadow: clientTab === 'ultimos' ? 'var(--shadow-sm)' : 'none', color: clientTab === 'ultimos' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    Últimos
                  </button>
                  <button 
                    onClick={() => setClientTab('frecuentes')}
                    style={{ flex: 1, padding: '0.25rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', backgroundColor: clientTab === 'frecuentes' ? 'var(--bg-secondary)' : 'transparent', boxShadow: clientTab === 'frecuentes' ? 'var(--shadow-sm)' : 'none', color: clientTab === 'frecuentes' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    Frecuentes
                  </button>
                  <button 
                    onClick={() => setClientTab('por_salir')}
                    style={{ flex: 1, padding: '0.25rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', backgroundColor: clientTab === 'por_salir' ? 'var(--bg-secondary)' : 'transparent', boxShadow: clientTab === 'por_salir' ? 'var(--shadow-sm)' : 'none', color: clientTab === 'por_salir' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    Por Salir
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '1.25rem' }}>
                {clientTab === 'ultimos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {clientAnalytics.ultimos.length > 0 ? clientAnalytics.ultimos.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{c.nombre_completo}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reg: {new Date(c.fecha_registro).toLocaleDateString()}</span>
                      </div>
                    )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay clientes registrados.</p>}
                  </div>
                )}

                {clientTab === 'frecuentes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {clientAnalytics.frecuentes.length > 0 ? clientAnalytics.frecuentes.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{c.nombre_completo}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{c.total_reservas} reservas</span>
                      </div>
                    )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay historial suficiente.</p>}
                  </div>
                )}

                {clientTab === 'por_salir' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {clientAnalytics.por_salir.length > 0 ? clientAnalytics.por_salir.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{r.cliente_nombre}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hab. {r.habitacion_id}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', color: r.saldo > 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
                            {r.saldo > 0 ? `Debe $${r.saldo}` : 'Pagado'}
                          </span>
                        </div>
                      </div>
                    )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nadie hace check-out mañana.</p>}
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      <CheckInOutWizard 
        isOpen={wizardOpen} 
        onClose={() => setWizardOpen(false)} 
        reservationId={wizardResId} 
        action={wizardAction} 
        onComplete={fetchDashboardData}
      />
    </div>
  );
}
