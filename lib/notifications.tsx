// lib/notifications.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth';
import { api } from './api';

export type NotifType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: number;
  type: NotifType;
  title: string;
  subtitle: string;
  description: string;
  dossierRef?: string;
  dossierId?: string;
  createdAt: string;
  read: boolean;
}

interface NotifContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
  // Stub functions for compatibility with existing components
  notifyAffectation: (dossierRef: string, dossierId: string, evaluateurNom: string) => void;
  notifyMarquerPret: (dossierRef: string, dossierId: string) => void;
  notifyNouveauDossier: (dossierRef: string, dossierId: string, operateur: string) => void;
}

const NotifContext = createContext<NotifContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get('/notifications');
    const mapped = data.map((n: any) => ({
      id: n.id,
      type: n.type || 'info',
      title: n.title,
      subtitle: n.subtitle || '',
      description: n.message || '',
      dossierRef: n.dossier_ref,
      dossierId: n.dossier_id,
      createdAt: n.created_at,
      read: n.is_read,
    }));
    setNotifications(mapped);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}`, { is_read: true });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await api.post(`/users/${user.id}/notifications/marquer-tout-lu`);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const remove = async (id: number) => {
    await api.delete(`/notifications/${id}`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Stub functions – these do not call the backend yet, but prevent runtime errors
  const notifyAffectation = (dossierRef: string, dossierId: string, evaluateurNom: string) => {
    console.log('[Notification stub] Affectation:', { dossierRef, dossierId, evaluateurNom });
    // TODO: implement POST /notifications when backend supports creation
  };

  const notifyMarquerPret = (dossierRef: string, dossierId: string) => {
    console.log('[Notification stub] Marquer prêt:', { dossierRef, dossierId });
  };

  const notifyNouveauDossier = (dossierRef: string, dossierId: string, operateur: string) => {
    console.log('[Notification stub] Nouveau dossier:', { dossierRef, dossierId, operateur });
  };

  return (
    <NotifContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        remove,
        notifyAffectation,
        notifyMarquerPret,
        notifyNouveauDossier,
      }}
    >
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}