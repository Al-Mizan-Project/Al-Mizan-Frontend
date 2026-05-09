'use client';

import { useNotifications } from '@/lib/notifications';
import { useAuth } from '@/lib/auth';               // <-- added to get user id
import { api } from '@/lib/api';
import { useSoumissions } from '@/lib/soumissions-context';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';

// ─── Types ────────────────────────────────────────────────────────────────────
type MainTab = 'offre-financiere' | 'offre-technique' | 'appel-offre' | 'rapports';
type RapportTab = 'infos-generales' | 'eval-financiere' | 'eval-technique' | 'conclusion';

// ─── Shared: PDF Viewer placeholder ──────────────────────────────────────────
function PdfViewer() {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2 rounded-t-lg text-xs">
        <div className="flex items-center gap-3">
          <button className="hover:text-gray-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </button>
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span className="font-medium">Zoom</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="font-medium">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      {/* Viewer area */}
      <div className="flex-1 bg-gray-200 flex items-center justify-center rounded-b-lg" style={{ minHeight: '420px' }}>
        <div className="bg-gray-300 flex items-center justify-center rounded" style={{ width: '60%', height: '85%' }}>
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
            <rect x="5" y="5" width="90" height="90" stroke="#9CA3AF" strokeWidth="3" fill="none"/>
            <line x1="5" y1="5" x2="95" y2="95" stroke="#9CA3AF" strokeWidth="3"/>
            <line x1="95" y1="5" x2="5" y2="95" stroke="#9CA3AF" strokeWidth="3"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Shared: AI Aide à l'analyse sidebar ─────────────────────────────────────
function AideAnalyse() {
  return (
    <div className="w-56 flex-shrink-0 space-y-4 text-sm">
      <h3 className="font-bold text-gray-800 text-sm">Aide à l'analyse</h3>
      <div>
        <p className="font-semibold text-gray-700 text-xs mb-2">Vérification de conformité du document</p>
        <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded mb-2">Conforme</span>
        <ul className="space-y-1">
          {[
            { ok: true,  text: 'Présence des sections obligatoires' },
            { ok: false, text: 'Respect du format exigé' },
            { ok: true,  text: 'Cohérence avec le cahier des charges' },
            { ok: true,  text: 'Présence des pièces techniques requises' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
              <span className={`mt-0.5 font-bold flex-shrink-0 ${item.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                {item.ok ? '✓' : '✕'}
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-semibold text-gray-700 text-xs mb-2">Detection des anomalies</p>
        <ul className="space-y-1">
          {[
            'La méthodologie est décrite sans planning',
            'Les moyens matériels ne sont pas chiffrés',
            'Certaines références techniques sont absentes',
            'Certaines références techniques sont ambiguës',
          ].map((a, i) => (
            <li key={i} className="text-xs text-gray-500">{a}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-semibold text-gray-700 text-xs mb-2">Estimation indicative</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left pb-1">Critère</th>
              <th className="text-left pb-1">Estimation</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {[['Méthodologie','14 – 17'],['Équipe','18 – 20'],['Moyens matériels','10 – 12']].map(([c,e]) => (
              <tr key={c}><td className="py-0.5">{c}</td><td>{e}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared: metadata info card ───────────────────────────────────────────────
function MetaCard({ rows }: { rows: [string, string][] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm w-56 flex-shrink-0">
      <table className="w-full">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="align-top">
              <td className="font-bold text-gray-800 pr-3 py-0.5 whitespace-nowrap">{label}</td>
              <td className="text-gray-600 py-0.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared: Radio group ─────────────────────────────────────────────────────
function RadioGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-gray-700 mb-1.5">{label}</p>
      <div className="space-y-1">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
            <div
              onClick={() => onChange(opt)}
              className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                value === opt ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
              }`}
            >
              {value === opt && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
            </div>
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Shared: Toggle ───────────────────────────────────────────────────────────
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}/>
      </button>
      <span className="text-xs text-gray-700">{label}</span>
    </div>
  );
}

// ─── Shared: Textarea ─────────────────────────────────────────────────────────
function FormTextarea({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg resize-y focus:outline-none focus:border-blue-400 text-gray-700 placeholder-gray-400"
    />
  );
}

// ─── Shared: Section navigator ───────────────────────────────────────────────
function SectionNav({ current, total, onChange }: { current: number; total: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6 border-t border-gray-100 mt-6">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Section
      </button>
      <span className="text-xs text-gray-400">{current} / {total}</span>
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= total}
        className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Section
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}

// ─── Shared: Score table ──────────────────────────────────────────────────────
function ScoreTable({ scores, onChange }: { scores: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const rows = [
    { critere: 'Méthodologie', max: 20 },
    { critere: 'Équipe',       max: 40 },
    { critere: 'Moyens matériels', max: 15 },
  ];
  const total = rows.reduce((sum, r) => sum + (parseFloat(scores[r.critere]) || 0), 0);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-3 py-2 text-gray-600 font-semibold">Critère</th>
            <th className="text-left px-3 py-2 text-gray-600 font-semibold">Score Maximal</th>
            <th className="text-left px-3 py-2 text-gray-600 font-semibold">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => (
            <tr key={r.critere}>
              <td className="px-3 py-2 text-gray-700">{r.critere}</td>
              <td className="px-3 py-2 text-gray-600">{r.max}</td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  value={scores[r.critere] ?? ''}
                  onChange={e => onChange(r.critere, e.target.value)}
                  placeholder="Tapez ici ..."
                  className="w-24 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-blue-400"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-700">
        Score totale calculé {total}/100
      </div>
    </div>
  );
}

// ─── OFFRE FINANCIÈRE tab ─────────────────────────────────────────────────────
function OffreFinanciereTab({ dossier }: { dossier: Dossier }) {
  return (
    <div className="flex gap-6 flex-1">
      <div className="flex flex-col gap-4">
        <MetaCard rows={[
          ['Dossier',            dossier.reference],
          ['Opérateur économique', dossier.operateur],
          ['Délais d\'évaluation', '2026-02-31'],
          ['Service Contractant', 'Service Contractant'],
          ['Domaine',            'Domaine'],
          ['Etape d\'évaluation', 'Evaluation des Offres'],
          ['Document',           'Offre financière'],
          ['Status',             dossier.status],
        ]}/>
        <AideAnalyse/>
      </div>
      <PdfViewer/>
    </div>
  );
}

// ─── OFFRE TECHNIQUE tab ──────────────────────────────────────────────────────
function OffreTechniqueTab({ dossier }: { dossier: Dossier }) {
  return (
    <div className="flex gap-6 flex-1">
      <div className="flex flex-col gap-4">
        <MetaCard rows={[
          ['Dossier',            dossier.reference],
          ['Opérateur économique', dossier.operateur],
          ['Délais d\'évaluation', '2026-02-31'],
          ['Service Contractant', 'Service Contractant'],
          ['Domaine',            'Domaine'],
          ['Etape d\'évaluation', 'Evaluation des Offres'],
          ['Document',           'Offre technique'],
          ['Status',             dossier.status],
        ]}/>
        <AideAnalyse/>
      </div>
      <PdfViewer/>
    </div>
  );
}

// ─── APPEL D'OFFRE tab ────────────────────────────────────────────────────────
function AppelOffreTab({ dossier }: { dossier: Dossier }) {
  return (
    <div className="flex gap-6 flex-1">
      <div className="flex flex-col gap-4">
        <MetaCard rows={[
          ['Dossier',            dossier.reference],
          ['Service Contractant', 'Service Contractant'],
          ['Domaine',            'Domaine'],
          ['Etape d\'évaluation', 'Evaluation des Offres'],
          ['Document',           'Cahier des charges'],
        ]}/>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all w-fit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Télécharger
        </button>
      </div>
      <PdfViewer/>
    </div>
  );
}

// ─── RAPPORTS: Informations Générales ─────────────────────────────────────────
function InfosGenerales({ dossier }: { dossier: Dossier }) {
  return (
    <div>
      <div className="border border-gray-200 rounded-lg p-5 text-sm">
        <div className="grid grid-cols-2 gap-x-12 gap-y-2">
          {[
            ['Dossier',              dossier.reference],
            ['Service Contractant',  'Service Contractant'],
            ['Opérateur économique', dossier.operateur],
            ['Domaine',              'Domaine'],
            ['Délais d\'évaluation', '2026-02-31'],
            ['Etape d\'évaluation',  'Evaluation des Offres'],
            ['Date d\'évaluation',   '2026-02-31'],
            ['Evaluateur',           'Nom Prénom'],
          ].map(([l, v]) => (
            <div key={l} className="flex gap-3 py-0.5">
              <span className="font-bold text-gray-800 whitespace-nowrap">{l}</span>
              <span className="text-gray-600">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <SectionNav current={1} total={4} onChange={() => {}} />
    </div>
  );
}

// ─── RAPPORTS: Évaluation Financière ─────────────────────────────────────────
function EvalFinanciere({ dossier, onSoumettre, isSubmitting }: { dossier: Dossier; onSoumettre: (note: number, commentaire: string) => Promise<void>; isSubmitting: boolean }) {
  const [conforme, setConforme] = useState(true);
  const [nonConformiteChecks, setNonConformiteChecks] = useState<Record<string, boolean>>({
    'Erreur de calcul': true,
    'Pièce manquante': true,
    'Incohérence des montants': true,
    'Autre': true,
  });
  const [motifDetail, setMotifDetail] = useState('');
  const [coherence, setCoherence] = useState('Élevée');
  const [justifCoherence, setJustifCoherence] = useState('');
  const [offreAnormale, setOffreAnormale] = useState(false);
  const [analyseAnormale, setAnalyseAnormale] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [syntheseJugement, setSyntheseJugement] = useState('');
  const [syntheseElements, setSyntheseElements] = useState('');
  const [avisFinancier, setAvisFinancier] = useState('Réservé');
  const [section, setSection] = useState(1);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const handleSubmit = async () => {
    await onSoumettre(totalScore, `${syntheseJugement}\n${syntheseElements}\nAvis: ${avisFinancier}`);
    setShowSubmitConfirm(false);
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Contexte Financier</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-1">
              <p><span className="font-semibold">Montant total</span> <span className="ml-2">12 500 000.00</span></p>
              <p><span className="font-semibold">Devise</span> <span className="ml-2">DZD</span></p>
              <p><span className="font-semibold">Domaine</span> <span className="ml-2">Domaine</span></p>
            </div>
            <div className="space-y-1">
              <p><span className="font-semibold">Lot 01</span> <span className="ml-2">Fourniture équipements</span></p>
              <p><span className="font-semibold">Lot 02</span> <span className="ml-2">Installation & mise en service</span></p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Conformité Financière</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <Toggle label="Conformité de l'offre financière" value={conforme} onChange={setConforme}/>
            {!conforme && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Motif de non conformité</p>
                {Object.keys(nonConformiteChecks).map(k => (
                  <label key={k} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nonConformiteChecks[k]}
                      onChange={e => setNonConformiteChecks(prev => ({ ...prev, [k]: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-blue-600"
                    />
                    {k}
                  </label>
                ))}
                <p className="text-xs font-semibold text-gray-700 mt-2">Détails du motif</p>
                <FormTextarea placeholder="Tapez ici ..." value={motifDetail} onChange={setMotifDetail}/>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Conformité Financière</h3>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <RadioGroup label="Cohérence du montant par rapport au marché" options={['Faible', 'Moyenne', 'Élevée']} value={coherence} onChange={setCoherence}/>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Justification de l'appréciation</p>
              <FormTextarea placeholder="Comparer le montant proposé aux références disponibles et justifier l'appréciation ..." value={justifCoherence} onChange={setJustifCoherence}/>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Offre anormalement basse</h3>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <Toggle label="Offre potentiellement anormalement basse" value={offreAnormale} onChange={setOffreAnormale}/>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Analyse détaillée</p>
              <FormTextarea placeholder="Tapez ici ..." value={analyseAnormale} onChange={setAnalyseAnormale}/>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Score financier</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Calcul du score</p>
            <ScoreTable scores={scores} onChange={(k, v) => setScores(s => ({ ...s, [k]: v }))}/>
            <p className="text-right text-sm font-semibold mt-2">Total: {totalScore}/100</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Synthèse financière</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-700 mb-1">Sur la base de l'analyse effectuée, l'offre financière est jugée</p>
              <FormTextarea placeholder="Tapez ici ..." value={syntheseJugement} onChange={setSyntheseJugement}/>
            </div>
            <div>
              <p className="text-xs text-gray-700 mb-1">Les éléments déterminants ayant conduit à cette évaluation sont</p>
              <FormTextarea placeholder="Tapez ici ..." value={syntheseElements} onChange={setSyntheseElements}/>
            </div>
            <RadioGroup label="Avis financier" options={['Favorable', 'Défavorable', 'Réservé']} value={avisFinancier} onChange={setAvisFinancier}/>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all"
          >
            {isSubmitting ? 'Envoi...' : 'Soumettre l\'évaluation financière'}
          </button>
        </div>

        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
              <h3 className="text-xl font-black text-gray-800 mb-4">Confirmer la soumission</h3>
              <p className="text-sm text-gray-600 mb-6">Voulez-vous soumettre cette évaluation financière ?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl">Annuler</button>
                <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Confirmer</button>
              </div>
            </div>
          </div>
        )}

        <SectionNav current={section} total={4} onChange={setSection}/>
      </div>
      <AideAnalyse/>
    </div>
  );
}

// ─── RAPPORTS: Évaluation Technique ──────────────────────────────────────────
function EvalTechnique({ dossier, onSoumettre, isSubmitting }: { dossier: Dossier; onSoumettre: (note: number, commentaire: string) => Promise<void>; isSubmitting: boolean }) {
  const [conforme, setConforme] = useState(true);
  const [nonConformiteChecks, setNonConformiteChecks] = useState<Record<string, boolean>>({
    'Spécifications techniques incomplètes': true,
    'Solutions proposées non conformes': true,
    "Absence d'éléments obligatoires": true,
    'Autre': true,
  });
  const [motifDetail, setMotifDetail] = useState('');
  const [pertinence, setPertinence] = useState('Élevée');
  const [adequation, setAdequation] = useState('Optimale');
  const [justifConformite, setJustifConformite] = useState('');
  const [moyensHumains, setMoyensHumains] = useState('Optimale');
  const [moyensMateriels, setMoyensMateriels] = useState('Optimale');
  const [justifMoyens, setJustifMoyens] = useState('');
  const [methodologie, setMethodologie] = useState('Très satisfaisante');
  const [planning, setPlanning] = useState('Optimisé');
  const [observations, setObservations] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [syntheseJugement, setSyntheseJugement] = useState('');
  const [syntheseElements, setSyntheseElements] = useState('');
  const [avisTechnique, setAvisTechnique] = useState('Réservé');
  const [section, setSection] = useState(1);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const totalScore = Object.values(scores).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  const handleSubmit = async () => {
    await onSoumettre(totalScore, `${syntheseJugement}\n${syntheseElements}\nAvis: ${avisTechnique}`);
    setShowSubmitConfirm(false);
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Contexte Technique</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="space-y-1">
              <p><span className="font-semibold">Objet du marché</span> <span className="ml-2">Fourniture</span></p>
              <p><span className="font-semibold">Domaine</span> <span className="ml-2">Domaine</span></p>
            </div>
            <div className="space-y-1">
              <p><span className="font-semibold">Lot 01</span> <span className="ml-2">Fourniture équipements</span></p>
              <p><span className="font-semibold">Lot 02</span> <span className="ml-2">Installation & mise en service</span></p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Conformité Technique</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <Toggle label="Conformité de l'offre technique" value={conforme} onChange={setConforme}/>
            {!conforme && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Motif de non conformité</p>
                {Object.keys(nonConformiteChecks).map(k => (
                  <label key={k} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={nonConformiteChecks[k]}
                      onChange={e => setNonConformiteChecks(prev => ({ ...prev, [k]: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-blue-600"/>
                    {k}
                  </label>
                ))}
                <p className="text-xs font-semibold text-gray-700 mt-2">Détails du motif</p>
                <FormTextarea placeholder="Tapez ici ..." value={motifDetail} onChange={setMotifDetail}/>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Conformité Financière</h3>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <RadioGroup label="Pertinence de la solution proposée" options={['Faible','Moyenne','Élevée']} value={pertinence} onChange={setPertinence}/>
            <RadioGroup label="Adéquation aux besoins exprimés" options={['Insuffisante','Acceptable','Optimale']} value={adequation} onChange={setAdequation}/>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Justification de l'appréciation</p>
              <FormTextarea placeholder="Évaluer la qualité de la solution proposée au regard des exigences techniques et des objectifs du projet" value={justifConformite} onChange={setJustifConformite}/>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Moyens humains et matériels</h3>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <RadioGroup label="Moyens humains proposés" options={['Insuffisante','Acceptable','Optimale']} value={moyensHumains} onChange={setMoyensHumains}/>
            <RadioGroup label="Moyens matériels et logistiques" options={['Insuffisante','Acceptable','Optimale']} value={moyensMateriels} onChange={setMoyensMateriels}/>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Justification de l'appréciation</p>
              <FormTextarea placeholder="Tapez ici..." value={justifMoyens} onChange={setJustifMoyens}/>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Méthodologie & planning</h3>
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <RadioGroup label="Méthodologie d'exécution" options={['Non satisfaisante','Satisfaisante','Très satisfaisante']} value={methodologie} onChange={setMethodologie}/>
            <RadioGroup label="Planning proposé" options={['Non réaliste','Réaliste','Optimisé']} value={planning} onChange={setPlanning}/>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Observations techniques</p>
              <FormTextarea placeholder="Tapez ici..." value={observations} onChange={setObservations}/>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Score technique</h3>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Calcul du score</p>
            <ScoreTable scores={scores} onChange={(k, v) => setScores(s => ({ ...s, [k]: v }))}/>
            <p className="text-right text-sm font-semibold mt-2">Total: {totalScore}/100</p>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Synthèse financière</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-700 mb-1">Sur la base de l'analyse effectuée, l'offre technique est jugée</p>
              <FormTextarea placeholder="Tapez ici ..." value={syntheseJugement} onChange={setSyntheseJugement}/>
            </div>
            <div>
              <p className="text-xs text-gray-700 mb-1">Les éléments déterminants ayant conduit à cette évaluation sont</p>
              <FormTextarea placeholder="Tapez ici ..." value={syntheseElements} onChange={setSyntheseElements}/>
            </div>
            <RadioGroup label="Avis technique" options={['Favorable','Défavorable','Réservé']} value={avisTechnique} onChange={setAvisTechnique}/>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowSubmitConfirm(true)}
            disabled={isSubmitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all"
          >
            {isSubmitting ? 'Envoi...' : 'Soumettre l\'évaluation technique'}
          </button>
        </div>

        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
              <h3 className="text-xl font-black text-gray-800 mb-4">Confirmer la soumission</h3>
              <p className="text-sm text-gray-600 mb-6">Voulez-vous soumettre cette évaluation technique ?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl">Annuler</button>
                <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Confirmer</button>
              </div>
            </div>
          </div>
        )}

        <SectionNav current={section} total={4} onChange={setSection}/>
      </div>
      <AideAnalyse/>
    </div>
  );
}

// ─── RAPPORTS: Conclusion et Décision ────────────────────────────────────────
function ConclusionDecision({ dossier, onMarquerPret }: { dossier: Dossier; onMarquerPret: () => void }) {
  const [decision, setDecision]   = useState('Dossier retenu sous réserve');
  const [motivation, setMotivation] = useState('');
  const [avis, setAvis]           = useState('');
  const [certified, setCertified] = useState(true);
  const [section, setSection]     = useState(4);

  return (
    <div>
      <div className="border border-gray-200 rounded-lg p-4 mb-6 text-sm">
        <div className="grid grid-cols-2 gap-x-12 gap-y-1">
          <div><span className="font-bold text-gray-800">Dossier</span> <span className="ml-2 text-gray-600">{dossier.reference}</span></div>
          <div><span className="font-bold text-gray-800">Service Contractant</span> <span className="ml-2 text-gray-600">Service Contractant</span></div>
          <div><span className="font-bold text-gray-800">Opérateur économique</span> <span className="ml-2 text-gray-600">{dossier.operateur}</span></div>
          <div><span className="font-bold text-gray-800">Domaine</span> <span className="ml-2 text-gray-600">Domaine</span></div>
          <div><span className="font-bold text-gray-800">Score financière</span> <span className="ml-2 text-gray-600">0/100</span></div><div/>
          <div><span className="font-bold text-gray-800">Score technique</span> <span className="ml-2 text-gray-600">0/100</span></div><div/>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-3">Décision finale</h3>
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <RadioGroup
            label="Décision"
            options={['Dossier retenu','Dossier rejeté','Dossier retenu sous réserve']}
            value={decision}
            onChange={setDecision}
          />
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Motivation de la décision</p>
            <FormTextarea placeholder="Tapez ici ..." value={motivation} onChange={setMotivation}/>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Avis final de l'évaluateur</p>
            <FormTextarea placeholder="Tapez ici ..." value={avis} onChange={setAvis}/>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <div
          onClick={() => setCertified(v => !v)}
          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all ${certified ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}
        >
          {certified && <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5"><polyline points="1.5 6 4.5 9 10.5 3"/></svg>}
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          Je certifie que cette décision est fondée sur une évaluation objective, conforme aux règles en vigueur, et dûment motivée
        </p>
      </label>

      <div className="flex justify-end">
        <button
          onClick={onMarquerPret}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
        >
          Marquer comme prêt
        </button>
      </div>

      <SectionNav current={section} total={4} onChange={setSection}/>
    </div>
  );
}

// ─── RAPPORTS: Read-only view with Modifier btn ───────────────────────────────
function RapportsTab({ dossier, onModifier }: { dossier: Dossier; onModifier: () => void; onMarquerPret: () => void }) {
  return (
    <div className="flex gap-6 flex-1">
      <div className="flex flex-col gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm w-56">
          <table className="w-full">
            <tbody>
              {([
                ['Dossier',             dossier.reference],
                ['Opérateur économique', dossier.operateur],
                ['Délais d\'évaluation', '2026-02-31'],
                ['Service Contractant',  'Service Contractant'],
                ['Evaluateur',           'Nom Prénom'],
                ['Domaine',              'Domaine'],
                ['Etape d\'évaluation',  'Evaluation des Offres'],
                ['Document',             'Rapport d\'évaluation'],
                ['Status',               'Prêt'],
              ] as [string, string][]).map(([l, v]) => (
                <tr key={l} className="align-top">
                  <td className="font-bold text-gray-800 pr-3 py-0.5 whitespace-nowrap text-xs">{l}</td>
                  <td className="text-gray-600 py-0.5 text-xs">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 mt-3">
            <button onClick={onModifier} className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all">Modifier</button>
            <button className="flex-1 px-3 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-lg transition-all">Marquer comme prêt</button>
          </div>
        </div>
      </div>
      <PdfViewer/>
    </div>
  );
}

// ─── RAPPORTS: Edit mode with 4 sub-tabs ─────────────────────────────────────
function RapportsEditMode({ dossier, onBack }: { dossier: Dossier; onBack: () => void }) {
  const [rapportTab, setRapportTab] = useState<RapportTab>('infos-generales');
  const [showMarquerModal, setShowMarquerModal] = useState(false);
  const [marked, setMarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { notifyMarquerPret } = useNotifications();
  const { soumettre } = useSoumissions();
  const { user } = useAuth();

  const handleSubmitEvaluation = async (note: number, commentaire: string, type: string) => {
    setSubmitting(true);
    try {
      // Dummy commission id – replace with actual commission id if needed
      const commissionId = 1;
      await api.post(`/api/soumissions/${dossier.id}/evaluate/`, {
        id_comission: commissionId,
        id_utilisateur: user?.id_utilisateur,
        type: type,
        note: note,
        commentaire: commentaire,
      });
      alert('Évaluation soumise avec succès');
    } catch (error) {
      console.error('Failed to submit evaluation', error);
      alert('Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await api.post(`/api/soumissions/${dossier.id}/terminer-evaluation/`);
    } catch {
      // non-blocking
    }
    notifyMarquerPret(dossier.reference, dossier.id);
    setShowMarquerModal(false);
    setMarked(true);
  };

  const RAPPORT_TABS: { id: RapportTab; label: string }[] = [
    { id: 'infos-generales',  label: 'Informations Générales' },
    { id: 'eval-financiere',  label: 'Évaluation Financière' },
    { id: 'eval-technique',   label: 'Évaluation Technique' },
    { id: 'conclusion',       label: 'Conclusion et Décision' },
  ];

  if (marked) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✅</div>
        <h3 className="text-lg font-black text-[#1C4532]">Dossier marqué comme prêt</h3>
        <p className="text-sm text-gray-500">Le chef de commission a été notifié.</p>
        <button onClick={onBack} className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>← Retour</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-5 text-xs font-semibold">
        {RAPPORT_TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setRapportTab(t.id)}
            className={`flex-1 px-4 py-2.5 transition-all border-r last:border-r-0 border-gray-200 ${
              rapportTab === t.id
                ? 'bg-gray-100 text-gray-800 font-bold'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rapportTab === 'infos-generales' && <InfosGenerales dossier={dossier}/>}
      {rapportTab === 'eval-financiere' && <EvalFinanciere dossier={dossier} onSoumettre={(note, comment) => handleSubmitEvaluation(note, comment, 'financière')} isSubmitting={submitting} />}
      {rapportTab === 'eval-technique'  && <EvalTechnique dossier={dossier} onSoumettre={(note, comment) => handleSubmitEvaluation(note, comment, 'technique')} isSubmitting={submitting} />}
      {rapportTab === 'conclusion' && <ConclusionDecision dossier={dossier} onMarquerPret={() => setShowMarquerModal(true)}/>}

      {showMarquerModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-black text-gray-800 leading-tight">Marquer le dossier<br/>comme prêt</h3>
              <button onClick={() => setShowMarquerModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors ml-4 mt-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">Je confirme le signalement au chef que ce dossier est prêt</p>
            <div className="flex gap-3">
              <button onClick={() => setShowMarquerModal(false)} className="flex-1 py-2.5 border-2 border-blue-600 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50">Annuler</button>
              <button onClick={handleConfirm} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function DossierDetailView({ dossier, onBack }: { dossier: Dossier; onBack: () => void }) {
  const [mainTab, setMainTab]       = useState<MainTab>('offre-financiere');
  const [rapportEditMode, setRapportEditMode] = useState(false);

  const MAIN_TABS: { id: MainTab; label: string }[] = [
    { id: 'offre-financiere', label: 'Offre Financière' },
    { id: 'offre-technique',  label: 'Offre Technique' },
    { id: 'appel-offre',      label: "Appel d'Offre" },
    { id: 'rapports',         label: "Rapports d'évaluation" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors w-fit mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        Retour à la liste
      </button>

      <div className="mb-1">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#1C4532' }}>OPÉRATEUR ÉCONOMIQUE</p>
        <h1 className="text-3xl font-black text-gray-900">{dossier.reference}</h1>
      </div>

      <div className="flex items-center gap-0 border-b border-gray-200 mb-6">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setMainTab(tab.id); setRapportEditMode(false); }}
            className={`px-5 py-3 text-sm font-semibold relative transition-all ${
              mainTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {mainTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"/>}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {mainTab === 'offre-financiere' && <OffreFinanciereTab dossier={dossier}/>}
        {mainTab === 'offre-technique'  && <OffreTechniqueTab dossier={dossier}/>}
        {mainTab === 'appel-offre'      && <AppelOffreTab dossier={dossier}/>}
        {mainTab === 'rapports' && !rapportEditMode && (
          <RapportsTab dossier={dossier} onModifier={() => setRapportEditMode(true)} onMarquerPret={() => {}} />
        )}
        {mainTab === 'rapports' && rapportEditMode && <RapportsEditMode dossier={dossier} onBack={() => setRapportEditMode(false)}/>}
      </div>
    </div>
  );
}