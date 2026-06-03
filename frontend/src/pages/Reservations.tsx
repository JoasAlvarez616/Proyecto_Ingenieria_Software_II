import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { Voucher } from '../components/Voucher';
import { CheckInOutWizard } from '../components/CheckInOutWizard';
import { Pagination } from '../components/Pagination';
import { toast } from 'react-hot-toast';
import { Search, Edit, XCircle, Calendar, List, ChevronLeft, ChevronRight, LogIn, LogOut, Printer, Eye } from 'lucide-react';

interface Reservation {
  id: number;
  habitacion_id: number;
  cliente_id: number;
  fecha_entrada: string;
  fecha_salida: string;
  numero_noches: number;
  costo_total: number;
  monto_pagado: number;
  estado: string;
  observaciones?: string;
  numero_huespedes: number;
}

export function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  
  const [formData, setFormData] = useState({ 
    cliente_id: '', 
    habitacion_id: '', 
    fecha_entrada: '', 
    fecha_salida: '', 
    numero_huespedes: 1, 
    observaciones: '' 
  });

  // Data for dropdowns and calendar
  const [clients, setClients] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);

  // View Mode: 'list' | 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardAction, setWizardAction] = useState<'checkin'|'checkout'|null>(null);
  const [wizardResId, setWizardResId] = useState<number|null>(null);

  const openWizard = (id: number, action: 'checkin' | 'checkout') => {
    setWizardResId(id);
    setWizardAction(action);
    setWizardOpen(true);
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedSearch !== searchTerm) {
        setDebouncedSearch(searchTerm);
        setCurrentPage(1);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch]);

  // Reset page when view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    fetchReservations();
  }, [currentPage, debouncedSearch, viewMode]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [clientsRes, roomsRes] = await Promise.all([
        api.get('/clients', { params: { limit: 500 } }),
        api.get('/rooms', { params: { limit: 500 } })
      ]);
      setClients(clientsRes.data.data);
      setAllRooms(roomsRes.data.data);
      setAvailableRooms(roomsRes.data.data.filter((r: any) => r.estado === 'disponible'));
    } catch (error) {
      console.error('Error fetching dropdown data', error);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const currentLimit = viewMode === 'list' ? 10 : 500;
      const response = await api.get('/reservations', {
        params: {
          page: currentPage,
          limit: currentLimit,
          search: debouncedSearch || undefined
        }
      });
      setReservations(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReservation) {
        const dataToSend = {
          fecha_entrada: formData.fecha_entrada,
          fecha_salida: formData.fecha_salida,
          numero_huespedes: formData.numero_huespedes,
          ...(formData.observaciones && { observaciones: formData.observaciones })
        };
        await api.put(`/reservations/${editingReservation.id}`, dataToSend);
        toast.success('Reserva actualizada exitosamente');
      } else {
        const dataToSend = {
          cliente_id: parseInt(formData.cliente_id),
          habitacion_id: parseInt(formData.habitacion_id),
          fecha_entrada: formData.fecha_entrada,
          fecha_salida: formData.fecha_salida,
          numero_huespedes: formData.numero_huespedes,
          ...(formData.observaciones && { observaciones: formData.observaciones })
        };
        await api.post('/reservations', dataToSend);
        toast.success('Reserva creada exitosamente');
      }
      
      closeModal();
      fetchReservations();
      fetchDropdownData();
    } catch (error: any) {
      console.error('Error saving reservation:', error);
      const errorMsg = error.response?.data?.detail || 'Hubo un error al guardar la reserva.';
      toast.error(Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg);
    }
  };

  const openEditModal = async (res: Reservation) => {
    try {
      const response = await api.get(`/reservations/${res.id}`);
      const fullRes = response.data;
      
      setEditingReservation(fullRes);
      setIsViewOnly(false);
      setFormData({
        cliente_id: fullRes.cliente_id.toString(),
        habitacion_id: fullRes.habitacion_id.toString(),
        fecha_entrada: fullRes.fecha_entrada,
        fecha_salida: fullRes.fecha_salida,
        numero_huespedes: fullRes.numero_huespedes,
        observaciones: fullRes.observaciones || ''
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      toast.error('No se pudo cargar la información de la reserva.');
    }
  };

  const openViewModal = async (res: Reservation) => {
    try {
      const response = await api.get(`/reservations/${res.id}`);
      const fullRes = response.data;
      
      setEditingReservation(fullRes);
      setIsViewOnly(true);
      setFormData({
        cliente_id: fullRes.cliente_id.toString(),
        habitacion_id: fullRes.habitacion_id.toString(),
        fecha_entrada: fullRes.fecha_entrada,
        fecha_salida: fullRes.fecha_salida,
        numero_huespedes: fullRes.numero_huespedes,
        observaciones: fullRes.observaciones || ''
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching reservation details:', error);
      toast.error('No se pudo cargar la información de la reserva.');
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm(`¿Estás seguro de que deseas cancelar la reserva #${id}? Esta acción liberará la habitación.`)) {
      try {
        await api.patch(`/reservations/${id}/cancelar`);
        toast.success('Reserva cancelada exitosamente');
        fetchReservations();
        fetchDropdownData();
      } catch (error: any) {
        console.error('Error canceling reservation:', error);
        const errorMsg = error.response?.data?.detail || 'Hubo un error al cancelar la reserva.';
        toast.error(errorMsg);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReservation(null);
    setIsViewOnly(false);
    setFormData({ cliente_id: '', habitacion_id: '', fecha_entrada: '', fecha_salida: '', numero_huespedes: 1, observaciones: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada':
      case 'completada': return 'var(--status-success)';
      case 'cancelada': return 'var(--status-error)';
      case 'pendiente':
      case 'en_curso': return 'var(--status-warning)';
      default: return 'var(--text-muted)';
    }
  };

  const getClientName = (id: number) => clients.find(c => c.id === id)?.nombre_completo || `Cliente ${id}`;
  const getRoomNumber = (id: number) => allRooms.find(r => r.id === id)?.numero || `${id}`;

  // --- Lógica del Calendario Visual ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const daysInMonthCount = getDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

  const prevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const monthName = monthNames[currentMonth];

  const renderCalendar = () => {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Controles del Mes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-tertiary)' }}>
          <button className="btn-secondary" onClick={prevMonth} style={{ padding: '0.25rem' }}><ChevronLeft size={20} /></button>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '120px', textAlign: 'center' }}>{monthName} {currentYear}</span>
          <button className="btn-secondary" onClick={nextMonth} style={{ padding: '0.25rem' }}><ChevronRight size={20} /></button>
        </div>

        {/* Contenedor del Grid */}
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <div style={{ minWidth: `${daysInMonthCount * 45 + 120}px` }}>
            {/* Cabecera (Días) */}
            <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${daysInMonthCount}, 1fr)`, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', borderRight: '1px solid var(--border-light)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', zIndex: 20 }}>
                Habitación
              </div>
              {daysArray.map(day => (
                <div key={day} style={{ padding: '0.75rem 0', textAlign: 'center', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-light)' }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Filas de Habitaciones */}
            {allRooms.sort((a, b) => a.numero.localeCompare(b.numero)).map(room => {
              // Filtrar reservas para esta habitación en el mes actual
              const roomReservations = reservations.filter(r => r.habitacion_id === room.id && r.estado !== 'cancelada');
              
              return (
                <div key={room.id} style={{ display: 'grid', gridTemplateColumns: `120px repeat(${daysInMonthCount}, 1fr)`, borderBottom: '1px solid var(--border-light)', minHeight: '50px' }}>
                  {/* Etiqueta Habitación */}
                  <div style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid var(--border-light)', position: 'sticky', left: 0, backgroundColor: 'var(--bg-primary)', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nº {room.numero}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{room.tipo.toUpperCase()}</span>
                  </div>

                  {/* Cuadrícula de Días y Bloques de Reserva */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${daysInMonthCount}, 1fr)`, gridColumn: '2 / -1', position: 'relative' }}>
                    {/* Líneas divisorias de los días */}
                    {daysArray.map(day => (
                      <div key={day} style={{ borderRight: '1px dashed var(--border-light)' }} />
                    ))}

                    {/* Bloques de Reservas */}
                    {roomReservations.map(res => {
                      const start = new Date(res.fecha_entrada + "T00:00:00");
                      const end = new Date(res.fecha_salida + "T00:00:00");
                      
                      const calStart = new Date(currentYear, currentMonth, 1);
                      const calEnd = new Date(currentYear, currentMonth, daysInMonthCount);

                      // Solo renderizar si la reserva toca el mes actual
                      if (end < calStart || start > calEnd) return null;

                      // Calcular en qué columnas cae
                      let startCol = 1;
                      if (start >= calStart) {
                        startCol = start.getDate();
                      }

                      let endCol = daysInMonthCount + 1;
                      if (end <= calEnd) {
                        endCol = end.getDate();
                        // Ajuste: si el check-out es el mismo mes, termina esa mañana.
                        // Grid column end es excluyente, así que endCol = día de salida.
                      }

                      // Si el check-in y check-out son el mismo día (improbable pero posible), forzar al menos 1 columna
                      if (startCol === endCol) endCol = startCol + 1;

                      // Estilos Premium del Bloque
                      let bgColor = 'rgba(79, 70, 229, 0.1)'; // Default: Indigo clarito
                      let borderColor = 'var(--accent-primary)';
                      
                      if (res.estado === 'confirmada' || res.estado === 'completada') {
                        bgColor = 'rgba(55, 48, 163, 0.08)';
                        borderColor = 'var(--status-success)';
                      } else if (res.estado === 'en_curso') {
                        bgColor = 'rgba(129, 140, 248, 0.1)';
                        borderColor = 'var(--status-warning)';
                      }

                      return (
                        <div 
                          key={res.id}
                          style={{
                            gridColumn: `${startCol} / ${endCol}`,
                            gridRow: 1,
                            backgroundColor: bgColor,
                            borderLeft: `3px solid ${borderColor}`,
                            margin: '4px 2px',
                            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: 'var(--shadow-sm)',
                            zIndex: 5
                          }}
                          title={`Reserva #${res.id} - ${getClientName(res.cliente_id)}\nEntrada: ${res.fecha_entrada}\nSalida: ${res.fecha_salida}`}
                          onClick={() => (res.estado === 'cancelada' || res.estado === 'completada') ? openViewModal(res) : openEditModal(res)}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '4px' }}>
                            {getClientName(res.cliente_id)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderList = () => {
    return (
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Hab.</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Total</th>
              <th>Pagado</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.id}>
                <td style={{ fontWeight: 600 }}>#{res.id}</td>
                <td>{getClientName(res.cliente_id)}</td>
                <td>Hab. {getRoomNumber(res.habitacion_id)}</td>
                <td>{res.fecha_entrada}</td>
                <td>{res.fecha_salida}</td>
                <td style={{ fontWeight: 500 }}>${res.costo_total}</td>
                <td style={{ color: res.monto_pagado >= res.costo_total ? 'var(--status-success)' : 'var(--text-primary)' }}>
                  ${res.monto_pagado}
                </td>
                <td>
                  <span style={{ color: getStatusColor(res.estado), fontWeight: 500, textTransform: 'capitalize' }}>
                    {res.estado.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn-action"
                      onClick={() => setSelectedVoucher(res)}
                      title="Imprimir Recibo"
                    >
                      <Printer size={16} strokeWidth={1.5} />
                    </button>
                    {(res.estado === 'pendiente' || res.estado === 'confirmada') && (
                      <button 
                        className="btn-action"
                        onClick={() => openWizard(res.id, 'checkin')}
                        title="Procesar Check-in"
                      >
                        <LogIn size={16} strokeWidth={1.5} />
                      </button>
                    )}
                    {res.estado === 'en_curso' && (
                      <button 
                        className="btn-action"
                        onClick={() => openWizard(res.id, 'checkout')}
                        title="Procesar Check-out"
                      >
                        <LogOut size={16} strokeWidth={1.5} />
                      </button>
                    )}
                    {res.estado !== 'cancelada' && res.estado !== 'completada' && (
                      <>
                        <button 
                          className="btn-action"
                          onClick={() => openEditModal(res)}
                          title="Editar"
                        >
                          <Edit size={16} strokeWidth={1.5} />
                        </button>
                        <button 
                          className="btn-action danger"
                          onClick={() => handleCancel(res.id)}
                          title="Cancelar Reserva"
                        >
                          <XCircle size={16} strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                    {(res.estado === 'cancelada' || res.estado === 'completada') && (
                      <button 
                        className="btn-action"
                        onClick={() => openViewModal(res)}
                        title="Ver Detalles"
                      >
                        <Eye size={16} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>No hay reservas registradas o que coincidan con la búsqueda.</td></tr>
            )}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={10}
          onPageChange={setCurrentPage}
        />
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="page-title">Reservas</h1>
          <p className="page-subtitle">Visualiza y gestiona las estancias.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Toggle View Mode */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, backgroundColor: viewMode === 'list' ? 'var(--bg-secondary)' : 'transparent', boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
            >
              <List size={16} strokeWidth={1.5} /> Lista
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, backgroundColor: viewMode === 'calendar' ? 'var(--bg-secondary)' : 'transparent', boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
            >
              <Calendar size={16} strokeWidth={1.5} /> Calendario
            </button>
          </div>

          {viewMode === 'list' && (
            <div style={{ position: 'relative' }}>
              <Search size={16} strokeWidth={1.5} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar reserva..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none', minWidth: '200px' }}
              />
            </div>
          )}
          
          <button className="btn-primary" onClick={() => { setEditingReservation(null); setIsModalOpen(true); }}>+ Nueva Reserva</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando reservas...</div>
      ) : (
        viewMode === 'calendar' ? renderCalendar() : renderList()
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isViewOnly ? "Detalles de la Reserva" : (editingReservation ? "Editar Reserva" : "Crear Reserva")}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cliente</label>
            <select className="form-control" required value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})} disabled={!!editingReservation || isViewOnly}>
              <option value="">Seleccione un cliente</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.nombre_completo} ({client.numero_documento})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Habitación (Solo Disponibles)</label>
            <select className="form-control" required value={formData.habitacion_id} onChange={e => setFormData({...formData, habitacion_id: e.target.value})} disabled={!!editingReservation || isViewOnly}>
              <option value="">Seleccione una habitación</option>
              {editingReservation && !availableRooms.find(r => r.id.toString() === formData.habitacion_id) && (
                <option value={formData.habitacion_id}>Habitación Actual (ID: {formData.habitacion_id})</option>
              )}
              {availableRooms.map(room => (
                <option key={room.id} value={room.id}>Hab. {room.numero} - {room.tipo.toUpperCase()} (${room.precio_base}/noche)</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Entrada</label>
              <input type="date" className="form-control" required value={formData.fecha_entrada} onChange={e => setFormData({...formData, fecha_entrada: e.target.value})} disabled={isViewOnly} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Salida</label>
              <input type="date" className="form-control" required value={formData.fecha_salida} onChange={e => setFormData({...formData, fecha_salida: e.target.value})} disabled={isViewOnly} />
            </div>
          </div>
          <div className="form-group">
            <label>Número de Huéspedes</label>
            <input type="number" className="form-control" required min="1" max="10" value={formData.numero_huespedes} onChange={e => setFormData({...formData, numero_huespedes: parseInt(e.target.value)})} disabled={isViewOnly} />
          </div>
          <div className="form-group">
            <label>Observaciones (Opcional)</label>
            <textarea className="form-control" rows={2} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} disabled={isViewOnly}></textarea>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>{isViewOnly ? "Cerrar" : "Cancelar"}</button>
            {!isViewOnly && <button type="submit" className="btn-primary">{editingReservation ? "Actualizar" : "Crear Reserva"}</button>}
          </div>
        </form>
      </Modal>

      {selectedVoucher && (
        <Voucher 
          type="Reserva" 
          data={selectedVoucher} 
          clientName={getClientName(selectedVoucher.cliente_id)}
          onClose={() => setSelectedVoucher(null)} 
        />
      )}

      <CheckInOutWizard 
        isOpen={wizardOpen} 
        onClose={() => setWizardOpen(false)} 
        reservationId={wizardResId} 
        action={wizardAction} 
        onComplete={() => { fetchReservations(); fetchDropdownData(); }}
      />
    </div>
  );
}
