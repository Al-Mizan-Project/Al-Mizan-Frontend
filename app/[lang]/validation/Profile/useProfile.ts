'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  photo?: string | null;
  id_membre?: string | number;
}

export function useProfile() {
  const { token, user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    nom: '',
    prenom: '',
    email: '',
    role: '',
    photo: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const getUserId = () => {
    let userId = user?.id || user?.id_utilisateur;
    
    // Essayer de récupérer depuis le localStorage de l'utilisateur
    const rawUser = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null;
    if (!userId && rawUser) {
      try {
        const p = JSON.parse(rawUser);
        userId = p.id || p.id_utilisateur || p.user_id;
      } catch {
        // ignore
      }
    }
    
    if (userId) return userId;
    
    // Essayer de décoder le token JWT (fallback pour les anciens logins)
    const effectiveToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null);
    if (effectiveToken) {
      try {
        const payloadBase64 = effectiveToken.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(atob(payloadBase64));
          if (payload.user_id) return payload.user_id;
        }
      } catch (e) {
        console.error("Impossible de décoder le JWT", e);
      }
    }
    
    return typeof window !== 'undefined' ? window.localStorage.getItem('user_id') : null;
  };

  const loadProfile = useCallback(async () => {
    const effectiveToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null);

    if (authLoading) return;
    
    if (!effectiveToken) {
      setError('Non authentifié');
      setIsLoading(false);
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError('Identifiant utilisateur introuvable');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proxy/auth?path=users/${userId}`, {
        headers: {
          Authorization: `Bearer ${effectiveToken.trim()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      let nom = data.nom || data.last_name || user?.nom || '';
      let prenom = data.prenom || data.first_name || user?.prenom || '';
      
      // Fetch Membre details if id_membre is available
      const idMembre = data.id_membre || user?.id_membre;
      if (idMembre) {
        try {
          const membreResponse = await fetch(`/api/proxy/acteurs?path=membres/${idMembre}/`, {
            headers: {
              Authorization: `Bearer ${effectiveToken.trim()}`,
            },
          });
          if (membreResponse.ok) {
            const membreData = await membreResponse.json();
            nom = membreData.nom || nom;
            prenom = membreData.prenom || prenom;
          }
        } catch (e) {
          console.error("Erreur lors de la récupération des détails du membre", e);
        }
      }

      setProfile({
        id: data.id,
        nom,
        prenom,
        email: data.email || user?.email || '',
        role: data.role?.name || data.role || user?.role || '',
        photo: data.photo || null,
        id_membre: idMembre,
      });
    } catch (err: any) {
      console.error(err);
      setError('Impossible de charger le profil');
      
      // Fallback on local user state if available
      if (user) {
        setProfile({
          nom: user.nom || '',
          prenom: user.prenom || '',
          email: user.email || '',
          role: user.role || '',
          photo: null,
          id_membre: user.id_membre,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, user, authLoading]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    const effectiveToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null);
    if (!effectiveToken) return false;

    const userId = getUserId();
    if (!userId) return false;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Update User (email)
      const userPayload = {
        email: updatedData.email,
      };

      const userResponse = await fetch(`/api/proxy/auth?path=users/${userId}`, {
        method: 'PUT', // might need to be PATCH if we only update email
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken.trim()}`,
        },
        body: JSON.stringify(userPayload),
      });

      if (!userResponse.ok) {
        throw new Error(`Erreur HTTP: ${userResponse.status}`);
      }

      const data = await userResponse.json();
      
      // 2. Update Membre (nom, prenom) if id_membre exists
      const idMembre = profile.id_membre;
      if (idMembre) {
        const membrePayload = {
          nom: updatedData.nom,
          prenom: updatedData.prenom,
        };
        
        await fetch(`/api/proxy/acteurs?path=membres/${idMembre}/`, {
          method: 'PATCH', // Assumes PATCH is allowed to partially update membre
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveToken.trim()}`,
          },
          body: JSON.stringify(membrePayload),
        });
      }

      setProfile(prev => ({
        ...prev,
        ...updatedData,
        email: data.email || updatedData.email,
      }));
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
      return true;
    } catch (err: any) {
      console.error(err);
      setError('Erreur lors de la mise à jour du profil');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { profile, isLoading, isSaving, error, success, updateProfile, refresh: loadProfile };
}
