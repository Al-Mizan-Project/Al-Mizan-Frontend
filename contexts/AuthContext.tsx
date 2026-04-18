'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptor, authAPI, LoginResponse } from '@/lib/api';

type User = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  id_membre?: number;
  id_role?: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load token from localStorage on mount
  useEffect(() => {
  const storedToken = localStorage.getItem('access_token');
const storedUser = localStorage.getItem('user');

if (storedToken && storedUser && storedUser !== 'undefined') {
  setToken(storedToken);
  try {
    setUser(JSON.parse(storedUser));
  } catch (e) {
    console.error('Failed to parse user:', e);
  }
  setupAuthInterceptor(storedToken);
}
setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data: LoginResponse = await authAPI.login(email, password);
      
      setToken(data.access);
      setUser(data.user);
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setupAuthInterceptor(data.access);
      
      // Redirect to dashboard
      router.push('/fr/dashboard'); // Adjust based on your routing
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setupAuthInterceptor(null);
    router.push('/fr/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}