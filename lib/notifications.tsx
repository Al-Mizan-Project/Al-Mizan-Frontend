'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { DOSSIERS, Dossier } from '@/lib/dossiers-data';

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotifType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  subtitle: string;
  description: string;
  dossierRef?: string;
  dossierId?: string;
  createdAt: Date;
  read: boolean;
}

interface NotifState {
  notifications: Notification[];
}

type NotifAction =
  | { type: 'ADD'; payload: Notification }
  | { type: 'MARK_READ'; id: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'REMOVE'; id: string }
  | { type: 'INIT'; payload: Notification[] };

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state: NotifState, action: NotifAction): NotifState {
  switch (action.type) {
    case 'INIT':
      return { notifications: action.payload };
    case 'ADD':
      return { notifications: [action.payload, ...state.notifications] };
    case 'MARK_READ':
      return {
        notifications: state.notifications.map(n =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };
    case 'MARK_ALL_READ':
      return { notifications: state.notifications.map(n => ({ ...n, read: true })) };
    case 'REMOVE':
      return { notifications: state.notifications.filter(n => n.id !== action.id) };
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60));
  return d;
}

// Parse "30 jours" → 30
function parseDays(delai: string): number {
  const m = delai.match(/\d+/);
  return m ? parseInt(m[0]) : 30;
}

// How many days since soumission
function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now  = Date.now();
  return Math.floor((now - then) / 86_400_000);
}

// ─── Build initial notifications from real dossier data ───────────────────────
function buildInitialNotifications(): Notification[] {
  const notifs: Notification[] = [];

  DOSSIERS.forEach((d: Dossier) => {
    const elapsed = daysSince(d.dateSoumission);
    const limit   = parseDays(d.delaiEvaluation);
    const remaining = limit - elapsed;

    // New dossier received (En attente)
    if (d.status === 'En attente') {
      notifs.push({
        id: makeId(),
        type: 'info',
        title: d.reference,
        subtitle: 'Nouveau Dossier Reçu',
        description: `Le dossier ${d.reference} de ${d.operateur} a été soumis et attend affectation.`,
        dossierRef: d.reference,
        dossierId: d.id,
        createdAt: new Date(d.dateSoumission),
        read: false,
      });
    }

    // Overdue (En retard)
    if (d.status === 'En retard') {
      notifs.push({
        id: makeId(),
        type: 'error',
        title: d.reference,
        subtitle: 'Dépasse le délai',
        description: `Le dossier ${d.reference} a dépassé son délai d'évaluation de ${Math.abs(remaining)} jours.`,
        dossierRef: d.reference,
        dossierId: d.id,
        createdAt: daysAgo(1),
        read: false,
      });
    }

    // 3 days warning (En cours, ≤ 3 days remaining)
    if (d.status === 'En cours' && remaining > 0 && remaining <= 3) {
      notifs.push({
        id: makeId(),
        type: 'warning',
        title: d.reference,
        subtitle: `${remaining} jour${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`,
        description: `Il reste ${remaining} jour${remaining > 1 ? 's' : ''} pour finaliser l'évaluation du dossier ${d.reference}.`,
        dossierRef: d.reference,
        dossierId: d.id,
        createdAt: daysAgo(0),
        read: false,
      });
    }

    // Submitted (Prêt) — evaluateur submitted
    if (d.status === 'Prêt') {
      notifs.push({
        id: makeId(),
        type: 'success',
        title: d.reference,
        subtitle: 'Évaluation soumise',
        description: `L'évaluateur a soumis le rapport d'évaluation pour le dossier ${d.reference}.`,
        dossierRef: d.reference,
        dossierId: d.id,
        createdAt: daysAgo(2),
        read: true,
      });
    }
  });

  // Sort: newest first
  return notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface NotifContextValue {
  notifications: Notification[];
  unreadCount: number;
  add: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  /** Call this when a dossier is assigned to an evaluateur */
  notifyAffectation: (dossierRef: string, dossierId: string, evaluateurNom: string) => void;
  /** Call this when an evaluateur marks a dossier as prêt */
  notifyMarquerPret: (dossierRef: string, dossierId: string) => void;
  /** Call this when a new dossier arrives */
  notifyNouveauDossier: (dossierRef: string, dossierId: string, operateur: string) => void;
}

const NotifContext = createContext<NotifContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { notifications: [] });

  // Seed from real dossier data on mount
  useEffect(() => {
    dispatch({ type: 'INIT', payload: buildInitialNotifications() });
  }, []);

  const add = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    dispatch({
      type: 'ADD',
      payload: { ...n, id: makeId(), createdAt: new Date(), read: false },
    });
  }, []);

  const markRead    = useCallback((id: string) => dispatch({ type: 'MARK_READ', id }), []);
  const markAllRead = useCallback(() => dispatch({ type: 'MARK_ALL_READ' }), []);
  const remove      = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);

  const notifyAffectation = useCallback((ref: string, id: string, evaluateur: string) => {
    add({
      type: 'info',
      title: ref,
      subtitle: 'Dossier affecté',
      description: `Le dossier ${ref} a été affecté à ${evaluateur}.`,
      dossierRef: ref,
      dossierId: id,
    });
  }, [add]);

  const notifyMarquerPret = useCallback((ref: string, id: string) => {
    add({
      type: 'success',
      title: ref,
      subtitle: 'Rapport soumis — Prêt',
      description: `L'évaluateur a marqué le dossier ${ref} comme prêt. En attente de votre validation.`,
      dossierRef: ref,
      dossierId: id,
    });
  }, [add]);

  const notifyNouveauDossier = useCallback((ref: string, id: string, operateur: string) => {
    add({
      type: 'info',
      title: ref,
      subtitle: 'Nouveau Dossier Reçu',
      description: `Un nouveau dossier de ${operateur} a été soumis et attend affectation.`,
      dossierRef: ref,
      dossierId: id,
    });
  }, [add]);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <NotifContext.Provider value={{
      notifications: state.notifications,
      unreadCount,
      add,
      markRead,
      markAllRead,
      remove,
      notifyAffectation,
      notifyMarquerPret,
      notifyNouveauDossier,
    }}>
      {children}
    </NotifContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}