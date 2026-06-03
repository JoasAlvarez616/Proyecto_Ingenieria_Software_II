import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';
import toast from 'react-hot-toast';

interface PrivateRouteProps {
  children: React.ReactElement;
  roles?: ('admin' | 'recepcionista')[];
}

export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const authenticated = authService.isAuthenticated();

  useEffect(() => {
    if (authenticated && roles && !authService.hasRole(roles)) {
      toast.error('Acceso denegado: No tiene los permisos requeridos para esta sección.');
    }
  }, [authenticated, roles]);

  if (!authenticated) {
    // Redirige al login si no está autenticado
    return <Navigate to="/login" replace />;
  }

  if (roles && !authService.hasRole(roles)) {
    // Si no tiene el rol, redirige al Dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}
