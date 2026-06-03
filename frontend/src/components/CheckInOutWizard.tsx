import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from './Modal';
import { toast } from 'react-hot-toast';
import { formatNumberString, handleNumberInput, parseFormattedNumber } from '../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservationId: number | null;
  action: 'checkin' | 'checkout' | null;
  onComplete: () => void;
}

export function CheckInOutWizard({ isOpen, onClose, reservationId, action, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  
  // Payment Form State
  const [includePayment, setIncludePayment] = useState(false);
  const [monto, setMonto] = useState<number | string>('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [comprobante, setComprobante] = useState('');

  useEffect(() => {
    if (isOpen && reservationId) {
      fetchReservation();
    } else {
      setReservation(null);
      setIncludePayment(false);
      setMonto('');
      setMetodoPago('efectivo');
      setComprobante('');
    }
  }, [isOpen, reservationId]);

  const fetchReservation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/reservations/${reservationId}`);
      setReservation(response.data);
      
      const saldo = response.data.costo_total - response.data.monto_pagado;
      if (action === 'checkout' && saldo > 0) {
        setIncludePayment(true);
        setMonto(formatNumberString(saldo));
      } else {
        setIncludePayment(false);
        setMonto('');
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
      toast.error('No se pudo cargar la información de la reserva.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!reservation) return;
    
    setLoading(true);
    try {
      const saldo = reservation.costo_total - reservation.monto_pagado;

      // 1. Procesar pago si es requerido o seleccionado
      if (includePayment) {
        const montoNum = typeof monto === 'string' ? parseFormattedNumber(monto) : monto;
        
        if (isNaN(montoNum) || montoNum <= 0) {
          toast.error('Por favor ingrese un monto válido mayor a 0.');
          setLoading(false);
          return;
        }

        if (montoNum > saldo) {
          toast.error(`El monto no puede superar el saldo pendiente de $${saldo.toFixed(2)}`);
          setLoading(false);
          return;
        }

        await api.post('/payments/', {
          reserva_id: reservation.id,
          monto: montoNum,
          metodo_pago: metodoPago,
          tipo_pago: action === 'checkout' ? 'liquidacion' : 'adelanto',
          codigo_comprobante: comprobante || undefined
        });
      }

      // 2. Actualizar estado de la reserva
      const nuevoEstado = action === 'checkin' ? 'en_curso' : 'completada';
      await api.put(`/reservations/${reservation.id}`, { estado: nuevoEstado });

      toast.success(action === 'checkin' ? 'Check-in completado exitosamente' : 'Check-out completado exitosamente');
      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error processing:', error);
      const errorMsg = error.response?.data?.detail || 'Hubo un error procesando la solicitud.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Error en la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const saldoPendiente = reservation ? reservation.costo_total - reservation.monto_pagado : 0;
  const isCheckoutBlocked = action === 'checkout' && saldoPendiente > 0 && !includePayment;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={action === 'checkin' ? 'Asistente de Check-in' : 'Asistente de Check-out'}>
      {loading && !reservation ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</div>
      ) : reservation ? (
        <div>
          {/* Resumen */}
          <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Resumen de Estancia</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div><strong>Habitación:</strong> {reservation.habitacion_id}</div>
              <div><strong>Huéspedes:</strong> {reservation.numero_huespedes}</div>
              <div><strong>Entrada:</strong> {reservation.fecha_entrada}</div>
              <div><strong>Salida:</strong> {reservation.fecha_salida}</div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--border-color)', margin: '0.5rem 0' }}></div>
              <div><strong>Costo Total:</strong> ${reservation.costo_total.toFixed(2)}</div>
              <div><strong>Pagado:</strong> ${reservation.monto_pagado.toFixed(2)}</div>
              <div style={{ gridColumn: '1 / -1', fontSize: '1rem', fontWeight: 600, color: saldoPendiente > 0 ? 'var(--status-warning)' : 'var(--status-success)', marginTop: '0.5rem' }}>
                Saldo Pendiente: ${saldoPendiente.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Lógica de Pagos según Acción */}
          {action === 'checkin' && saldoPendiente > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={includePayment} 
                  onChange={(e) => setIncludePayment(e.target.checked)} 
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
                ¿Desea registrar un pago de adelanto ahora mismo?
              </label>
            </div>
          )}

          {action === 'checkout' && saldoPendiente > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--status-warning-bg)', borderLeft: '4px solid var(--status-warning)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--status-warning)', margin: '0 0 0.5rem 0', fontWeight: 600 }}>
                Liquidación Obligatoria
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                El huésped tiene un saldo pendiente. Debe registrar el pago de la diferencia antes de procesar el Check-out.
              </p>
            </div>
          )}

          {/* Formulario de Pago */}
          {includePayment && (
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Detalles del Pago</h4>
              
              <div className="form-group">
                <label>Monto a Pagar ($)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={monto} 
                  onChange={(e) => {
                    const { display } = handleNumberInput(e.target.value, monto.toString());
                    setMonto(display);
                  }} 
                  disabled={action === 'checkout'} // En checkout es estricto liquidar todo
                  placeholder="Ej. 200.000"
                />
              </div>

              <div className="form-group">
                <label>Método de Pago</label>
                <select className="form-control" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta de Crédito / Débito</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              {metodoPago !== 'efectivo' && (
                <div className="form-group">
                  <label>Código de Comprobante / Referencia</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={comprobante} 
                    onChange={(e) => setComprobante(e.target.value)} 
                    placeholder="Ej. TXN-123456"
                  />
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="form-actions">
            <button className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button 
              className="btn-primary" 
              onClick={handleProcess} 
              disabled={loading || isCheckoutBlocked || (includePayment && (!monto || Number(monto) <= 0))}
            >
              {loading ? 'Procesando...' : action === 'checkin' ? 'Completar Check-in' : 'Completar Check-out'}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
