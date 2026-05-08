'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Organisation, Membre, OrgType } from '@/lib/types';

interface Permission {
  id_permission: number;
  nom_permission: string;
}

interface Props {
  organisation: Organisation;
  orgType: OrgType;
  onBack: () => void;
  onSuccess: (membre: Membre) => void;
}

// roleId par type d'organisation — à ajuster selon ta DB
const ROLE_MAP: Record<OrgType, number> = {
  operateur_economique: 5,
  tutelle: 3,
  service_contractant: 2,
  commission_externe: 4,
};

export default function CreateMemberUserForm({ organisation, orgType, onBack, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  const [membreData, setMembreData] = useState({
    prenom: '', nom: '', telephone: '', fonction: '',
  });
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [permsLoading, setPermsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/permissions')
      .then(({ data }) => setPermissions(data))
      .catch(() => setError('Erreur chargement permissions.'))
      .finally(() => setPermsLoading(false));
  }, []);

  const togglePerm = (id: number) =>
    setSelectedPerms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Convert selected permission IDs to permission names
      const selectedPermNames = permissions
        .filter(p => selectedPerms.includes(p.id_permission))
        .map(p => p.nom_permission);

      const payload = {
        prenom: membreData.prenom,
        nom: membreData.nom,
        telephone: membreData.telephone,
        fonction: membreData.fonction,
        email: userEmail,
        password: userPassword,
        permissions: selectedPermNames,
      };
      const response = await api.post(`/organisations/${organisation.id_organisation}/responsable/`, payload);
      // The backend should return the created member (or both member and user)
      onSuccess(response.data);
    } catch (err: any) {
      console.error(err);
      // Extract detailed error message from response
      const detail = err.response?.data?.detail || err.response?.data?.message || 'Erreur lors de la création.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={step === 1 ? onBack : () => setStep(1)} className="text-gray-500 hover:text-gray-800">
          ← {step === 1 ? 'Retour' : 'Étape précédente'}
        </button>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">
          Nouveau membre — <span className="text-[#00738C]">{organisation.nom_officiel}</span>
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['Membre', 'Compte utilisateur'] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2;
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 text-sm font-semibold ${active ? 'text-[#00738C]' : done ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-[#00738C] text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {done ? '✓' : n}
                </span>
                {label}
              </div>
              {i < 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* STEP 1 — Membre */}
      {step === 1 && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-700">Informations du membre</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['prenom', 'nom'] as const).map(field => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-500 mb-1 capitalize">
                  {field === 'prenom' ? 'Prénom' : 'Nom'} <span className="text-red-500">*</span>
                </label>
                <input type="text" value={membreData[field]}
                  onChange={e => setMembreData(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]" />
              </div>
            ))}
          </div>
          {(['telephone', 'fonction'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs font-semibold text-gray-500 mb-1 capitalize">
                {field === 'telephone' ? 'Téléphone' : 'Fonction'}
              </label>
              <input type="text" value={membreData[field]}
                onChange={e => setMembreData(p => ({ ...p, [field]: e.target.value }))}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]" />
            </div>
          ))}
          <button onClick={() => setStep(2)} disabled={!membreData.prenom || !membreData.nom}
            className="w-full py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors">
            Suivant →
          </button>
        </div>
      )}

      {/* STEP 2 — Utilisateur + Permissions */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-gray-700">Compte utilisateur</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Email <span className="text-red-500">*</span></label>
              <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mot de passe <span className="text-red-500">*</span></label>
              <input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)}
                placeholder="12 caractères minimum"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]" />
              <p className="text-xs text-gray-400 mt-1">Minimum 12 caractères</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-bold text-gray-700 mb-4">Permissions</h2>
            {permsLoading ? (
              <p className="text-sm text-gray-400">Chargement...</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {permissions.map(perm => (
                  <label key={perm.id_permission}
                    className="flex items-center gap-2 text-sm cursor-pointer bg-gray-50 border rounded-lg px-3 py-2 hover:border-[#00738C] transition-colors">
                    <input type="checkbox" checked={selectedPerms.includes(perm.id_permission)}
                      onChange={() => togglePerm(perm.id_permission)} className="accent-[#00738C]" />
                    {perm.nom_permission}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:border-gray-500 transition-colors">
              ← Retour
            </button>
            <button onClick={handleSubmit} disabled={loading || !userEmail || userPassword.length < 12}
              className="flex-1 py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors">
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}