'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { commissionAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface CommissionInfo {
  id_comission: number;
  nom_comission: string;
  categorie: string;
  role_label: string;
}

interface CommissionCtx {
  commission: CommissionInfo | null;
  loading: boolean;
  error: string | null;
}

const CommissionContext = createContext<CommissionCtx | null>(null);

export function useCommission() {
  const ctx = useContext(CommissionContext);
  if (!ctx) throw new Error('useCommission must be used inside CommissionProvider');
  return ctx;
}

export function CommissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [commission, setCommission] = useState<CommissionInfo | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id_utilisateur) return;
    setLoading(true);
    commissionAPI.getByMembre(user.id_utilisateur)
      .then((data) => {
        setCommission(data);
        setError(null);
      })
      .catch(() => setError('Commission introuvable'))
      .finally(() => setLoading(false));
  }, [user?.id_utilisateur]);

  return (
    <CommissionContext.Provider value={{ commission, loading, error }}>
      {children}
    </CommissionContext.Provider>
  );
}