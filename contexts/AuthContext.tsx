'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptor, authAPI, LoginResponse } from '@/lib/api';

export type User = {
  id?: number;
  email: string;
  nom?: string;
  prenom?: string;
  id_membre?: string | number;
  id_role?: number;
  role?: string;
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
      // Redirection en fonction du rôle renvoyé par le service d'auth
      const roleName = (data.user && (data.user.role as string)) || '';
      const idRole = (data.user && (data.user.id as number)) || 0;

      const normalized = roleName.toLowerCase().trim().replace(/\s+/g, '_');
      const ROLE_REDIRECTS: Record<string, string> = {
        admin: '/fr/system-admin',
        operateur_economique: '/fr/dashboard/operator',
        service_contractant: '/fr/dashboard/contractant',
        resp_valid_intern: '/fr/validation/dashboard/commission',
        resp_cm: '/fr/validation/dashboard/commission',
        validateur_interne_cdc: '/fr/validation/dashboard/validatorCDC',
        validateur_interne_marche: '/fr/validation/dashboard/validatorMarche',
        validateur_externe_cdc: '/fr/validation/dashboard/validatorCDC',
        validateur_externe_marche: '/fr/validation/dashboard/validatorMarche',
      };

      if (ROLE_REDIRECTS[normalized]) {
        router.push(ROLE_REDIRECTS[normalized]);
        return;
      }

      if (normalized.includes('admin')) return router.push('/fr/system-admin');
      if (normalized.includes('operateur')) return router.push('/fr/dashboard/operator');
      if (normalized.includes('contractant')) return router.push('/fr/dashboard/contractant');
      if (normalized.includes('resp_valid_intern') || normalized.includes('resp_cm')) return router.push('/fr/validation/dashboard/commission');
      if (normalized.includes('validateur')) {
        if (normalized.includes('cdc')) return router.push('/fr/validation/dashboard/validatorCDC');
        if (normalized.includes('marche')) return router.push('/fr/validation/dashboard/validatorMarche');
        return router.push('/fr/validation/dashboard/validatorCDC');
      }

      // fallback by idRole
      const idRoleMap: Record<number, string> = {
        1: '/fr/system-admin',
        2: '/fr/dashboard/contractant',
        3: '/fr/validation/dashboard/commission',
        4: '/fr/dashboard/operator',
        5: '/fr/dashboard/operator',
      };
      router.push(idRoleMap[idRole] ?? '/fr/dashboard/operator');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
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
    user, token, login, logout, isLoading
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