'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Organisation, OrgType } from '@/lib/types';
import CreateMemberUserForm from './CreateMemberUserForm';

interface Props {
  orgType: OrgType;
  onBack: () => void;
  onSuccess: (org: Organisation) => void;
}

export default function CreateOrganisationForm({ orgType, onBack, onSuccess }: Props) {
  const [step, setStep] = useState<'org' | 'responsable'>('org');
  const [createdOrg, setCreatedOrg] = useState<Organisation | null>(null);

  const [base, setBase] = useState({
    nom_officiel: '', adresse_siege: '', email_contact: '', type_entite: '',
  });

  // Champs spécifiques par type
  const [tutelle, setTutelle] = useState({ nom_tutelle: '', identité_autorité: '' });
  const [sc, setSc] = useState({ code_ordonnateur: '', categorie: '', id_tutelle: '' });
  const [ce, setCe] = useState({ nom_comission: '', niveau_compétance: '', seuils_compétence_financière: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpointMap: Record<OrgType, string> = {
        tutelle: '/admin/organisations/tutelle/creer/',
        service_contractant: '/admin/organisations/service-contractant/creer/',
        commission_externe: '/admin/organisations/commission-externe/creer/',
        operateur_economique: '/admin/organisations/operateurs/',
      };
      const orgRes = await api.post(endpointMap[orgType], { ...base });
      setCreatedOrg(orgRes.data);
      setStep('responsable');
    } catch {
      setError("Erreur lors de la création.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#00738C]";
  const labelCls = "block text-xs font-semibold text-gray-500 mb-1";

  // ── Étape 2 : Création du responsable ──────────────────────────────────
  if (step === 'responsable' && createdOrg) {
    return (
      <CreateMemberUserForm
        organisation={createdOrg}
        orgType={orgType}
        onBack={() => onSuccess(createdOrg)} // org already created; "back" just finishes
        onSuccess={() => onSuccess(createdOrg)}
      />
    );
  }

  // ── Étape 1 : Création de l'organisation ────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">← Retour</button>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">Créer une organisation</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {/* Champs communs */}
      <div className="bg-white border rounded-xl p-6 space-y-4 mb-4">
        <h2 className="font-bold text-gray-700">Informations générales</h2>
        <div>
          <label className={labelCls}>Nom officiel <span className="text-red-500">*</span></label>
          <input type="text" value={base.nom_officiel} maxLength={20}
            onChange={e => setBase(p => ({ ...p, nom_officiel: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Adresse du siège</label>
          <input type="text" value={base.adresse_siege} maxLength={100}
            onChange={e => setBase(p => ({ ...p, adresse_siege: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email de contact</label>
          <input type="email" value={base.email_contact} maxLength={100}
            onChange={e => setBase(p => ({ ...p, email_contact: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Type d'entité</label>
          <input type="text" value={base.type_entite} maxLength={30}
            onChange={e => setBase(p => ({ ...p, type_entite: e.target.value }))} className={inputCls} />
        </div>
      </div>

      {/* Champs Tutelle */}
      {orgType === 'tutelle' && (
        <div className="bg-white border rounded-xl p-6 space-y-4 mb-4">
          <h2 className="font-bold text-gray-700">Informations Tutelle</h2>
          <div>
            <label className={labelCls}>Nom de la tutelle</label>
            <input type="text" value={tutelle.nom_tutelle}
              onChange={e => setTutelle(p => ({ ...p, nom_tutelle: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Identité de l'autorité</label>
            <input type="text" value={tutelle.identité_autorité}
              onChange={e => setTutelle(p => ({ ...p, identité_autorité: e.target.value }))} className={inputCls} />
          </div>
        </div>
      )}

      {/* Champs Service Contractant */}
      {orgType === 'service_contractant' && (
        <div className="bg-white border rounded-xl p-6 space-y-4 mb-4">
          <h2 className="font-bold text-gray-700">Informations Service Contractant</h2>
          <div>
            <label className={labelCls}>Code ordonnateur</label>
            <input type="text" value={sc.code_ordonnateur}
              onChange={e => setSc(p => ({ ...p, code_ordonnateur: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Catégorie</label>
            <input type="text" value={sc.categorie}
              onChange={e => setSc(p => ({ ...p, categorie: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ID Tutelle de rattachement</label>
            <input type="number" value={sc.id_tutelle}
              onChange={e => setSc(p => ({ ...p, id_tutelle: e.target.value }))} className={inputCls} />
          </div>
        </div>
      )}

      {/* Champs Commission Externe */}
      {orgType === 'commission_externe' && (
        <div className="bg-white border rounded-xl p-6 space-y-4 mb-4">
          <h2 className="font-bold text-gray-700">Informations Commission Externe</h2>
          <div>
            <label className={labelCls}>Nom de la commission</label>
            <input type="text" value={ce.nom_comission}
              onChange={e => setCe(p => ({ ...p, nom_comission: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Niveau de compétence</label>
            <select value={ce.niveau_compétance}
              onChange={e => setCe(p => ({ ...p, niveau_compétance: e.target.value }))}
              className={inputCls}>
              <option value="">-- Sélectionner --</option>
              <option value="Communale">Communale</option>
              <option value="de Wilaya">de Wilaya</option>
              <option value="Sectorielle">Sectorielle</option>
              <option value="Nationale">Nationale</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Seuils de compétence financière</label>
            <input type="text" value={ce.seuils_compétence_financière}
              onChange={e => setCe(p => ({ ...p, seuils_compétence_financière: e.target.value }))} className={inputCls} />
          </div>
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading || !base.nom_officiel}
        className="w-full py-2.5 bg-[#00738C] text-white font-bold rounded-lg disabled:opacity-50 hover:bg-[#005f75] transition-colors">
        {loading ? 'Création...' : 'Créer l\'organisation et continuer'}
      </button>
    </div>
  );
}