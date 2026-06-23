'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';

// ─── Types ────────────────────────────────────────────────────────────────────
type MainTab = 'offre-financiere' | 'offre-technique' | 'appel-offre' | 'rapports';
type RapportSubTab = 'eval-administrative' | 'eval-offres';

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
function PdfViewer() {
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-lg overflow-hidden border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2 text-xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <button className="hover:text-gray-300 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </button>
          <button className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span className="font-medium">Zoom</span>
          <button className="hover:text-gray-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
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
      {/* Document area */}
      <div className="flex-1 bg-gray-200 flex items-center justify-center" style={{ minHeight: '480px' }}>
        <div className="bg-gray-300 flex items-center justify-center rounded" style={{ width: '55%', height: '80%' }}>
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

// ─── Metadata + action card ───────────────────────────────────────────────────
function MetaCard({
  rows,
  actions,
}: {
  rows: [string, string][];
  actions: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 w-72 flex-shrink-0">
      <table className="w-full mb-4">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="align-top">
              <td className="font-bold text-gray-800 pr-4 py-1 text-sm whitespace-nowrap">{label}</td>
              <td className="text-gray-600 py-1 text-sm">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 flex-wrap">{actions}</div>
    </div>
  );
}

// ─── Shared: blue outline btn ─────────────────────────────────────────────────
function OutlineBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-all"
    >
      {label}
    </button>
  );
}

function SolidBtn({ label, onClick, icon }: { label: string; onClick?: () => void; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
    >
      {icon}
      {label}
    </button>
  );
}

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-black text-gray-900 leading-tight pr-4">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors mt-1 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border-2 border-blue-600 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Offre Financière ────────────────────────────────────────────────────
function OffreFinanciereTab({ dossier }: { dossier: Dossier }) {
  return (
    <div className="flex gap-6 items-start">
      <MetaCard
        rows={[
          ['Dossier',             dossier.reference],
          ['Opérateur économique', dossier.operateur],
          ['Délais d\'évaluation', '2026-02-31'],
          ['Service Contractant',  'Service Contractant'],
          ['Domaine',              'Domaine'],
          ['Etape d\'évaluation',  'Evaluation des Offres'],
          ['Document',             'Offre financière'],
          ['Status',               dossier.status],
        ]}
        actions={<SolidBtn label="Télécharger" icon={<DownloadIcon />} />}
      />
      <PdfViewer />
    </div>
  );
}

// ─── TAB: Offre Technique ─────────────────────────────────────────────────────
function OffreTechniqueTab({ dossier }: { dossier: Dossier }) {
  return (
    <div className="flex gap-6 items-start">
      <MetaCard
        rows={[
          ['Dossier',             dossier.reference],
          ['Opérateur économique', dossier.operateur],
          ['Délais d\'évaluation', '2026-02-31'],
          ['Service Contractant',  'Service Contractant'],
          ['Domaine',              'Domaine'],
          ['Etape d\'évaluation',  'Evaluation des Offres'],
          ['Document',             'Offre technique'],
          ['Status',               dossier.status],
        ]}
        actions={<SolidBtn label="Télécharger" icon={<DownloadIcon />} />}
      />
      <PdfViewer />
    </div>
  );
}

// ─── TAB: Appel d'Offre ───────────────────────────────────────────────────────
function AppelOffreTab({ dossier }: { dossier: Dossier }) {
  return (
    <div className="flex gap-6 items-start">
      <MetaCard
        rows={[
          ['Dossier',            dossier.reference],
          ['Service Contractant', 'Service Contractant'],
          ['Domaine',             'Domaine'],
          ['Etape d\'évaluation', 'Evaluation des Offres'],
          ['Document',            'Cahier des charges'],
        ]}
        actions={<SolidBtn label="Télécharger" icon={<DownloadIcon />} />}
      />
      <PdfViewer />
    </div>
  );
}

// ─── TAB: Rapports d'évaluation ───────────────────────────────────────────────
function RapportsTab({ dossier }: { dossier: Dossier }) {
  const [subTab, setSubTab] = useState<RapportSubTab>('eval-administrative');
  const [showModal, setShowModal] = useState(false);
  const [transmitted, setTransmitted] = useState(false);

  const isAdminTab = subTab === 'eval-administrative';

  const metaRows: [string, string][] = [
    ['Dossier',              dossier.reference],
    ['Opérateur économique', dossier.operateur],
    ['Délais d\'évaluation', '2026-02-31'],
    ['Service Contractant',  'Service Contractant'],
    ['Evaluateur',           'Nom Prénom'],
    ['Domaine',              'Domaine'],
    ['Etape d\'évaluation',  isAdminTab ? 'Evaluation Administrative' : 'Evaluation des Offres'],
    ['Document',             'Rapport d\'évaluation'],
    ['Status',               'Prêt'],
  ];

  if (transmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">✅</div>
        <h3 className="text-lg font-black text-gray-800">Dossier transmis à l'administration</h3>
        <p className="text-sm text-gray-500">Le dossier <strong>{dossier.reference}</strong> a été transmis avec succès.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tabs */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm font-semibold w-fit">
        {([
          { id: 'eval-administrative' as const, label: 'Evaluation administrative' },
          { id: 'eval-offres'         as const, label: 'Evaluation des offres' },
        ]).map((t, i) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-5 py-2.5 transition-all border-r last:border-r-0 border-gray-200 ${
              subTab === t.id
                ? 'bg-gray-100 text-gray-800 font-bold'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex gap-6 items-start">
        <MetaCard
          rows={metaRows}
          actions={
            <>
              <SolidBtn label="Télécharger" icon={<DownloadIcon />} />
              <OutlineBtn label="Transmettre" onClick={() => setShowModal(true)} />
            </>
          }
        />
        <PdfViewer />
      </div>

      {/* Confirm modal */}
      {showModal && (
        <ConfirmModal
          title={`Transmettre le Dossier ${dossier.id} à l'administration`}
          message="Je confirme la transmission du dossier à l'administration"
          onConfirm={() => { setShowModal(false); setTransmitted(true); }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function AdminDossierDetailView({
  dossier,
  onBack,
}: {
  dossier: Dossier;
  onBack: () => void;
}) {
  const [mainTab, setMainTab] = useState<MainTab>('offre-financiere');

  const MAIN_TABS: { id: MainTab; label: string }[] = [
    { id: 'offre-financiere', label: 'Offre Financière' },
    { id: 'offre-technique',  label: 'Offre Technique' },
    { id: 'appel-offre',      label: "Appel d'Offre" },
    { id: 'rapports',         label: "Rapports d'évaluation" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#00738C] hover:text-[#1C4532] transition-colors w-fit mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Retour à la liste
      </button>

      {/* Page header */}
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-blue-700 mb-0.5">
          OPÉRATEUR ÉCONOMIQUE
        </p>
        <h1 className="text-3xl font-black text-gray-900">{dossier.reference}</h1>
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-0 border-b border-gray-200 mb-6">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold relative transition-all ${
              mainTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {mainTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {mainTab === 'offre-financiere' && <OffreFinanciereTab dossier={dossier} />}
        {mainTab === 'offre-technique'  && <OffreTechniqueTab  dossier={dossier} />}
        {mainTab === 'appel-offre'      && <AppelOffreTab      dossier={dossier} />}
        {mainTab === 'rapports'         && <RapportsTab        dossier={dossier} />}
      </div>
    </div>
  );
}