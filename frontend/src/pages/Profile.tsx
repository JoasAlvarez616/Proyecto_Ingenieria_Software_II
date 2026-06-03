import React, { useState } from 'react';
import api from '../services/api';
import { authService } from '../services/auth';
import { toast } from 'react-hot-toast';
import { User, Key, Save } from 'lucide-react';

export function Profile() {
  const currentUser = authService.getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.nombre_completo || '');
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('El nombre completo es requerido');
      return;
    }
    setLoading(true);
    try {
      const response = await api.put('/users/me/profile', { nombre_completo: profileName });
      toast.success('Perfil actualizado correctamente');
      
      // Update local storage user
      if (currentUser) {
        const updatedUser = { ...currentUser, nombre_completo: response.data.nombre_completo };
        localStorage.setItem('hotel_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('hotelConfigUpdated')); // Trigger re-render in Layout
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.detail || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('La contraseña nueva debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.put('/users/me/password', {
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      });
      toast.success('Contraseña cambiada correctamente');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.detail || 'La contraseña anterior es incorrecta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fade-in-up 0.4s ease' }}>
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Mi Perfil
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-xs) 0 0 0', fontSize: '0.95rem' }}>
          Gestione sus datos de acceso personales y su contraseña.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Card: Datos Personales */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 var(--space-lg) 0', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--accent-primary)' }} />
            Datos de la Cuenta
          </h3>
          
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label>Usuario</label>
              <input 
                type="text" 
                className="form-control" 
                value={currentUser?.username || ''} 
                disabled 
                style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }} 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>El nombre de usuario es inmutable.</span>
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label>Nombre Completo</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={profileName} 
                onChange={e => setProfileName(e.target.value)} 
                placeholder="Ej. Juan Pérez" 
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={16} />
              {loading ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </form>
        </div>

        {/* Card: Seguridad */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 var(--space-lg) 0', fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: 'var(--accent-primary)' }} />
            Seguridad (Contraseña)
          </h3>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
              <label>Contraseña Anterior</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                value={passwordForm.oldPassword} 
                onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} 
                placeholder="••••••••" 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
              <label>Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                value={passwordForm.newPassword} 
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                placeholder="Mínimo 6 caracteres" 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label>Confirmar Nueva Contraseña</label>
              <input 
                type="password" 
                className="form-control" 
                required 
                value={passwordForm.confirmPassword} 
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                placeholder="Repita la nueva contraseña" 
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Key size={16} />
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
