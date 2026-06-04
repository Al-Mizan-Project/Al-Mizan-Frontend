'use client';

import { useState, useEffect, useCallback } from 'react';
import { fileRecord } from '../../types';
import { documentsApi, DocumentMetadata } from '@/lib/api/documents';
import { appelsApi } from '@/lib/api/appels';
import { useAuth } from '@/contexts/AuthContext';

type ValidationDecision = 'valide' | 'refuse' | 'ferme';

interface ValidationCDCModalProps {
  dossier: fileRecord;
  onClose: () => void;
  onValidated: () => void;
}

export default function ValidationCDCModal({ dossier, onClose, onValidated }: ValidationCDCModalProps) {
  const { user } = useAuth();

  const [docMeta, setDocMeta] = useState<DocumentMetadata | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  const [decision, setDecision] = useState<ValidationDecision | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);

  // Fetch document metadata and download URL
  useEffect(() => {
    async function fetchDoc() {
      const docId = dossier.id_doc_cdc;
      if (!docId) {
        setDocError('Aucun document CDC associé à cet appel d\'offre.');
        setDocLoading(false);
        return;
      }

      try {
        const numericId = typeof docId === 'string' ? parseInt(docId, 10) : docId;
        const [meta, urlData] = await Promise.all([
          documentsApi.getDocument(numericId),
          documentsApi.getDownloadUrl(numericId),
        ]);
        setDocMeta(meta);
        const downloadUrl = urlData.download_url || urlData.storage_url || null;
        setDocUrl(downloadUrl);

        // Fetch the file as a Blob to bypass the backend's "attachment" header
        // This allows the iframe to render the PDF instead of downloading it
        const isPdfType = meta?.type_document?.toLowerCase() === 'pdf' || meta?.nom?.toLowerCase().endsWith('.pdf');
        
        if (isPdfType && downloadUrl) {
          try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(downloadUrl, { headers });
            if (response.ok) {
              const blob = await response.blob();
              const pdfBlob = new Blob([blob], { type: 'application/pdf' });
              setDocBlobUrl(URL.createObjectURL(pdfBlob));
            }
          } catch (e) {
            console.warn('Could not fetch blob for preview:', e);
          }
        }
      } catch (err: any) {
        console.error('Error fetching CDC document:', err);
        setDocError('Impossible de charger le document CDC.');
      } finally {
        setDocLoading(false);
      }
    }

    fetchDoc();
  }, [dossier.id_doc_cdc]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (docBlobUrl) {
        URL.revokeObjectURL(docBlobUrl);
      }
    };
  }, [docBlobUrl]);

  // Submit validation decision
  const handleSubmit = useCallback(async () => {
    if (!decision) return;

    const appelId = typeof dossier.rawId === 'string' ? parseInt(dossier.rawId, 10) : (dossier.rawId as number);
    if (!appelId) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const validatedBy = user?.id_utilisateur ?? user?.id ?? user?.id_membre;

      if (decision === 'valide') {
        await appelsApi.validerAppel(appelId, validatedBy);
      } else if (decision === 'refuse') {
        await appelsApi.refuserAppel(appelId, validatedBy);
      } else if (decision === 'ferme') {
        await appelsApi.fermerAppel(appelId);
      }

      setSubmitSuccess(true);

      // Trigger PDF download of validation receipt
      generateValidationReceipt(appelId, decision);

      // After a short delay, close and refresh
      setTimeout(() => {
        onValidated();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error submitting validation:', err);
      setSubmitError(err.message || 'Erreur lors de la validation.');
    } finally {
      setSubmitting(false);
    }
  }, [decision, dossier.rawId, user, onValidated, onClose]);

  // Generate a downloadable validation receipt
  const generateValidationReceipt = (appelId: number, decision: ValidationDecision) => {
    const decisionLabels: Record<ValidationDecision, string> = {
      valide: 'Validé',
      refuse: 'Refusé',
      ferme: 'Fermé',
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const content = [
      '═══════════════════════════════════════════════════════════',
      '            ATTESTATION DE VALIDATION CDC',
      '═══════════════════════════════════════════════════════════',
      '',
      `Date : ${dateStr}`,
      '',
      '───────────────────────────────────────────────────────────',
      '  INFORMATIONS DE L\'APPEL D\'OFFRE',
      '───────────────────────────────────────────────────────────',
      `  Référence     : ${dossier.reference}`,
      `  ID Appel      : ${appelId}`,
      `  ID Document CDC : ${dossier.id_doc_cdc || 'N/A'}`,
      docMeta ? `  Nom Document  : ${docMeta.nom}` : '',
      '',
      '───────────────────────────────────────────────────────────',
      '  DÉCISION DE VALIDATION',
      '───────────────────────────────────────────────────────────',
      `  Statut        : ${decisionLabels[decision]}`,
      `  Validateur    : ${user?.nom || user?.email || 'N/A'} ${user?.prenom || ''}`,
      `  ID Validateur : ${user?.id_utilisateur ?? user?.id ?? 'N/A'}`,
      '',
      '═══════════════════════════════════════════════════════════',
      '  Ce document atteste de la décision de validation',
      '  effectuée via la plateforme Al-Mizan.',
      '═══════════════════════════════════════════════════════════',
    ].filter(Boolean).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_${appelId}_${decision}_${now.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const decisions: { value: ValidationDecision; label: string; color: string; icon: string }[] = [
    { value: 'valide', label: 'Validé', color: '#16a34a', icon: '✓' },
    { value: 'refuse', label: 'Refusé', color: '#dc2626', icon: '✕' },
    { value: 'ferme', label: 'Fermé', color: '#9333ea', icon: '⊘' },
  ];

  // Determine if CDC file is a PDF for preview
  const isPdf = docMeta?.type_document?.toLowerCase() === 'pdf' ||
    docMeta?.nom?.toLowerCase().endsWith('.pdf');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ border: '1px solid #DDE1E6' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid #DDE1E6', background: 'linear-gradient(135deg, #306B6F 0%, #418387 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Validation du CDC</h2>
                <p className="text-white/80 text-sm">{dossier.reference}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Document Preview Section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#306B6F' }}>
                Document Cahier des Charges
              </h3>

              {docLoading ? (
                <div className="flex items-center justify-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-3 border-gray-300 border-t-teal-600 rounded-full animate-spin mb-3" 
                      style={{ borderWidth: '3px', borderTopColor: '#306B6F' }}
                    />
                    <p className="text-gray-500 text-sm">Chargement du document...</p>
                  </div>
                </div>
              ) : docError ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-amber-800 text-sm">{docError}</span>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Document info bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E2F3F2' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#306B6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{docMeta?.nom || 'Document CDC'}</p>
                        <p className="text-xs text-gray-500">
                          {docMeta?.type_document?.toUpperCase()} • ID: {dossier.id_doc_cdc}
                        </p>
                      </div>
                    </div>
                    {docUrl && (
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                        style={{ color: '#306B6F', backgroundColor: '#E2F3F2' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c8e6e5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#E2F3F2'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Télécharger
                      </a>
                    )}
                  </div>

                  {/* Document preview iframe */}
                  {isPdf && (docBlobUrl || docUrl) ? (
                    <iframe
                      src={docBlobUrl || docUrl || ''}
                      className="w-full border-0"
                      style={{ height: '400px' }}
                      title="Aperçu CDC"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#E2F3F2' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#306B6F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium mb-1">
                        {docMeta?.nom || 'Document CDC'}
                      </p>
                      <p className="text-gray-400 text-sm mb-4">
                        L'aperçu n'est pas disponible pour ce format.
                      </p>
                      {docUrl && (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                          style={{ backgroundColor: '#306B6F' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#245457'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#306B6F'; }}
                        >
                          Ouvrir le document
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Decision Section */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#306B6F' }}>
                Décision de validation
              </h3>

              <div className="flex flex-col gap-2">
                {decisions.map((d) => {
                  const isSelected = decision === d.value;
                  return (
                    <label
                      key={d.value}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150 cursor-pointer"
                      style={{
                        borderColor: isSelected ? d.color : '#DDE1E6',
                        backgroundColor: isSelected ? `${d.color}08` : 'white',
                        opacity: submitSuccess ? 0.6 : 1,
                        pointerEvents: submitSuccess ? 'none' : 'auto',
                      }}
                      onClick={() => !submitSuccess && setDecision(d.value)}
                    >
                      {/* Radio circle */}
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                        style={{ borderColor: isSelected ? d.color : '#C1C7CD' }}
                      >
                        {isSelected && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: d.color }}
                          />
                        )}
                      </span>

                      {/* Colored dot */}
                      <span
                        className="flex-shrink-0 w-3 h-3 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />

                      {/* Label */}
                      <span
                        className="text-sm font-medium"
                        style={{ color: isSelected ? d.color : '#4D5358' }}
                      >
                        {d.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Error/Success Messages */}
            {submitError && (
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span className="text-red-700 text-sm">{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-green-700 text-sm font-medium">
                  Validation enregistrée avec succès ! Téléchargement de l'attestation...
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid #DDE1E6', backgroundColor: '#F2F4F8' }}
          >
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors"
              style={{ borderColor: '#C1C7CD', color: '#4D5358', backgroundColor: 'white' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F2F4F8'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
            >
              Annuler
            </button>

            <button
              onClick={handleSubmit}
              disabled={!decision || submitting || submitSuccess}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200"
              style={{
                backgroundColor: decision && !submitting && !submitSuccess ? '#306B6F' : '#9BCFCF',
                cursor: decision && !submitting && !submitSuccess ? 'pointer' : 'not-allowed',
                boxShadow: decision ? '0 2px 8px rgba(48, 107, 111, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (decision && !submitting && !submitSuccess) {
                  e.currentTarget.style.backgroundColor = '#245457';
                }
              }}
              onMouseLeave={(e) => {
                if (decision && !submitting && !submitSuccess) {
                  e.currentTarget.style.backgroundColor = '#306B6F';
                }
              }}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : submitSuccess ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Enregistré !
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Marquer comme prêt
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
