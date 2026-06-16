'use client';

import { useState } from 'react';
import { useParametres } from '../../Parametres/useParametres';

interface ParametresViewProps {
  lang: string;
  dict?: any;
}

export default function ParametresView({ lang, dict }: ParametresViewProps) {
  const { changePassword, isChangingPassword, passwordError, passwordSuccess } = useParametres();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword !== confirmPassword) {
      setLocalError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 8) {
      setLocalError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Changer le mot de passe</h3>
          
          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              Votre mot de passe a été modifié avec succès.
            </div>
          )}

          {(localError || passwordError) && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {localError || passwordError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ancien mot de passe
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
