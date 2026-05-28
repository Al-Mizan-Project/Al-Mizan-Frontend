'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import { Dossier, DossierStatus } from './dossiers-data';

interface Evaluateur {
  id_utilisateur: number;
  email: string;
  id_role: number;
}

interface Ctx {
  dossiers: Dossier[];
  evaluateurs: Evaluateur[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  affecter: (soumissionId: string, evaluateurIds: number[], type: 'technique' | 'administrative') => Promise<void>;
  soumettre: (soumissionId: string, note: number, commentaire: string, type: 'technique' | 'financiere' | 'administrative') => Promise<void>;
}

export const SoumissionsContext = createContext<Ctx | null>(null);

function mapSoumissionStatus(statut: string): DossierStatus {
  switch (statut) {
    case 'SOUMIS': return 'En attente';
    case 'EN_EVALUATION': return 'En cours';
    case 'EVALU_TERMINEE': return 'Prêt';
    default: return 'En attente';
  }
}

function mapSoumissionEtape(statut: string): Dossier['etape'] {
  switch (statut) {
    case 'SOUMIS': return 'Soumis';
    case 'EN_EVALUATION': return 'Évaluation';
    default: return 'Soumis';
  }
}

interface SoumissionsProviderProps {
  commissionId: number;
  children: ReactNode;
}

export function SoumissionsProvider({ commissionId, children }: SoumissionsProviderProps) {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [evaluateurs] = useState<Evaluateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!commissionId) return;
    setLoading(true);
    setError(null);
    try {
const res = await api.get(`/api/soumissions/by-commission/${commissionId}/`);
      const soumissions: any[] = Array.isArray(res.data)
        ? res.data
        : res.data.results ?? [];

      setDossiers(soumissions.map((s: any) => ({
  id: String(s.id_soumission),
  reference: s.reference || `SOUM-${s.id_soumission}`,
  operateur: s.operateur_nom || 'Opérateur',
  dateSoumission: s.date_soumission?.slice(0, 10) ?? '',
  delaiEvaluation: s.delai_evaluation?.slice(0, 10) ?? '',
  etape: mapSoumissionEtape(s.statut),
  status: mapSoumissionStatus(s.statut),
  commissionId,   // ADD THIS
})));
    } catch {
      setError('Erreur de chargement des soumissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [commissionId]);

  const affecter = async (soumissionId: string, evaluateurIds: number[], type: 'technique' | 'administrative') => {
    await api.post(`/soumissions/${soumissionId}/affecter/`, {
      evaluateur_ids: evaluateurIds,
      type_evaluation: type,
    });
    await load();
  };

  const soumettre = async (soumissionId: string, note: number, commentaire: string, type: 'technique' | 'financiere' | 'administrative') => {
    await api.post(`/soumissions/${soumissionId}/evaluate/`, {
      note,
      commentaire,
      type_evaluation: type,
    });
    await load();
  };

  return (
    <SoumissionsContext.Provider value={{ dossiers, evaluateurs, loading, error, refresh: load, affecter, soumettre }}>
      {children}
    </SoumissionsContext.Provider>
  );
}

export function useSoumissions() {
  const ctx = useContext(SoumissionsContext);
  if (!ctx) throw new Error('useSoumissions must be used within SoumissionsProvider');
  return ctx;
}