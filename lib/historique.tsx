'use client';

import {
  createContext, useContext, useReducer,
  useCallback, ReactNode
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AffectationRecord {
  id: string;
  dossierRef: string;
  dossierId: string;
  operateur: string;
  evaluateurNom: string;
  evaluateurId: string;
  domaine: string;
  delaiEvaluation: string;
  affectedAt: Date;
  status: 'En cours' | 'En retard' | 'Prêt';
}

interface HistoriqueState {
  records: AffectationRecord[];
}

type HistoriqueAction =
  | { type: 'ADD'; payload: AffectationRecord }
  | { type: 'UPDATE_STATUS'; dossierId: string; status: AffectationRecord['status'] };

function reducer(state: HistoriqueState, action: HistoriqueAction): HistoriqueState {
  switch (action.type) {
    case 'ADD':
      return { records: [action.payload, ...state.records] };
    case 'UPDATE_STATUS':
      return {
        records: state.records.map(r =>
          r.dossierId === action.dossierId ? { ...r, status: action.status } : r
        ),
      };
    default:
      return state;
  }
}

function makeId() {
  return `aff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface HistoriqueContextValue {
  records: AffectationRecord[];
  recordAffectation: (data: Omit<AffectationRecord, 'id' | 'affectedAt'>) => void;
  updateStatus: (dossierId: string, status: AffectationRecord['status']) => void;
}

const HistoriqueContext = createContext<HistoriqueContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function HistoriqueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { records: [] });

  const recordAffectation = useCallback(
    (data: Omit<AffectationRecord, 'id' | 'affectedAt'>) => {
      dispatch({
        type: 'ADD',
        payload: { ...data, id: makeId(), affectedAt: new Date() },
      });
    },
    []
  );

  const updateStatus = useCallback(
    (dossierId: string, status: AffectationRecord['status']) => {
      dispatch({ type: 'UPDATE_STATUS', dossierId, status });
    },
    []
  );

  return (
    <HistoriqueContext.Provider value={{ records: state.records, recordAffectation, updateStatus }}>
      {children}
    </HistoriqueContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useHistorique() {
  const ctx = useContext(HistoriqueContext);
  if (!ctx) throw new Error('useHistorique must be used within HistoriqueProvider');
  return ctx;
}