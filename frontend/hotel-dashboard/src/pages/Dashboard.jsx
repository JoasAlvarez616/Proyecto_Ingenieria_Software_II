import { useEffect, useState } from 'react';
import { Bed, CalendarCheck, DollarSign } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentReservations } from '../components/dashboard/RecentReservations';
import { api } from '../services/api';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    habitacionesOcupadas: 0,
    checkinsHoy: 0,
    checkoutsHoy: 0,
    ingresosMes: 0,
  });
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const habitaciones = await api.getRooms();
        const ocupadas = habitaciones.filter(r => r.estado === 'ocupada').length;
        
        const reservasData = await api.getReservasRecientes();
        const hoy = new Date().toISOString().split('T')[0];
        const checkinsHoy = reservasData.filter(r => r.fecha_entrada === hoy && r.estado === 'confirmada').length;
        const checkoutsHoy = reservasData.filter(r => r.fecha_salida === hoy && r.estado === 'en_curso').length;
        
        const fechaInicio = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-01';
        const ingresos = await api.getIngresos(fechaInicio, hoy);
        
        setStats({
          habitacionesOcupadas: ocupadas,
          checkinsHoy,
          checkoutsHoy,
          ingresosMes: ingresos?.ingresos_netos || 0,
        });
        setReservas(reservasData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-[#C49A6C] font-serif">Cargando datos del hotel...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[#1E4A4A] mb-2">
          Panel de Control
        </h1>
        <p className="text-gray-500">Bienvenido de vuelta. Aquí está el resumen de hoy.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          titulo="Habitaciones ocupadas"
          valor={stats.habitacionesOcupadas}
          icono={Bed}
          cambio={3}
          color="bg-[#1E4A4A]"
        />
        <StatCard 
          titulo="Check-ins hoy"
          valor={stats.checkinsHoy}
          icono={CalendarCheck}
          cambio={-2}
          color="bg-[#C49A6C]"
        />
        <StatCard 
          titulo="Check-outs hoy"
          valor={stats.checkoutsHoy}
          icono={CalendarCheck}
          cambio={5}
          color="bg-[#D4C4A8]"
        />
        <StatCard 
          titulo="Ingresos del mes"
          valor={`$${stats.ingresosMes.toLocaleString()}`}
          icono={DollarSign}
          cambio={12}
          color="bg-[#1E4A4A]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentReservations reservas={reservas} />
        
        <div className="card-hotel p-6">
          <h3 className="font-serif text-xl text-[#1E4A4A] mb-4">📊 Ocupación Semanal</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Gráfico de ocupación (próximamente)
          </div>
        </div>
      </div>
    </div>
  );
};