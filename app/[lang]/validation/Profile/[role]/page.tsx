'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCamera } from '@fortawesome/free-solid-svg-icons';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nom: 'Nom',
    prenom: 'Prénom',
    role: 'Chef évaluateur',
    email: 'mail@mail.com',
    photo: null as string | null,
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfile((prev) => ({ ...prev, photo: null }));
  };

  const handleModifier = () => {
    if (isEditing) {
      // Sauvegarder les modifications
      console.log('Profil mis à jour:', profile);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
     

      {/* Photo de profil */}
      <div className="val-profile-section">
        <h2 className="val-profile-section-title">Photo de profil</h2>
        
        <div className="val-profile-photo-container">
          <div className="val-profile-avatar">
            {profile.photo ? (
              <img src={profile.photo} alt="Profile" className="val-profile-avatar-image" />
            ) : (
              <FontAwesomeIcon icon={faUser} className="val-profile-avatar-icon" />
            )}
          </div>

          <div className="val-profile-photo-actions">
            <label className="val-profile-upload-button">
              <FontAwesomeIcon icon={faCamera} className="val-profile-upload-icon" />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="val-profile-upload-input"
              />
            </label>
            
            {profile.photo && (
              <button
                onClick={handleRemovePhoto}
                className="val-profile-remove-button"
              >
                remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informations sur le profil */}
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
            <label className="val-profile-label">Role</label>
            <input
              type="text"
              name="role"
              value={profile.role}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="val-profile-input"
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

          <div className="val-profile-form-actions">
            <button
              onClick={handleModifier}
              className="val-profile-modify-button"
            >
              {isEditing ? 'Enregistrer' : 'Modifier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}