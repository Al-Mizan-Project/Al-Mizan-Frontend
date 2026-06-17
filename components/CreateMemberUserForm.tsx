'use client';

import { useState } from 'react';
import { Organisation, Membre, OrgType } from '@/lib/types';
import { upsertResponsable, ResponsableResult } from '@/lib/api';

interface Props {
  organisation: Organisation;
  orgType: OrgType;
  initialResponsable?: Membre & { email?: string };
  onBack: () => void;
  onSuccess: (result: ResponsableResult) => void;
}

export default function CreateMemberUserForm({
  organisation, orgType, initialResponsable, onBack, onSuccess,
}: Props) {
  const isEdit = !!initialResponsable;

  const [membreData, setMembreData] = useState({
    prenom: initialResponsable?.prenom ?? '',
    nom: initialResponsable?.nom ?? '',
    telephone: initialResponsable?.telephone ?? '',
    fonction: initialResponsable?.fonction ?? '',
  });
  const [userEmail, setUserEmail] = useState(initialResponsable?.email ?? '');
  const [userPassword, setUserPassword] = useState('');
  const [resendActivation, setResendActivation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);

  const canSubmit =
    membreData.prenom && membreData.nom && userEmail &&
    (isEdit || userPassword.length >= 12) &&
    (!userPassword || userPassword.length >= 12);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setActivationUrl(null);
    try {
      const payload: Record<string, any> = {
        prenom: membreData.prenom,
        nom: membreData.nom,
        telephone: membreData.telephone,
        fonction: membreData.fonction,
        email: userEmail,
      };
      if (userPassword) payload.password = userPassword;
      if (isEdit && resendActivation) payload.resend_activation = true;

      const result = await upsertResponsable(organisation.id_organisation, payload);
      if (result.activation_url) setActivationUrl(result.activation_url);
      onSuccess(result);
    } catch (err: any) {
      const respData = err.response?.data;
      const detail =
        respData?.detail ||
        respData?.erreur ||
        respData?.message ||
        (respData?.email ? `Email: ${respData.email.join(', ')}` : null) ||
        'Erreur lors de l\'enregistrement.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">← Retour</button>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">
          {isEdit ? 'Modifier le responsable' : 'Nouveau responsable'} —{' '}
          <span className="text-[#00738C]">{organisation.nom_officiel}</span>
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}
      {activationUrl && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 break-all">
          Lien d'activation envoyé : {activationUrl}
        </div>
      )}

      <div className="bg-white border rounded-xl p-6 space-y-4 mb-6">
        <h2 className="font-bold text-gray-700">Informations du responsable</h2>
        <div className="grid grid-cols-2 gap-4">
          {(['prenom', 'nom'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
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
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              {field === 'telephone' ? 'Téléphone' : 'Fonction'}
            </label>
            <input type="text" value={membreData[field]}
              onChange={e => setMembreData(p => ({ ...p, [field]: e.target.value }))}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]" />
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-4 mb-6">
        <h2 className="font-bold text-gray-700">Compte utilisateur</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            {isEdit
              ? 'Nouveau mot de passe (laisser vide pour ne pas changer)'
              : <> Mot de passe <span className="text-red-500">*</span></>}
          </label>
          <input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)}
            placeholder="12 caractères minimum"
            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]" />
          <p className="text-xs text-gray-400 mt-1">Minimum 12 caractères</p>
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={resendActivation}
              onChange={e => setResendActivation(e.target.checked)}
              className="accent-[#00738C]" />
            Renvoyer le lien d'activation / accès au tableau de bord par email
          </label>
        )}

        <p className="text-xs text-gray-500">
          Les permissions du responsable sont définies automatiquement selon son rôle.
          {!isEdit && " Un email contenant le lien d'accès au tableau de bord lui sera envoyé."}
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:border-gray-500 transition-colors">
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={loading || !canSubmit}
          className="flex-1 py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors">
          {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer le responsable'}
        </button>
      </div>
    </div>
  );
}