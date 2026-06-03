import { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { toast } from 'react-hot-toast';
import { Search, Edit, Trash2 } from 'lucide-react';
import { formatNumberString, handleNumberInput } from '../utils/format';

interface Room {
  id: number;
  numero: string;
  tipo: string;
  capacidad: number;
  precio_base: number;
  estado: string;
}

export function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({ numero: '', tipo: 'simple', capacidad: 1, precio_base: 0, descripcion: '', estado: 'disponible' });
  const [precioDisplay, setPrecioDisplay] = useState('');

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchRooms();
  }, [filterType, filterStatus, currentPage, debouncedSearch]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit,
        search: debouncedSearch || undefined
      };
      if (filterType) params.tipo = filterType;
      if (filterStatus) params.estado = filterStatus;

      const response = await api.get('/rooms', { params });
      setRooms(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.descripcion) delete (dataToSend as any).descripcion;
      
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, dataToSend);
        toast.success('Habitación actualizada exitosamente');
      } else {
        await api.post('/rooms', dataToSend);
        toast.success('Habitación creada exitosamente');
      }
      closeModal();
      fetchRooms(); // Refresh
    } catch (error: any) {
      console.error('Error saving room:', error);
      const errorMsg = error.response?.data?.detail || 'Hubo un error al guardar la habitación.';
      toast.error(Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg);
    }
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      numero: room.numero,
      tipo: room.tipo,
      capacidad: room.capacidad,
      precio_base: room.precio_base,
      descripcion: (room as any).descripcion || '',
      estado: room.estado
    });
    setPrecioDisplay(formatNumberString(room.precio_base));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormData({ numero: '', tipo: 'simple', capacidad: 1, precio_base: 0, descripcion: '', estado: 'disponible' });
    setPrecioDisplay('');
  };

  const handleDelete = async (id: number, numero: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar (desactivar) la habitación ${numero}?`)) {
      try {
        await api.delete(`/rooms/${id}`);
        toast.success('Habitación eliminada exitosamente');
        fetchRooms();
      } catch (error: any) {
        console.error('Error deleting room:', error);
        toast.error('Hubo un error al eliminar la habitación.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'var(--status-success)';
      case 'ocupada': return 'var(--status-error)';
      case 'mantenimiento': return 'var(--status-warning)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'disponible': return 'var(--status-success-bg)';
      case 'ocupada': return 'var(--status-error-bg)';
      case 'mantenimiento': return 'var(--status-warning-bg)';
      default: return 'var(--bg-tertiary)';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="page-title">Habitaciones</h1>
          <p className="page-subtitle">Gestiona las habitaciones del hotel y su disponibilidad.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <option value="">Todos los Tipos</option>
            <option value="simple">Simple</option>
            <option value="doble">Doble</option>
            <option value="triple">Triple</option>
            <option value="suite">Suite</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <option value="">Todos los Estados</option>
            <option value="disponible">Disponible</option>
            <option value="ocupada">Ocupada</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={16} strokeWidth={1.5} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar habitación..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none', minWidth: '200px' }}
            />
          </div>
          <button className="btn-primary" onClick={() => { setEditingRoom(null); setPrecioDisplay(''); setIsModalOpen(true); }}>+ Nueva Habitación</button>
        </div>
      </div>

      {loading ? (
        <p>Cargando habitaciones...</p>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          {rooms.map(room => (
            <div key={room.id} className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <h3 style={{ fontSize: '1.25rem' }}>Hab. {room.numero}</h3>
                <span style={{ 
                  backgroundColor: getStatusBg(room.estado), 
                  color: getStatusColor(room.estado),
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {room.estado}
                </span>
              </div>
              
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
                <p>Tipo: <strong style={{color: 'var(--text-primary)', textTransform: 'capitalize'}}>{room.tipo}</strong></p>
                <p>Capacidad: <strong style={{color: 'var(--text-primary)'}}>{room.capacidad} pers.</strong></p>
              </div>

              <div style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  ${room.precio_base} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400}}>/ noche</span>
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => openEditModal(room)}
                    className="btn-action"
                    title="Editar"
                  >
                    <Edit size={16} strokeWidth={1.5} />
                  </button>
                  <button 
                    onClick={() => handleDelete(room.id, room.numero)}
                    className="btn-action danger"
                    title="Eliminar"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 'var(--space-2xl)', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No hay habitaciones registradas o que coincidan con la búsqueda.</p>
            </div>
          )}
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setCurrentPage}
        />
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingRoom ? "Editar Habitación" : "Nueva Habitación"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Número</label>
            <input type="text" className="form-control" required value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} placeholder="Ej. 101" />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select className="form-control" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
              <option value="simple">Simple</option>
              <option value="doble">Doble</option>
              <option value="triple">Triple</option>
              <option value="suite">Suite</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select 
              className="form-control" 
              value={formData.estado} 
              onChange={e => setFormData({...formData, estado: e.target.value})}
              disabled={editingRoom?.estado === 'ocupada'}
            >
              {editingRoom?.estado === 'ocupada' ? (
                <option value="ocupada">Ocupada (En uso)</option>
              ) : (
                <>
                  <option value="disponible">Disponible</option>
                  <option value="mantenimiento">En Mantenimiento</option>
                </>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Capacidad (personas)</label>
            <input type="number" className="form-control" required min="1" max="10" value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: parseInt(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>Precio Base por Noche ($)</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              value={precioDisplay} 
              onChange={e => {
                const { display, raw } = handleNumberInput(e.target.value, precioDisplay);
                setPrecioDisplay(display);
                setFormData({ ...formData, precio_base: raw });
              }} 
              placeholder="Ej. 200.000"
            />
          </div>
          <div className="form-group">
            <label>Descripción (Opcional)</label>
            <textarea className="form-control" rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn-primary">{editingRoom ? "Actualizar" : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
