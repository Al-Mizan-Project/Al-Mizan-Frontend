'use client';

import { useState, useMemo } from 'react';
import DossierTable from '@/components/DossierTable';
import Pagination from '@/components/Pagination';
import { DOSSIERS, DossierStatus, DossierEtape, Dossier } from '@/lib/dossiers-data';
import AdminDossierDetailView from '@/components/AdminDossierDetailView';

const ROWS_PER_PAGE = 6;

// ─── Action handlers ──────────────────────────────────────────────────────────
// ─── Filter options ───────────────────────────────────────────────────────────
const EVALUATEURS = ['Tous', 'A. Benali', 'S. Hadj', 'K. Meziane', 'L. Ouali', 'M. Tebbal'];
const DOMAINES    = ['Tous', 'BTP', 'Industrie', 'Agriculture', 'Énergie', 'Santé', 'Technologie'];
const PERIODES    = ['Toutes', 'Ce mois', '3 derniers mois', '6 derniers mois', 'Cette année'];
const STATUTS: ('Tous' | DossierStatus)[] = ['Tous', 'En attente', 'En cours', 'En retard', 'Prêt'];

const STATUS_BADGE_COLORS: Record<string, string> = {
  'En attente': 'bg-amber-50 border border-amber-200 text-amber-700',
  'En cours':   'bg-blue-50 border border-blue-200 text-blue-700',
  'En retard':  'bg-red-50 border border-red-200 text-red-700',
  'Prêt':       'bg-emerald-50 border border-emerald-200 text-emerald-700',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DossiersView() {
  const [search,     setSearch]     = useState('');
  const [evaluateur, setEvaluateur] = useState('Tous');
  const [domaine,    setDomaine]    = useState('Tous');
  const [periode,    setPeriode]    = useState('Toutes');
  const [statut,     setStatut]     = useState<'Tous' | DossierStatus>('Tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  const actionConfig = {
    buttons: [
      {
        label: 'Voir',
        variant: 'secondary' as const,
        onClick: (d: Dossier) => setSelectedDossier(d),
      },
      {
        label: 'Gérer',
        variant: 'primary' as const,
        onClick: (d: Dossier) => setSelectedDossier(d),
      },
    ],
  };

  const filtered = useMemo(() => {
    return DOSSIERS.filter(d => {
      const matchSearch = search === '' ||
        d.reference.toLowerCase().includes(search.toLowerCase()) ||
        d.operateur.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());
      const matchStatut = statut === 'Tous' || d.status === statut;
      // evaluateur, domaine, periode are UI-only filters (no field in mock data)
      return matchSearch && matchStatut;
    });
  }, [search, statut, evaluateur, domaine, periode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));

  // Reset page when filters change
  const handleFilter = (fn: () => void) => { fn(); setCurrentPage(1); };

  const activeFilterCount = [
    evaluateur !== 'Tous',
    domaine !== 'Tous',
    periode !== 'Toutes',
    statut !== 'Tous',
  ].filter(Boolean).length;

  if (selectedDossier) {
    return <AdminDossierDetailView dossier={selectedDossier} onBack={() => setSelectedDossier(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Search + Filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher par référence, opérateur…"
              value={search}
              onChange={e => handleFilter(() => setSearch(e.target.value))}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7F4] text-sm focus:outline-none focus:border-[#97A675] focus:bg-white transition-all placeholder-gray-400"
              style={{ color: '#1C4532' }}
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              filtersOpen || activeFilterCount > 0
                ? 'border-[#97A675] bg-[#D6EAD4] text-[#1C4532]'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filtres
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#1C4532] text-white text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Status quick-filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {STATUTS.map(s => (
              <button
                key={s}
                onClick={() => handleFilter(() => setStatut(s))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  statut === s
                    ? s === 'Tous'
                      ? 'bg-[#1C4532] text-white border-[#1C4532]'
                      : STATUS_BADGE_COLORS[s]
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Reset */}
          {(search || activeFilterCount > 0) && (
            <button
              onClick={() => {
                setSearch(''); setStatut('Tous'); setEvaluateur('Tous');
                setDomaine('Tous'); setPeriode('Toutes'); setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-200"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Évaluateur */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Évaluateur
              </label>
              <select
                value={evaluateur}
                onChange={e => handleFilter(() => setEvaluateur(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all"
                style={{ color: '#1C4532' }}
              >
                {EVALUATEURS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Domaine */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Domaine
              </label>
              <select
                value={domaine}
                onChange={e => handleFilter(() => setDomaine(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all"
                style={{ color: '#1C4532' }}
              >
                {DOMAINES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Période */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Période
              </label>
              <select
                value={periode}
                onChange={e => handleFilter(() => setPeriode(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all"
                style={{ color: '#1C4532' }}
              >
                {PERIODES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Statut
              </label>
              <select
                value={statut}
                onChange={e => handleFilter(() => setStatut(e.target.value as any))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all"
                style={{ color: '#1C4532' }}
              >
                {STATUTS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}
            >
              {filtered.length}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Tous les Dossiers</h3>
              <p className="text-xs text-gray-400">
                {filtered.length} dossier{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
                {filtered.length !== DOSSIERS.length && (
                  <span className="text-[#00738C] font-semibold"> (filtrés sur {DOSSIERS.length})</span>
                )}
              </p>
            </div>
          </div>

          {/* Export stub */}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-[#D6EAD4] hover:text-[#1C4532] hover:border-[#97A675] transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exporter
          </button>
        </div>

        <DossierTable
          data={filtered}
          actionConfig={actionConfig}
          currentPage={currentPage}
          rowsPerPage={ROWS_PER_PAGE}
        />

        
      </div>
    </div>
  );
}