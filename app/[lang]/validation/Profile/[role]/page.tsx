'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '../useProfile';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { profile: serverProfile, isLoading, isSaving, error, success, updateProfile } = useProfile();
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    role: '',
    email: '',
  });

  useEffect(() => {
    if (serverProfile && !isEditing) {
      setProfile({
        nom: serverProfile.nom,
        prenom: serverProfile.prenom,
        role: serverProfile.role,
        email: serverProfile.email,
      });
    }
  }, [serverProfile, isEditing]);

  const handleModifier = async () => {
    if (isEditing) {
      const ok = await updateProfile(profile);
      if (ok) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setProfile({
      nom: serverProfile.nom,
      prenom: serverProfile.prenom,
      role: serverProfile.role,
      email: serverProfile.email,
    });
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Chargement du profil...</div>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
      {success && <div className="p-4 bg-green-100 text-green-700 rounded-md">Profil mis à jour avec succès!</div>}

      <div className="val-profile-section">
        <h2 className="val-profile-section-title">Informations sur le profil</h2>
        
        <div className="val-profile-form">
          <div className="val-profile-form-row">
            <div className="val-profile-form-group">
              <label className="val-profile-label">Nom</label>
              <input
                type="text"
                name="nom"
                value={profile.nom}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="val-profile-input"
              />
            </div>

            <div className="val-profile-form-group">
              <label className="val-profile-label">Prénom</label>
              <input
                type="text"
                name="prenom"
                value={profile.prenom}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="val-profile-input"
              />
            </div>
          </div>

          <div className="val-profile-form-group">
            <label className="val-profile-label">Rôle</label>
            <input
              type="text"
              name="role"
              value={profile.role}
              disabled={true}
              className="val-profile-input opacity-70 bg-gray-50"
            />
          </div>

          <div className="val-profile-form-group">
            <label className="val-profile-label">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="val-profile-input"
            />
          </div>

          <div className="val-profile-form-actions flex gap-4 mt-8 pt-6 border-t border-gray-200">
            {isEditing && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleModifier}
              className="val-profile-modify-button"
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Modifier'}
            </button>
            
            {!isEditing && (
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors ml-auto"
              >
                Se déconnecter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}