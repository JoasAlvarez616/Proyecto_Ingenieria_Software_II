import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { authService, User as AuthUser } from '../services/auth';
import { Modal } from '../components/Modal';
import { toast } from 'react-hot-toast';
import { 
  Settings as SettingsIcon, 
  Hotel, 
  Users, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Save, 
  UserCheck, 
  UserX 
} from 'lucide-react';

interface HotelConfig {
  id: number;
  nombre: string;
  eslogan: string;
  ruc: string;
  telefono: string;
  direccion: string;
  email: string;
  logo_url?: string;
}

interface UserConfig {
  id: number;
  username: string;
  nombre_completo: string;
  rol: 'admin' | 'recepcionista';
  activo: boolean;
  creado_en: string;
  ultimo_acceso?: string;
}

export function Settings() {
  const currentUser = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'hotel' | 'users'>('hotel');

  // States
  const [loading, setLoading] = useState(false);
  const [hotelConfig, setHotelConfig] = useState<HotelConfig>({
    id: 1,
    nombre: '',
    eslogan: '',
    ruc: '',
    telefono: '',
    direccion: '',
    email: '',
    logo_url: '',
  });

  // Users list (admin only)
  const [users, setUsers] = useState<UserConfig[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserConfig | null>(null);
  
  // Forms
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    rol: 'recepcionista' as 'admin' | 'recepcionista',
    activo: true
  });
  
  const [resetPasswordData, setResetPasswordData] = useState({
    userId: 0,
    username: '',
    newPassword: ''
  });



  useEffect(() => {
    if (isAdmin) {
      fetchHotelConfig();
      fetchUsers();
    }
  }, [isAdmin]);

  // --- API calls ---

  const fetchHotelConfig = async () => {
    try {
      const response = await api.get('/settings');
      setHotelConfig(response.data);
    } catch (error) {
      console.error('Error fetching hotel config:', error);
      toast.error('No se pudo cargar la configuración del hotel');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // --- Handlers ---

  const handleHotelConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/settings', hotelConfig);
      toast.success('Configuración del hotel guardada correctamente');
      // Dispatch custom event to notify other parts of the app (e.g. Layout, Vouchers)
      window.dispatchEvent(new Event('hotelConfigUpdated'));
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      const response = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setHotelConfig(response.data);
      toast.success('Logo actualizado correctamente');
      window.dispatchEvent(new Event('hotelConfigUpdated'));
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.detail || 'Error al subir el logo');
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleLogoDelete = async () => {
    if (!window.confirm("¿Está seguro de que desea eliminar el logo?")) return;
    setLoading(true);
    try {
      const response = await api.delete('/settings/logo');
      setHotelConfig(response.data);
      toast.success('Logo eliminado correctamente');
      window.dispatchEvent(new Event('hotelConfigUpdated'));
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      toast.error(error.response?.data?.detail || 'Error al eliminar el logo');
    } finally {
      setLoading(false);
    }
  };


  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // En edición, password es opcional
        const updateData: any = {
          username: userFormData.username,
          nombre_completo: userFormData.nombre_completo,
          rol: userFormData.rol,
          activo: userFormData.activo
        };
        await api.put(`/users/${editingUser.id}`, updateData);
        toast.success('Usuario actualizado correctamente');
      } else {
        if (!userFormData.password) {
          toast.error('La contraseña es requerida para un nuevo usuario');
          return;
        }
        await api.post('/users', userFormData);
        toast.success('Usuario creado correctamente');
      }
      closeUserModal();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar usuario');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      await api.put(`/users/${resetPasswordData.userId}`, {
        password: resetPasswordData.newPassword
      });
      toast.success(`Contraseña restablecida con éxito para ${resetPasswordData.username}`);
      closePasswordModal();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.detail || 'Error al restablecer contraseña');
    }
  };

  const toggleUserStatus = async (user: UserConfig) => {
    try {
      await api.put(`/users/${user.id}`, { activo: !user.activo });
      toast.success(`Usuario ${user.activo ? 'desactivado' : 'activado'} correctamente`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.detail || 'Error al cambiar estado');
    }
  };

  const handleDeleteUser = async (user: UserConfig) => {
    if (user.id === currentUser?.id) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }
    if (!window.confirm(`¿Está seguro de eliminar al usuario '${user.username}'? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api.delete(`/users/${user.id}`);
      toast.success('Usuario eliminado de la base de datos');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.detail || 'Error al eliminar usuario');
    }
  };

  // --- Modals logic ---

  const openNewUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      password: '',
      nombre_completo: '',
      rol: 'recepcionista',
      activo: true
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserConfig) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      password: '', // Password se deja vacío en edición ordinaria
      nombre_completo: user.nombre_completo,
      rol: user.rol,
      activo: user.activo
    });
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const openPasswordModal = (user: UserConfig) => {
    setResetPasswordData({
      userId: user.id,
      username: user.username,
      newPassword: ''
    });
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Configuración
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-xs) 0 0 0', fontSize: '0.95rem' }}>
            Administre la información del hotel, controle los accesos de usuarios y personalice su cuenta.
          </p>
        </div>
      </div>

      {/* Tabs Header (shown only for Admin) */}
      {isAdmin ? (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '24px', marginBottom: 'var(--space-xl)' }}>
          <button 
            onClick={() => setActiveTab('hotel')}
            style={{
              padding: '12px 4px',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: activeTab === 'hotel' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'hotel' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Hotel size={18} />
            Datos del Hotel
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 4px',
              fontFamily: 'var(--font-heading)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: activeTab === 'users' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'users' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <Users size={18} />
            Usuarios y Roles
          </button>
        </div>
      ) : null}

      {/* Tab Contents */}
      <div style={{ animation: 'fade-in-up 0.4s ease' }}>
        
        {/* TAB 1: HOTEL CONFIGURATION (ADMIN ONLY) */}
        {isAdmin && activeTab === 'hotel' && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ margin: '0 0 var(--space-lg) 0', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
              Información de Impresión y Vouchers
            </h3>
            
            <form onSubmit={handleHotelConfigSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ 
                  width: '100px', height: '100px', borderRadius: 'var(--radius-md)', 
                  backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  {hotelConfig.logo_url ? (
                    <img src={`http://localhost:8000${hotelConfig.logo_url}`} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Hotel size={36} color="var(--text-muted)" />
                  )}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Logo del Establecimiento</h4>
                  <p style={{ margin: '0 0 var(--space-sm) 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recomendado: 512x512px, formato PNG o JPG.</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <Plus size={16} />
                      Subir Imagen
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={loading} />
                    </label>
                    {hotelConfig.logo_url && (
                      <button type="button" className="btn-secondary" style={{ color: 'var(--status-error)', borderColor: 'var(--status-error-bg)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }} onClick={handleLogoDelete} disabled={loading}>
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label>Nombre del Establecimiento</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={hotelConfig.nombre} 
                    onChange={e => setHotelConfig({ ...hotelConfig, nombre: e.target.value })} 
                    placeholder="Ej. Grand Hotel"
                  />
                </div>
                <div className="form-group">
                  <label>Eslogan o Subtítulo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={hotelConfig.eslogan} 
                    onChange={e => setHotelConfig({ ...hotelConfig, eslogan: e.target.value })} 
                    placeholder="Ej. La mejor experiencia de descanso"
                  />
                </div>
                <div className="form-group">
                  <label>RUC / Registro Tributario</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={hotelConfig.ruc} 
                    onChange={e => setHotelConfig({ ...hotelConfig, ruc: e.target.value })} 
                    placeholder="Ej. 20501234567"
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={hotelConfig.telefono} 
                    onChange={e => setHotelConfig({ ...hotelConfig, telefono: e.target.value })} 
                    placeholder="Ej. (01) 555-1234"
                  />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={hotelConfig.direccion} 
                    onChange={e => setHotelConfig({ ...hotelConfig, direccion: e.target.value })} 
                    placeholder="Ej. Av. Principal 123"
                  />
                </div>
                <div className="form-group">
                  <label>Email de contacto</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={hotelConfig.email} 
                    onChange={e => setHotelConfig({ ...hotelConfig, email: e.target.value })} 
                    placeholder="Ej. reservas@grandhotel.com"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--space-md)' }}>
                <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} />
                  {loading ? 'Guardando...' : 'Guardar Información'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT (ADMIN ONLY) */}
        {isAdmin && activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                Cuentas de Usuarios
              </h3>
              <button className="btn-primary" onClick={openNewUserModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} />
                Nuevo Usuario
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>Nombre Completo</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>Usuario</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>Rol</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>Estado</th>
                    <th style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.nombre_completo}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>{u.username}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          backgroundColor: u.rol === 'admin' ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                          color: u.rol === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          border: u.rol === 'admin' ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid var(--border-color)'
                        }}>
                          {u.rol}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          backgroundColor: u.activo ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                          color: u.activo ? 'var(--status-success)' : 'var(--status-error)'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: u.activo ? 'var(--status-success)' : 'var(--status-error)'
                          }} />
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-action" 
                            title={u.activo ? "Desactivar usuario" : "Activar usuario"}
                            onClick={() => toggleUserStatus(u)}
                          >
                            {u.activo ? <UserX size={16} strokeWidth={1.5} style={{color: 'var(--status-error)'}} /> : <UserCheck size={16} strokeWidth={1.5} style={{color: 'var(--status-success)'}} />}
                          </button>
                          <button 
                            className="btn-action" 
                            title="Restablecer Contraseña"
                            onClick={() => openPasswordModal(u)}
                          >
                            <Key size={16} strokeWidth={1.5} />
                          </button>
                          <button 
                            className="btn-action" 
                            title="Editar datos"
                            onClick={() => openEditUserModal(u)}
                          >
                            <Edit size={16} strokeWidth={1.5} />
                          </button>
                          <button 
                            className="btn-action danger" 
                            title="Eliminar usuario"
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === currentUser?.id}
                            style={{ opacity: u.id === currentUser?.id ? 0.3 : 1 }}
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </div>

      {/* MODAL 1: CREATE OR EDIT USER */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={closeUserModal} 
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario de Sistema"}
      >
        <form onSubmit={handleUserSubmit}>
          <div className="form-group">
            <label>Nombre de Usuario (Login)</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              disabled={!!editingUser}
              value={userFormData.username} 
              onChange={e => setUserFormData({ ...userFormData, username: e.target.value })}
              placeholder="Ej. jperez" 
              style={editingUser ? { backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' } : {}}
            />
          </div>
          
          <div className="form-group">
            <label>Nombre Completo</label>
            <input 
              type="text" 
              className="form-control" 
              required 
              value={userFormData.nombre_completo} 
              onChange={e => setUserFormData({ ...userFormData, nombre_completo: e.target.value })}
              placeholder="Ej. Juan Pérez" 
            />
          </div>

          {!editingUser && (
            <div className="form-group">
              <label>Contraseña Inicial</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                value={userFormData.password} 
                onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres" 
              />
            </div>
          )}

          <div className="form-group">
            <label>Rol / Nivel de Acceso</label>
            <select 
              className="form-control" 
              value={userFormData.rol} 
              onChange={e => setUserFormData({ ...userFormData, rol: e.target.value as 'admin' | 'recepcionista' })}
            >
              <option value="recepcionista">Recepcionista</option>
              <option value="admin">Administrador (Super Admin)</option>
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'var(--space-md)' }}>
            <input 
              id="user-active"
              type="checkbox" 
              checked={userFormData.activo} 
              onChange={e => setUserFormData({ ...userFormData, activo: e.target.checked })} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="user-active" style={{ cursor: 'pointer', margin: 0, fontWeight: 500 }}>Cuenta activa (Permitir acceso)</label>
          </div>

          <div className="form-actions" style={{ marginTop: 'var(--space-lg)' }}>
            <button type="button" className="btn-secondary" onClick={closeUserModal}>Cancelar</button>
            <button type="submit" className="btn-primary">
              {editingUser ? "Actualizar Datos" : "Crear Cuenta"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RESET USER PASSWORD BY ADMIN */}
      <Modal 
        isOpen={isPasswordModalOpen} 
        onClose={closePasswordModal} 
        title={`Restablecer Contraseña de ${resetPasswordData.username}`}
      >
        <form onSubmit={handleResetPasswordSubmit}>
          <div className="form-group">
            <label>Nueva Contraseña para el Usuario</label>
            <input 
              type="password" 
              className="form-control" 
              required 
              value={resetPasswordData.newPassword} 
              onChange={e => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
              placeholder="Contraseña de al menos 6 caracteres" 
              autoFocus
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              El usuario podrá cambiarla posteriormente desde su propio panel de configuración.
            </span>
          </div>

          <div className="form-actions" style={{ marginTop: 'var(--space-lg)' }}>
            <button type="button" className="btn-secondary" onClick={closePasswordModal}>Cancelar</button>
            <button type="submit" className="btn-primary">
              Establecer Contraseña
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
