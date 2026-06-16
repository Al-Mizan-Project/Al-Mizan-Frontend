'use client';

import { useState, useMemo } from 'react';
import { Dossier, DossierStatus } from '@/lib/dossiers-data';
import { useSoumissions } from '@/lib/soumissions-context';
import Pagination from '@/components/Pagination';

const ROWS_PER_PAGE = 10;
const STATUTS: ('Tous' | DossierStatus)[] = ['Tous', 'En attente', 'En cours', 'En retard', 'Prêt'];
const STATUS_BADGE: Record<string, string> = {
  'En attente': 'text-amber-700',
  'En cours':   'text-blue-700',
  'En retard':  'text-red-600',
  'Prêt':       'text-emerald-700',
};

// Analyse status — per dossier, local to CT
const ANALYSE_STATUS: Record<string, string> = {
  'En attente': 'Rapport non démarré',
  'En cours':   'Rapport en cours',
  'Prêt':       'Rapport soumis',
};

interface Props { onVoirDossier: (d: Dossier) => void; }

export default function MesAnalysesView({ onVoirDossier }: Props) {
  const { dossiers } = useSoumissions();
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<typeof STATUTS[number]>(STATUTS[0]);
  const [page, setPage]       = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dossiers.filter(d => {
      const matchSearch = !q || d.reference.toLowerCase().includes(q) || d.operateur.toLowerCase().includes(q);
      const matchStatus = status === 'Tous' || d.status === status;
      return matchSearch && matchStatus;
    });
  }, [search, status, dossiers]);

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        <strong>Comité Technique :</strong> Votre mission est d'analyser les offres techniques et de produire un rapport écrit pour la COPEO. Vous n'avez pas de droit de vote, ne signez pas les PVs, et n'avez pas accès aux enveloppes financières.
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:border-[#97A675] focus:outline-none transition-all placeholder-gray-400"
            style={{ color: '#1C4532' }} />
        </div>
        <div className="flex items-center gap-2">
          {STATUTS.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                status === s ? 'bg-[#1C4532] text-white border-[#1C4532]' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">Aucune analyse assignée</div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F4F7F4]">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Dossier</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Opérateur</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut analyse</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-[#F9FBF9] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{d.reference}</p>
                      <p className="text-xs text-gray-400">{d.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.operateur}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.dateSoumission}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${STATUS_BADGE[d.status]}`}>
                        {ANALYSE_STATUS[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onVoirDossier(d)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                        Rédiger le rapport
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} rowsPerPage={ROWS_PER_PAGE} />}
        </>
      )}
    </div>
  );
}