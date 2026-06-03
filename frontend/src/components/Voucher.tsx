import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import api from '../services/api';
import { authService } from '../services/auth';
import '../styles/print.css';

interface VoucherProps {
  type: 'Reserva' | 'Pago';
  data: any;
  hotelName?: string;
  clientName?: string; // Nuevo prop para pasar el nombre del cliente directamente
  onClose: () => void;
}

export function Voucher({ type, data, clientName, onClose }: VoucherProps) {
  const [hotelConfig, setHotelConfig] = useState({
    nombre: 'Grand Hotel',
    eslogan: 'La mejor experiencia de descanso',
    ruc: '20501234567',
    telefono: '(01) 555-1234',
    logo_url: ''
  });

  const currentUser = authService.getCurrentUser();
  const cashierName = currentUser ? currentUser.username.toUpperCase() : 'ADMIN';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings');
        setHotelConfig(response.data);
      } catch (error) {
        console.error('Error fetching voucher settings:', error);
      }
    };
    fetchSettings();
  }, []);
  
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const transactionId = data.id ? data.id.toString().padStart(8, '0') : '00000000';
  const currentDate = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="modal-overlay">
      <div className="voucher-container print-section">
        
        <div className="voucher-header">
          <div className="voucher-logo-container">
            {hotelConfig.logo_url ? (
              <img src={`http://localhost:8000${hotelConfig.logo_url}`} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '8px' }} />
            ) : (
              <div className="voucher-logo">
                {hotelConfig.nombre.substring(0, 3).toUpperCase()}
              </div>
            )}
          </div>
          <h1>{hotelConfig.nombre}</h1>
          <p>{hotelConfig.eslogan}</p>
          <p>RUC: {hotelConfig.ruc} • TEL: {hotelConfig.telefono}</p>
        </div>

        <div className="voucher-info">
          <div><strong>TICKET:</strong> {type.toUpperCase()} - {transactionId}</div>
          <div><strong>FECHA:</strong> {currentDate}</div>
          <div><strong>CAJERO:</strong> {cashierName}</div>
        </div>

        <div className="voucher-body">
          {type === 'Pago' && (
            <>
              <div className="voucher-row">
                <span>Reserva Ref:</span>
                <span>#{data.reserva_id?.toString().padStart(6, '0')}</span>
              </div>
              <div className="voucher-row">
                <span>Método:</span>
                <span style={{ textTransform: 'uppercase' }}>{data.metodo_pago}</span>
              </div>
              <div className="voucher-row">
                <span>Concepto:</span>
                <span style={{ textTransform: 'uppercase' }}>{data.tipo_pago?.replace('_', ' ')}</span>
              </div>
              {data.referencia && (
                <div className="voucher-row">
                  <span>Ref:</span>
                  <span>{data.referencia}</span>
                </div>
              )}
              <div className="voucher-row total">
                <span>TOTAL ABONADO:</span>
                <span>${data.monto?.toFixed(2)}</span>
              </div>
            </>
          )}

          {type === 'Reserva' && (
            <>
              <div className="voucher-row">
                <span>Huésped:</span>
                <span>{clientName || `Cliente #${data.cliente_id}`}</span>
              </div>
              <div className="voucher-row">
                <span>Habitación:</span>
                <span>ID {data.habitacion_id}</span>
              </div>
              <div className="voucher-row">
                <span>Entrada:</span>
                <span>{data.fecha_entrada}</span>
              </div>
              <div className="voucher-row">
                <span>Salida:</span>
                <span>{data.fecha_salida}</span>
              </div>
              <div className="voucher-row">
                <span>Noches:</span>
                <span>{data.numero_noches}</span>
              </div>
              <div className="voucher-row total">
                <span>COSTO TOTAL:</span>
                <span>${data.costo_total?.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <div className="voucher-footer">
          <p>*** COPIA DE CLIENTE ***</p>
          <p>Gracias por elegir {hotelConfig.nombre}.</p>
          <p>El horario de Check-out es a las 12:00 PM.</p>
          <p>Conserve este ticket para cualquier reclamo.</p>
          
          <div className="voucher-barcode">
            <div className="voucher-barcode-lines"></div>
            <div className="voucher-barcode-text">*{transactionId}*</div>
          </div>
        </div>

        {/* Botones que NO se imprimirán */}
        <div className="print-actions no-print">
          <button className="btn-secondary" onClick={onClose} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Cerrar</button>
          <button className="btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}><Printer size={16} /> Imprimir POS</button>
        </div>
      </div>
    </div>
  );
}
