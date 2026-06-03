import api from './api';

export interface User {
  id: number;
  username: string;
  nombre_completo: string;
  rol: 'admin' | 'recepcionista';
  activo: boolean;
  creado_en: string;
  ultimo_acceso?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async login(username: string, password: string): Promise<User> {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    
    const { access_token, user } = response.data;
    localStorage.setItem('hotel_token', access_token);
    localStorage.setItem('hotel_user', JSON.stringify(user));
    return user;
  },

  logout(): void {
    localStorage.removeItem('hotel_token');
    localStorage.removeItem('hotel_user');
    window.location.href = '/login';
  },

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem('hotel_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('hotel_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'admin';
  },

  hasRole(roles: ('admin' | 'recepcionista')[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.rol);
  }
};
