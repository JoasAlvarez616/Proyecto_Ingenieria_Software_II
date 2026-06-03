import React, { ReactNode, useState, useEffect } from 'react';
import '../styles/layout.css';
import { SidebarLayout } from './sidebar-layout';
import { Link } from 'react-router-dom';

import { Sidebar, SidebarHeader, SidebarBody, SidebarSection, SidebarItem, SidebarLabel, SidebarSpacer, SidebarFooter } from './sidebar';
import { Avatar } from './avatar';
import { authService } from '../services/auth';
import {
  Home,
  Building2,
  Users,
  CalendarDays,
  CreditCard,
  BarChart3,
  LogOut,
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [updateTick, setUpdateTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTick(tick => tick + 1);
    };
    window.addEventListener('hotelConfigUpdated', handleUpdate);
    return () => {
      window.removeEventListener('hotelConfigUpdated', handleUpdate);
    };
  }, []);

  const user = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  return (
    <SidebarLayout
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div style={{ display: 'flex', alignItems: 'center', height: '36px', paddingLeft: '58px', marginTop: '6px' }}>
              <span className="c-sidebar-label" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.08em', color: 'var(--c-text-primary)', textTransform: 'uppercase', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
                SGH
              </span>
            </div>
          </SidebarHeader>
          
          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/">
                <Home size={20} strokeWidth={1.5} />
                <SidebarLabel>Dashboard</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/rooms">
                <Building2 size={20} strokeWidth={1.5} />
                <SidebarLabel>Habitaciones</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/clients">
                <Users size={20} strokeWidth={1.5} />
                <SidebarLabel>Clientes</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/reservations">
                <CalendarDays size={20} strokeWidth={1.5} />
                <SidebarLabel>Reservas</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/payments">
                <CreditCard size={20} strokeWidth={1.5} />
                <SidebarLabel>Pagos</SidebarLabel>
              </SidebarItem>
              {isAdmin && (
                <SidebarItem href="/reports">
                  <BarChart3 size={20} strokeWidth={1.5} />
                  <SidebarLabel>Reportes</SidebarLabel>
                </SidebarItem>
              )}
              {isAdmin && (
                <SidebarItem href="/settings">
                  <Settings size={20} strokeWidth={1.5} />
                  <SidebarLabel>Configuración</SidebarLabel>
                </SidebarItem>
              )}
            </SidebarSection>
            
            <SidebarSpacer />

            <SidebarFooter style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--c-sidebar-border)', paddingTop: '16px' }}>
              {user && (
                <Link
                  to="/profile"
                  className="c-sidebar-user-button"
                >
                  <Avatar initials={(user.nombre_completo || user.username || 'US').substring(0, 2).toUpperCase()} className="avatar" />
                  <div className="c-sidebar-user-details" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.nombre_completo || user.username}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {user.rol === 'admin' ? 'Administrador' : 'Recepcionista'}
                    </span>
                  </div>
                </Link>
              )}
              <SidebarItem onClick={() => authService.logout()} style={{ color: 'var(--status-error)', opacity: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <LogOut size={20} strokeWidth={1.5} />
                <SidebarLabel>Cerrar Sesión</SidebarLabel>
              </SidebarItem>
            </SidebarFooter>
          </SidebarBody>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
}
