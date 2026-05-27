import { useEffect, useState } from 'react';
import { api } from '../services/api';

export const Calendar = () => {
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Obtener días del mes actual
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    const lastDay = new Date(year, month + 1, 0);
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, reservationsData] = await Promise.all([
          api.getRooms(),
          api.getReservasRecientes()
        ]);
        setRooms(roomsData);
        setReservations(reservationsData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Obtener reserva para una fecha específica (incluye día de salida)
  const getReservationForDate = (roomId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.find(res => {
      if (res.habitacion_id !== roomId) return false;
      if (res.estado === 'cancelada') return false;
      
      const entrada = res.fecha_entrada;
      const salida = res.fecha_salida;
      
      // Incluye el día de salida como parte de la reserva (para limpieza)
      return dateStr >= entrada && dateStr <= salida;
    });
  };

  // Obtener color de celda según estado (incluyendo día de limpieza)
  const getCellColor = (room, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const reservation = getReservationForDate(room.id, date);
    
    if (!reservation) return 'bg-green-100 hover:bg-green-200';
    
    // Si la fecha es EXACTAMENTE la fecha de salida → DÍA DE LIMPIEZA (gris)
    if (dateStr === reservation.fecha_salida) {
      return 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed';
    }
    
    switch (reservation.estado) {
      case 'pendiente': return 'bg-yellow-100 hover:bg-yellow-200';
      case 'confirmada': return 'bg-blue-100 hover:bg-blue-200';
      case 'en_curso': return 'bg-orange-100 hover:bg-orange-200';
      case 'completada': return 'bg-gray-200';
      default: return 'bg-green-100';
    }
  };

  // Obtener mensaje para tooltip
  const getCellTooltip = (room, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const reservation = getReservationForDate(room.id, date);
    
    if (!reservation) return 'Disponible';
    
    if (dateStr === reservation.fecha_salida) {
      return `🧹 Limpieza - Reserva #${reservation.id}`;
    }
    
    return `Reserva #${reservation.id} - ${reservation.estado}`;
  };

  // Verificar si se puede hacer clic en la celda
  const isCellClickable = (room, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const reservation = getReservationForDate(room.id, date);
    
    if (!reservation) return true;
    if (dateStr === reservation.fecha_salida) return false;
    return true;
  };

  // Obtener icono según estado
  const getEstadoIcono = (estado) => {
    switch (estado) {
      case 'pendiente': return '⏳';
      case 'confirmada': return '✓';
      case 'en_curso': return '🟢';
      case 'completada': return '✅';
      case 'cancelada': return '❌';
      default: return '📋';
    }
  };

  // Manejar click en celda
  const handleCellClick = (room, date) => {
    if (!isCellClickable(room, date)) {
      alert('🧹 Día de limpieza. No se pueden hacer reservas en esta fecha.');
      return;
    }
    const reservation = getReservationForDate(room.id, date);
    setSelectedCell({ room, date, reservation });
    setShowModal(true);
  };

  // Cambiar mes
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-[#C49A6C] font-serif">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="font-serif text-2xl md:text-3xl text-[#1E4A4A]">
          📅 Calendario de Ocupación
        </h1>
        <div className="flex gap-3">
          <button 
            onClick={previousMonth}
            className="px-4 py-2 bg-[#C49A6C] text-white rounded-lg hover:bg-[#1E4A4A] transition text-sm"
          >
            ← Mes anterior
          </button>
          <span className="text-lg font-semibold text-gray-700">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button 
            onClick={nextMonth}
            className="px-4 py-2 bg-[#C49A6C] text-white rounded-lg hover:bg-[#1E4A4A] transition text-sm"
          >
            Mes siguiente →
          </button>
        </div>
      </div>

      {/* Calendario - Vista PC (tabla) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-3 bg-[#1E4A4A] text-white">Habitación</th>
              {days.map((day, idx) => (
                <th key={idx} className="border p-3 bg-[#1E4A4A] text-white text-sm">
                  {day.getDate()}
                  <br />
                  <span className="text-xs opacity-80">
                    {day.toLocaleDateString('es', { weekday: 'short' })}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="border p-3 font-semibold bg-gray-50">
                  <div>#{room.numero}</div>
                  <div className="text-xs text-gray-500">{room.tipo}</div>
                </td>
                {days.map((day, idx) => {
                  const reservation = getReservationForDate(room.id, day);
                  const cellColor = getCellColor(room, day);
                  const clickable = isCellClickable(room, day);
                  return (
                    <td 
                      key={idx}
                      onClick={() => clickable && handleCellClick(room, day)}
                      className={`border p-2 text-center transition ${cellColor} ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      title={getCellTooltip(room, day)}
                    >
                      {reservation && (
                        <div className="text-xs">
                          <div className="font-semibold text-sm">
                            #{reservation.id}
                          </div>
                          <div className="text-xs">
                            {getEstadoIcono(reservation.estado)}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calendario - Vista Móvil (scroll horizontal) */}
      <div className="md:hidden overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(60px,1fr))]">
            <div className="p-2 font-bold bg-[#1E4A4A] text-white sticky left-0">Habitación</div>
            {days.map((day, idx) => (
              <div key={idx} className="p-2 text-center bg-[#1E4A4A] text-white text-xs">
                {day.getDate()}
              </div>
            ))}
            {rooms.map(room => (
              <>
                <div key={`label-${room.id}`} className="p-2 border font-semibold sticky left-0 bg-white">
                  {room.numero}
                </div>
                {days.map((day, idx) => {
                  const reservation = getReservationForDate(room.id, day);
                  const cellColor = getCellColor(room, day);
                  const clickable = isCellClickable(room, day);
                  return (
                    <div 
                      key={idx}
                      onClick={() => clickable && handleCellClick(room, day)}
                      className={`border p-2 text-center ${cellColor} ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      title={getCellTooltip(room, day)}
                    >
                      {reservation && getEstadoIcono(reservation.estado)}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-200 rounded"></div>
          <span className="text-sm">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-yellow-200 rounded"></div>
          <span className="text-sm">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-200 rounded"></div>
          <span className="text-sm">Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-200 rounded"></div>
          <span className="text-sm">En curso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
          <span className="text-sm">🧹 Limpieza (no disponible)</span>
        </div>
      </div>

      {/* Modal de reserva */}
      {showModal && selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-serif text-xl text-[#1E4A4A] mb-4">
              {selectedCell.reservation ? 'Detalles de Reserva' : 'Nueva Reserva'}
            </h3>
            <div className="space-y-3">
              <p><strong>Habitación:</strong> #{selectedCell.room.numero} ({selectedCell.room.tipo})</p>
              <p><strong>Fecha:</strong> {selectedCell.date.toLocaleDateString()}</p>
              {selectedCell.reservation ? (
                <>
                  <p><strong>Reserva #:</strong> {selectedCell.reservation.id}</p>
                  <p><strong>Estado:</strong> {selectedCell.reservation.estado}</p>
                  <p><strong>Total:</strong> ${selectedCell.reservation.costo_total?.toLocaleString()}</p>
                  <p><strong>Pagado:</strong> ${selectedCell.reservation.monto_pagado?.toLocaleString() || 0}</p>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="w-full mt-4 px-4 py-2 bg-[#C49A6C] text-white rounded-lg"
                  >
                    Cerrar
                  </button>
                </>
              ) : (
                <>
                  <p className="text-green-600">✅ Habitación disponible</p>
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      alert('📝 Próximamente: formulario completo de reserva');
                    }}
                    className="w-full mt-4 px-4 py-2 bg-[#1E4A4A] text-white rounded-lg"
                  >
                    Crear reserva
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};