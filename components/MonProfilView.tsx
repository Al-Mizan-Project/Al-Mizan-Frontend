'use client';

import { useState, useRef, useEffect } from 'react';
import { useUserProfile } from '@/lib/user-profile';

export default function MonProfilView() {
  const { profile, updateProfile, setPhoto, lastSaved } = useUserProfile();

  // Local form state — initialised from store, editable before saving
  const [nom,    setNom]    = useState(profile.nom);
  const [prenom, setPrenom] = useState(profile.prenom);
  const [role,   setRole]   = useState(profile.role);
  const [email,  setEmail]  = useState(profile.email);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // Sync local state if profile changes externally (e.g. another tab)
  useEffect(() => {
    setNom(profile.nom);
    setPrenom(profile.prenom);
    setRole(profile.role);
    setEmail(profile.email);
  }, [profile]);

  // Validation
  const emailValid = email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isDirty =
    nom    !== profile.nom    ||
    prenom !== profile.prenom ||
    role   !== profile.role   ||
    email  !== profile.email;

  const handleModifier = () => {
    if (!emailValid) return;
    setSaving(true);
    // Simulate async save (would be API call in real app)
    setTimeout(() => {
      updateProfile({ nom, prenom, role, email });
      setSaving(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    }, 400);
  };

  // Photo upload via FileReader — converts to base64 data URL
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        setPhoto(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be picked again
    e.target.value = '';
  };

  const handleRemovePhoto = () => setPhoto(null);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* Photo card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Photo de profil</h3>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Hidden real file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2 border-2 border-blue-600 text-blue-600 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-all w-fit"
            >
              Upload Photo
            </button>
            {profile.photoUrl && (
              <button
                onClick={handleRemovePhoto}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors text-left"
              >
                remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile info card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-800">Informations sur le profil</h3>
          {lastSaved && (
            <p className="text-xs text-gray-400">
              Dernière sauvegarde : {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Nom + Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Nom"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-400 transition-all placeholder-gray-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder="Prénom"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-400 transition-all placeholder-gray-400 bg-gray-50"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Chef évaluateur"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-400 transition-all placeholder-gray-400 bg-gray-50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="mail@mail.com"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 focus:outline-none transition-all placeholder-gray-400 bg-gray-50 ${
                !emailValid ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'
              }`}
            />
            {!emailValid && (
              <p className="text-xs text-red-500 mt-1">Adresse email invalide.</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-1">
            {isDirty && !justSaved && (
              <p className="text-xs text-amber-600 font-medium">
                Modifications non enregistrées
              </p>
            )}
            {!isDirty && !justSaved && <span />}
            {justSaved && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Profil mis à jour
              </p>
            )}
            <button
              onClick={handleModifier}
              disabled={!isDirty || !emailValid || saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Enregistrement…
                </>
              ) : justSaved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Enregistré
                </>
              ) : 'Modifier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}