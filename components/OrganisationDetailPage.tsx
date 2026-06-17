'use client';

import { useState, useEffect } from 'react';
import { Organisation, Membre, OrgType } from '@/lib/types';
import { api } from '@/lib/api';
import CreateMemberUserForm from './CreateMemberUserForm';
import MembreDetailPage from './MembreDetailPage';

interface Props {
  organisation: Organisation;
  orgType: OrgType;
  membres: Membre[];
  onBack: () => void;
  onMemberCreated: (m: Membre) => void;
}

export default function OrganisationDetailPage({
  organisation, orgType, membres: propMembres, onBack, onMemberCreated
}: Props) {
  const [showEditResponsable, setShowEditResponsable] = useState(false);
  const [selectedMembreId, setSelectedMembreId] = useState<string | null>(null);
  const [membres, setMembres] = useState<Membre[]>(propMembres);
  const [loading, setLoading] = useState(propMembres.length === 0);

  useEffect(() => {
    api.get(`/organisations/${organisation.id_organisation}/membres/`)
      .then(({ data }) => setMembres(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [organisation.id_organisation]);

  // Le responsable est conventionnellement le premier membre créé.
  const responsable = membres.length > 0
    ? [...membres].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))[0]
    : null;
const responsableAuth = responsable
  ? (membres.find(m => m.id_membre === responsable.id_membre) as any)?.compte_auth
  : null;

  if (selectedMembreId) {
    return (
      <MembreDetailPage
        idMembre={selectedMembreId}
        onBack={() => setSelectedMembreId(null)}
      />
    );
  }

  if (showEditResponsable) {
    return (
      <CreateMemberUserForm
        organisation={organisation}
        orgType={orgType}
        initialResponsable={responsable ?? undefined}
        onBack={() => setShowEditResponsable(false)}
        onSuccess={(result) => {
          // Refresh members list after edit/create
          api.get(`/organisations/${organisation.id_organisation}/membres/`)
            .then(({ data }) => setMembres(data))
            .catch(() => {});
          setShowEditResponsable(false);
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">← Retour</button>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">{organisation.nom_officiel}</h1>
      </div>

      {/* Infos organisation */}
      <div className="bg-white border rounded-xl p-6 space-y-3 mb-6">
        <h2 className="font-bold text-gray-700 mb-2">Informations</h2>
        {[
          ['Email de contact', organisation.email_contact || 'Non renseigné'],
          ['Responsable', organisation.responsable_nom || 'Non défini'],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="text-gray-800">{val}</span>
          </div>
        ))}
      </div>

      {/* Responsable */}
      <div className="bg-white border rounded-xl overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-700">Responsable</h2>
          <button
            onClick={() => setShowEditResponsable(true)}
            className="px-4 py-2 bg-[#00738C] text-white text-sm font-bold rounded-lg hover:bg-[#005f75] transition-colors"
          >
            {responsable ? 'Modifier le responsable' : '+ Créer le responsable'}
          </button>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Chargement...</p>
        ) : responsable ? (
          <div className="px-6 py-4 text-sm space-y-1">
            <div className="font-medium text-gray-800">{responsable.prenom} {responsable.nom}</div>
            <div className="text-gray-500">{responsable.fonction}</div>
            <div className="text-gray-500">{responsable.telephone}</div>
            <div className="text-gray-500">{responsableAuth?.email || 'Email non chargé'}</div>

          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucun responsable défini.</p>
        )}
      </div>

      {/* Liste membres */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-700">Membres</h2>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Chargement...</p>
        ) : membres.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucun membre pour cette organisation.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Fonction</th>
                <th className="px-4 py-3 text-left">Téléphone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {membres.map(m => (
                <tr key={m.id_membre}
                  onClick={() => setSelectedMembreId(m.id_membre)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {m.prenom} {m.nom}
                    {responsable?.id_membre === m.id_membre && (
                      <span className="ml-2 text-xs font-semibold text-[#00738C] bg-[#00738C]/10 px-2 py-0.5 rounded">
                        Responsable
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.fonction}</td>
                  <td className="px-4 py-3 text-gray-500">{m.telephone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}