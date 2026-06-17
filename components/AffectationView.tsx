'use client';

import { useNotifications } from '@/lib/notifications';
import { useHistorique } from '@/lib/historique';
import { useSoumissions } from '@/lib/soumissions-context';

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

// ─── Helper functions ─────────────────────────────────────────────────────────
function Dispobadge({ dispo }: { dispo: Disponibilite }) {
  const c = DISPO_CONFIG[dispo];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
      {c.label}
    </span>
  );
}

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
  const [selectedEvals, setSelectedEvals] = useState<number[]>([]);
  const [confirmed,     setConfirmed]     = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [evalType,      setEvalType]      = useState<'technique' | 'administrative'>('technique');
  const { notifyAffectation } = useNotifications();
  const { recordAffectation }  = useHistorique();
  const { affecter, evaluateurs } = useSoumissions();

  const evalList = evaluateurs.map((e: any) => ({
    id:            e.id_utilisateur,
    nom:           e.email,
    role:          e.id_role,
    email:         e.email,
    disponibilite: 'Recommandé' as Disponibilite,
    chargeDossiers: 0,
  }));

  const toggleEval = (id: number) => {
    setSelectedEvals(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const handleAffecter = async () => {
    if (selectedEvals.length === 0 || !confirmed) return;
    setSubmitting(true);
    try {
      await affecter(dossier.id, selectedEvals, evalType);
      selectedEvals.forEach(id => {
        const ev = evalList.find(e => e.id === id);
        if (ev) {
          recordAffectation({
            dossierRef: dossier.reference, dossierId: dossier.id,
            operateur: dossier.operateur, evaluateurNom: ev.nom,
            evaluateurId: String(ev.id), domaine: '',
            delaiEvaluation: dossier.delaiEvaluation, status: 'En cours',
          });
          notifyAffectation(dossier.reference, dossier.id, ev.nom);
        }
      });
      setSubmitted(true);
    } catch {
      alert('Erreur lors de l\'affectation');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-[#D6EAD4] flex items-center justify-center text-3xl">✅</div>
        <h3 className="text-lg font-black text-[#1C4532]">Affectation confirmée</h3>
        <p className="text-sm text-gray-500">
          Le dossier <strong>{dossier.reference}</strong> a été affecté avec succès.
        </p>
        <button onClick={onBack} className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
          ← Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors w-fit">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Retour à la liste
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-xl overflow-hidden">
          {[['Dossier', dossier.id], ['Référence', dossier.reference], ['Service Contractant', 'Direction des Marchés Publics']].map(([l, v], i) => (
            <div key={i} className={`p-4 ${i < 2 ? 'border-r border-gray-200' : ''} bg-[#F9FBF9]`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{l}</p>
              <p className="text-sm font-bold text-[#1C4532]">{v}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-0 border border-t-0 border-gray-200 rounded-b-xl overflow-hidden">
          {[['Opérateur économique', dossier.operateur], ['Délai d\'évaluation', dossier.delaiEvaluation], ['Étape', dossier.etape], ['Statut', dossier.status]].map(([l, v], i) => (
            <div key={i} className={`p-4 ${i < 3 ? 'border-r border-gray-200' : ''}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{l}</p>
              <p className="text-sm font-bold text-[#1C4532]">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-[#1C4532] mb-3">Type d'évaluation</h3>
        <div className="flex gap-3">
          {(['technique', 'administrative'] as const).map(t => (
            <button key={t} onClick={() => setEvalType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${evalType === t ? 'bg-[#1C4532] text-white border-[#1C4532]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t === 'technique' ? 'Technique / Financière' : 'Administrative'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-[#1C4532] mb-1">Sélectionner les évaluateurs</h3>
        <p className="text-xs text-gray-400 mb-4">Cliquez sur une ligne pour sélectionner/désélectionner.</p>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                <th className="w-10 px-4 py-3"></th>
                {['Évaluateur', 'Rôle', 'Disponibilité'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#1C4532]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {evalList.map(ev => {
                const isSelected = selectedEvals.includes(ev.id);
                return (
                  <tr key={ev.id} onClick={() => toggleEval(ev.id)}
                    className={`cursor-pointer transition-all ${isSelected ? 'bg-[#D6EAD4]' : 'hover:bg-[#F9FBF9]'}`}>
                    <td className="px-4 py-3 text-center">
                      <div className={`w-4 h-4 rounded border-2 mx-auto flex items-center justify-center transition-all ${isSelected ? 'border-[#1C4532] bg-[#1C4532]' : 'border-gray-300'}`}>
                        {isSelected && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5"><polyline points="1.5 6 4.5 9 10.5 3"/></svg>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
                          {ev.email.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-gray-800">{ev.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{ev.role}</td>
                    <td className="px-4 py-3"><Dispobadge dispo="Recommandé"/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={confirmed} onChange={() => setConfirmed(!confirmed)} className="mt-1" />
          <p className="text-sm text-gray-700">Je déclare que cette affectation respecte les règles d'impartialité.</p>
        </label>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {selectedEvals.length > 0 ? `${selectedEvals.length} sélectionné(s)` : 'Aucun évaluateur sélectionné'}
          </div>
          <button onClick={handleAffecter} disabled={selectedEvals.length === 0 || !confirmed || submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
            {submitting ? 'Affectation...' : 'Affecter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TABS COMPONENTS (EN ATTENTE / EN COURS) ──────────────────────────────────

function EnAttenteTab() {
  const { dossiers: DOSSIERS } = useSoumissions();
  const [search, setSearch] = useState('');
  const [domaine, setDomaine] = useState('Tous');
  const [periode, setPeriode] = useState('Toutes');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  const filtered = useMemo(() => {
    return DOSSIERS.filter(d => {
      if (d.status !== 'En attente') return false;
      return search === '' || d.reference.toLowerCase().includes(search.toLowerCase()) || d.operateur.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, DOSSIERS]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  if (selectedDossier) return <DossierDetailCard dossier={selectedDossier} onBack={() => setSelectedDossier(null)} />;

  return (
    <div className="flex flex-col gap-5">
      <SearchFilterBar
        search={search} setSearch={setSearch}
        filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}
        activeFilterCount={[domaine !== 'Tous', periode !== 'Toutes'].filter(Boolean).length}
        onReset={() => { setSearch(''); setDomaine('Tous'); setPeriode('Toutes'); }}
        filterSlots={<><SelectFilter label="Domaine" value={domaine} onChange={setDomaine} options={DOMAINES} /><SelectFilter label="Période" value={periode} onChange={setPeriode} options={PERIODES} /></>}
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                {['Référence', 'Opérateur', 'Date', 'Délai', 'Étape', 'Statut', 'Action'].map(col => (
                  <th key={col} className="text-left px-5 py-3.5 text-xs font-bold uppercase text-[#1C4532]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(row => (
                <tr key={row.id}>
                  <td className="px-5 py-4 font-bold">{row.reference}</td>
                  <td className="px-5 py-4">{row.operateur}</td>
                  <td className="px-5 py-4">{row.dateSoumission}</td>
                  <td className="px-5 py-4 text-[#00738C] font-bold">{row.delaiEvaluation}</td>
                  <td className="px-5 py-4"><span className={`px-2 py-1 rounded text-xs ${ETAPE_BADGE[row.etape]}`}>{row.etape}</span></td>
                  <td className="px-5 py-4"><span className="text-amber-600">En attente</span></td>
                  <td className="px-5 py-4"><button onClick={() => setSelectedDossier(row)} className="bg-[#00738C] text-white px-3 py-1.5 rounded-lg text-xs">Gérer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        
      </div>
    </div>
  );
}

function EnCoursTab() {
  const { dossiers: DOSSIERS } = useSoumissions();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  const filtered = useMemo(() => {
    return DOSSIERS.filter(d => d.status === 'En cours' && (search === '' || d.reference.toLowerCase().includes(search.toLowerCase())));
  }, [search, DOSSIERS]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  if (selectedDossier) return <DossierDetailCard dossier={selectedDossier} onBack={() => setSelectedDossier(null)} />;

  return (
    <div className="flex flex-col gap-5">
      <SearchFilterBar search={search} setSearch={setSearch} filtersOpen={false} setFiltersOpen={() => {}} activeFilterCount={0} onReset={() => setSearch('')} filterSlots={null} />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                {['Référence', 'Opérateur', 'Date', 'Statut', 'Action'].map(col => (
                  <th key={col} className="text-left px-5 py-3.5 text-xs font-bold uppercase text-[#1C4532]">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map(row => (
                <tr key={row.id}>
                  <td className="px-5 py-4 font-bold">{row.reference}</td>
                  <td className="px-5 py-4">{row.operateur}</td>
                  <td className="px-5 py-4">{row.dateSoumission}</td>
                  <td className="px-5 py-4 text-blue-600">En cours</td>
                  <td className="px-5 py-4"><button onClick={() => setSelectedDossier(row)} className="bg-[#00738C] text-white px-3 py-1.5 rounded-lg text-xs">Gérer</button></td>
                </tr>
              ))}
            </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} rowsPerPage={ROWS_PER_PAGE} />
      </div>
    </div>
  );
}

// ─── EVALUATEUR PROFILE & TAB ─────────────────────────────────────────────────

function EvaluateurProfile({ ev, onBack }: { ev: Evaluateur; onBack: () => void }) {
  const assignedDossiers = DOSSIERS.filter(d => ev.dossiers.includes(d.reference));
  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="text-sm font-semibold text-[#00738C]">← Retour</button>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-xl font-black text-[#1C4532]">{ev.nom}</h3>
        <p className="text-sm text-gray-500">{ev.role} • {ev.specialite}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
         <h4 className="font-bold mb-4">Dossiers assignés ({assignedDossiers.length})</h4>
         <table className="w-full text-sm">
            <thead><tr className="text-left border-b"><th>Référence</th><th>Opérateur</th></tr></thead>
            <tbody>
              {assignedDossiers.map(d => (
                <tr key={d.id} className="border-b"><td className="py-2">{d.reference}</td><td>{d.operateur}</td></tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}

function EvaluateursTab() {
  const [search, setSearch] = useState('');
  const [selectedEv, setSelectedEv] = useState<Evaluateur | null>(null);

  const filtered = useMemo(() => {
    return EVALUATEURS_DATA.filter(ev => ev.nom.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  if (selectedEv) return <EvaluateurProfile ev={selectedEv} onBack={() => setSelectedEv(null)} />;

  return (
    <div className="flex flex-col gap-5">
      <SearchFilterBar search={search} setSearch={setSearch} filtersOpen={false} setFiltersOpen={() => {}} activeFilterCount={0} onReset={() => setSearch('')} filterSlots={null} />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F4F7F4] border-b border-gray-100">
              {['Évaluateur', 'Rôle', 'Charge', 'Disponibilité'].map(col => (
                <th key={col} className="text-left px-5 py-3.5 text-xs font-bold uppercase text-[#1C4532]">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(ev => (
              <tr key={ev.id} onClick={() => setSelectedEv(ev)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-5 py-4 font-bold">{ev.nom}</td>
                <td className="px-5 py-4">{ev.role}</td>
                <td className="px-5 py-4">{ev.chargeDossiers} dossiers</td>
                <td className="px-5 py-4"><Dispobadge dispo={ev.disponibilite} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function AffectationView() {
  const { dossiers } = useSoumissions();
  const [activeTab, setActiveTab] = useState<'en-attente' | 'en-cours' | 'evaluateurs'>('en-attente');

  const TABS = [
    { id: 'en-attente' as const, label: 'En Attente', count: dossiers.filter(d => d.status === 'En attente').length },
    { id: 'en-cours' as const, label: 'En Cours', count: dossiers.filter(d => d.status === 'En cours').length },
    { id: 'evaluateurs' as const, label: 'Évaluateurs', count: EVALUATEURS_DATA.length },
  ];

  return (
    <div className="flex flex-col gap-0">
      <div className="bg-white border-b border-gray-100 -mx-6 -mt-6 px-8 mb-6 flex items-center gap-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold relative ${isActive ? 'text-[#00738C]' : 'text-gray-500'}`}>
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-[#D6EAD4] text-[#1C4532]' : 'bg-gray-100'}`}>{tab.count}</span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00738C] rounded-full" />}
            </button>
          );
        })}
      </div>
      {activeTab === 'en-attente'  && <EnAttenteTab />}
      {activeTab === 'en-cours'    && <EnCoursTab />}
      {activeTab === 'evaluateurs' && <EvaluateursTab />}
    </div>
  );
}