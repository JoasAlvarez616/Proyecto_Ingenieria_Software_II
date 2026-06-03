import { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, DollarSign, Calendar, TrendingUp, CreditCard, Banknote, BedDouble, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Modal } from '../components/Modal';

interface IngresosData {
  resumen_ingresos: {
    ingresos_netos: number;
    ingresos_brutos: number;
    total_devoluciones: number;
  };
  ingresos_por_metodo_pago: {
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  };
  ingresos_por_tipo_habitacion: {
    tipo: string;
    total_reservas: number;
    ingresos: number;
  }[];
  resumen_reservas: {
    total: number;
    completadas: number;
    canceladas: number;
    en_curso?: number;
    pendientes?: number;
  };
  estadisticas: {
    promedio_noches_por_reserva: number;
    total_habitaciones_activas: number;
    total_clientes_activos: number;
  };
}

interface OcupacionData {
  ocupacion_por_habitacion: {
    habitacion_id: number;
    numero: string;
    tipo: string;
    precio_base: number;
    total_reservas: number;
    noches_ocupadas: number;
    tasa_ocupacion: string;
    ingresos_generados: number;
  }[];
}

export function Reports() {
  const [dataIngresos, setDataIngresos] = useState<IngresosData | null>(null);
  const [dataOcupacion, setDataOcupacion] = useState<OcupacionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fechas de filtro (por defecto mes actual)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    tablasAtomicas: { name: string; data: any[] }[];
    ingresosData: any[];
    reservasData: any[];
    metodosData: any[];
    ocupacionData: any[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Historial');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
      const [resIngresos, resOcupacion] = await Promise.all([
        api.get('/reports/ingresos', { params }),
        api.get('/reports/ocupacion', { params })
      ]);
      setDataIngresos(resIngresos.data);
      setDataOcupacion(resOcupacion.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedData = async () => {
    try {
      // 1. Fetch ALL data for the master history log
      const [clientesRes, reservasRes, pagosRes, roomsRes] = await Promise.all([
        api.get('/clients', { params: { limit: 5000 } }),
        api.get('/reservations', { params: { limit: 5000 } }),
        api.get('/payments', { params: { limit: 5000 } }),
        api.get('/rooms', { params: { limit: 5000 } })
      ]);

      const clientes = clientesRes.data.data;
      const reservas = reservasRes.data.data;
      const pagos = pagosRes.data.data;
      const habitaciones = roomsRes.data.data;

      // Helpers para formateo de datos
      const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
      };

      const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        // Treat as UTC to avoid timezone shifts for simple dates
        const d = new Date(dateStr + 'T12:00:00Z');
        return d.toLocaleDateString('es-ES');
      };

      const formatCurrency = (amount: number | undefined | null) => {
        if (amount == null) return '$0';
        return `$${amount.toLocaleString('es-ES')}`;
      };

      const capitalize = (str: string) => {
        if (!str) return '-';
        return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      };

      // 2. Build Tablas Atómicas para Historial
      const tipoDocFormat = (tipo: string) => tipo ? tipo.replace('_', ' ').toUpperCase() : '-';

      const clientesList = clientes.map((c: any) => ({
        'ID Cliente': c.id,
        'Doc. Tipo': tipoDocFormat(c.tipo_documento),
        'Doc. Número': c.numero_documento || '-',
        'Nombre Completo': capitalize(c.nombre_completo),
        'Email': c.email || '-',
        'Teléfono': c.telefono || '-',
        'País': capitalize(c.pais) || 'Colombia',
        'Nacionalidad': c.es_extranjero ? 'Extranjero' : 'Nacional'
      }));

      const habitacionesList = habitaciones.map((h: any) => ({
        'ID Habitación': h.id,
        'Número': h.numero || '-',
        'Tipo': capitalize(h.tipo),
        'Precio Noche': formatCurrency(h.precio_base),
        'Estado Actual': capitalize(h.estado)
      }));

      const reservasList = reservas.map((r: any) => ({
        'ID Reserva': r.id,
        'ID Cliente': r.cliente_id,
        'ID Habitación': r.habitacion_id,
        'Estado': capitalize(r.estado),
        'Ingreso Esperado': formatDate(r.fecha_entrada),
        'Salida Esperada': formatDate(r.fecha_salida),
        'Costo Total': formatCurrency(r.costo_total),
        'Monto Pagado': formatCurrency(r.monto_pagado),
        'Fecha Registro': formatDateTime(r.creado_en)
      }));

      const pagosList = pagos.map((p: any) => ({
        'ID Pago': p.id,
        'ID Reserva': p.reserva_id,
        'Monto': formatCurrency(p.monto),
        'Método': capitalize(p.metodo_pago),
        'Tipo Pago': capitalize(p.tipo_pago),
        'Fecha Transacción': formatDateTime(p.fecha_pago)
      }));

      const tablasAtomicas = [
        { name: 'TABLA: CLIENTES', data: clientesList },
        { name: 'TABLA: HABITACIONES', data: habitacionesList },
        { name: 'TABLA: RESERVAS', data: reservasList },
        { name: 'TABLA: PAGOS', data: pagosList }
      ];

      return { 
        tablasAtomicas, 
        ingresosData: dataIngresos!, 
        ocupacionData: dataOcupacion! 
      };
    } catch (error) {
      console.error('Error fetching details:', error);
      throw error;
    }
  };

  const showPreview = async () => {
    if (!dataIngresos || !dataOcupacion) return;
    setPreviewLoading(true);
    toast.loading('Cargando vista previa...', { id: 'preview-load' });
    try {
      const { tablasAtomicas, ingresosData: dIngresos, ocupacionData: dOcupacion } = await fetchDetailedData();
      
      const ingresosData = [
        { Concepto: 'Ingresos Brutos', Monto: dIngresos.resumen_ingresos.ingresos_brutos },
        { Concepto: 'Ingresos Netos', Monto: dIngresos.resumen_ingresos.ingresos_netos },
        { Concepto: 'Total Devoluciones', Monto: dIngresos.resumen_ingresos.total_devoluciones }
      ];

      const reservasData = [
        { Estado: 'Completadas', Cantidad: dIngresos.resumen_reservas.completadas },
        { Estado: 'Canceladas', Cantidad: dIngresos.resumen_reservas.canceladas },
        { Estado: 'En Curso', Cantidad: dIngresos.resumen_reservas.en_curso },
        { Estado: 'Pendientes', Cantidad: dIngresos.resumen_reservas.pendientes }
      ];

      const metodosData = [
        { Método: 'Efectivo', Ingresos: dIngresos.ingresos_por_metodo_pago.efectivo },
        { Método: 'Tarjeta', Ingresos: dIngresos.ingresos_por_metodo_pago.tarjeta },
        { Método: 'Transferencia', Ingresos: dIngresos.ingresos_por_metodo_pago.transferencia },
      ];

      const ocupacionData = dOcupacion.ocupacion_por_habitacion.map((h: any) => ({
        Habitación: h.numero,
        Tipo: h.tipo.charAt(0).toUpperCase() + h.tipo.slice(1),
        'Precio Base': h.precio_base,
        Reservas: h.total_reservas,
        'Noches Ocupadas': h.noches_ocupadas,
        'Tasa de Ocupación': h.tasa_ocupacion,
        'Ingresos Generados': h.ingresos_generados
      }));

      setPreviewData({ tablasAtomicas, ingresosData, reservasData, metodosData, ocupacionData });
      toast.dismiss('preview-load');
      setIsPreviewOpen(true);
    } catch (error) {
      toast.error('Error al cargar la vista previa', { id: 'preview-load' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!dataIngresos || !dataOcupacion) return;

    // Toast feedback since this might take a second to fetch extra data
    toast.loading('Generando reporte Excel detallado...', { id: 'excel-export' });

    try {
      const { tablasAtomicas, ingresosData: dIngresos, ocupacionData: dOcupacion } = await fetchDetailedData();

      // Hoja 1: Ingresos
      const ingresosData = [
        { Concepto: 'Ingresos Brutos', Monto: dIngresos.resumen_ingresos.ingresos_brutos },
        { Concepto: 'Ingresos Netos', Monto: dIngresos.resumen_ingresos.ingresos_netos },
        { Concepto: 'Total Devoluciones', Monto: dIngresos.resumen_ingresos.total_devoluciones }
      ];

      // Hoja 2: Reservas
      const reservasData = [
        { Estado: 'Completadas', Cantidad: dIngresos.resumen_reservas.completadas },
        { Estado: 'Canceladas', Cantidad: dIngresos.resumen_reservas.canceladas },
        { Estado: 'En Curso', Cantidad: dIngresos.resumen_reservas.en_curso },
        { Estado: 'Pendientes', Cantidad: dIngresos.resumen_reservas.pendientes }
      ];

      // Hoja 3: Método de Pago
      const metodosData = [
        { Método: 'Efectivo', Ingresos: dIngresos.ingresos_por_metodo_pago.efectivo },
        { Método: 'Tarjeta', Ingresos: dIngresos.ingresos_por_metodo_pago.tarjeta },
        { Método: 'Transferencia', Ingresos: dIngresos.ingresos_por_metodo_pago.transferencia },
      ];

      // Hoja 4: Ocupación por Habitación
      const ocupacionData = dOcupacion.ocupacion_por_habitacion.map((h: any) => ({
        Habitación: h.numero,
        Tipo: h.tipo.charAt(0).toUpperCase() + h.tipo.slice(1),
        'Precio Base': h.precio_base,
        Reservas: h.total_reservas,
        'Noches Ocupadas': h.noches_ocupadas,
        'Tasa de Ocupación': h.tasa_ocupacion,
        'Ingresos Generados': h.ingresos_generados
      }));

      // Crear Workbook
      const wb = XLSX.utils.book_new();

      // Hoja Historial (Múltiples tablas atómicas)
      const wsHistorial = XLSX.utils.json_to_sheet([]); // Create empty sheet
      let currentRowOffset = 0;

      tablasAtomicas.forEach((tabla) => {
        // Add table title as a row
        XLSX.utils.sheet_add_json(wsHistorial, [{ [Object.keys(tabla.data[0] || { 'Dato': '' })[0]]: tabla.name }], { origin: `A${currentRowOffset + 1}`, skipHeader: true });
        
        // Add actual table data
        XLSX.utils.sheet_add_json(wsHistorial, tabla.data, { origin: `A${currentRowOffset + 2}` });
        
        // Calculate new offset: title (1) + header (1) + data rows + spacing (2)
        currentRowOffset += 1 + 1 + tabla.data.length + 2;
      });

      XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ingresosData), 'Resumen Ingresos');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reservasData), 'Estado Reservas');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metodosData), 'Métodos de Pago');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ocupacionData), 'Ocupación');

      XLSX.writeFile(wb, `Reporte_General_Hotel_${fechaInicio}_al_${fechaFin}.xlsx`);
      
      toast.success('Excel generado exitosamente con historial completo', { id: 'excel-export' });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      toast.error('Error al generar el Excel', { id: 'excel-export' });
    }
  };

  const getProgressWidth = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle">Rendimiento financiero y ocupación por período.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Desde:</span>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Hasta:</span>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            />
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={showPreview} disabled={previewLoading}>
            <Eye size={16} strokeWidth={1.5} /> {previewLoading ? 'Cargando...' : 'Vista Previa'}
          </button>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={exportToExcel}>
            <Download size={16} strokeWidth={1.5} /> Exportar
          </button>
          <button className="btn-primary" onClick={fetchReport}>Actualizar Datos</button>
        </div>
      </div>

      {loading || !dataIngresos || !dataOcupacion ? (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando estadísticas...</div>
      ) : (
        <>
          {/* Fila 1: KPIs Principales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
            
            {/* Ingresos Netos */}
            <div className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ingresos Netos
                </h3>
                <div style={{ padding: '8px', backgroundColor: 'var(--accent-light)', borderRadius: 'var(--radius-md)', color: 'var(--accent-primary)' }}>
                  <DollarSign size={20} strokeWidth={1.5} />
                </div>
              </div>
              <p style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                ${dataIngresos.resumen_ingresos.ingresos_netos.toLocaleString('es-ES')}
              </p>
              <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <p>Brutos: ${dataIngresos.resumen_ingresos.ingresos_brutos} | Devoluciones: ${dataIngresos.resumen_ingresos.total_devoluciones}</p>
              </div>
            </div>

            {/* Reservas */}
            <div className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Volumen de Reservas
                </h3>
                <div style={{ padding: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--status-success)' }}>
                  <Calendar size={20} strokeWidth={1.5} />
                </div>
              </div>
              <p style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {dataIngresos.resumen_reservas.total}
              </p>
              <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <p>{dataIngresos.resumen_reservas.completadas} completadas | {dataIngresos.resumen_reservas.canceladas} canceladas</p>
              </div>
            </div>

            {/* Estadísticas Generales */}
            <div className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Estadísticas Globales
                </h3>
                <div style={{ padding: '8px', backgroundColor: 'var(--status-warning-bg)', borderRadius: 'var(--radius-md)', color: 'var(--status-warning)' }}>
                  <TrendingUp size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-xs)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Clientes Activos:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dataIngresos.estadisticas.total_clientes_activos}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-xs)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Habitaciones:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dataIngresos.estadisticas.total_habitaciones_activas}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Promedio Noches:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{dataIngresos.estadisticas.promedio_noches_por_reserva}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Fila 2: Desgloses de Ingresos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
            
            {/* Por Método de Pago */}
            <div className="card">
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} /> Ingresos por Método de Pago
              </h3>
              
              {(() => {
                const { efectivo, tarjeta, transferencia } = dataIngresos.ingresos_por_metodo_pago;
                const totalM = efectivo + tarjeta + transferencia;
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Efectivo */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Banknote size={14} color="var(--status-success)" /> Efectivo</span>
                        <strong>${efectivo.toLocaleString('es-ES')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({getProgressWidth(efectivo, totalM)})</span></strong>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: getProgressWidth(efectivo, totalM), height: '100%', backgroundColor: 'var(--status-success)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    {/* Tarjeta */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={14} color="var(--accent-primary)" /> Tarjeta</span>
                        <strong>${tarjeta.toLocaleString('es-ES')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({getProgressWidth(tarjeta, totalM)})</span></strong>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: getProgressWidth(tarjeta, totalM), height: '100%', backgroundColor: 'var(--accent-primary)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                    {/* Transferencia */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={14} color="var(--status-warning)" /> Transferencia</span>
                        <strong>${transferencia.toLocaleString('es-ES')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({getProgressWidth(transferencia, totalM)})</span></strong>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: getProgressWidth(transferencia, totalM), height: '100%', backgroundColor: 'var(--status-warning)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Por Tipo de Habitación */}
            <div className="card">
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BedDouble size={18} /> Rendimiento por Categoría
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dataIngresos.ingresos_por_tipo_habitacion.length > 0 ? dataIngresos.ingresos_por_tipo_habitacion.map((tipo, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < dataIngresos.ingresos_por_tipo_habitacion.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.95rem', textTransform: 'capitalize' }}>{tipo.tipo}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tipo.total_reservas} Reservas Registradas</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                      ${tipo.ingresos.toLocaleString('es-ES')}
                    </div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay ingresos registrados en este período.</p>
                )}
              </div>
            </div>

          </div>

          {/* Fila 3: Tabla de Ocupación Detallada */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0 }}>Ocupación y Rendimiento por Habitación</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Estadísticas individuales en el período seleccionado.</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Habitación</th>
                  <th>Tipo</th>
                  <th>Precio Base</th>
                  <th>Total Reservas</th>
                  <th>Noches Ocupadas</th>
                  <th>Tasa Ocupación</th>
                  <th style={{ textAlign: 'right' }}>Ingresos Generados</th>
                </tr>
              </thead>
              <tbody>
                {dataOcupacion.ocupacion_por_habitacion.map(h => (
                  <tr key={h.habitacion_id}>
                    <td style={{ fontWeight: 600 }}>{h.numero}</td>
                    <td style={{ textTransform: 'capitalize' }}>{h.tipo}</td>
                    <td>${h.precio_base}</td>
                    <td>{h.total_reservas}</td>
                    <td>{h.noches_ocupadas}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: h.tasa_ocupacion, height: '100%', backgroundColor: 'var(--accent-primary)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{h.tasa_ocupacion}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--status-success)' }}>
                      ${h.ingresos_generados.toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))}
                {dataOcupacion.ocupacion_por_habitacion.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                      No hay datos de ocupación para este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Vista Previa */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Vista Previa" fullScreen>
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['Historial', 'Resumen Ingresos', 'Estado Reservas', 'Métodos de Pago', 'Ocupación'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: activeTab === tab ? 'var(--accent-primary)' : 'var(--bg-primary)',
                  color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { setIsPreviewOpen(false); exportToExcel(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={16} strokeWidth={1.5} /> Exportar Excel Completo
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: '1px', border: '1px solid var(--border-light)' }}>
          
          {/* Renderización especial si es "Historial" y contiene múltiples tablas */}
          {previewData && activeTab === 'Historial' && (
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {previewData.tablasAtomicas.map((tabla, idx) => (
                <div key={idx}>
                  <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{tabla.name}</h3>
                  <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.85rem', margin: 0, border: 'none' }}>
                      <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <tr>
                          {tabla.data.length > 0 && Object.keys(tabla.data[0]).map((key) => (
                            <th key={key} style={{ whiteSpace: 'nowrap' }}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tabla.data.length === 0 ? (
                          <tr><td colSpan={100} style={{ textAlign: 'center', padding: '1rem' }}>Sin datos</td></tr>
                        ) : (
                          tabla.data.map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((val: any, j) => (
                                <td key={j} style={{ whiteSpace: 'nowrap' }}>{val}</td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Renderización normal para el resto de hojas */}
          {previewData && activeTab !== 'Historial' && (
            <table className="data-table" style={{ fontSize: '0.85rem', margin: 0, border: 'none' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  {(() => {
                    let dataToRender: any[] = [];
                    if (activeTab === 'Resumen Ingresos') dataToRender = previewData.ingresosData;
                    if (activeTab === 'Estado Reservas') dataToRender = previewData.reservasData;
                    if (activeTab === 'Métodos de Pago') dataToRender = previewData.metodosData;
                    if (activeTab === 'Ocupación') dataToRender = previewData.ocupacionData;
                    
                    return dataToRender.length > 0 && Object.keys(dataToRender[0]).map((key) => (
                      <th key={key} style={{ whiteSpace: 'nowrap' }}>{key}</th>
                    ));
                  })()}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let dataToRender: any[] = [];
                  if (activeTab === 'Resumen Ingresos') dataToRender = previewData.ingresosData;
                  if (activeTab === 'Estado Reservas') dataToRender = previewData.reservasData;
                  if (activeTab === 'Métodos de Pago') dataToRender = previewData.metodosData;
                  if (activeTab === 'Ocupación') dataToRender = previewData.ocupacionData;

                  if (dataToRender.length === 0) {
                    return (
                      <tr>
                        <td colSpan={100} style={{ textAlign: 'center', padding: '2rem' }}>No hay datos para esta hoja.</td>
                      </tr>
                    );
                  }

                  return dataToRender.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} style={{ whiteSpace: 'nowrap' }}>{val}</td>
                      ))}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
}
