'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { ctAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type CTTab = 'offre-technique' | 'cahier-charges' | 'rapport';

function PdfViewer() {
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2 text-xs">
        <span className="font-medium">Document</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="hover:text-gray-300">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="hover:text-gray-300">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 bg-gray-200 flex items-center justify-center" style={{ minHeight: '380px' }}>
        <div className="bg-gray-300 flex items-center justify-center rounded" style={{ width: '60%', height: '80%' }}>
          <p className="text-xs text-gray-500">Aperçu document non disponible</p>
        </div>
      </div>
    </div>
  );
}

export default function RapportTechniqueView({
  dossier,
  onBack,
  commissionId,
}: {
  dossier: Dossier;
  onBack: () => void;
  commissionId: number;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CTTab>('rapport');
  const [methodologie, setMethodologie] = useState('');
  const [equipe, setEquipe] = useState('');
  const [materiels, setMateriels] = useState('');
  const [anomalies, setAnomalies] = useState('');
  const [avisGlobal, setAvisGlobal] = useState<'favorable' | 'defavorable' | 'reserve' | ''>('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const TABS = [
    { id: 'offre-technique' as CTTab, label: 'Offre Technique' },
    { id: 'cahier-charges'  as CTTab, label: 'Cahier des Charges' },
    { id: 'rapport'         as CTTab, label: "Rapport d'Analyse" },
  ];

  const canSubmit = methodologie.trim() && equipe.trim() && materiels.trim() && avisGlobal;

  const handleSubmit = async () => {
    if (!canSubmit || !user?.id_utilisateur) return;
    setSaving(true);
    try {
      await ctAPI.saveRapport(commissionId, {
        submitted_by: user.id_utilisateur,
        methodologie,
        equipe,
        materiels,
        anomalies,
        avis_global: avisGlobal,
        submitted: true,
      });
      setShowSubmitModal(false);
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.id_utilisateur) return;
    setSaving(true);
    try {
      await ctAPI.saveRapport(commissionId, {
        submitted_by: user.id_utilisateur,
        methodologie,
        equipe,
        materiels,
        anomalies,
        avis_global: avisGlobal || undefined,
        submitted: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✓</div>
        <h3 className="text-lg font-black text-[#1C4532]">Rapport soumis à la COPEO</h3>
        <p className="text-sm text-gray-500">Le rapport d'analyse technique est maintenant disponible en lecture seule dans l'espace COPEO.</p>
        <p className="text-xs text-gray-400">Rappel : le Comité Technique n'a pas de vote et ne signe pas les PVs.</p>
        <button onClick={onBack} className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 -mt-6 -mx-6">
      <div className="bg-white border-b border-gray-100 px-8 pt-6 pb-0">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#00738C] hover:text-[#1C4532] mb-3 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Retour aux analyses
        </button>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00738C' }}>
          COMITÉ TECHNIQUE — ANALYSE
        </p>
        <h2 className="text-2xl font-black mb-1" style={{ color: '#1C4532' }}>{dossier.reference}</h2>
        <p className="text-sm text-gray-500 mb-4">{dossier.operateur}</p>
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
        {activeTab === 'offre-technique' && (
          <div className="flex gap-6 items-start">
            <div className="w-48 flex-shrink-0 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-700 mb-3">Détails</p>
              <dl className="space-y-2 text-xs">
                <div><dt className="font-bold text-gray-600">Dossier</dt><dd className="text-gray-500">{dossier.reference}</dd></div>
                <div><dt className="font-bold text-gray-600">Opérateur</dt><dd className="text-gray-500">{dossier.operateur}</dd></div>
                <div><dt className="font-bold text-gray-600">Document</dt><dd className="text-gray-500">Offre Technique</dd></div>
              </dl>
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                Accès lecture seule — aucun accès à l'enveloppe financière
              </div>
            </div>
            <PdfViewer />
          </div>
        )}

        {activeTab === 'cahier-charges' && (
          <div className="flex gap-6 items-start">
            <div className="w-48 flex-shrink-0 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-700 mb-3">Document</p>
              <p className="text-xs text-gray-500">Cahier des Charges</p>
            </div>
            <PdfViewer />
          </div>
        )}

        {activeTab === 'rapport' && (
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
              Ce rapport sera transmis à la COPEO en lecture seule. Le Comité Technique n'a pas de vote et ne signe pas les PVs.
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Méthodologie d'exécution</label>
                <textarea value={methodologie} onChange={e => setMethodologie(e.target.value)}
                  placeholder="Décrire et évaluer la méthodologie proposée par l'OE…"
                  rows={4} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#97A675] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Équipe proposée</label>
                <textarea value={equipe} onChange={e => setEquipe(e.target.value)}
                  placeholder="Évaluer les profils, qualifications, adéquation aux besoins…"
                  rows={4} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#97A675] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Moyens matériels</label>
                <textarea value={materiels} onChange={e => setMateriels(e.target.value)}
                  placeholder="Évaluer les moyens matériels et logistiques proposés…"
                  rows={4} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#97A675] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Anomalies ou points d'attention</label>
                <textarea value={anomalies} onChange={e => setAnomalies(e.target.value)}
                  placeholder="Laisser vide si aucune…"
                  rows={3} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#97A675] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Avis technique global</label>
                <div className="flex gap-3">
                  {[
                    { value: 'favorable',   label: 'Favorable',   color: 'emerald' },
                    { value: 'reserve',     label: 'Réservé',     color: 'amber' },
                    { value: 'defavorable', label: 'Défavorable', color: 'red' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setAvisGlobal(opt.value as any)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        avisGlobal === opt.value
                          ? opt.color === 'emerald' ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                          : opt.color === 'amber'   ? 'bg-amber-100 border-amber-400 text-amber-700'
                          :                           'bg-red-100 border-red-400 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleSaveDraft} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] disabled:opacity-40">
                Enregistrer brouillon
              </button>
              <button onClick={() => setShowSubmitModal(true)} disabled={!canSubmit || saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                Soumettre à la COPEO
              </button>
            </div>
          </div>
        )}
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Soumettre le rapport</h3>
            <p className="text-sm text-gray-600 mb-2">Avis global : <strong>{avisGlobal}</strong></p>
            <p className="text-xs text-gray-500 mb-5">
              Le rapport sera transmis à la COPEO en lecture seule et ne pourra plus être modifié.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}