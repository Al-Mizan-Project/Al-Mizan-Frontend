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

const SoumissionsContext = createContext<Ctx | null>(null);

// Map soumission status to DossierStatus
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

export function SoumissionsProvider({ children }: { children: ReactNode }) {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [evaluateurs, setEvaluateurs] = useState<Evaluateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load soumissions – note the trailing slash
      const [soumissionsRes, usersRes, rolesRes] = await Promise.all([
        api.get('/api/soumissions/'),
        api.get('/users'),
        api.get('/roles').catch(() => ({ data: [] })),
      ]);

      const soumissions = Array.isArray(soumissionsRes.data) ? soumissionsRes.data : soumissionsRes.data.results ?? [];
      setDossiers(soumissions.map((s: any) => ({
        id: String(s.id_soumission),
        reference: s.reference || `SOUM-${s.id_soumission}`,
        operateur: s.operateur_nom || 'Opérateur',
        dateSoumission: s.date_soumission?.slice(0, 10) ?? '',
        delaiEvaluation: s.delai_evaluation?.slice(0, 10) ?? '',
        etape: mapSoumissionEtape(s.statut),
        status: mapSoumissionStatus(s.statut),
      })));

      const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results ?? [];
      let evaluatorRoleIds: number[] = [];

      if (rolesRes.data && Array.isArray(rolesRes.data)) {
        const roles = rolesRes.data;
        const roleNameToId: Record<string, number> = {};
        for (const r of roles) {
          roleNameToId[r.nom_role] = r.id_role;
        }
        const evaluatorRoleNames = ['evaluateur', 'evaluateur_administratif', 'chef_commission'];
        evaluatorRoleIds = evaluatorRoleNames
          .map(name => roleNameToId[name])
          .filter(id => id !== undefined);
      } else {
        evaluatorRoleIds = [7, 8, 6];
      }

      setEvaluateurs(users.filter((u: any) => evaluatorRoleIds.includes(u.id_role)));
    } catch (err) {
      console.error('Load error', err);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const affecter = async (soumissionId: string, evaluateurIds: number[], type: 'technique' | 'administrative') => {
    await api.post(`/api/soumissions/${soumissionId}/affecter/`, {
      evaluateur_ids: evaluateurIds,
      type_evaluation: type,
    });
    await load();
  };

  const soumettre = async (soumissionId: string, note: number, commentaire: string, type: 'technique' | 'financiere' | 'administrative') => {
    await api.post(`/api/soumissions/${soumissionId}/evaluate/`, {
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