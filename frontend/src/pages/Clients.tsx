import { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { toast } from 'react-hot-toast';
import { Search, Edit, Trash2 } from 'lucide-react';
import { COUNTRIES, getFlagUrl } from '../utils/countries';

interface Client {
  id: number;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  telefono: string;
  email: string | null;
  direccion?: string | null;
  es_extranjero: boolean;
  pais: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  
  const [formData, setFormData] = useState({ 
    nombre_completo: '', 
    tipo_documento: 'cedula', 
    numero_documento: '', 
    telefono: '', 
    email: '', 
    direccion: '',
    es_extranjero: false,
    pais: 'Colombia'
  });

  // Debounce effect for search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedSearch !== searchTerm) {
        setDebouncedSearch(searchTerm);
        setCurrentPage(1); // Reset to page 1 on new search
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    fetchClients();
  }, [currentPage, debouncedSearch]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients', {
        params: {
          page: currentPage,
          limit,
          search: debouncedSearch || undefined
        }
      });
      setClients(response.data.data);
      setTotalPages(response.data.total_pages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.email) delete (dataToSend as any).email;
      if (!dataToSend.direccion) delete (dataToSend as any).direccion;
      
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, dataToSend);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await api.post('/clients', dataToSend);
        toast.success('Cliente registrado exitosamente');
      }
      closeModal();
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      const errorMsg = error.response?.data?.detail || 'Hubo un error al guardar el cliente.';
      toast.error(Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      nombre_completo: client.nombre_completo,
      tipo_documento: client.tipo_documento,
      numero_documento: client.numero_documento,
      telefono: client.telefono,
      email: client.email || '',
      direccion: client.direccion || '',
      es_extranjero: client.es_extranjero ?? false,
      pais: client.pais || 'Colombia'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ 
      nombre_completo: '', 
      tipo_documento: 'cedula', 
      numero_documento: '', 
      telefono: '', 
      email: '', 
      direccion: '',
      es_extranjero: false,
      pais: 'Colombia'
    });
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${nombre}?`)) {
      try {
        await api.delete(`/clients/${id}`);
        toast.success('Cliente eliminado exitosamente');
        fetchClients();
      } catch (error: any) {
        console.error('Error deleting client:', error);
        toast.error('Hubo un error al eliminar el cliente.');
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Directorio de huéspedes registrados.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} strokeWidth={1.5} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem', outline: 'none', minWidth: '200px' }}
            />
          </div>
          <button className="btn-primary" onClick={() => { setEditingClient(null); setIsModalOpen(true); }}>+ Nuevo Cliente</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-xl)' }}>Cargando clientes...</div>
        ) : (
          <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Documento</th>
                <th>Origen</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td style={{ fontWeight: 500 }}>{client.nombre_completo}</td>
                  <td>{client.tipo_documento.replace('_', ' ').toUpperCase()} - {client.numero_documento}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={getFlagUrl(client.pais)} 
                        alt={client.pais} 
                        style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px', border: '1px solid var(--border-color)', display: 'inline-block' }} 
                      />
                      {client.pais}
                    </span>
                  </td>
                  <td>{client.telefono}</td>
                  <td>{client.email || <span style={{color: 'var(--text-muted)'}}>No registrado</span>}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => openEditModal(client)}
                        className="btn-action"
                        title="Editar"
                      >
                        <Edit size={16} strokeWidth={1.5} />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id, client.nombre_completo)}
                        className="btn-action danger"
                        title="Eliminar"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    No hay clientes registrados o que coincidan con la búsqueda.
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input type="text" className="form-control" required minLength={3} value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} placeholder="Ej. Juan Pérez" />
          </div>

          <div className="form-group">
            <label>Nacionalidad</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '6px', marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', fontSize: '0.875rem' }}>
                <input 
                  type="radio" 
                  name="es_extranjero" 
                  checked={!formData.es_extranjero} 
                  onChange={() => setFormData({ ...formData, es_extranjero: false, pais: 'Colombia', tipo_documento: 'cedula' })} 
                />
                Nacional (Colombiano)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal', fontSize: '0.875rem' }}>
                <input 
                  type="radio" 
                  name="es_extranjero" 
                  checked={formData.es_extranjero} 
                  onChange={() => setFormData({ ...formData, es_extranjero: true, pais: '', tipo_documento: 'pasaporte' })} 
                />
                Extranjero
              </label>
            </div>
            {!formData.es_extranjero && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(9, 9, 11, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: 'fit-content', marginTop: '6px' }}>
                <img 
                  src="https://flagcdn.com/w20/co.png" 
                  alt="Colombia" 
                  style={{ width: '20px', height: '14px', objectFit: 'cover', borderRadius: '2px', border: '1px solid var(--border-color)' }} 
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Nacionalidad: <strong>Colombia</strong></span>
              </div>
            )}
          </div>

          {formData.es_extranjero && (
            <div className="form-group">
              <label>País de Origen</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {formData.pais && (
                  <img 
                    src={getFlagUrl(formData.pais)} 
                    alt={formData.pais} 
                    style={{ width: '24px', height: '16px', objectFit: 'cover', borderRadius: '2px', border: '1px solid var(--border-color)', flexShrink: 0 }} 
                  />
                )}
                <select 
                  className="form-control" 
                  required 
                  value={formData.pais} 
                  onChange={e => setFormData({ ...formData, pais: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">Seleccione un país...</option>
                  {COUNTRIES.filter(c => c.name !== 'Colombia').map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Tipo de Documento</label>
            <select className="form-control" value={formData.tipo_documento} onChange={e => setFormData({...formData, tipo_documento: e.target.value})}>
              {!formData.es_extranjero ? (
                <>
                  <option value="cedula">Cédula de Ciudadanía</option>
                  <option value="tarjeta_identidad">Tarjeta de Identidad</option>
                  <option value="rut">RUT</option>
                  <option value="nit">NIT</option>
                  <option value="ppt">Permiso por Protección Temporal (PPT)</option>
                </>
              ) : (
                <>
                  <option value="pasaporte">Pasaporte</option>
                  <option value="cedula_extranjeria">Cédula de Extranjería</option>
                  <option value="ppt">Permiso por Protección Temporal (PPT)</option>
                </>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Número de Documento</label>
            <input type="text" className="form-control" required minLength={5} value={formData.numero_documento} onChange={e => setFormData({...formData, numero_documento: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input type="tel" className="form-control" required minLength={7} value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="Ej. 555-1234" />
          </div>
          <div className="form-group">
            <label>Email (Opcional)</label>
            <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="correo@ejemplo.com" />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn-primary">{editingClient ? "Actualizar Cliente" : "Guardar Cliente"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
