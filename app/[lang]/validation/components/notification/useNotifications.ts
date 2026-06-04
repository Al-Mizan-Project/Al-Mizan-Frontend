'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface BackendNotification {
  id: number;
  user_id: number;
  type: string; // e.g. "INFO", "WARNING", "DANGER", "NEW"
  titre: string;
  message: string;
  date_creation: string;
  est_lu: boolean;
  lien_relatif?: string;
  reference_dossier?: string;
}

export interface UseNotificationsReturn {
  notifications: BackendNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

function getUserIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  
  const rawUser = window.localStorage.getItem('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed?.id_utilisateur) return String(parsed.id_utilisateur);
      if (parsed?.user_id) return String(parsed.user_id);
      if (parsed?.id) return String(parsed.id);
    } catch {
      // ignore
    }
  }
  
  // Fallback décoder JWT access_token
  const effectiveToken = window.localStorage.getItem('access_token') || window.localStorage.getItem('token');
  if (effectiveToken) {
    try {
      const payloadBase64 = effectiveToken.split('.')[1];
      if (payloadBase64) {
        const payload = JSON.parse(atob(payloadBase64));
        if (payload.user_id) return String(payload.user_id);
      }
    } catch (e) {
      console.error("Impossible de décoder le JWT", e);
    }
  }
  
  return window.localStorage.getItem('user_id');
}

export function useNotifications(): UseNotificationsReturn {
  const { token, user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const effectiveToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null);

    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!effectiveToken) {
      setError('Authentification requise.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = user?.id_utilisateur ? String(user.id_utilisateur) : (user?.id ? String(user.id) : getUserIdFromStorage());
      
      if (!userId) {
        throw new Error("Utilisateur non identifié");
      }

      const response = await fetch(`/api/proxy/notifications?path=users/${userId}/notifications`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${effectiveToken.trim()}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : (data.results || data.data || []));
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [token, user, authLoading]);

  const markAsRead = async (id: number) => {
    const effectiveToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null);
    if (!effectiveToken) return;

    try {
      const response = await fetch(`/api/proxy/notifications?path=notifications/${id}/marquer-lu`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${effectiveToken.trim()}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, est_lu: true } : notif))
        );
      }
    } catch (error) {
      console.error('Erreur markAsRead', error);
    }
  };

  const markAllAsRead = async () => {
    const effectiveToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null);
    if (!effectiveToken) return;

    const userId = user?.id_utilisateur ? String(user.id_utilisateur) : (user?.id ? String(user.id) : getUserIdFromStorage());
    if (!userId) return;

    try {
      const response = await fetch(`/api/proxy/notifications?path=users/${userId}/notifications/marquer-tout-lu`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${effectiveToken.trim()}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, est_lu: true })));
      }
    } catch (error) {
      console.error('Erreur markAllAsRead', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.est_lu).length;

  return { notifications, unreadCount, isLoading, error, refresh: fetchNotifications, markAsRead, markAllAsRead };
}
