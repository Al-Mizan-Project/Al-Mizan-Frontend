'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSCSession } from '@/lib/sc/session';
import { Card, PageHeader, Spinner, EmptyState, Badge } from '@/lib/sc/ui';

interface AppelOffre {
  id_appel_offres: number;
  reference: string;
  titre: string;
  statut: string;
  required_docs_admin: string[];
  required_docs_tech: string[];
  required_docs_fin: string[];
  date_publication: string | null;
  date_limite_soumission: string | null;
}

interface Soumission {
  id_soumission: number;
  id_appel_offre: number;
  id_soumissionnaire: number;
  document_ids: number[];
  statut: string;
  montant_financier: number | null;
  date_soumission: string;
  conformite_statut: string | null;
  conformite_rapport: string | null;
}

interface DocMeta {
  id_document: number;
  nom: string;
  type_document: string;
  storage_url: string;
  taille_fichier?: number;
  ia_verif_statut?: string;
}

interface IAFullResult {
  id_soumission: number;
  id_appel_offre: number;
  conformite_statut: string;
  conformite_rapport: any;
  next_action: string;
  analysis_context?: {
    required_documents: any[];
    provided_document_ids: number[];
    provided_documents_detected: any[];
    ocr?: { enabled: boolean; processed: number; succeeded: number };
    missing_metadata_required_ids?: number[];
    missing_metadata_provided_ids?: number[];
  };
  integrations?: {
    soumission_sync?: any;
    documents_sync?: any[];
  };
}

type Step = 'select' | 'details' | 'analysis' | 'results';

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

function resolveList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as any).results))
    return (data as any).results;
  return [];
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge tone="neutral">En attente</Badge>;
  if (status.toLowerCase() === 'conforme') return <Badge tone="success">✓ Conforme</Badge>;
  if (status.toLowerCase() === 'non_conforme') return <Badge tone="danger">✕ Non conforme</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
}

export default function DemoConformitePage() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, token } = useSCSession();

  const [step, setStep] = useState<Step>('select');
  const [appels, setAppels] = useState<AppelOffre[]>([]);
  const [selectedAppel, setSelectedAppel] = useState<AppelOffre | null>(null);
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [selectedSoum, setSelectedSoum] = useState<Soumission | null>(null);
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaFullResult, setIaFullResult] = useState<IAFullResult | null>(null);
  const [iaStatus, setIaStatus] = useState<string | null>(null);
  const [analyzedResults, setAnalyzedResults] = useState<Record<number, string>>({});
  const [loadingAppels, setLoadingAppels] = useState(false);
  const [loadingSoum, setLoadingSoum] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setLoadingAppels(true);
      try {
        const raw = await apiFetch<unknown>('/api/proxy/appels?path=appels-offres', token);
        setAppels(resolveList<AppelOffre>(raw));
      } catch (_e) {
      } finally {
        setLoadingAppels(false);
      }
    })();
  }, [ready, token]);

  const loadSoumissions = async (appel: AppelOffre) => {
    setSelectedAppel(appel);
    setSoumissions([]);
    setSelectedSoum(null);
    setDocs([]);
    setIaFullResult(null);
    setIaStatus(null);
    setAnalyzedResults({});
    setStep('details');
    setLoadingSoum(true);
    try {
      const raw = await apiFetch<unknown>(
        `/api/proxy/soumissions?path=appels-offres/${appel.id_appel_offres}/soumissions`,
        token
      );
      setSoumissions(resolveList<Soumission>(raw));
    } catch (_e) {
    } finally {
      setLoadingSoum(false);
    }
  };

  const selectSoumission = async (s: Soumission) => {
    setSelectedSoum(s);
    setDocs([]);
    setIaFullResult(null);
    setIaStatus(null);
    setStep('analysis');
    if (s.document_ids?.length) {
      try {
        const idsParam = s.document_ids.join(',');
        const raw = await apiFetch<unknown>(
          `/api/proxy/documents?path=api/documents/search/&ids=${idsParam}`,
          token
        );
        setDocs(resolveList<DocMeta>(raw));
      } catch (_e) {
      }
    }
  };

  const runConformite = async () => {
    if (!selectedSoum || !selectedAppel) return;
    setIaLoading(true);
    setIaFullResult(null);
    setIaStatus(null);
    try {
      const requiredDocs = [
        ...(selectedAppel.required_docs_admin || []),
        ...(selectedAppel.required_docs_tech || []),
        ...(selectedAppel.required_docs_fin || []),
      ];
      const body = {
        id_appel_offre: selectedAppel.id_appel_offres,
        provided_document_ids: selectedSoum.document_ids || [],
        required_documents: requiredDocs,
        perform_ocr: true,
      };
      const endpoint = `/api/proxy/soumissions?path=ia/conformite/verifier-soumission-auto/${selectedSoum.id_soumission}`;
      const result = await apiFetch<IAFullResult>(endpoint, token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setIaStatus(result.conformite_statut);
      setIaFullResult(result);
      setAnalyzedResults(prev => ({ ...prev, [selectedSoum.id_soumission]: result.conformite_statut }));
      setStep('results');
    } catch (_e) {
    } finally {
      setIaLoading(false);
    }
  };

  if (!ready) return <Spinner />;

  const stepTabs: Step[] = ['select', 'details', 'analysis', 'results'];
  const stepLabels = ["Appels d'offres", 'Soumissions', 'Analyse IA', 'Résultats'];
  const currentStepIdx = stepTabs.indexOf(step);

  return (
    <div>
      <PageHeader
        title="Analyse de Conformité IA"
        breadcrumb={isArabic ? 'التدقيق بالذكاء الاصطناعي' : 'Vérification automatisée par IA'}
      />

      <div className="flex items-center gap-2 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-3">
        {stepTabs.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i === currentStepIdx
                  ? 'text-white shadow-md'
                  : i < currentStepIdx
                  ? 'bg-[#D6EAD4] text-[#1C4532]'
                  : 'bg-[#F4F7F4] text-gray-400'
              }`}
              style={i === currentStepIdx ? { background: 'linear-gradient(135deg, #1C4532, #00738C)' } : {}}
            >
              {i < currentStepIdx ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs font-semibold ${
                i === currentStepIdx ? 'text-[#1C4532]' : i < currentStepIdx ? 'text-[#00738C]' : 'text-gray-400'
              }`}
            >
              {stepLabels[i]}
            </span>
            {i < stepTabs.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {step === 'select' && (
          <Card className="p-5">
            <h3 className="text-base font-bold mb-1" style={{ color: '#1C4532' }}>
              Étape 1 — Sélectionner un Appel d'Offres
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Choisissez un appel d'offres pour consulter ses soumissions et lancer l'analyse de conformité.
            </p>
            {loadingAppels ? (
              <Spinner label="Chargement…" />
            ) : appels.length === 0 ? (
              <EmptyState title="Aucun appel d'offres trouvé" hint="Aucun appel d'offres disponible dans le système." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {appels.map((a) => (
                  <button
                    key={a.id_appel_offres}
                    onClick={() => loadSoumissions(a)}
                    className="text-left p-4 rounded-xl border border-gray-100 hover:border-[#97A675] hover:shadow-sm transition-all bg-[#F4F7F4] hover:bg-white"
                  >
                    <p className="text-xs text-gray-400 font-mono">{a.reference || `AO-${a.id_appel_offres}`}</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1C4532' }}>{a.titre || 'Sans titre'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge tone={a.statut === 'publie' ? 'success' : 'neutral'}>{a.statut}</Badge>
                      {(a.required_docs_admin?.length || a.required_docs_tech?.length || a.required_docs_fin?.length) ? (
                        <span className="text-xs text-gray-400">
                          {(a.required_docs_admin?.length || 0) + (a.required_docs_tech?.length || 0) + (a.required_docs_fin?.length || 0)} doc(s)
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        )}

        {step === 'details' && selectedAppel && (
          <Card className="p-5">
            <button
              onClick={() => setStep('select')}
              className="text-sm text-[#00738C] hover:underline mb-3 flex items-center gap-1"
            >
              ← Retour aux appels
            </button>
            <h3 className="text-base font-bold mb-1" style={{ color: '#1C4532' }}>
              Étape 2 — Soumissions pour {selectedAppel.reference}
            </h3>

            <div className="bg-[#F4F7F4] rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Documents requis par le cahier des charges</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['required_docs_admin', 'required_docs_tech', 'required_docs_fin'] as const).map((key, i) => {
                  const labels = ['📁 Administratifs', '⚙️ Techniques', '💰 Financiers'];
                  const docs = selectedAppel[key] || [];
                  const extraDocs = key === 'required_docs_admin'
                    ? ['Déclaration à souscrire', 'Attestation de probité']
                    : [];
                  return (
                    <div key={key}>
                      <p className="text-xs font-semibold mb-1">{labels[i]}</p>
                      {(docs.length > 0 || extraDocs.length > 0) ? (
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {docs.map((d: string, idx: number) => <li key={`b-${idx}`}>{d}</li>)}
                          {extraDocs.map((d, idx) => <li key={`e-${idx}`} className="text-[#1C4532] font-medium">{d}</li>)}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Non spécifié</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {loadingSoum ? (
              <Spinner label="Chargement des soumissions…" />
            ) : soumissions.length === 0 ? (
              <EmptyState title="Aucune soumission" hint="Aucune soumission pour cet appel d'offres." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
                      <th className="text-left py-2 pr-4">ID</th>
                      <th className="text-left py-2 pr-4">Soumissionnaire</th>
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-right py-2 pr-4">Montant</th>
                      <th className="text-center py-2 pr-4">Docs</th>
                      <th className="text-center py-2 pr-4">Conformité</th>
                      <th className="text-right py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soumissions.map((s) => (
                      <tr key={s.id_soumission} className="border-b border-gray-50 hover:bg-[#F4F7F4]">
                        <td className="py-3 pr-4 font-mono text-xs">#{s.id_soumission}</td>
                        <td className="py-3 pr-4">Opérateur #{s.id_soumissionnaire}</td>
                        <td className="py-3 pr-4 text-xs text-gray-500">
                          {s.date_soumission ? new Date(s.date_soumission).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="py-3 pr-4 text-right text-xs">
                          {s.montant_financier ? `${Number(s.montant_financier).toLocaleString('fr-FR')} DA` : '—'}
                        </td>
                        <td className="py-3 pr-4 text-center text-xs">{s.document_ids?.length || 0}</td>
                        <td className="py-3 pr-4 text-center"><StatusBadge status={analyzedResults[s.id_soumission] || null} /></td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => selectSoumission(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}
                          >
                            Analyser →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {(step === 'analysis' || step === 'results') && selectedSoum && selectedAppel && (
          <Card className="p-5">
            <button
              onClick={() => setStep('details')}
              className="text-sm text-[#00738C] hover:underline mb-3 flex items-center gap-1"
            >
              ← Retour aux soumissions
            </button>
            <h3 className="text-base font-bold mb-3" style={{ color: '#1C4532' }}>
              {step === 'analysis' ? 'Étape 3 — Analyse de Conformité IA' : 'Étape 4 — Résultats'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Soumission', value: `#${selectedSoum.id_soumission}` },
                { label: "Appel d'Offres", value: selectedAppel.reference },
                { label: 'Opérateur', value: `#${selectedSoum.id_soumissionnaire}` },
                { label: 'Statut', value: <StatusBadge status={iaStatus || selectedSoum.conformite_statut} /> },
              ].map((item, i) => (
                <div key={i} className="bg-[#F4F7F4] rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#1C4532' }}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#1C4532' }}>📄 Documents fournis ({docs.length})</h4>
              {docs.length > 0 ? (
                <div className="space-y-2">
                  {docs.map((d) => (
                    <div key={d.id_document} className="flex items-center gap-3 p-3 rounded-xl bg-[#F4F7F4]">
                      <span className="text-lg">📄</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.nom}</p>
                        <p className="text-xs text-gray-400">{d.type_document}</p>
                      </div>
                      <Badge tone={d.ia_verif_statut === 'verifie' ? 'success' : 'neutral'}>
                        {d.ia_verif_statut || 'non vérifié'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Aucun document chargé ou IDs: [{selectedSoum.document_ids?.join(', ')}]
                </p>
              )}
            </div>

            <div className="bg-[#F4F7F4] rounded-xl p-5 mb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold mb-1" style={{ color: '#1C4532' }}>🔬 Vérification automatique de conformité</h4>
                  <p className="text-xs text-gray-500">
                    L'IA compare les documents fournis avec les documents requis, vérifie la validité des pièces et détecte les anomalies.
                  </p>
                </div>
                <button
                  onClick={runConformite}
                  disabled={iaLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}
                >
                  {iaLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyse…</>
                  ) : (
                    '🚀 Lancer l\'analyse'
                  )}
                </button>
              </div>
            </div>

            {(step === 'results') && (
              <div className="space-y-3">
                <div
                  className={`rounded-xl p-4 flex items-center justify-between gap-4 ${
                    iaStatus === 'CONFORME' ? 'bg-emerald-50 border border-emerald-200' :
                    iaStatus === 'NON_CONFORME' ? 'bg-red-50 border border-red-200' :
                    'bg-amber-50 border border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {iaStatus === 'CONFORME' ? '✅' : iaStatus === 'NON_CONFORME' ? '❌' : '⏳'}
                    </span>
                    <div>
                      <p className="text-lg font-black">{iaStatus === 'CONFORME' ? 'CONFORME' : iaStatus === 'NON_CONFORME' ? 'NON CONFORME' : iaStatus || 'En attente'}</p>
                      <p className="text-xs text-gray-500">
                        {iaFullResult?.next_action === 'EVALUATION_TECHNIQUE'
                          ? '➡️ Passer à l\'évaluation technique'
                          : iaFullResult?.next_action
                          ? '⚠️ Validation humaine requise'
                          : 'Analyse de conformité'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setIaFullResult(null); setIaStatus(null); setAnalyzedResults(prev => { const n = {...prev}; delete n[selectedSoum.id_soumission]; return n; }); setStep('analysis'); }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/80 hover:bg-white transition-all shadow-sm"
                      style={{ color: '#1C4532' }}
                    >
                      🔄 Re-analyser
                    </button>
                  </div>
                </div>

                {iaFullResult?.analysis_context?.ocr && (
                  <div className="bg-[#F4F7F4] rounded-xl px-5 py-3 flex items-center gap-6 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500">🔍 OCR / NLP</span>
                    {[
                      { value: iaFullResult.analysis_context.ocr.processed, label: 'Traités' },
                      { value: iaFullResult.analysis_context.ocr.succeeded, label: 'Réussis' },
                      { value: iaFullResult.analysis_context?.provided_documents_detected?.length || 0, label: 'Détectés' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-sm font-black" style={{ color: '#1C4532' }}>{stat.value}</span>
                        <span className="text-xs text-gray-500">{stat.label}</span>
                      </div>
                    ))}
                    {iaFullResult.analysis_context.ocr.succeeded < iaFullResult.analysis_context.ocr.processed && (
                      <span className="text-xs text-amber-700 font-medium">⚠️ OCR partiel</span>
                    )}
                  </div>
                )}

                {iaFullResult?.analysis_context && (
                  <div className="bg-[#F4F7F4] rounded-xl p-4">
                    <h4 className="text-xs font-semibold mb-3" style={{ color: '#1C4532' }}>📋 Comparaison Requis vs Fournis</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Documents requis ({iaFullResult.analysis_context.required_documents?.length || 0})</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {(iaFullResult.analysis_context.required_documents || []).map((d: any, i: number) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-[#97A675]">•</span>
                              {typeof d === 'string' ? d : d.type_document || d.nom || JSON.stringify(d)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Documents fournis ({iaFullResult.analysis_context.provided_documents_detected?.length || 0})</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {(iaFullResult.analysis_context.provided_documents_detected || []).map((d: any, i: number) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-[#00738C]">•</span>
                              <span>{d.nom || d.type_document || `Doc #${d.id_document}`}</span>
                              {d.type_document && <Badge tone="neutral">{d.type_document}</Badge>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
