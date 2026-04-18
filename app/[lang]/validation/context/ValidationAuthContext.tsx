'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ValidationUser {
  id_utilisateur: number;
  email: string;
  id_role: number;
  id_organisation?: number;
  nom?: string;
  prenom?: string;
}

interface ValidationAuthContextType {
  user: ValidationUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  role: 'commission' | 'validator' | 'admin' | null;
  organisationId: number | null;
}

const ValidationAuthContext = createContext<ValidationAuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
  role: null,
  organisationId: null,
});

export const useValidationAuth = () => useContext(ValidationAuthContext);

export const ValidationAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ValidationUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuth = () => {
      try {
        const storedToken = 
          localStorage.getItem('access_token') || 
          localStorage.getItem('authToken') || 
          localStorage.getItem('token');

        if (storedToken) {
          setToken(storedToken);
          
          const base64Url = storedToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            window.atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );

          const decoded = JSON.parse(jsonPayload);
          
           setUser({
             id_utilisateur: decoded.user_id || decoded.id || null,
             email: decoded.email || '',
             // @ts-ignore
             role_name: (decoded.role || '').toLowerCase(),
             id_role: decoded.id_role || 0,
             id_organisation: decoded.id_organisation || decoded.org_id || null,
             nom: decoded.nom || decoded.last_name || '',
             prenom: decoded.prenom || decoded.first_name || '',
           } as any);
        }
      } catch (error) {
        console.error('Failed to parse validation auth token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const role: 'commission' | 'validator' | 'admin' | null = React.useMemo(() => {
    if (!user) return null;
     const u = user as any;
     const roleName = u.role_name || '';
     if (u.id_role === 1 || roleName === 'admin') return 'admin';
     if (u.id_role === 2 || u.id_role === 3 || roleName.includes('commission')) return 'commission';
     return 'validator';
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    token,
    role,
    organisationId: user?.id_organisation || null,
  };

  return (
    <ValidationAuthContext.Provider value={value}>
      {children}
    </ValidationAuthContext.Provider>
  );
};
