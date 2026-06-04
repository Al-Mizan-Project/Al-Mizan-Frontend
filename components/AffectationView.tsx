'use client';

import { useNotifications } from '@/lib/notifications';
import { useHistorique } from '@/lib/historique';

import { useState, useMemo } from 'react';
import Pagination from '@/components/Pagination';
import {
  DOSSIERS,
  EVALUATEURS_DATA,
  Dossier,
  Evaluateur,
  Disponibilite,
} from '@/lib/dossiers-data';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROWS_PER_PAGE = 5;
const DOMAINES = ['Tous', 'BTP', 'Industrie', 'Agriculture', 'Énergie', 'Santé', 'Technologie'];
const PERIODES = ['Toutes', 'Ce mois', '3 derniers mois', '6 derniers mois', 'Cette année'];
const ROLES    = ['Tous', 'Évaluateur', 'Évaluateur Senior', 'Évaluateur Principal'];
const DISPOS   = ['Toutes', 'Recommandé', 'Indisponible', 'Conflit'];

// ─── Badge helpers ────────────────────────────────────────────────────────────
const ETAPE_BADGE: Record<string, string> = {
  'Soumis':       'bg-slate-100 text-slate-600',
  'En analyse':   'bg-violet-50 border border-violet-200 text-violet-700',
  'Vérification': 'bg-sky-50 border border-sky-200 text-sky-700',
  'Évaluation':   'bg-orange-50 border border-orange-200 text-orange-700',
  'Clôturé':      'bg-[#D6EAD4] border border-[#97A675] text-[#1C4532]',
};

const DISPO_CONFIG: Record<Disponibilite, { bg: string; text: string; dot: string; label: string }> = {
  'Recommandé':  { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Recommandé' },
  'Indisponible':{ bg: 'bg-gray-100 border border-gray-300',      text: 'text-gray-600',    dot: 'bg-gray-400',    label: 'Indisponible' },
  'Conflit':     { bg: 'bg-red-50 border border-red-200',         text: 'text-red-700',     dot: 'bg-red-500',     label: 'Conflit' },
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function SearchFilterBar({
  search, setSearch,
  filtersOpen, setFiltersOpen,
  activeFilterCount,
  onReset,
  filterSlots,
}: {
  search: string;
  setSearch: (v: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  activeFilterCount: number;
  onReset: () => void;
  filterSlots: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F4F7F4] text-sm focus:outline-none focus:border-[#97A675] focus:bg-white transition-all placeholder-gray-400"
            style={{ color: '#1C4532' }}
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            filtersOpen || activeFilterCount > 0
              ? 'border-[#97A675] bg-[#D6EAD4] text-[#1C4532]'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filtres
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#1C4532] text-white text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {(search || activeFilterCount > 0) && (
          <button onClick={onReset} className="px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all">
            Réinitialiser
          </button>
        )}
      </div>
      {filtersOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3">
          {filterSlots}
        </div>
      )}
    </div>
  );
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all"
        style={{ color: '#1C4532' }}
      >
        {options.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}



// ─── DOSSIER DETAIL CARD ──────────────────────────────────────────────────────

function DossierDetailCard({ dossier, onBack }: { dossier: Dossier; onBack: () => void }) {
  const [selectedEval, setSelectedEval]   = useState<string | null>(null);
  const [confirmed,    setConfirmed]      = useState(false);
  const [submitted,    setSubmitted]      = useState(false);
  const { notifyAffectation } = useNotifications();
  const { recordAffectation } = useHistorique();

  const handleAffecter = () => {
    if (!selectedEval || !confirmed) return;
    // Find the evaluateur object to get id
    const ev = EVALUATEURS_DATA.find(e => e.nom === selectedEval);
    recordAffectation({
      dossierRef:      dossier.reference,
      dossierId:       dossier.id,
      operateur:       dossier.operateur,
      evaluateurNom:   selectedEval,
      evaluateurId:    ev?.id ?? '',
      domaine:         '',
      delaiEvaluation: dossier.delaiEvaluation,
      status:          'En cours',
    });
    notifyAffectation(dossier.reference, dossier.id, selectedEval);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-[#D6EAD4] flex items-center justify-center text-3xl">✅</div>
        <h3 className="text-lg font-black text-[#1C4532]">Affectation confirmée</h3>
        <p className="text-sm text-gray-500">Le dossier <strong>{dossier.reference}</strong> a été affecté à <strong>{selectedEval}</strong>.</p>
        <button onClick={onBack} className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
          ← Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Retour à la liste
      </button>

      {/* Metadata card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
            📄
          </div>
          <div>
            <h3 className="text-sm font-black text-[#1C4532]">Détails du dossier</h3>
            <p className="text-xs text-gray-400">{dossier.reference}</p>
          </div>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-0">
          {[
            { label: 'Dossier',              value: dossier.id },
            { label: 'Référence dossier ID', value: dossier.reference },
            { label: 'Service Contractant',  value: 'Direction des Marchés Publics' },
          ].map((item, i) => (
            <div key={i} className={`p-4 ${i < 2 ? 'border-r border-gray-200' : ''} bg-[#F9FBF9]`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-bold text-[#1C4532]">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-0 border border-t-0 border-gray-200 rounded-b-xl overflow-hidden">
          {[
            { label: 'Opérateur économique', value: dossier.operateur },
            { label: 'Domaine',              value: 'BTP / Infrastructure' },
            { label: "Délai d'évaluation",   value: dossier.delaiEvaluation },
            { label: "Étape d'évaluation",   value: dossier.etape },
          ].map((item, i) => (
            <div key={i} className={`p-4 ${i < 3 ? 'border-r border-gray-200' : ''}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-bold text-[#1C4532]">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Extra row */}
        <div className="grid grid-cols-3 gap-0 border border-t-0 border-gray-200 rounded-b-xl overflow-hidden">
          {[
            { label: 'Date de soumission',    value: dossier.dateSoumission },
            { label: "Statut",                value: 'En attente d\'affectation' },
            { label: 'Évaluation',            value: 'Evaluation Administrative' },
          ].map((item, i) => (
            <div key={i} className={`p-4 ${i < 2 ? 'border-r border-gray-200' : ''} bg-[#F9FBF9]`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-bold text-[#1C4532]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluateurs selection table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-[#1C4532] mb-1">Sélectionner un évaluateur</h3>
        <p className="text-xs text-gray-400 mb-4">Cliquez sur une ligne pour sélectionner l'évaluateur à affecter.</p>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                <th className="w-10 px-4 py-3"></th>
                {['Évaluateur', 'Rôle', 'Charge (dossiers actuel)', 'Disponibilité'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#1C4532]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {EVALUATEURS_DATA.map((ev: Evaluateur) => {
                const isSelected = selectedEval === ev.nom;
                return (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEval(ev.nom)}
                    className={`cursor-pointer transition-all ${isSelected ? 'bg-[#D6EAD4]' : 'hover:bg-[#F9FBF9]'}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <div className={`w-4 h-4 rounded-full border-2 mx-auto flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#1C4532] bg-[#1C4532]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
                          {ev.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{ev.nom}</p>
                          <p className="text-xs text-gray-400">{ev.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ev.role}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-[#00738C]">{ev.chargeDossiers}</span>
                      <span className="text-xs text-gray-400 ml-1">dossiers</span>
                    </td>
                    <td className="px-4 py-3"><Dispobadge dispo={ev.disponibilite}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation + action */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setConfirmed(v => !v)}
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${
              confirmed ? 'border-[#1C4532] bg-[#1C4532]' : 'border-gray-300 group-hover:border-[#97A675]'
            }`}
          >
            {confirmed && (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5"><polyline points="1.5 6 4.5 9 10.5 3"/></svg>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Je déclare que cette affectation respecte les règles d'impartialité et d'absence de conflit d'intérêts.
          </p>
        </label>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {selectedEval
              ? <span>Évaluateur sélectionné : <strong className="text-[#1C4532]">{selectedEval}</strong></span>
              : <span className="text-amber-600 font-medium">⚠ Aucun évaluateur sélectionné</span>
            }
          </div>
          <button
            onClick={handleAffecter}
            disabled={!selectedEval || !confirmed}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}
          >
            Affecter
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EN ATTENTE TAB ───────────────────────────────────────────────────────────

function EnAttenteTab() {
  const [search,      setSearch]      = useState('');
  const [domaine,     setDomaine]     = useState('Tous');
  const [periode,     setPeriode]     = useState('Toutes');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  const filtered = useMemo(() => {
    return DOSSIERS.filter(d => {
      if (d.status !== 'En attente') return false;
      const matchSearch = search === '' ||
        d.reference.toLowerCase().includes(search.toLowerCase()) ||
        d.operateur.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [search, domaine, periode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleFilter = (fn: () => void) => { fn(); setCurrentPage(1); };
  const activeFilterCount = [domaine !== 'Tous', periode !== 'Toutes'].filter(Boolean).length;

  if (selectedDossier) {
    return <DossierDetailCard dossier={selectedDossier} onBack={() => setSelectedDossier(null)} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <SearchFilterBar
        search={search} setSearch={v => handleFilter(() => setSearch(v))}
        filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
        activeFilterCount={activeFilterCount}
        onReset={() => { setSearch(''); setDomaine('Tous'); setPeriode('Toutes'); setCurrentPage(1); }}
        filterSlots={<>
          <SelectFilter label="Domaine"  value={domaine}  onChange={v => handleFilter(() => setDomaine(v))}  options={DOMAINES} />
          <SelectFilter label="Période"  value={periode}  onChange={v => handleFilter(() => setPeriode(v))}  options={PERIODES} />
        </>}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg,#92400e,#d97706)' }}>
            {filtered.length}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Dossiers En Attente d'Affectation</h3>
            <p className="text-xs text-gray-400">{filtered.length} dossier{filtered.length !== 1 ? 's' : ''} — cliquez sur <strong>Gérer</strong> pour affecter</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                {['Référence Dossier', 'Opérateur Économique', 'Date de soumission', "Délai d'évaluation", 'Étape', 'Statut', 'Action'].map(col => (
                  <th key={col} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1C4532] whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">Aucun dossier trouvé</td></tr>
              ) : paginated.map((row: Dossier) => (
                <tr key={row.id} className="hover:bg-[#F9FBF9] transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-bold text-[#1C4532] text-sm">{row.reference}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{row.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
                        {row.operateur.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{row.operateur}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                    {new Date(row.dateSoumission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-[#00738C]">{row.delaiEvaluation}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${ETAPE_BADGE[row.etape] ?? 'bg-slate-100 text-slate-600'}`}>
                      {row.etape}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                      En attente
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDossier(row)}
                        className="bg-[#00738C] hover:bg-[#005f75] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md"
                      >
                        Gérer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        
      </div>
    </div>
  );
}

// ─── EVALUATEUR PROFILE ───────────────────────────────────────────────────────

function EvaluateurProfile({ ev, onBack }: { ev: Evaluateur; onBack: () => void }) {
  const assignedDossiers = DOSSIERS.filter(d => ev.dossiers.includes(d.reference));

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Retour à la liste
      </button>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
            {ev.nom.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-[#1C4532]">{ev.nom}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{ev.role} · {ev.specialite}</p>
                <p className="text-xs text-[#00738C] mt-1">{ev.email}</p>
              </div>
              <Dispobadge dispo={ev.disponibilite}/>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
          {[
            { label: 'ID Évaluateur',      value: ev.id },
            { label: 'Dossiers en charge', value: `${ev.chargeDossiers} dossiers` },
            { label: 'Spécialité',         value: ev.specialite },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-sm font-bold text-[#1C4532]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned dossiers */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
            {assignedDossiers.length}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Dossiers assignés</h3>
            <p className="text-xs text-gray-400">{assignedDossiers.length} dossier{assignedDossiers.length !== 1 ? 's' : ''} en charge</p>
          </div>
        </div>

        {assignedDossiers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Aucun dossier assigné</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F4F7F4] border-b border-gray-100">
                  {['Référence', 'Opérateur', 'Date', 'Délai', 'Étape', 'Statut'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#1C4532] whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignedDossiers.map((row: Dossier) => (
                  <tr key={row.id} className="hover:bg-[#F9FBF9] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#1C4532] text-xs">{row.reference}</p>
                      <p className="text-xs text-gray-400">{row.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{row.operateur}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(row.dateSoumission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-[#00738C]">{row.delaiEvaluation}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${ETAPE_BADGE[row.etape] ?? 'bg-slate-100 text-slate-600'}`}>
                        {row.etape}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"/>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EVALUATEURS TAB ──────────────────────────────────────────────────────────

function EvaluateursTab() {
  const [search,      setSearch]      = useState('');
  const [role,        setRole]        = useState('Tous');
  const [dispo,       setDispo]       = useState('Toutes');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedEv,  setSelectedEv]  = useState<Evaluateur | null>(null);

  const filtered = useMemo(() => {
    return EVALUATEURS_DATA.filter(ev => {
      const matchSearch = search === '' ||
        ev.nom.toLowerCase().includes(search.toLowerCase()) ||
        ev.role.toLowerCase().includes(search.toLowerCase()) ||
        ev.id.toLowerCase().includes(search.toLowerCase());
      const matchRole  = role  === 'Tous'    || ev.role === role;
      const matchDispo = dispo === 'Toutes'  || ev.disponibilite === dispo;
      return matchSearch && matchRole && matchDispo;
    });
  }, [search, role, dispo]);

  const activeFilterCount = [role !== 'Tous', dispo !== 'Toutes'].filter(Boolean).length;

  if (selectedEv) {
    return <EvaluateurProfile ev={selectedEv} onBack={() => setSelectedEv(null)} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <SearchFilterBar
        search={search} setSearch={setSearch}
        filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
        activeFilterCount={activeFilterCount}
        onReset={() => { setSearch(''); setRole('Tous'); setDispo('Toutes'); }}
        filterSlots={<>
          <SelectFilter label="Rôle"         value={role}  onChange={setRole}  options={ROLES} />
          <SelectFilter label="Disponibilité" value={dispo} onChange={setDispo} options={DISPOS} />
        </>}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
            {filtered.length}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Évaluateurs</h3>
            <p className="text-xs text-gray-400">Cliquez sur une ligne pour voir le profil complet</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                {['Évaluateur', 'Rôle', 'Charge (dossiers actuel)', 'Disponibilité'].map(col => (
                  <th key={col} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#1C4532] whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-16 text-gray-400 text-sm">Aucun évaluateur trouvé</td></tr>
              ) : filtered.map((ev: Evaluateur) => (
                <tr
                  key={ev.id}
                  onClick={() => setSelectedEv(ev)}
                  className="hover:bg-[#F4F7F4] cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
                        {ev.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#1C4532]">{ev.nom}</p>
                        <p className="text-xs text-gray-400">{ev.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{ev.role}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-[#00738C]">{ev.chargeDossiers}</span>
                    <span className="text-xs text-gray-400 ml-1">dossiers</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <Dispobadge dispo={ev.disponibilite}/>
                      <svg className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Dispobadge({ dispo }: { dispo: Disponibilite }) {
  const c = DISPO_CONFIG[dispo];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
      {c.label}
    </span>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function AffectationView() {
  const [activeTab, setActiveTab] = useState<'en-attente' | 'evaluateurs'>('en-attente');

  const TABS = [
    { id: 'en-attente'  as const, label: 'En Attente',   count: DOSSIERS.filter(d => d.status === 'En attente').length },
    { id: 'evaluateurs' as const, label: 'Évaluateurs',  count: EVALUATEURS_DATA.length },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 -mx-6 -mt-6 px-8 mb-6 flex items-center gap-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold relative transition-all duration-200 ${
                isActive ? 'text-[#00738C]' : 'text-gray-500 hover:text-[#1C4532]'
              }`}
            >
              {tab.label}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isActive ? 'bg-[#D6EAD4] text-[#1C4532]' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#00738C' }}/>}
            </button>
          );
        })}
      </div>

      {activeTab === 'en-attente'  && <EnAttenteTab/>}
      {activeTab === 'evaluateurs' && <EvaluateursTab/>}
    </div>
  );
}