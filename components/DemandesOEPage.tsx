'use client';

import { useState, useEffect } from 'react';
import { DemandeOE } from '@/lib/types';
import { api } from '@/lib/api';

interface Props {
  onReview: (demande: DemandeOE) => void;
}

export default function DemandesOEPage({ onReview }: Props) {
  const [demandes, setDemandes] = useState<DemandeOE[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.get('/admin/demandes/')
      .then(({ data }) => setDemandes(Array.isArray(data) ? data : data.results ?? data.data ?? []))
      .catch(() => setError('Erreur lors du chargement des demandes.'))
      .finally(() => setLoading(false));
  }, []);

  const statutBadge = (s: DemandeOE['statut']) => {
    const map = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
      APPROUVE:   'bg-green-100 text-green-700',
      REJETE:     'bg-red-100 text-red-700',
    };
    const labels = {
      EN_ATTENTE: 'En attente',
      APPROUVE:   'Approuvée',
      REJETE:     'Refusée',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[s]}`}>{labels[s]}</span>;
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Chargement des demandes...</div>;
  if (error)   return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Demandes — Opérateurs Économiques</h1>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Nom officiel</th>
              <th className="px-4 py-3 text-left">Téléphone</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {demandes.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucune demande.</td></tr>
            )}
            {demandes.map(d => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{d.nom_organisation}</td>
                <td className="px-4 py-3 text-gray-500">{d.telephone}</td>
                <td className="px-4 py-3 text-gray-500">{d.email_contact}</td>
                <td className="px-4 py-3">{statutBadge(d.statut)}</td>
                <td className="px-4 py-3">
                  {d.statut === 'EN_ATTENTE' && (
                    <button onClick={() => onReview(d)} className="text-[#00738C] hover:underline font-semibold text-xs">
                      Examiner →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}