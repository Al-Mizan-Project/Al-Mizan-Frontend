'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useParametres() {
  const { token } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const effectiveToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token') : null);
    
    if (!effectiveToken) {
      setPasswordError('Authentification requise');
      return false;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      // Endpoint to change password from Auth service
      const response = await fetch(`/api/proxy/auth?path=auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken.trim()}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        let msg = 'Erreur lors du changement de mot de passe';
        try {
          const errData = await response.json();
          msg = errData.detail || errData.error || errData.message || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 5000);
      return true;
    } catch (err: any) {
      setPasswordError(err.message || 'Erreur interne');
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  };

  return { changePassword, isChangingPassword, passwordError, passwordSuccess };
}
