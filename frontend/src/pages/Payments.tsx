import { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { Voucher } from '../components/Voucher';
import { Pagination } from '../components/Pagination';
import { toast } from 'react-hot-toast';
import { Search, Printer, Edit2, FileText } from 'lucide-react';
import { formatNumberString, handleNumberInput } from '../utils/format';

interface Payment {
  id: number;
  reserva_id: number;
  monto: number;
  metodo_pago: string;
  tipo_pago: string;
  fecha_pago: string;
}

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [formData, setFormData] = useState({ reserva_id: '', monto: 0, metodo_pago: 'efectivo', tipo_pago: 'pago_total' });
  const [montoDisplay, setMontoDisplay] = useState('');
  const [editFormData, setEditFormData] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState<any>(null);

  // Data for dropdown
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    fetchPayments();
  }, [currentPage]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments', {
        params: {
          page: currentPage,
          limit
        }
      });
      setPayments(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await api.get('/reservations', { params: { limit: 500 } });
      setReservations(response.data.data.filter((r: any) => r.estado !== 'cancelada'));
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        reserva_id: parseInt(formData.reserva_id),
        monto: parseFloat(formData.monto.toString()),
        metodo_pago: formData.metodo_pago,
        tipo_pago: formData.tipo_pago
      });
      setIsModalOpen(false);
      setFormData({ reserva_id: '', monto: 0, metodo_pago: 'efectivo', tipo_pago: 'pago_total' });
      setMontoDisplay('');
      toast.success('Pago registrado exitosamente');
      fetchPayments();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      const errorMsg = error.response?.data?.detail || 'Hubo un error al registrar el pago.';
      toast.error(Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    try {
      await api.put(`/payments/${editFormData.id}`, {
        referencia: editFormData.referencia,
        observaciones: editFormData.observaciones
      });
      setIsEditModalOpen(false);
      setEditFormData(null);
      toast.success('Pago actualizado exitosamente');
      fetchPayments();
    } catch (error: any) {
      console.error('Error updating payment:', error);
      const errorMsg = error.response?.data?.detail || 'Hubo un error al actualizar el pago.';
      toast.error(Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg);
    }
  };

  const openEditModal = (payment: Payment) => {
    setEditFormData(payment);
    setIsEditModalOpen(true);
  };

  const fetchAccountStatus = async (reserva_id: number) => {
    try {
      const response = await api.get(`/payments/reserva/${reserva_id}`);
      setAccountStatus(response.data);
      setIsAccountModalOpen(true);
    } catch (error) {
      console.error('Error fetching account status:', error);
      toast.error('Error al consultar estado de cuenta');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="page-title">Pagos</h1>
          <p className="page-subtitle">Historial de transacciones financieras.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} strokeWidth={1.5} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar pago..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none', minWidth: '200px' }}
            />
          </div>
          <button className="btn-primary" onClick={() => { setFormData({ reserva_id: '', monto: 0, metodo_pago: 'efectivo', tipo_pago: 'pago_total' }); setMontoDisplay(''); setIsModalOpen(true); }}>+ Registrar Pago</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-xl)' }}>Cargando pagos...</div>
        ) : (
          <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Recibo #</th>
                <th>Reserva ID</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Concepto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {payments.filter(payment => 
                payment.id.toString().includes(searchTerm) || 
                payment.reserva_id.toString().includes(searchTerm)
              ).map(payment => (
                <tr key={payment.id}>
                  <td style={{ fontWeight: 600 }}>P-{payment.id}</td>
                  <td>R-{payment.reserva_id}</td>
                  <td>{new Date(payment.fecha_pago).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--status-success)' }}>${payment.monto}</td>
                  <td style={{ textTransform: 'capitalize' }}>{payment.metodo_pago}</td>
                  <td style={{ textTransform: 'capitalize' }}>{payment.tipo_pago.replace('_', ' ')}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-action" 
                      onClick={() => setSelectedVoucher(payment)}
                      title="Imprimir"
                    >
                      <Printer size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                      className="btn-action" 
                      onClick={() => openEditModal(payment)}
                      title="Editar Pago"
                    >
                      <Edit2 size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                      className="btn-action" 
                      onClick={() => fetchAccountStatus(payment.reserva_id)}
                      title="Ver Cuenta de Reserva"
                    >
                      <FileText size={16} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
              {payments.filter(payment => 
                payment.id.toString().includes(searchTerm) || 
                payment.reserva_id.toString().includes(searchTerm)
              ).length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    No hay pagos registrados o que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={limit}
            onPageChange={setCurrentPage}
          />
        </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Pago">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reserva Asociada</label>
            <select 
              className="form-control" 
              required 
              value={formData.reserva_id} 
              onChange={e => {
                const resId = e.target.value;
                const selectedRes = reservations.find(r => r.id.toString() === resId);
                let newMonto = 0;
                let newMontoDisplay = '';
                
                if (selectedRes) {
                  const pending = selectedRes.costo_total - selectedRes.monto_pagado;
                  if (formData.tipo_pago === 'pago_total') {
                    newMonto = pending;
                    newMontoDisplay = formatNumberString(pending);
                  }
                }
                
                setFormData({
                  ...formData,
                  reserva_id: resId,
                  monto: newMonto
                });
                setMontoDisplay(newMontoDisplay);
              }}
            >
              <option value="">Seleccione una reserva</option>
              {reservations.map(res => (
                <option key={res.id} value={res.id}>Reserva #{res.id} - Total a Pagar: ${res.costo_total - res.monto_pagado}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Monto ($)</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              value={montoDisplay} 
              onChange={e => {
                const { display, raw } = handleNumberInput(e.target.value, montoDisplay);
                setMontoDisplay(display);
                setFormData({ ...formData, monto: raw });
              }} 
              placeholder="Ej. 200.000"
            />
          </div>
          <div className="form-group">
            <label>Método de Pago</label>
            <select className="form-control" value={formData.metodo_pago} onChange={e => setFormData({...formData, metodo_pago: e.target.value})}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div className="form-group">
            <label>Concepto (Tipo de Pago)</label>
            <select 
              className="form-control" 
              value={formData.tipo_pago} 
              onChange={e => {
                const tipo = e.target.value;
                let newMonto = formData.monto;
                let newMontoDisplay = montoDisplay;
                
                const selectedRes = reservations.find(r => r.id.toString() === formData.reserva_id);
                if (selectedRes) {
                  const pending = selectedRes.costo_total - selectedRes.monto_pagado;
                  if (tipo === 'pago_total') {
                    newMonto = pending;
                    newMontoDisplay = formatNumberString(pending);
                  }
                }
                
                setFormData({
                  ...formData,
                  tipo_pago: tipo,
                  monto: newMonto
                });
                setMontoDisplay(newMontoDisplay);
              }}
            >
              <option value="pago_total">Pago Total</option>
              <option value="adelanto">Adelanto / Reserva</option>
              <option value="pago_parcial">Pago Parcial</option>
              <option value="devolucion">Devolución</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Registrar Pago</button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Pago */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Pago">
        {editFormData && (
          <form onSubmit={handleEditSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Recibo #</label>
              <input type="text" className="form-control" value={`P-${editFormData.id}`} disabled />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Monto</label>
              <input type="text" className="form-control" value={`$${editFormData.monto}`} disabled />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Método de Pago</label>
              <input type="text" className="form-control" value={editFormData.metodo_pago} style={{ textTransform: 'capitalize' }} disabled />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Concepto</label>
              <input type="text" className="form-control" value={editFormData.tipo_pago.replace('_', ' ')} style={{ textTransform: 'capitalize' }} disabled />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Número de Referencia (Opcional)</label>
              <input type="text" className="form-control" placeholder="Ej. # de transferencia" value={editFormData.referencia || ''} onChange={e => setEditFormData({...editFormData, referencia: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Observaciones (Opcional)</label>
              <textarea className="form-control" rows={3} placeholder="Notas adicionales del pago" value={editFormData.observaciones || ''} onChange={e => setEditFormData({...editFormData, observaciones: e.target.value})}></textarea>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-action" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar Cambios</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Estado de Cuenta */}
      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Estado de Cuenta">
        {accountStatus && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reserva ID</span>
              <span style={{ fontWeight: 600 }}>R-{accountStatus.reserva_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Costo Total</span>
              <span style={{ fontWeight: 600 }}>${accountStatus.costo_total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Monto Pagado</span>
              <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>${accountStatus.monto_pagado}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              <span>Saldo Pendiente</span>
              <span style={{ fontWeight: 600, color: accountStatus.saldo_pendiente > 0 ? 'var(--status-error)' : 'var(--text-primary)' }}>
                ${accountStatus.saldo_pendiente}
              </span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Historial de Pagos</h4>
              {accountStatus.pagos.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {accountStatus.pagos.map((p: any) => (
                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>P-{p.id}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>{new Date(p.fecha_pago).toLocaleDateString()}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: p.tipo_pago === 'devolucion' ? 'var(--status-error)' : 'var(--status-success)' }}>
                          {p.tipo_pago === 'devolucion' ? '-' : ''}${p.monto}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {p.metodo_pago}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay pagos registrados.</p>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button className="btn-primary" onClick={() => setIsAccountModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      {selectedVoucher && (
        <Voucher 
          type="Pago" 
          data={selectedVoucher} 
          onClose={() => setSelectedVoucher(null)} 
        />
      )}
    </div>
  );
}
