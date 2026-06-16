'use client';

import { useContext } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { SoumissionsContext } from '@/lib/soumissions-context';
import { useCommission } from '@/lib/commission-context';

interface Props { onVoirDossier: (d: Dossier) => void; }

export default function MesDossiersCOPEOView({ onVoirDossier }: Props) {
  const ctx = useContext(SoumissionsContext);
  const { commission } = useCommission();
  const dossiers = ctx?.dossiers ?? [];
  const loading = ctx?.loading ?? false;

  if (loading) {
    return <div className="text-center py-20 text-gray-400 text-sm">Chargement…</div>;
  }

  if (!commission) {
    return <div className="text-center py-20 text-gray-400 text-sm">Aucune commission assignée.</div>;
  }

  const enCours  = dossiers.filter(d => d.status === 'En cours').length;
  const enAttente = dossiers.filter(d => d.status === 'En attente').length;

  const commissionDossier: Dossier = {
    id: String(commission.id_comission),
    reference: commission.nom_comission,
    operateur: `${dossiers.length} soumission${dossiers.length !== 1 ? 's' : ''}`,
    dateSoumission: dossiers[0]?.dateSoumission ?? '—',
    delaiEvaluation: '—',
    etape: 'Évaluation',
    status: enCours > 0 ? 'En cours' : enAttente > 0 ? 'En attente' : 'Prêt',
    commissionId: commission.id_comission,
  };

  const STATUS_BADGE: Record<string, string> = {
    'En attente': 'text-amber-700',
    'En cours':   'text-blue-700',
    'En retard':  'text-red-600',
    'Prêt':       'text-emerald-700',
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-[#F4F7F4]">
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Commission</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Soumissions</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">En cours</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr
            onClick={() => onVoirDossier(commissionDossier)}
            className="border-b border-gray-50 hover:bg-[#F9FBF9] cursor-pointer transition-colors"
          >
            <td className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">{commission.nom_comission}</p>
              <p className="text-xs text-gray-400">{commission.categorie}</p>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{dossiers.length}</td>
            <td className="px-4 py-3 text-sm font-semibold text-blue-700">{enCours}</td>
            <td className="px-4 py-3">
              <span className={`text-xs font-semibold ${STATUS_BADGE[commissionDossier.status]}`}>
                {commissionDossier.status}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}