'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptor, authAPI, LoginResponse } from '@/lib/api';

export type User = {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  id_membre?: string | number; // Supporte UUID et ID classique
  id_role?: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  setSession: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
      setSession(data.access, data.refresh, data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const setSession = (accessToken: string, refreshToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setupAuthInterceptor(accessToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    setupAuthInterceptor(null);
    router.push('/fr/login');
  };

  // ✅ CRITIQUE : Empêche les re-renders inutiles des enfants
  const contextValue = useMemo(() => ({
    user, token, login, setSession, logout, isLoading
  }), [user, token, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}