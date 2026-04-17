// lib/auth.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id_utilisateur: number;
  id_role: number | null;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserById = async (userId: number) => {
    const { data } = await api.get(`/users/${userId}`);
    return data;
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const userId = decoded.user_id;
        fetchUserById(userId)
          .then(setUser)
          .catch(() => logout())
          .finally(() => setIsLoading(false));
      } catch {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const decoded: any = jwtDecode(data.access);
    const userId = decoded.user_id;
    const userData = await fetchUserById(userId);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}