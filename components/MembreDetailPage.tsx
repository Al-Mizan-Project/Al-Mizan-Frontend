'use client';

import { useState, useEffect } from 'react';
import { fetchMembreDetail, MembreDetail } from '@/lib/api';

interface Props {
  idMembre: string;
  onBack: () => void;
}

export default function MembreDetailPage({ idMembre, onBack }: Props) {
  const [membre, setMembre] = useState<MembreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembreDetail(idMembre)
      .then(setMembre)
      .catch(() => setError('Impossible de charger les détails du membre.'))
      .finally(() => setLoading(false));
  }, [idMembre]);

  if (loading) return <div className="p-6 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!membre) return null;

  const rows: [string, string | undefined][] = [
    ['Prénom', membre.prenom],
    ['Nom', membre.nom],
    ['Fonction', membre.fonction || 'Non renseigné'],
    ['Téléphone', membre.telephone || 'Non renseigné'],
    ['Créé le', membre.created_at ? new Date(membre.created_at).toLocaleString('fr-FR') : '—'],
    ['Mis à jour le', membre.updated_at ? new Date(membre.updated_at).toLocaleString('fr-FR') : '—'],
  ];

  const orgRows: [string, string | undefined][] = [
    ['Organisation', membre.organisation?.nom_officiel],
    ['Type', membre.organisation?.type_entite_display],
    ['Adresse du siège', membre.organisation?.adresse_siege || 'Non renseigné'],
    ['Email de contact', membre.organisation?.email_contact || 'Non renseigné'],
    ['Wilaya', membre.organisation?.wilaya || 'Non renseigné'],
    ['Secteur', membre.organisation?.secteur || 'Non renseigné'],
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">← Retour</button>
        <div className="h-4 w-px bg-gray-300" />
        <h1 className="text-lg font-bold text-gray-800">{membre.prenom} {membre.nom}</h1>
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-3 mb-6">
        <h2 className="font-bold text-gray-700 mb-2">Informations du membre</h2>
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="text-gray-800">{val}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-3">
        <h2 className="font-bold text-gray-700 mb-2">Organisation</h2>
        {orgRows.map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="text-gray-800">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}