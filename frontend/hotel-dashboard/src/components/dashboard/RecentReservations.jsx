import { useState } from 'react';
import { Calendar, Users, DollarSign, X } from 'lucide-react';

export const RecentReservations = ({ reservas }) => {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-blue-100 text-blue-800',
      en_curso: 'bg-green-100 text-green-800',
      completada: 'bg-gray-100 text-gray-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      pendiente: '⏳ Pendiente de pago',
      confirmada: '✓ Confirmada',
      en_curso: '🟢 En curso (check-in realizado)',
      completada: '✅ Completada (check-out realizado)',
      cancelada: '❌ Cancelada',
    };
    return textos[estado] || estado;
  };

  const handleVerClick = (reserva) => {
    setSelectedReservation(reserva);
    setShowModal(true);
  };

  return (
    <>
      <div className="card-hotel p-6">
        <h3 className="font-serif text-xl text-[#1E4A4A] mb-4">📋 Reservas Recientes</h3>
        <div className="space-y-3">
          {reservas.slice(0, 5).map((reserva) => (
            <div key={reserva.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Reserva #{reserva.id}</p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {reserva.fecha_entrada} → {reserva.fecha_salida}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {reserva.numero_huespedes || 1} huéspedes</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${reserva.costo_total?.toLocaleString() || 0}</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(reserva.estado)}`}>
                  {reserva.estado}
                </span>
                <button 
                  onClick={() => handleVerClick(reserva)}
                  className="text-[#C49A6C] hover:text-[#1E4A4A] text-sm font-medium transition-colors"
                >
                  Ver →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalles de reserva */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-serif text-xl text-[#1E4A4A]">
                Reserva #{selectedReservation.id}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Estado</p>
                  <p className={`font-semibold ${getEstadoColor(selectedReservation.estado)} inline-block px-2 py-0.5 rounded-full text-xs`}>
                    {getEstadoTexto(selectedReservation.estado)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Habitación</p>
                  <p className="font-semibold">#{selectedReservation.habitacion_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cliente ID</p>
                  <p className="font-semibold">#{selectedReservation.cliente_id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Huéspedes</p>
                  <p className="font-semibold">{selectedReservation.numero_huespedes || 1}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-gray-500 text-sm">Fechas</p>
                <p className="font-semibold">
                  📅 {selectedReservation.fecha_entrada} → {selectedReservation.fecha_salida}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedReservation.numero_noches} noches
                </p>
              </div>

              <div className="border-t pt-3">
                <p className="text-gray-500 text-sm">Financiero</p>
                <div className="flex justify-between">
                  <span>Costo total:</span>
                  <span className="font-semibold">${selectedReservation.costo_total?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pagado:</span>
                  <span>${selectedReservation.monto_pagado?.toLocaleString() || 0}</span>
                </div>
                {selectedReservation.monto_pagado < selectedReservation.costo_total && (
                  <div className="flex justify-between text-red-600 font-semibold mt-1">
                    <span>Saldo pendiente:</span>
                    <span>${(selectedReservation.costo_total - selectedReservation.monto_pagado).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {selectedReservation.observaciones && (
                <div className="border-t pt-3">
                  <p className="text-gray-500 text-sm">Observaciones</p>
                  <p className="text-sm">{selectedReservation.observaciones}</p>
                </div>
              )}

              <div className="border-t pt-3 text-xs text-gray-400">
                Creado: {new Date(selectedReservation.creado_en).toLocaleString()}
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="border-t p-4 flex gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  alert('Próximamente: editar reserva');
                }}
                className="flex-1 px-4 py-2 bg-[#1E4A4A] text-white rounded-lg"
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};