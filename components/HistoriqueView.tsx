'use client';

import { useState, useMemo } from 'react';
import { useHistorique, AffectationRecord } from '@/lib/historique';
import { EVALUATEURS_DATA } from '@/lib/dossiers-data';

const ROWS_PER_PAGE = 10;
const STATUTS_OPTS  = ['Tous', 'En cours', 'En retard', 'Prêt'];
const PERIODES      = ['Toutes', 'Ce mois', '3 derniers mois', '6 derniers mois', 'Cette année'];
const EVALUATEUR_OPTS = ['Tous', ...EVALUATEURS_DATA.map(e => e.nom)];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function matchesPeriode(date: Date, periode: string): boolean {
  if (periode === 'Toutes') return true;
  const now   = new Date();
  const msAgo = now.getTime() - date.getTime();
  const days  = msAgo / 86_400_000;
  if (periode === 'Ce mois')          return days <= 30;
  if (periode === '3 derniers mois')  return days <= 90;
  if (periode === '6 derniers mois')  return days <= 180;
  if (periode === 'Cette année')      return date.getFullYear() === now.getFullYear();
  return true;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<AffectationRecord['status'], string> = {
  'En cours':  'text-blue-700',
  'En retard': 'text-red-600',
  'Prêt':      'text-emerald-700',
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = value !== options[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
      >
        {active ? value : label}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] py-1 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === opt ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────
function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700">
      {label}
      <button onClick={onRemove} className="text-gray-400 hover:text-gray-600 ml-0.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (n: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    [1,2,3,4,5,'...',total].forEach(p => pages.push(p as any));
  }
  return (
    <div className="flex items-center justify-center gap-1 py-5">
      <button onClick={() => onChange(current-1)} disabled={current<=1}
        className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-blue-600 disabled:opacity-30">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Previous
      </button>
      {pages.map((p,i) => p === '...'
        ? <span key={`e${i}`} className="px-2 text-gray-400">...</span>
        : <button key={p} onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold ${current===p ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            {p}
          </button>
      )}
      <button onClick={() => onChange(current+1)} disabled={current>=total}
        className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-blue-600 disabled:opacity-30">
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}

// ─── Sort header ──────────────────────────────────────────────────────────────
function SortTh({ label }: { label: string }) {
  return (
    <th className="text-left px-5 py-3.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
      <span className="flex items-center gap-1">
        {label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
        </svg>
      </span>
    </th>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="38" ry="38" stroke="#D1D5DB" strokeWidth="3"/>
        <path d="M35 50 Q42 60 50 57 Q58 54 65 50" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="38" cy="40" r="4" fill="#D1D5DB"/>
        <circle cx="62" cy="40" r="4" fill="#D1D5DB"/>
        <path d="M78 22 L90 12 M83 17 L95 22" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <div className="text-center">
        <h2 className="text-3xl font-black text-gray-800 mb-2">
          {hasFilters ? 'Aucun résultat trouvé' : 'Aucune affectation enregistrée'}
        </h2>
        <p className="text-gray-500 text-sm max-w-sm">
          {hasFilters
            ? "Nous n'avons trouvé aucun article correspondant à votre recherche."
            : "Les dossiers affectés aux évaluateurs apparaîtront ici automatiquement."}
        </p>
      </div>
      {hasFilters && (
        <button onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 border border-blue-600 text-blue-600 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-all">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HistoriqueView() {
  const { records } = useHistorique();

  const [search,      setSearch]      = useState('');
  const [evaluateur,  setEvaluateur]  = useState('Tous');
  const [statut,      setStatut]      = useState('Tous');
  const [periode,     setPeriode]     = useState('Toutes');
  const [currentPage, setCurrentPage] = useState(1);

  const reset = () => {
    setSearch(''); setEvaluateur('Tous'); setStatut('Tous');
    setPeriode('Toutes'); setCurrentPage(1);
  };
  const handle = (fn: () => void) => { fn(); setCurrentPage(1); };

  const filtered = useMemo(() => {
    return records.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.dossierRef.toLowerCase().includes(q) ||
        r.operateur.toLowerCase().includes(q)  ||
        r.evaluateurNom.toLowerCase().includes(q);
      const matchEval   = evaluateur === 'Tous' || r.evaluateurNom === evaluateur;
      const matchStatut = statut === 'Tous'     || r.status === statut;
      const matchPeriode = matchesPeriode(r.affectedAt, periode);
      return matchSearch && matchEval && matchStatut && matchPeriode;
    });
  }, [records, search, evaluateur, statut, periode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((currentPage-1)*ROWS_PER_PAGE, currentPage*ROWS_PER_PAGE);

  const activePills: { label: string; clear: () => void }[] = [
    ...(evaluateur !== 'Tous'   ? [{ label: evaluateur, clear: () => handle(() => setEvaluateur('Tous'))  }] : []),
    ...(statut     !== 'Tous'   ? [{ label: statut,     clear: () => handle(() => setStatut('Tous'))      }] : []),
    ...(periode    !== 'Toutes' ? [{ label: periode,    clear: () => handle(() => setPeriode('Toutes'))   }] : []),
  ];

  const hasFilters = !!search || activePills.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher"
            value={search}
            onChange={e => handle(() => setSearch(e.target.value))}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-blue-400 transition-all placeholder-gray-400 text-gray-800"
          />
        </div>
        <Dropdown label="Evaluateur" value={evaluateur} options={EVALUATEUR_OPTS} onChange={v => handle(() => setEvaluateur(v))} />
        <Dropdown label="Status"     value={statut}     options={STATUTS_OPTS}    onChange={v => handle(() => setStatut(v))} />
        <Dropdown label="Période"    value={periode}    options={PERIODES}         onChange={v => handle(() => setPeriode(v))} />
        {hasFilters && (
          <button onClick={reset} className="text-sm text-red-500 hover:text-red-700 font-semibold px-2 py-1 transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activePills.map(p => <Pill key={p.label} label={p.label} onRemove={p.clear} />)}
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onReset={reset} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <SortTh label="Dossier" />
                  <SortTh label="Évaluateur" />
                  <SortTh label="Opérateur Economique" />
                  <SortTh label="Délai d'évaluation" />
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-gray-700">Date d'affectation</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-gray-700">Statut</th>
                  <th className="text-left px-5 py-3.5 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {/* Dossier */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="flex-shrink-0">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <div>
                          <p className="font-semibold text-gray-800">{row.dossierRef}</p>
                          <p className="text-xs text-gray-400">{row.dossierId}</p>
                        </div>
                      </div>
                    </td>
                    {/* Évaluateur */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{row.evaluateurNom}</p>
                          <p className="text-xs text-gray-400">{row.evaluateurId}</p>
                        </div>
                      </div>
                    </td>
                    {/* Opérateur */}
                    <td className="px-5 py-4 text-gray-700">{row.operateur}</td>
                    {/* Délai */}
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{row.delaiEvaluation}</td>
                    {/* Date affectation */}
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap text-xs">
                      {row.affectedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      <br />
                      <span className="text-gray-400">
                        {row.affectedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    {/* Statut */}
                    <td className={`px-5 py-4 font-semibold text-sm ${STATUS_STYLE[row.status]}`}>
                      {row.status}
                    </td>
                    {/* Action */}
                    <td className="px-5 py-4">
                      <button className="px-3 py-1.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all">
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        </div>
      )}
    </div>
  );
}