'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useNotifications } from '@/lib/notifications';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth'; // <-- added

type MainTab       = 'offre-financiere' | 'offre-technique' | 'appel-offre' | 'rapports';
type RapportSection = 'infos-generales' | 'eval-administrative' | 'conclusion';

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span className="font-medium">Zoom</span>
          <button className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <button onClick={() => setPage(p => Math.max(1, p-1))} className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p+1)} className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 bg-gray-100 flex items-center justify-center min-h-[400px]">
        <div className="w-[70%] h-[85%] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <p className="text-gray-400 text-sm font-medium">Aperçu du Document PDF</p>
        </div>
      </div>
    </div>
  );
}

// ─── Document Tab Content ─────────────────────────────────────────────────────
function DocTabContent({ dossier, docType }: { dossier: Dossier; docType: string }) {
  return (
    <div className="flex gap-8 h-full">
      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Informations</h3>
          <div className="space-y-3">
            {[
              ['Dossier', dossier.reference],
              ['Type', docType === 'financiere' ? 'Offre Financière' : 'Offre Technique'],
              ['Statut', 'Vérifié'],
              ['Date', '12/05/2024'],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{l}</p>
                <p className="text-sm font-semibold text-gray-700">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <PdfViewer />
    </div>
  );
}

// ─── Evaluation Results / Reports Tab ─────────────────────────────────────────
interface RapportState {
  habilite: boolean; habiliteJustif: string;
  absence:  boolean; absenceJustif:  string;
  conformite: boolean; conformiteJustif: string;
  dossierComplet: boolean;
  pieceValide: boolean;
  decision: string;
}
const INITIAL_RAPPORT: RapportState = {
  habilite: true, habiliteJustif: '',
  absence: true,  absenceJustif: '',
  conformite: true, conformiteJustif: '',
  dossierComplet: true,
  pieceValide: true,
  decision: 'Dossier retenu'
};

function RapportsTab({ dossier, rapportExists, onSaved }: {  dossier: Dossier; rapportExists: boolean; onSaved: () => void;}) {
  const [section,   setSection]   = useState<RapportSection>('infos-generales');
  const [editMode,  setEditMode]  = useState(!rapportExists);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState<RapportState>(INITIAL_RAPPORT);
  const { notifyMarquerPret } = useNotifications();
  const { user } = useAuth();                                                // <-- added

  const SECTIONS = [
    { id: 'infos-generales'    as RapportSection, label: 'Informations Générales' },
    { id: 'eval-administrative' as RapportSection, label: 'Évaluation Administrative' },
    { id: 'conclusion'          as RapportSection, label: 'Conclusion et Décision' },
  ];

  const idx = SECTIONS.findIndex(s => s.id === section);

  const handleConfirm = async () => {
    // 1. Submit the administrative evaluation (if the form has any data)
    try {
      // Build a comment from the justifications
      const comment = [
        form.habiliteJustif,
        form.absenceJustif,
        form.conformiteJustif,
        form.dossierComplet ? 'Dossier complet' : 'Dossier incomplet',
        form.pieceValide ? 'Pièce valide' : 'Pièce non valide'
      ].filter(Boolean).join(' | ');

      await api.post(`/api/soumissions/${dossier.id}/evaluate/`, {
        id_comission: 1,                                    // ensure commission ID 1 exists
        id_utilisateur: user?.id_utilisateur,
        type: 'administrative',
        note: 0,                                            // you can map form values to a score later
        commentaire: comment || 'Évaluation administrative terminée',
      });
    } catch (evalErr) {
      console.warn('Administrative evaluation submission failed', evalErr);
      // Continue anyway – non‑blocking
    }

    // 2. Mark the soumission as ready
    try {
      await api.post(`/api/soumissions/${dossier.id}/terminer-evaluation/`);
    } catch {
      // non-blocking
    }

    notifyMarquerPret(dossier.reference, dossier.id);
    setShowModal(false);
    setEditMode(false);
    onSaved();
  };

  // UI components for sections
  const renderInfos = () => (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <div className="grid grid-cols-2 gap-y-6 gap-x-12">
        {[
          ['Dossier', dossier.reference],
          ['Service Contractant', 'Direction des Moyens'],
          ['Opérateur', dossier.operateur],
          ['Domaine', 'Fournitures de bureau'],
          ['Étape', 'Analyse Administrative'],
        ].map(([l, v]) => (
          <div key={l} className="border-b border-gray-50 pb-2">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">{l}</p>
            <p className="text-sm font-bold text-gray-800">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvalAdmin = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Habilité du signataire', key: 'habilite', justif: 'habiliteJustif' },
          { label: 'Absence de condamnations', key: 'absence', justif: 'absenceJustif' },
          { label: 'Conformité fiscale/sociale', key: 'conformite', justif: 'conformiteJustif' },
        ].map(item => (
          <div key={item.key} className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-800">{item.label}</span>
              <button
                onClick={() => setForm({...form, [item.key]: !form[item.key as keyof RapportState]})}
                className={`w-12 h-6 rounded-full relative transition-colors ${form[item.key as keyof RapportState] ? 'bg-emerald-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form[item.key as keyof RapportState] ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <textarea
              placeholder="Justification ou réserve..."
              className="w-full text-xs p-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-blue-400 outline-none h-20 resize-none"
              value={form[item.justif as keyof RapportState] as string}
              onChange={e => setForm({...form, [item.justif]: e.target.value})}
            />
          </div>
        ))}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.dossierComplet} onChange={e => setForm({...form, dossierComplet: e.target.checked})} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-bold text-gray-700">Dossier complet</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.pieceValide} onChange={e => setForm({...form, pieceValide: e.target.checked})} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm font-bold text-gray-700">Pièces en cours de validité</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderConclusion = () => (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="text-center">
        <h3 className="text-xl font-black text-gray-800 mb-2">Conclusion de l'analyse</h3>
        <p className="text-sm text-gray-500 font-medium">Déterminez le résultat final pour ce dossier</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {['Dossier retenu', 'Dossier rejeté', 'Sous réserve'].map(opt => (
          <button
            key={opt}
            onClick={() => setForm({...form, decision: opt})}
            className={`py-4 px-2 rounded-2xl border-2 font-bold text-sm transition-all ${
              form.decision === opt ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex justify-center pt-8">
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:scale-105 transition-all"
        >
          Marquer comme prêt
        </button>
      </div>
    </div>
  );

  if (!editMode) {
    return (
      <div className="flex gap-8">
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Rapport validé</h3>
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-700 text-xs font-bold">
                Dossier marqué comme prêt
              </div>
              <button onClick={() => setEditMode(true)} className="w-full py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">
                Modifier l'analyse
              </button>
            </div>
          </div>
        </div>
        <PdfViewer />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Sub-nav */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                section === s.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="min-h-[400px]">
        {section === 'infos-generales' && renderInfos()}
        {section === 'eval-administrative' && renderEvalAdmin()}
        {section === 'conclusion' && renderConclusion()}
      </div>

      {/* Nav Controls */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-center gap-4">
        <button
          disabled={idx === 0}
          onClick={() => setSection(SECTIONS[idx-1].id)}
          className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-gray-400 hover:text-gray-800 disabled:opacity-0 transition-all"
        >
          ← Précédent
        </button>
        <div className="flex gap-1.5">
          {SECTIONS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? 'bg-blue-600 w-4' : 'bg-gray-200'} transition-all`} />
          ))}
        </div>
        <button
          disabled={idx === SECTIONS.length - 1}
          onClick={() => setSection(SECTIONS[idx+1].id)}
          className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-0 transition-all"
        >
          Suivant →
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-10 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3">
                <path d="M20 6L9 17L4 12" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Prêt à transmettre ?</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
              Cela informera le chef de commission que votre analyse administrative est terminée.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-white text-gray-400 font-bold rounded-2xl hover:text-gray-600 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main View Component ──────────────────────────────────────────────────────
export default function AdminDossierDetailView({ dossier, onBack }: { dossier: Dossier; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<MainTab>('offre-financiere');
  const [rapportReady, setRapportReady] = useState(false);

  const TABS = [
    { id: 'offre-financiere', label: 'Offre Financière' },
    { id: 'offre-technique',  label: 'Offre Technique' },
    { id: 'appel-offre',      label: "Appel d'Offre" },
    { id: 'rapports',         label: 'Résultats des évaluations' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfc] -m-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 pt-8">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-800 transition-colors mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
          Retour aux dossiers
        </button>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00738C' }}>OPÉRATEUR ÉCONOMIQUE</p>
        <h2 className="text-2xl font-black mb-4" style={{ color: '#1C4532' }}>
          {dossier.reference} &nbsp; {dossier.id}
        </h2>

        <div className="flex items-center">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as MainTab)}
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

      {/* Content */}
      <div className="px-8 py-6">
        {activeTab === 'offre-financiere' && <DocTabContent dossier={dossier} docType="financiere" />}
        {activeTab === 'offre-technique'  && <DocTabContent dossier={dossier} docType="technique" />}
        {activeTab === 'appel-offre'      && <DocTabContent dossier={dossier} docType="appel-offre" />}
        {activeTab === 'rapports'         && (
          <RapportsTab
            dossier={dossier}
            rapportExists={rapportReady}
            onSaved={() => setRapportReady(true)}
          />
        )}
      </div>
    </div>
  );
}