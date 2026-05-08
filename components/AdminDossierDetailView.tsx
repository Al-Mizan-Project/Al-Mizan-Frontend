'use client';

import { useState, useEffect } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useNotifications } from '@/lib/notifications';
import { api } from '@/lib/api';

type MainTab       = 'offre-financiere' | 'offre-technique' | 'appel-offre' | 'rapports';
type RapportSection = 'infos-generales' | 'eval-administrative' | 'evaluations-list';

// ─── PDF Viewer placeholder (real PDFs come from document-store for refs) ─────
function PdfViewer() {
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2 text-xs">
        <div className="flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <button className="hover:text-gray-300 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span className="font-medium">Zoom</span>
          <button className="hover:text-gray-300 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="hover:text-gray-300">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="font-medium">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="hover:text-gray-300">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 bg-gray-200 flex items-center justify-center" style={{ minHeight: '420px' }}>
        <div className="bg-gray-300 flex items-center justify-center rounded" style={{ width: '60%', height: '85%' }}>
          <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
            <rect x="5" y="5" width="90" height="90" stroke="#9CA3AF" strokeWidth="3" fill="none"/>
            <line x1="5" y1="5" x2="95" y2="95" stroke="#9CA3AF" strokeWidth="3"/>
            <line x1="95" y1="5" x2="5" y2="95" stroke="#9CA3AF" strokeWidth="3"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Meta card ────────────────────────────────────────────────────────────────
function MetaCard({ rows }: { rows: [string, string][] }) {
  return (
    <div className="w-52 flex-shrink-0 bg-white border border-gray-100 rounded-xl p-4 shadow-sm self-start">
      <dl className="space-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-bold text-gray-700">{k}</dt>
            <dd className="text-xs text-gray-500 mt-0.5 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── Read-only evaluation display ────────────────────────────────────────────
interface Evaluation {
  id_evaluation?: number;
  type: string;
  note: number;
  commentaire: string;
  date_evaluation?: string;
  evaluateur_nom?: string;
  // other fields as needed
}

function EvaluationsList({ evaluations }: { evaluations: Evaluation[] }) {
  if (!evaluations.length) {
    return (
      <div className="text-center py-10 text-gray-500">
        Aucune évaluation n'a encore été soumise pour ce dossier.
      </div>
    );
  }

  // Group by type
  const grouped = evaluations.reduce((acc, ev) => {
    if (!acc[ev.type]) acc[ev.type] = [];
    acc[ev.type].push(ev);
    return acc;
  }, {} as Record<string, Evaluation[]>);

  const typeLabels: Record<string, string> = {
    administrative: 'Évaluation administrative',
    technique: 'Évaluation technique',
    financière: 'Évaluation financière',
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-3">{typeLabels[type] || type}</h3>
          {items.map((ev, idx) => (
            <div key={idx} className="border-t border-gray-100 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Note obtenue</p>
                  <p className="text-2xl font-black text-blue-600">{ev.note} / 100</p>
                </div>
                {ev.evaluateur_nom && (
                  <p className="text-xs text-gray-400">Évalué par {ev.evaluateur_nom}</p>
                )}
              </div>
              {ev.commentaire && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Commentaire</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{ev.commentaire}</p>
                </div>
              )}
              {ev.date_evaluation && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(ev.date_evaluation).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Informations Générales (unchanged) ──────────────────────────────────────
function SectionInfosGenerales({ dossier }: { dossier: Dossier }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
        {[
          ['Dossier',               dossier.reference],
          ['Service Contractant',   'Direction des Marchés Publics'],
          ['Opérateur économique',  dossier.operateur],
          ['Domaine',               'BTP / Infrastructure'],
          ['Délais d\'évaluation',  dossier.delaiEvaluation],
          ['Etape d\'évaluation',   dossier.etape],
          ['Date d\'évaluation',    dossier.dateSoumission],
          ['Evaluateur',            'Nom Prénom'],
        ].map(([k, v]) => (
          <div key={k}>
            <span className="font-bold text-gray-700 text-xs">{k}</span>
            <p className="text-gray-500 text-xs mt-0.5">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Rapport Tab (with evaluations) ─────────────────────────────────────
function RapportsTab({ dossier, rapportExists, onSaved }: {
  dossier: Dossier; rapportExists: boolean; onSaved: () => void;
}) {
  const [section, setSection] = useState<RapportSection>('infos-generales');
  const [editMode, setEditMode] = useState(!rapportExists);
  const [showModal, setShowModal] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingEval, setLoadingEval] = useState(false);
  const { notifyMarquerPret } = useNotifications();

  const SECTIONS = [
    { id: 'infos-generales' as RapportSection, label: 'Informations Générales' },
    { id: 'evaluations-list' as RapportSection, label: 'Résultats des évaluations' },
  ];
  const idx = SECTIONS.findIndex(s => s.id === section);

  // Fetch evaluations when the tab is active
  useEffect(() => {
    if (section === 'evaluations-list' || section === 'infos-generales') {
      const fetchEvals = async () => {
        setLoadingEval(true);
        try {
          const res = await api.get(`/api/soumissions/${dossier.id}/evaluate/`);
          if (Array.isArray(res.data)) {
            setEvaluations(res.data);
          } else if (res.data.results) {
            setEvaluations(res.data.results);
          } else {
            setEvaluations([]);
          }
        } catch (err) {
          console.error('Failed to fetch evaluations', err);
          setEvaluations([]);
        } finally {
          setLoadingEval(false);
        }
      };
      fetchEvals();
    }
  }, [dossier.id, section]);

  const handleConfirm = async () => {
    try {
      await api.post(`/soumissions/${dossier.id}/terminer-evaluation`);
    } catch {
      // non-blocking
    }
    notifyMarquerPret(dossier.reference, dossier.id);
    setShowModal(false);
    setEditMode(false);
    onSaved();
  };

  const Modal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-black text-gray-800">Marquer le dossier comme prêt</h3>
          <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <p className="text-sm text-gray-600 mb-6">Je confirme le signalement au chef que ce dossier est prêt</p>
        <div className="flex gap-3">
          <button onClick={() => setShowModal(false)}
            className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all">Annuler</button>
          <button onClick={handleConfirm}
            className="flex-1 py-2.5 bg-[#00738C] text-white font-bold text-sm rounded-xl hover:bg-[#005f75] transition-all">Confirmer</button>
        </div>
      </div>
    </div>
  );

  // Already-submitted view (no edit mode)
  if (!editMode) {
    return (
      <div className="flex gap-6 items-start">
        <MetaCard rows={[
          ['Dossier',               dossier.reference],
          ['Opérateur économique',  dossier.operateur],
          ['Délais d\'évaluation',  dossier.delaiEvaluation],
          ['Service Contractant',   'Direction des Marchés Publics'],
          ['Evaluateur',            'Nom Prénom'],
          ['Domaine',               'BTP / Infrastructure'],
          ['Etape d\'évaluation',   dossier.etape],
          ['Document',              'Rapport d\'évaluation'],
          ['Status',                'Prêt'],
        ]} />
        <div className="flex flex-col flex-1 gap-4">
          <div className="flex gap-2">
            <button onClick={() => setEditMode(true)} className="px-5 py-2.5 bg-[#00738C] hover:bg-[#005f75] text-white text-sm font-bold rounded-xl transition-all shadow-sm">Modifier</button>
            <button onClick={() => setShowModal(true)} className="px-5 py-2.5 border-2 border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] text-sm font-bold rounded-xl transition-all">Marquer comme prêt</button>
          </div>
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-bold mb-3">Évaluations soumises</h3>
            {loadingEval ? (
              <p className="text-sm text-gray-500">Chargement des évaluations...</p>
            ) : (
              <EvaluationsList evaluations={evaluations} />
            )}
          </div>
          <PdfViewer />
        </div>
        {showModal && <Modal />}
      </div>
    );
  }

  // Edit mode (identical to the previous edit mode – keep as is)
  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center gap-0 mb-6">
        {SECTIONS.map((s, i) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`px-5 py-2.5 text-sm font-semibold border transition-all ${
              section === s.id
                ? 'bg-white border-gray-300 text-gray-800 shadow-sm z-10'
                : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-50'
            } ${i === 0 ? 'rounded-l-xl' : ''} ${i === SECTIONS.length - 1 ? 'rounded-r-xl' : ''}`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'infos-generales' && <SectionInfosGenerales dossier={dossier} />}
      {section === 'evaluations-list' && (
        loadingEval ? (
          <div className="text-center py-10">Chargement des évaluations...</div>
        ) : (
          <EvaluationsList evaluations={evaluations} />
        )
      )}

      <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-gray-100">
        <button onClick={() => setSection(SECTIONS[Math.max(0, idx - 1)].id)} disabled={idx === 0}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#1C4532] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Section
        </button>
        <span className="text-xs text-gray-400">{idx + 1} / {SECTIONS.length}</span>
        <button onClick={() => setSection(SECTIONS[Math.min(SECTIONS.length - 1, idx + 1)].id)} disabled={idx === SECTIONS.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#1C4532] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          Section
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {showModal && <Modal />}
    </div>
  );
}

// ─── Doc tab (unchanged) ─────────────────────────────────────────────────────
function DocTabContent({ dossier, docType }: { dossier: Dossier; docType: 'financiere' | 'technique' | 'appel' }) {
  const isAppel = docType === 'appel';
  const docLabel = docType === 'financiere' ? 'Offre financière' : docType === 'technique' ? 'Offre technique' : 'Cahier des charges';
  const metaRows: [string, string][] = isAppel ? [
    ['Dossier',             dossier.reference],
    ['Service Contractant', 'Direction des Marchés Publics'],
    ['Domaine',             'BTP / Infrastructure'],
    ['Etape d\'évaluation', dossier.etape],
    ['Document',            docLabel],
  ] : [
    ['Dossier',               dossier.reference],
    ['Opérateur économique',  dossier.operateur],
    ['Délais d\'évaluation',  dossier.delaiEvaluation],
    ['Service Contractant',   'Direction des Marchés Publics'],
    ['Domaine',               'BTP / Infrastructure'],
    ['Etape d\'évaluation',   dossier.etape],
    ['Document',              docLabel],
    ['Status',                dossier.status],
  ];
  return (
    <div className="flex gap-6 items-start">
      <MetaCard rows={metaRows} />
      <div className="flex flex-col flex-1 gap-4">
        {isAppel && (
          <button className="self-start flex items-center gap-2 px-5 py-2.5 bg-[#00738C] hover:bg-[#005f75] text-white text-sm font-bold rounded-xl transition-all shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Télécharger
          </button>
        )}
        <PdfViewer />
        {!isAppel && <div className="w-56 flex-shrink-0 space-y-4 text-sm"></div>}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
interface Props {
  dossier: Dossier;
  onBack: () => void;
}

export default function AdminDossierDetailView({ dossier, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<MainTab>('offre-financiere');
  const [rapportSaved, setRapportSaved] = useState(false);

  const TABS = [
    { id: 'offre-financiere' as MainTab, label: 'Offre Financière' },
    { id: 'offre-technique'  as MainTab, label: 'Offre Technique' },
    { id: 'appel-offre'      as MainTab, label: "Appel d'Offre" },
    { id: 'rapports'         as MainTab, label: "Rapports d'évaluation" },
  ];

  return (
    <div className="flex flex-col gap-0 -mt-6 -mx-6">
      <div className="bg-white border-b border-gray-100 px-8 pt-6 pb-0">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#00738C] hover:text-[#1C4532] mb-3 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Retour aux dossiers
        </button>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00738C' }}>OPÉRATEUR ÉCONOMIQUE</p>
        <h2 className="text-2xl font-black mb-4" style={{ color: '#1C4532' }}>
          {dossier.reference} &nbsp; {dossier.id}
        </h2>
        <div className="flex items-center">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-sm font-semibold relative transition-all duration-200 ${
                activeTab === tab.id ? 'text-[#00738C]' : 'text-gray-500 hover:text-[#1C4532]'
              }`}>
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#00738C' }} />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="px-8 py-6">
        {activeTab === 'offre-financiere' && <DocTabContent dossier={dossier} docType="financiere" />}
        {activeTab === 'offre-technique'  && <DocTabContent dossier={dossier} docType="technique" />}
        {activeTab === 'appel-offre'      && <DocTabContent dossier={dossier} docType="appel" />}
        {activeTab === 'rapports'         && (
          <RapportsTab dossier={dossier} rapportExists={rapportSaved} onSaved={() => setRapportSaved(true)} />
        )}
      </div>
    </div>
  );
}