import { create } from 'zustand';
import { getCookie, removeCookie } from '@/lib/axios';

export type Role = 'ADMIN' | 'Business Manager' | 'Staff';

export interface User {
  id?: string;
  email?: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setCredentials: (user: User) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Mặc định là true để check token lúc mới load app
  setCredentials: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    removeCookie('accessToken');
    removeCookie('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  checkAuth: () => {
    const token = getCookie('accessToken') || getCookie('refreshToken');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      localStorage.removeItem('user');
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        set({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    }
  }
}));