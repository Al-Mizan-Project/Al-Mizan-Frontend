'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { evaluationAPI } from '@/lib/api';

export interface EvaluationState {
  commission: Record<string, unknown> | null;
  rapport_ct: Record<string, unknown> | null;
  membres: Array<{ id: number; id_utilisateur: number; role_label: string }>;
  registre: {
    entries: unknown[];
    integrite_confirmed: boolean;
    integrite_confirmed_at: string | null;
  };
  seance: {
    data: Record<string, unknown> | null;
    plis: unknown[];
  };
  conformites: unknown[];
  capacites: unknown[];
  evals_technique: unknown[];
  evals_financiere: unknown[];
  classement: unknown[];
  pvs: {
    ouverture: Record<string, unknown> | null;
    evaluation: Record<string, unknown> | null;
  };
  sc_decision: Record<string, unknown> | null;
}

interface EvaluationCtx {
  state: EvaluationState | null;
  loading: boolean;
  error: string | null;
  commissionId: string;
  currentMembreId: number;
  refresh: () => void;

  confirmerIntegrite: () => Promise<void>;
  demarrerSeance: (dateOuverture?: string) => Promise<void>;
  cloturerSeance: () => Promise<void>;
  ouvrirPli: (id_soumission: number, montant?: number) => Promise<void>;
  parapherPli: (id_soumission: number) => Promise<void>;

  updateConformite: (id_soumission: number, payload: Record<string, boolean | null | string>) => Promise<void>;
  updateCapacites: (id_soumission: number, payload: Record<string, unknown>) => Promise<void>;

  updateEvalTechnique: (id_soumission: number, payload: Record<string, unknown>) => Promise<void>;
lockTechniqueOffer: (id_soumission: number, score_total?: number, threshold?: number) => Promise<void>;
  updateEvalFinanciere: (id_soumission: number, payload: Record<string, unknown>) => Promise<void>;
  lockFinanciereOffer: (id_soumission: number) => Promise<void>;

  calculerClassement: () => Promise<void>;
ecarterProvisional: (id_soumission: number, motif: string) => Promise<void>;
  signerPV: (type_pv: 'ouverture' | 'evaluation', reserve?: string) => Promise<void>;
  verrouillerPV: (type_pv: 'ouverture' | 'evaluation') => Promise<void>;
  soumettreAuSC: () => Promise<void>;

  submitCTReport: (report: {
    methodologie: string;
    equipe: string;
    materiels: string;
    anomalies: string;
    avis_global: 'favorable' | 'reserve' | 'defavorable';
  }) => Promise<void>;
}

const EvaluationContext = createContext<EvaluationCtx | null>(null);

export function useEvaluation(): EvaluationCtx {
  const ctx = useContext(EvaluationContext);
  if (!ctx) throw new Error('useEvaluation must be used inside EvaluationProvider');
  return ctx;
}

interface Props {
  commissionId: string;
  currentMembreId: number;
  children: React.ReactNode;
}

export function EvaluationProvider({ commissionId, currentMembreId, children }: Props) {
  const [state, setState] = useState<EvaluationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await evaluationAPI.getState(commissionId);
      setState(data);
      setError(null);
    } catch (e: unknown) {
      const err = e as { response?: { status: number } };
      if (err?.response?.status === 404) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError('endpoint_not_found');
      } else {
        setError('Erreur de synchronisation');
      }
    } finally {
      setLoading(false);
    }
  }, [commissionId]);

  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchState]);

  const act = async (fn: () => Promise<unknown>) => {
    await fn();
    await fetchState();
  };

  const ctx: EvaluationCtx = {
    state,
    loading,
    error,
    commissionId,
    currentMembreId,
    refresh: fetchState,

    confirmerIntegrite: () => act(() => evaluationAPI.confirmerIntegrite(commissionId, currentMembreId)),
    demarrerSeance: (date?) => act(() => evaluationAPI.demarrerSeance(commissionId, date)),
cloturerSeance: () => act(async () => {
  try {
    await evaluationAPI.cloturerSeance(commissionId);
  } catch {
    // already closed — continue
  }
  await evaluationAPI.creerPV(commissionId, 'ouverture');
}),
    ouvrirPli: (id_s, montant?) => act(() => evaluationAPI.ouvrirPli(commissionId, id_s, montant)),
    parapherPli: (id_s) => act(() => evaluationAPI.parapherPli(commissionId, id_s, currentMembreId)),

    updateConformite: (id_s, payload) => act(() => evaluationAPI.updateConformite(commissionId, id_s, payload)),
    updateCapacites: (id_s, payload) => act(() => evaluationAPI.updateCapacites(commissionId, id_s, payload)),

    updateEvalTechnique: (id_s, payload) => act(() => evaluationAPI.updateEvalTechnique(commissionId, id_s, payload)),
lockTechniqueOffer: (id_s, score_total?, threshold?) => act(() => evaluationAPI.lockTechniqueOffer(commissionId, id_s, score_total, threshold)),
    updateEvalFinanciere: (id_s, payload) => act(() => evaluationAPI.updateEvalFinanciere(commissionId, id_s, payload)),
    lockFinanciereOffer: (id_s) => act(() => evaluationAPI.lockFinanciereOffer(commissionId, id_s)),

    calculerClassement: () => act(() => evaluationAPI.calculerClassement(commissionId)),
ecarterProvisional: (id_s, motif) => act(() => evaluationAPI.ecarterProvisional(commissionId, id_s, motif)),
    signerPV: (type_pv, reserve?) => act(() => evaluationAPI.signerPV(commissionId, type_pv, currentMembreId, reserve)),
    verrouillerPV: (type_pv) => act(() => evaluationAPI.verrouillerPV(commissionId, type_pv)),
    soumettreAuSC: () => act(() => evaluationAPI.soumettreAuSC(commissionId)),

    submitCTReport: (report) => act(() => evaluationAPI.submitCTReport(commissionId, report)),
  };

  return <EvaluationContext.Provider value={ctx}>{children}</EvaluationContext.Provider>;
}