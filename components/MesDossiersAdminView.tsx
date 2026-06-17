'use client';

import { useState, useMemo, useRef } from 'react';
import { DOSSIERS, DossierStatus, Dossier } from '@/lib/dossiers-data';
import Pagination from '@/components/Pagination';

// ─── Same assigned pool ───────────────────────────────────────────────────────
const ASSIGNED_REFS = [
  'REF-2024-0022', 'REF-2024-0023', 'REF-2024-0024', 'REF-2024-0025', 'REF-2024-0026',
  'REF-2024-0011', 'REF-2024-0012', 'REF-2024-0013', 'REF-2024-0014', 'REF-2024-0015',
];
const MY_DOSSIERS = DOSSIERS.filter(d => ASSIGNED_REFS.includes(d.reference));

const ROWS_PER_PAGE = 10;

// ─── Filter options (derived from real data) ──────────────────────────────────
const DOMAINES = ['Tous', 'BTP', 'Industrie', 'Agriculture', 'Énergie', 'Santé', 'Technologie'];
const PERIODES = ['Toutes', 'Ce mois', '3 derniers mois', '6 derniers mois', 'Cette année'];
const STATUTS: ('Tous' | DossierStatus)[] = ['Tous', 'En attente', 'En cours', 'En retard', 'Prêt'];

const STATUS_BADGE: Record<string, string> = {
  'En attente': 'text-amber-700',
  'En cours': 'text-blue-700',
  'En retard': 'text-red-600',
  'Prêt': 'text-emerald-700',
};

const DROPDOWN_ACTIVE = 'bg-[#1C4532] text-white border-[#1C4532]';
const DROPDOWN_IDLE = 'bg-white text-gray-700 border-gray-200 hover:bg-[#F4F7F4]';

type SortDir = 'asc' | 'desc' | null;

function matchesPeriode(dateSoumission: string, periode: string): boolean {
  if (periode === 'Toutes') return true;
  const d = new Date(dateSoumission);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (periode === 'Ce mois') return diffDays <= 30;
  if (periode === '3 derniers mois') return diffDays <= 90;
  if (periode === '6 derniers mois') return diffDays <= 180;
  if (periode === 'Cette année') return d.getFullYear() === now.getFullYear();
  return true;
}

function ColHeader({ label, sortKey, sortBy, sortDir, onSort }: {
  label: string; sortKey: string;
  sortBy: string | null; sortDir: SortDir;
  onSort: (k: string) => void;
}) {
  const active = sortBy === sortKey;
  return (
    <button onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wider hover:text-[#1C4532] transition-colors">
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className={active ? 'text-[#1C4532]' : 'text-gray-400'}>
        <polyline points={(!active || sortDir === 'asc') ? '6 9 12 15 18 9' : '18 15 12 9 6 15'} />
      </svg>
    </button>
  );
}

// ─── Dropdown component ───────────────────────────────────────────────────────
function Dropdown<T extends string>({ label, options, value, onChange }: {
  label: string; options: T[]; value: T; onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${isActive ? DROPDOWN_ACTIVE : DROPDOWN_IDLE}`}
      >
        {isActive ? value : label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === opt ? 'text-[#1C4532] font-bold bg-[#F4F7F4]' : 'text-gray-600 hover:bg-[#F4F7F4]'
                }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props { onVoirDossier: (d: Dossier) => void; }

export default function MesDossiersAdminView({ onVoirDossier }: Props) {
  const [search, setSearch] = useState('');
  const [domaine, setDomaine] = useState(DOMAINES[0]);
  const [status, setStatus] = useState<typeof STATUTS[number]>(STATUTS[0]);
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MY_DOSSIERS.filter(d => {
      const matchSearch = !q || d.reference.toLowerCase().includes(q) || d.operateur.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
      const matchStatus = status === 'Tous' || d.status === status;
      const matchPeriode = matchesPeriode(d.dateSoumission, periode);
      // domaine filter is illustrative — no domaine field on Dossier yet
      return matchSearch && matchStatus && matchPeriode;
    });
  }, [search, domaine, status, periode]);

  const sorted = useMemo(() => {
    if (!sortBy) return filtered;
    return [...filtered].sort((a, b) => {
      const av = sortBy === 'reference' ? a.reference : sortBy === 'operateur' ? a.operateur
        : sortBy === 'date' ? a.dateSoumission : sortBy === 'delai' ? a.delaiEvaluation : a.status;
      const bv = sortBy === 'reference' ? b.reference : sortBy === 'operateur' ? b.operateur
        : sortBy === 'date' ? b.dateSoumission : sortBy === 'delai' ? b.delaiEvaluation : b.status;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const paged = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Active filter pills
  const activePills: { label: string; clear: () => void }[] = [];
  if (domaine !== DOMAINES[0]) activePills.push({ label: domaine, clear: () => setDomaine(DOMAINES[0]) });
  if (status !== STATUTS[0]) activePills.push({ label: status, clear: () => setStatus(STATUTS[0]) });
  if (periode !== PERIODES[0]) activePills.push({ label: periode, clear: () => setPeriode(PERIODES[0]) });

  const resetAll = () => { setSearch(''); setDomaine(DOMAINES[0]); setStatus(STATUTS[0]); setPeriode(PERIODES[0]); setPage(1); };

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-lg">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:border-[#97A675] focus:outline-none transition-all placeholder-gray-400"
            style={{ color: '#1C4532' }}
          />
        </div>
        <Dropdown label="Domaine" options={DOMAINES} value={domaine} onChange={v => { setDomaine(v); setPage(1); }} />
        <Dropdown label="Status" options={STATUTS} value={status} onChange={v => { setStatus(v); setPage(1); }} />
        <Dropdown label="Période" options={PERIODES} value={periode} onChange={v => { setPeriode(v); setPage(1); }} />
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activePills.map(p => (
            <span key={p.label} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-semibold text-gray-700">
              {p.label}
              <button onClick={p.clear} className="text-gray-400 hover:text-red-500 transition-colors leading-none">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Table or empty state */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h3 className="text-2xl font-black text-gray-800">Aucun résultat trouvé</h3>
          <p className="text-sm text-gray-500">Nous n'avons trouvé aucun article correspondant à votre recherche.</p>
          <button onClick={resetAll}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#00738C] text-[#00738C] font-bold text-sm rounded-xl hover:bg-[#D6EAD4] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-[#F4F7F4]">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-left"><ColHeader label="Dossier" sortKey="reference" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-4 py-3 text-left"><ColHeader label="Opérateur Économique" sortKey="operateur" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-4 py-3 text-left"><ColHeader label="Date de d'affectation" sortKey="date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-4 py-3 text-left"><ColHeader label="Délai d'évaluation" sortKey="delai" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                  <th className="px-4 py-3 text-left"><ColHeader label="Status" sortKey="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {paged.map(d => (
                  <tr key={d.id} onClick={() => onVoirDossier(d)}
                    className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-gray-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{d.reference}</p>
                      <p className="text-xs text-gray-400">{d.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{d.operateur}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.dateSoumission}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.delaiEvaluation}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${STATUS_BADGE[d.status]}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            
          )}
        </>
      )}
    </div>
  );
}