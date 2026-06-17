// components/CreateUserPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Permission {
  id_permission: number;
  nom_permission: string;
}

interface Props {
  roleId: number;
  roleName: string;
  preselectedPermissionNames: string[];
  onBack: () => void;
  onSuccess: () => void;
}

export default function CreateUserPage({
  roleId,
  roleName,
  preselectedPermissionNames,
  onBack,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 - organisation
  const [orgData, setOrgData] = useState({
    nom_officiel: '',
    adresse_siege: '',
    email_contact: '',
    type_entite: '',
  });

  // Step 2 - membre
  const [membreData, setMembreData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    fonction: '',
  });

  // Step 3 - utilisateur
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [permsLoading, setPermsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data } = await api.get('/permissions');
        setPermissions(data);
        const preselected = data
          .filter((p: Permission) =>
            preselectedPermissionNames.includes(p.nom_permission)
          )
          .map((p: Permission) => p.id_permission);
        setSelectedPerms(preselected);
      } catch {
        setError('Erreur lors du chargement des permissions.');
      } finally {
        setPermsLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const togglePerm = (id: number) => {
    setSelectedPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!userEmail || !userPassword) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Create organisation
      const orgRes = await api.post('/organisations', {
        nom_officiel: orgData.nom_officiel,
        adresse_siege: orgData.adresse_siege,
        email_contact: orgData.email_contact,
        type_entite: orgData.type_entite,
      });
      const id_organisation = orgRes.data.id_organisation;

      // 2. Create membre
      const membreRes = await api.post('/membres', {
        prenom: membreData.prenom,
        nom: membreData.nom,
        telephone: membreData.telephone,
        fonction: membreData.fonction,
        id_organisation,
      });
      const id_membre = membreRes.data.id_membre;

      // 3. Create utilisateur
      const userRes = await api.post('/users', {
        id_role: roleId,
        id_membre,
        email: userEmail,
        password: userPassword,
      });
      const userId = userRes.data.id_utilisateur;

      // 4. Assign permissions
      if (selectedPerms.length > 0) {
        await api.put(`/users/${userId}/permissions`, {
          permission_ids: selectedPerms,
        });
      }

      onSuccess();
    } catch (err: any) {
      const details = err?.response?.data?.details;
      if (details) {
        const messages = Object.entries(details)
          .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
          .join(' | ');
        setError(messages);
      } else {
        setError('Erreur lors de la création du compte.');
      }
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Organisation', 'Membre', 'Compte utilisateur'];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={step === 1 ? onBack : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
          className="text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← {step === 1 ? 'Retour' : 'Étape précédente'}
        </button>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">
          Créer un compte — {roleName}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 text-sm font-semibold ${active ? 'text-[#00738C]' : done ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-[#00738C] text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? '✓' : n}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* STEP 1 — Organisation */}
      {step === 1 && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-700 mb-2">Informations de l'organisation</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nom officiel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={orgData.nom_officiel}
              onChange={e => setOrgData(p => ({ ...p, nom_officiel: e.target.value }))}
              placeholder="Ex: Entreprise ABC"
              maxLength={20}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Adresse du siège
            </label>
            <input
              type="text"
              value={orgData.adresse_siege}
              onChange={e => setOrgData(p => ({ ...p, adresse_siege: e.target.value }))}
              placeholder="Ex: 12 Rue des Entrepreneurs, Alger"
              maxLength={100}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Email de contact
            </label>
            <input
              type="email"
              value={orgData.email_contact}
              onChange={e => setOrgData(p => ({ ...p, email_contact: e.target.value }))}
              placeholder="contact@organisation.dz"
              maxLength={100}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Type d'entité
            </label>
            <input
              type="text"
              value={orgData.type_entite}
              onChange={e => setOrgData(p => ({ ...p, type_entite: e.target.value }))}
              placeholder="Ex: PME, SARL, EURL..."
              maxLength={30}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!orgData.nom_officiel}
              className="w-full py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Membre */}
      {step === 2 && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-700 mb-2">Informations du membre</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={membreData.prenom}
                onChange={e => setMembreData(p => ({ ...p, prenom: e.target.value }))}
                placeholder="Prénom"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={membreData.nom}
                onChange={e => setMembreData(p => ({ ...p, nom: e.target.value }))}
                placeholder="Nom"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Téléphone
            </label>
            <input
              type="text"
              value={membreData.telephone}
              onChange={e => setMembreData(p => ({ ...p, telephone: e.target.value }))}
              placeholder="Ex: 0550000000"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Fonction
            </label>
            <input
              type="text"
              value={membreData.fonction}
              onChange={e => setMembreData(p => ({ ...p, fonction: e.target.value }))}
              placeholder="Ex: Directeur général"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:border-gray-500 transition-colors"
            >
              ← Retour
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!membreData.prenom || !membreData.nom}
              className="flex-1 py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Utilisateur + Permissions */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-gray-700 mb-2">Compte utilisateur</h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={userPassword}
                onChange={e => setUserPassword(e.target.value)}
                placeholder="12 caractères minimum"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 12 caractères</p>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-bold text-gray-700 mb-4">Permissions</h2>
            {permsLoading ? (
              <p className="text-sm text-gray-400">Chargement des permissions...</p>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune permission disponible.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {permissions.map(perm => (
                  <label
                    key={perm.id_permission}
                    className="flex items-center gap-2 text-sm cursor-pointer bg-gray-50 border rounded-lg px-3 py-2 hover:border-[#00738C] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm.id_permission)}
                      onChange={() => togglePerm(perm.id_permission)}
                      className="accent-[#00738C]"
                    />
                    {perm.nom_permission}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:border-gray-500 transition-colors"
            >
              ← Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !userEmail || !userPassword}
              className="flex-1 py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors"
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}