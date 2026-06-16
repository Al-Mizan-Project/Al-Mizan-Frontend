'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Appel {
  id: string;
  rawId: number;
  reference: string;
  economicOperator: string;
  submissionDate: string;
  validationDeadline: string;
  status: string;
  etape: string;
  delayDays: number;
  validator: string;
  has_suivi: boolean;
  suivi_count: number;
  suivis: Array<{
    id_utilisateur: number;
    created_at: string;
  }>;
}

type AppelsContextType = {
  selectedAppel: Appel | null;
  setSelectedAppel: (appel: Appel | null) => void;
};

const AppelsContext = createContext<AppelsContextType | undefined>(undefined);

export function AppelsProvider({ children }: { children: ReactNode }) {
  const [selectedAppel, setSelectedAppel] = useState<Appel | null>(null);

  return (
    <AppelsContext.Provider value={{ selectedAppel, setSelectedAppel }}>
      {children}
    </AppelsContext.Provider>
  );
}

export function useAppels() {
  const context = useContext(AppelsContext);
  if (!context) {
    throw new Error('useAppels must be used within AppelsProvider');
  }
  return context;
}
