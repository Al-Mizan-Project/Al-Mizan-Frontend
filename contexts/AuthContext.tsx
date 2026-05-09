'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptor, authAPI, LoginResponse } from '@/lib/api';

export type User = {
  id: number;
  id_utilisateur?: number;
  email: string;
  nom?: string;
  prenom?: string;
  id_membre?: string | number; // Supporte UUID et ID classique
  id_role?: number;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  setSession: (accessToken: string, refreshToken: string | null | undefined, user: User) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEYS = [
  'access_token',
  'refresh_token',
  'user',
  'membre_id',
  'authToken',
  'token',
  'validation_token',
] as const;

function persistAuthSession({
  accessToken,
  refreshToken,
  user,
}: {
  accessToken: string;
  refreshToken?: string | null;
  user: User;
}) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('authToken', accessToken);
  localStorage.setItem('token', accessToken);

  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  } else {
    localStorage.removeItem('refresh_token');
  }

  localStorage.setItem('user', JSON.stringify(user));

  if (user.id_membre !== undefined && user.id_membre !== null) {
    localStorage.setItem('membre_id', String(user.id_membre));
  } else {
    localStorage.removeItem('membre_id');
  }
}

function clearAuthSession() {
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

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

  const setSession = (accessToken: string, refreshToken: string | null | undefined, nextUser: User) => {
    setToken(accessToken);
    setUser(nextUser);
    persistAuthSession({ accessToken, refreshToken, user: nextUser });
    setupAuthInterceptor(accessToken);
  };

  const login = async (email: string, password: string) => {
    try {
      const data: LoginResponse = await authAPI.login(email, password);
      setSession(data.access, data.refresh, data.user);
      router.push('/fr/dashboard/contractant');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthSession();
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
