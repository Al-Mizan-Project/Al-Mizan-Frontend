'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useNotifications } from '@/lib/notifications';

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

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}>
      <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ─── Aide à l'analyse (administrative) ───────────────────────────────────────
function AideAnalyseAdmin() {
  return (
    <div className="w-56 flex-shrink-0 space-y-4 text-sm">
      <h3 className="font-bold text-gray-800 text-sm">Aide à l'analyse</h3>
      <div>
        <p className="font-semibold text-gray-700 text-xs mb-2">Vérification de conformité du dossier</p>
        <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded mb-2">Conforme</span>
        <ul className="space-y-1">
          {[
            { ok: true,  text: 'Présence des sections obligatoires' },
            { ok: false, text: 'Respect du format exigé' },
            { ok: true,  text: 'Cohérence avec le cahier des charges' },
            { ok: true,  text: 'Présence des pièces techniques requises' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
              <span className={`mt-0.5 font-bold flex-shrink-0 ${item.ok ? 'text-emerald-600' : 'text-red-500'}`}>{item.ok ? '✓' : '✕'}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-semibold text-gray-700 text-xs mb-2">Detection des anomalies</p>
        <div className="space-y-1">
          {[
            { label: 'Documents non signés détectés',     val: 'Aucun' },
            { label: 'Documents illisibles ou incomplets', val: 'Aucun' },
            { label: 'Incohérences entre documents',       val: 'Aucun' },
          ].map(a => (
            <div key={a.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{a.label}</span>
              <span className="text-emerald-600 font-semibold ml-2 flex-shrink-0">{a.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Rapport form state ───────────────────────────────────────────────────────
interface RapportState {
  dossierComplet:         boolean;
  pieceValide:            boolean;
  habilite:               boolean;
  habiliteJustif:         string;
  absenceMotifs:          boolean;
  absenceJustif:          string;
  conformiteNationalite:  boolean;
  conformiteJustif:       string;
  decision:               'retenu' | 'rejete' | 'reserve';
  motivation:             string;
  avisEvaluateur:         string;
  certifie:               boolean;
}

const INITIAL_RAPPORT: RapportState = {
  dossierComplet:        true,
  pieceValide:           true,
  habilite:              true,
  habiliteJustif:        '',
  absenceMotifs:         true,
  absenceJustif:         '',
  conformiteNationalite: true,
  conformiteJustif:      '',
  decision:              'reserve',
  motivation:            '',
  avisEvaluateur:        '',
  certifie:              false,
};

// ─── Section: Informations Générales ─────────────────────────────────────────
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

// ─── Section: Évaluation Administrative ──────────────────────────────────────
function SectionEvalAdmin({ form, setForm }: {
  form: RapportState;
  setForm: React.Dispatch<React.SetStateAction<RapportState>>;
}) {
  const set = (key: keyof RapportState, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="flex gap-6">
      <div className="flex-1 flex flex-col gap-6">

        {/* Contexte Administratif */}
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Contexte Administratif</h3>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="font-semibold text-gray-600">Liste officielle des pièces exigées</dt>
                <dd className="text-gray-500 mt-0.5">Offre Financière &nbsp;&nbsp; Offre Technique</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-600">Base réglementaire applicable</dt>
                <dd className="text-gray-500 mt-0.5">Loi et textes réglementaires relatifs aux marchés publics en vigueur</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-600">Type de procédure</dt>
                <dd className="text-gray-500 mt-0.5">Appel d'offres national ouvert</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Compléture et validité */}
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Compléture et validité des pièces</h3>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-3">
            {[
              { label: 'Le dossier administratif est-il complet ?', key: 'dossierComplet' as const },
              { label: 'Pièce valide à la date de soumission ?',    key: 'pieceValide'    as const },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  <Toggle checked={form[item.key] as boolean} onChange={v => set(item.key, v)} />
                  <span className="text-xs text-gray-500 w-6">{form[item.key] ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conformité Légale */}
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-3">Conformité Légale</h3>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-5">
            {[
              { label: "L'opérateur est-il légalement habilité à soumissionner ?", toggleKey: 'habilite'              as const, justifKey: 'habiliteJustif'        as const },
              { label: "Absence de motifs d'exclusion légale ?",                   toggleKey: 'absenceMotifs'         as const, justifKey: 'absenceJustif'          as const },
              { label: "Conformité aux exigences de nationalité / partenariat",    toggleKey: 'conformiteNationalite' as const, justifKey: 'conformiteJustif'        as const },
            ].map(item => (
              <div key={item.toggleKey} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <Toggle checked={form[item.toggleKey] as boolean} onChange={v => set(item.toggleKey, v)} />
                    <span className="text-xs text-gray-500 w-6">{form[item.toggleKey] ? 'Oui' : 'Non'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Justification</label>
                  <textarea
                    value={form[item.justifKey] as string}
                    onChange={e => set(item.justifKey, e.target.value)}
                    placeholder="Comparer le montant proposé aux références disponibles et justifier l'appréciation ..."
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all resize-none placeholder-gray-400"
                    style={{ color: '#1C4532' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AideAnalyseAdmin />
    </div>
  );
}

// ─── Section: Conclusion et Décision ─────────────────────────────────────────
function SectionConclusion({ dossier, form, setForm, onMarquerPret }: {
  dossier: Dossier;
  form: RapportState;
  setForm: React.Dispatch<React.SetStateAction<RapportState>>;
  onMarquerPret: () => void;
}) {
  const set = (key: keyof RapportState, val: any) => setForm(f => ({ ...f, [key]: val }));
  const canSubmit = form.certifie;

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-xs">
          {[
            ['Dossier',             dossier.reference],
            ['Service Contractant', 'Direction des Marchés Publics'],
            ['Opérateur économique', dossier.operateur],
            ['Domaine',             'BTP / Infrastructure'],
            ['Score financière',    '0/100'],
            ['Score technique',     '0/100'],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="font-bold text-gray-700">{k}</span>
              <p className="text-gray-500 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Décision finale */}
      <div>
        <h3 className="text-base font-bold text-gray-800 mb-3">Décision finale</h3>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4 max-w-lg">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Décision</p>
            <div className="space-y-2">
              {([
                { val: 'retenu',  label: 'Dossier retenu' },
                { val: 'rejete',  label: 'Dossier rejeté' },
                { val: 'reserve', label: 'Dossier retenu sous réserve' },
              ] as const).map(opt => (
                <label key={opt.val} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => set('decision', opt.val)}>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    form.decision === opt.val ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {form.decision === opt.val && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Motivation de la décision</label>
            <textarea value={form.motivation} onChange={e => set('motivation', e.target.value)}
              placeholder="Tapez ici ..." rows={3}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all resize-none placeholder-gray-400"
              style={{ color: '#1C4532' }} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Avis final de l'évaluateur</label>
            <textarea value={form.avisEvaluateur} onChange={e => set('avisEvaluateur', e.target.value)}
              placeholder="Tapez ici ..." rows={3}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all resize-none placeholder-gray-400"
              style={{ color: '#1C4532' }} />
          </div>
        </div>
      </div>

      {/* Certification + submit */}
      <div className="flex flex-col gap-4 max-w-2xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.certifie} onChange={e => set('certifie', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-gray-700">
            Je certifie que cette décision est fondée sur une évaluation objective, conforme aux règles en vigueur, et dûment motivée
          </span>
        </label>
        <div className="flex justify-end">
          <button onClick={onMarquerPret} disabled={!canSubmit}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              canSubmit ? 'bg-[#00738C] hover:bg-[#005f75] text-white hover:shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            Marquer comme prêt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rapport tab ──────────────────────────────────────────────────────────────
function RapportsTab({ dossier, rapportExists, onSaved }: {
  dossier: Dossier; rapportExists: boolean; onSaved: () => void;
}) {
  const [section,   setSection]   = useState<RapportSection>('infos-generales');
  const [editMode,  setEditMode]  = useState(!rapportExists);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState<RapportState>(INITIAL_RAPPORT);
  const { notifyMarquerPret } = useNotifications();

  const SECTIONS = [
    { id: 'infos-generales'    as RapportSection, label: 'Informations Générales' },
    { id: 'eval-administrative' as RapportSection, label: 'Évaluation Administrative' },
    { id: 'conclusion'          as RapportSection, label: 'Conclusion et Décision' },
  ];
  const idx = SECTIONS.findIndex(s => s.id === section);

  const handleConfirm = () => {
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

  // Already-submitted view
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
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-2">
            <button onClick={() => setEditMode(true)}
              className="px-5 py-2.5 bg-[#00738C] hover:bg-[#005f75] text-white text-sm font-bold rounded-xl transition-all shadow-sm">Modifier</button>
            <button onClick={() => setShowModal(true)}
              className="px-5 py-2.5 border-2 border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] text-sm font-bold rounded-xl transition-all">Marquer comme prêt</button>
          </div>
          <PdfViewer />
        </div>
        {showModal && <Modal />}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="flex flex-col gap-0">
      {/* Section tabs */}
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

      {section === 'infos-generales'     && <SectionInfosGenerales dossier={dossier} />}
      {section === 'eval-administrative' && <SectionEvalAdmin form={form} setForm={setForm} />}
      {section === 'conclusion'          && <SectionConclusion dossier={dossier} form={form} setForm={setForm} onMarquerPret={() => setShowModal(true)} />}

      {/* Navigation */}
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

// ─── Doc tab (Financière / Technique / Appel d'Offre) ─────────────────────────
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
        {!isAppel && <AideAnalyseAdmin />}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  dossier: Dossier;
  onBack: () => void;
}

export default function DossierDetailAdminView({ dossier, onBack }: Props) {
  const [activeTab,    setActiveTab]    = useState<MainTab>('offre-financiere');
  const [rapportSaved, setRapportSaved] = useState(false);

  const TABS = [
    { id: 'offre-financiere' as MainTab, label: 'Offre Financière' },
    { id: 'offre-technique'  as MainTab, label: 'Offre Technique' },
    { id: 'appel-offre'      as MainTab, label: "Appel d'Offre" },
    { id: 'rapports'         as MainTab, label: "Rapports d'évaluation" },
  ];

  return (
    <div className="flex flex-col gap-0 -mt-6 -mx-6">
      {/* Header */}
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

      {/* Content */}
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