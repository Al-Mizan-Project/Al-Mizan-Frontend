'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { setupAuthInterceptor, authAPI, LoginResponse } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = {
  id: number;
  id_utilisateur?: number;  // ← branch adds this
  email: string;
  nom?: string;
  prenom?: string;
  id_membre?: string | number;
  id_role?: number;
  role?: string;            // ← branch adds this
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  setSession: (
    accessToken: string,
    refreshToken: string | null | undefined,  // ← branch: optional
    user: User,
  ) => void;
  logout: () => void;
  isLoading: boolean;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Storage helpers ──────────────────────────────────────────────────────────

const AUTH_STORAGE_KEYS = [      // ← branch adds this (safer than localStorage.clear())
  'access_token',
  'refresh_token',
  'user',
  'member_info',
  'id_membre',
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
  // Branch saves token under 3 keys for legacy compatibility
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('authToken',    accessToken);
  localStorage.setItem('token',        accessToken);

  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  } else {
    localStorage.removeItem('refresh_token');
  }

  localStorage.setItem('user', JSON.stringify(user));
  // The Service Contractant session reads `member_info` / `id_membre`; keep them in sync.
  localStorage.setItem('member_info', JSON.stringify(user));

  if (user.id_membre !== undefined && user.id_membre !== null) {
    localStorage.setItem('membre_id', String(user.id_membre));
    localStorage.setItem('id_membre', String(user.id_membre));
  } else {
    localStorage.removeItem('membre_id');
    localStorage.removeItem('id_membre');
  }
}

function clearAuthSession() {
  // ← branch: surgical removal instead of localStorage.clear()
  //   which would wipe unrelated app data
  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [token, setToken]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser  = localStorage.getItem('user');

    if (storedToken && storedUser && storedUser !== 'undefined') {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
      setupAuthInterceptor(storedToken);
    }

    setIsLoading(false);
  }, []);

  const setSession = (
    accessToken: string,
    refreshToken: string | null | undefined,
    nextUser: User,
  ) => {
    setToken(accessToken);
    setUser(nextUser);
    persistAuthSession({ accessToken, refreshToken, user: nextUser });
    setupAuthInterceptor(accessToken);
  };

  const login = async (email: string, password: string) => {
    try {
      const data: LoginResponse = await authAPI.login(email, password);
      // ← No redirect here: LoginPage handles role-based redirection
      setSession(data.access, data.refresh, data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthSession();                // ← safe, not localStorage.clear()
    setupAuthInterceptor(null);
    router.push('/fr/login');
  };

  const contextValue = useMemo(
    () => ({ user, token, login, setSession, logout, isLoading }),
    [user, token, isLoading],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}