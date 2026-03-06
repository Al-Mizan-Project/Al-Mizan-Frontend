'use client';

import { useState, useRef } from 'react';
import { useDocumentStore, DocKey } from '@/lib/document-store';

type RefTab = 'loi-23-12' | 'loi-17-18' | 'faq';

// ─── Real PDF viewer using iframe ─────────────────────────────────────────────
function PdfViewer({ dataUrl, filename }: { dataUrl: string; filename: string }) {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200" style={{ minHeight: '640px' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className="font-medium text-gray-300 truncate max-w-xs">{filename}</span>
        </div>
        {/* Download button */}
        <a
          href={dataUrl}
          download={filename}
          className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-semibold transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Télécharger
        </a>
      </div>

      {/* iframe renders the actual PDF using the browser's built-in viewer */}
      <iframe
        src={dataUrl}
        title={filename}
        className="flex-1 w-full bg-gray-100"
        style={{ minHeight: '600px', border: 'none' }}
      />
    </div>
  );
}

// ─── Upload zone shown when no doc is loaded ──────────────────────────────────
function UploadZone({
  docKey,
  label,
  onUploaded,
}: {
  docKey: DocKey;
  label: string;
  onUploaded: () => void;
}) {
  const { uploadDoc } = useDocumentStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 20 Mo.');
      return;
    }
    setLoading(true);
    try {
      await uploadDoc(docKey, file);
      onUploaded();
    } catch {
      setError('Erreur lors du chargement du fichier.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '500px' }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-5 w-full max-w-lg border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
        }`}
        onClick={() => fileRef.current?.click()}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 12 15 15"/>
          </svg>
        </div>

        <div className="text-center">
          <p className="font-bold text-gray-800 text-base mb-1">
            {loading ? 'Chargement en cours…' : `Importer ${label}`}
          </p>
          <p className="text-sm text-gray-500">
            Glissez-déposez votre fichier PDF ici, ou{' '}
            <span className="text-blue-600 font-semibold">cliquez pour parcourir</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF uniquement · 20 Mo maximum</p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Lecture du fichier…
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── Doc tab: upload zone OR real viewer + replace button ─────────────────────
function DocTab({ docKey, label }: { docKey: DocKey; label: string }) {
  const { docs, removeDoc } = useDocumentStore();
  const doc = docs[docKey];
  const [replacing, setReplacing] = useState(false);

  if (!doc || replacing) {
    return (
      <div>
        {replacing && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setReplacing(false)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
              Annuler le remplacement
            </button>
          </div>
        )}
        <UploadZone docKey={docKey} label={label} onUploaded={() => setReplacing(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Doc info bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{doc.filename}</p>
            <p className="text-xs text-gray-400">
              {doc.sizeKb} Ko · Importé le{' '}
              {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReplacing(true)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-all"
          >
            Remplacer
          </button>
          <button
            onClick={() => removeDoc(docKey)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-300 text-red-500 hover:border-red-400 rounded-lg transition-all"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Actual PDF rendered in iframe */}
      <PdfViewer dataUrl={doc.dataUrl} filename={doc.filename} />
    </div>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: 'Quelles sont les conditions de recevabilité d\'un dossier ?',         a: 'Un dossier doit contenir l\'offre financière, l\'offre technique et toutes les pièces administratives exigées dans le cahier des charges.' },
  { q: 'Quel est le délai réglementaire d\'évaluation des offres ?',          a: 'Selon la loi 23-12, le délai d\'évaluation ne peut excéder 30 jours à compter de la date d\'ouverture des plis.' },
  { q: 'Comment traiter une offre anormalement basse ?',                       a: 'L\'évaluateur doit demander des justifications écrites à l\'opérateur et les analyser avant toute décision de rejet ou d\'acceptation.' },
  { q: 'Quels critères s\'appliquent à l\'évaluation technique ?',             a: 'Les critères incluent la méthodologie, les moyens humains et matériels, le planning d\'exécution et la conformité aux spécifications techniques.' },
  { q: 'Que faire en cas de dossier incomplet reçu hors délai ?',             a: 'Le dossier doit être écarté et l\'opérateur notifié par écrit avec mention des pièces manquantes et du motif d\'exclusion.' },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-0 max-w-3xl">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-lg mb-2 overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            {item.q}
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`flex-shrink-0 ml-4 transition-transform duration-200 ${openIndex === i ? 'rotate-45' : ''}`}
            >
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3 leading-relaxed">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ReferencesView() {
  const [activeTab, setActiveTab] = useState<RefTab>('loi-23-12');

  const TABS: { id: RefTab; label: string }[] = [
    { id: 'loi-23-12', label: 'Articles Loi 23-12' },
    { id: 'loi-17-18', label: 'Articles Loi 17-18' },
    { id: 'faq',       label: 'FAQ' },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Tab row */}
      <div className="border-b border-gray-200 -mx-6 -mt-6 px-6 mb-6 flex items-center gap-0 bg-white">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3.5 text-sm font-semibold relative transition-all ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'loi-23-12' && <DocTab docKey="loi-23-12" label="Articles Loi 23-12" />}
      {activeTab === 'loi-17-18' && <DocTab docKey="loi-17-18" label="Articles Loi 17-18" />}
      {activeTab === 'faq'       && <FaqAccordion />}
    </div>
  );
}