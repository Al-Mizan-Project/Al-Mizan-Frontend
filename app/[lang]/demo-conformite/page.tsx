'use client';

import { useState, useEffect } from 'react';
import './demo-conformite.css';

/* ───── Types ───── */
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

interface LogEntry {
  ts: string;
  type: 'info' | 'success' | 'error' | 'request' | 'response';
  msg: string;
}

type Step = 'select' | 'details' | 'analysis' | 'results';

/* ───── API helpers (use the existing proxy) ───── */
function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('authToken') || ''
      : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
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

/* ───── Component ───── */
export default function DemoConformitePage() {
  const [step, setStep] = useState<Step>('select');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [appels, setAppels] = useState<AppelOffre[]>([]);
  const [selectedAppel, setSelectedAppel] = useState<AppelOffre | null>(null);
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [selectedSoum, setSelectedSoum] = useState<Soumission | null>(null);
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaFullResult, setIaFullResult] = useState<IAFullResult | null>(null);
  const [iaStatus, setIaStatus] = useState<string | null>(null);
  const [loadingAppels, setLoadingAppels] = useState(false);
  const [loadingSoum, setLoadingSoum] = useState(false);

  const log = (type: LogEntry['type'], msg: string) =>
    setLogs((p) => [{ ts: new Date().toLocaleTimeString(), type, msg }, ...p]);

  /* 1 — Load Appels d'offres */
  useEffect(() => {
    (async () => {
      setLoadingAppels(true);
      log('info', 'Chargement des appels d\'offres…');
      try {
        log('request', 'GET /api/proxy/appels?path=appels-offres');
        const raw = await apiFetch<unknown>('/api/proxy/appels?path=appels-offres');
        const list = resolveList<AppelOffre>(raw);
        setAppels(list);
        log('success', `${list.length} appel(s) d'offres chargé(s)`);
      } catch (e: any) {
        log('error', `Erreur chargement appels: ${e.message}`);
      } finally {
        setLoadingAppels(false);
      }
    })();
  }, []);

  /* 2 — Load soumissions for selected appel */
  const loadSoumissions = async (appel: AppelOffre) => {
    setSelectedAppel(appel);
    setSoumissions([]);
    setSelectedSoum(null);
    setDocs([]);
    setIaFullResult(null);
    setIaStatus(null);
    setStep('details');
    setLoadingSoum(true);
    log('info', `Appel sélectionné: ${appel.reference} — ${appel.titre}`);
    try {
      log('request', `GET /api/proxy/soumissions?path=appels-offres/${appel.id_appel_offres}/soumissions`);
      const raw = await apiFetch<unknown>(
        `/api/proxy/soumissions?path=appels-offres/${appel.id_appel_offres}/soumissions`
      );
      const list = resolveList<Soumission>(raw);
      setSoumissions(list);
      log('success', `${list.length} soumission(s) trouvée(s)`);
    } catch (e: any) {
      log('error', `Erreur soumissions: ${e.message}`);
    } finally {
      setLoadingSoum(false);
    }
  };

  /* 3 — Load documents for selected soumission */
  const selectSoumission = async (s: Soumission) => {
    setSelectedSoum(s);
    setDocs([]);
    setIaFullResult(null);
    setIaStatus(s.conformite_statut);
    setStep('analysis');
    log('info', `Soumission #${s.id_soumission} sélectionnée (statut: ${s.statut})`);
    if (s.document_ids?.length) {
      try {
        const idsParam = s.document_ids.join(',');
        log('request', `GET /api/proxy/documents?path=api/documents/search/&ids=${idsParam}`);
        const raw = await apiFetch<unknown>(
          `/api/proxy/documents?path=api/documents/search/&ids=${idsParam}`
        );
        const list = resolveList<DocMeta>(raw);
        setDocs(list);
        log('success', `${list.length} document(s) chargé(s)`);
      } catch (e: any) {
        log('error', `Erreur documents: ${e.message}`);
      }
    } else {
      log('info', 'Aucun document associé à cette soumission');
    }
  };

  /* 4 — Run IA conformity check */
  const runConformite = async () => {
    if (!selectedSoum || !selectedAppel) return;
    setIaLoading(true);
    setIaFullResult(null);
    setIaStatus(null);
    log('info', '🤖 Lancement de l\'analyse de conformité IA…');
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
      log('request', `POST ${endpoint}`);
      log('info', `Body: ${JSON.stringify(body, null, 2)}`);

      const result = await apiFetch<IAFullResult>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setIaStatus(result.conformite_statut);
      setIaFullResult(result);
      setStep('results');
      log('success', `Résultat IA: ${result.conformite_statut}`);
      if (result.analysis_context?.ocr) {
        log('info', `🔍 OCR: ${result.analysis_context.ocr.processed} traité(s), ${result.analysis_context.ocr.succeeded} réussi(s)`);
      }
      log('response', JSON.stringify(result, null, 2));
    } catch (e: any) {
      log('error', `Erreur IA: ${e.message}`);
    } finally {
      setIaLoading(false);
    }
  };

  /* ───── Render helpers ───── */
  const statusBadge = (s: string | null) => {
    if (!s) return <span className="dc-badge dc-badge--pending">En attente</span>;
    if (s === 'conforme') return <span className="dc-badge dc-badge--ok">✓ Conforme</span>;
    if (s === 'non_conforme') return <span className="dc-badge dc-badge--fail">✕ Non conforme</span>;
    return <span className="dc-badge dc-badge--pending">{s}</span>;
  };

  const stepIndicator = () => (
    <div className="dc-steps">
      {(['select', 'details', 'analysis', 'results'] as Step[]).map((s, i) => (
        <div key={s} className={`dc-step ${step === s ? 'dc-step--active' : ''} ${(['select','details','analysis','results'].indexOf(step) > i) ? 'dc-step--done' : ''}`}>
          <div className="dc-step__num">{i + 1}</div>
          <span className="dc-step__label">
            {['Appels d\'offres', 'Soumissions', 'Analyse IA', 'Résultats'][i]}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="dc-page">
      {/* Header */}
      <header className="dc-header">
        <div className="dc-header__inner">
          <div>
            <h1 className="dc-header__title">
              <span className="dc-header__icon">⚖️</span>
              Analyse de Conformité
            </h1>
            <p className="dc-header__sub">
              Vérification automatisée des documents de soumission par intelligence artificielle
            </p>
          </div>
          <div className="dc-header__brand">AL-MIZAN</div>
        </div>
        {stepIndicator()}
      </header>

      <div className="dc-layout">
        {/* ─── Main panel ─── */}
        <main className="dc-main">
          {/* STEP 1: Appels d'offres */}
          {step === 'select' && (
            <section className="dc-card">
              <h2 className="dc-card__title">
                <span className="dc-card__icon">📋</span>
                Étape 1 — Sélectionner un Appel d'Offres
              </h2>
              <p className="dc-card__desc">
                Choisissez un appel d'offres pour consulter ses soumissions et lancer l'analyse de conformité.
              </p>
              {loadingAppels ? (
                <div className="dc-loader"><div className="dc-spinner" /> Chargement…</div>
              ) : appels.length === 0 ? (
                <div className="dc-empty">Aucun appel d'offres trouvé dans le système.</div>
              ) : (
                <div className="dc-grid">
                  {appels.map((a) => (
                    <button key={a.id_appel_offres} className="dc-ao-card" onClick={() => loadSoumissions(a)}>
                      <div className="dc-ao-card__ref">{a.reference || `AO-${a.id_appel_offres}`}</div>
                      <div className="dc-ao-card__title">{a.titre || 'Sans titre'}</div>
                      <div className="dc-ao-card__meta">
                        <span className={`dc-badge dc-badge--${a.statut === 'publie' ? 'ok' : 'pending'}`}>
                          {a.statut}
                        </span>
                      </div>
                      {a.required_docs_admin?.length > 0 && (
                        <div className="dc-ao-card__docs">
                          {a.required_docs_admin.length + (a.required_docs_tech?.length || 0) + (a.required_docs_fin?.length || 0)} doc(s) requis
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* STEP 2: Soumissions */}
          {step === 'details' && selectedAppel && (
            <section className="dc-card">
              <button className="dc-back" onClick={() => setStep('select')}>← Retour aux appels</button>
              <h2 className="dc-card__title">
                <span className="dc-card__icon">📦</span>
                Étape 2 — Soumissions pour {selectedAppel.reference}
              </h2>

              {/* Required docs summary */}
              <div className="dc-req-docs">
                <h3>Documents requis par le cahier des charges</h3>
                <div className="dc-req-docs__grid">
                  <div className="dc-req-docs__col">
                    <h4>📁 Administratifs</h4>
                    <ul>{(selectedAppel.required_docs_admin || []).map((d, i) => <li key={i}>{d}</li>)}</ul>
                    {!(selectedAppel.required_docs_admin?.length) && <p className="dc-muted">Non spécifié</p>}
                  </div>
                  <div className="dc-req-docs__col">
                    <h4>⚙️ Techniques</h4>
                    <ul>{(selectedAppel.required_docs_tech || []).map((d, i) => <li key={i}>{d}</li>)}</ul>
                    {!(selectedAppel.required_docs_tech?.length) && <p className="dc-muted">Non spécifié</p>}
                  </div>
                  <div className="dc-req-docs__col">
                    <h4>💰 Financiers</h4>
                    <ul>{(selectedAppel.required_docs_fin || []).map((d, i) => <li key={i}>{d}</li>)}</ul>
                    {!(selectedAppel.required_docs_fin?.length) && <p className="dc-muted">Non spécifié</p>}
                  </div>
                </div>
              </div>

              {loadingSoum ? (
                <div className="dc-loader"><div className="dc-spinner" /> Chargement des soumissions…</div>
              ) : soumissions.length === 0 ? (
                <div className="dc-empty">Aucune soumission pour cet appel d'offres.</div>
              ) : (
                <table className="dc-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Soumissionnaire</th>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Documents</th>
                      <th>Conformité</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soumissions.map((s) => (
                      <tr key={s.id_soumission}>
                        <td className="dc-mono">#{s.id_soumission}</td>
                        <td>Opérateur #{s.id_soumissionnaire}</td>
                        <td>{s.date_soumission ? new Date(s.date_soumission).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>{s.montant_financier ? `${Number(s.montant_financier).toLocaleString('fr-FR')} DA` : '—'}</td>
                        <td>{s.document_ids?.length || 0} fichier(s)</td>
                        <td>{statusBadge(s.conformite_statut)}</td>
                        <td>
                          <button className="dc-btn dc-btn--sm" onClick={() => selectSoumission(s)}>
                            Analyser →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* STEP 3: Analysis */}
          {(step === 'analysis' || step === 'results') && selectedSoum && selectedAppel && (
            <section className="dc-card">
              <button className="dc-back" onClick={() => setStep('details')}>← Retour aux soumissions</button>
              <h2 className="dc-card__title">
                <span className="dc-card__icon">🤖</span>
                {step === 'analysis' ? 'Étape 3 — Analyse de Conformité IA' : 'Étape 4 — Résultats'}
              </h2>

              {/* Soumission info */}
              <div className="dc-info-grid">
                <div className="dc-info-item">
                  <span className="dc-info-label">Soumission</span>
                  <span className="dc-info-value">#{selectedSoum.id_soumission}</span>
                </div>
                <div className="dc-info-item">
                  <span className="dc-info-label">Appel d'Offres</span>
                  <span className="dc-info-value">{selectedAppel.reference}</span>
                </div>
                <div className="dc-info-item">
                  <span className="dc-info-label">Opérateur</span>
                  <span className="dc-info-value">#{selectedSoum.id_soumissionnaire}</span>
                </div>
                <div className="dc-info-item">
                  <span className="dc-info-label">Statut actuel</span>
                  {statusBadge(iaStatus || selectedSoum.conformite_statut)}
                </div>
              </div>

              {/* Documents */}
              <div className="dc-docs-section">
                <h3>📄 Documents fournis ({docs.length})</h3>
                {docs.length > 0 ? (
                  <div className="dc-docs-list">
                    {docs.map((d) => (
                      <div key={d.id_document} className="dc-doc-item">
                        <div className="dc-doc-icon">📄</div>
                        <div className="dc-doc-info">
                          <span className="dc-doc-name">{d.nom}</span>
                          <span className="dc-doc-type">{d.type_document}</span>
                        </div>
                        <span className={`dc-badge dc-badge--${d.ia_verif_statut === 'verifie' ? 'ok' : 'pending'}`}>
                          {d.ia_verif_statut || 'non vérifié'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dc-muted">Aucun document chargé ou IDs: [{selectedSoum.document_ids?.join(', ')}]</p>
                )}
              </div>

              {/* IA Action */}
              <div className="dc-action-section">
                <div className="dc-action-box">
                  <div className="dc-action-info">
                    <h3>🔬 Vérification automatique de conformité</h3>
                    <p>
                      L'IA va comparer les documents fournis avec les documents requis par le cahier des charges,
                      vérifier la validité des pièces et détecter les anomalies.
                    </p>
                    <div className="dc-endpoint-info">
                      <code>POST /ia/conformite/verifier-soumission-auto/{selectedSoum.id_soumission}</code>
                    </div>
                  </div>
                  <button
                    className="dc-btn dc-btn--primary dc-btn--lg"
                    onClick={runConformite}
                    disabled={iaLoading}
                  >
                    {iaLoading ? (
                      <><div className="dc-spinner dc-spinner--sm" /> Analyse en cours…</>
                    ) : (
                      '🚀 Lancer l\'analyse de conformité'
                    )}
                  </button>
                </div>
              </div>

              {/* Results */}
              {(iaFullResult || iaStatus) && (
                <div className="dc-results">
                  <h3>📊 Résultat de l'analyse</h3>
                  <div className={`dc-result-banner dc-result-banner--${iaStatus === 'CONFORME' ? 'ok' : iaStatus === 'NON_CONFORME' ? 'fail' : 'pending'}`}>
                    <div className="dc-result-banner__icon">
                      {iaStatus === 'CONFORME' ? '✅' : iaStatus === 'NON_CONFORME' ? '❌' : '⏳'}
                    </div>
                    <div>
                      <div className="dc-result-banner__status">{iaStatus || 'Inconnu'}</div>
                      <div className="dc-result-banner__label">Statut de conformité</div>
                    </div>
                  </div>

                  {/* OCR Stats */}
                  {iaFullResult?.analysis_context?.ocr && (
                    <div className="dc-result-detail dc-result-detail--info">
                      <h4>🔍 Traitement OCR / NLP</h4>
                      <div className="dc-ocr-stats">
                        <div className="dc-stat">
                          <span className="dc-stat__value">{iaFullResult.analysis_context.ocr.processed}</span>
                          <span className="dc-stat__label">Documents traités</span>
                        </div>
                        <div className="dc-stat">
                          <span className="dc-stat__value">{iaFullResult.analysis_context.ocr.succeeded}</span>
                          <span className="dc-stat__label">OCR réussis</span>
                        </div>
                        <div className="dc-stat">
                          <span className="dc-stat__value">{iaFullResult.analysis_context?.provided_documents_detected?.length || 0}</span>
                          <span className="dc-stat__label">Documents détectés</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OCR partial failure warning */}
                  {iaFullResult?.analysis_context?.ocr &&
                    iaFullResult.analysis_context.ocr.succeeded < iaFullResult.analysis_context.ocr.processed && (
                    <div className="dc-result-detail dc-result-detail--warn">
                      <h4>⚠️ OCR partiel</h4>
                      <p>
                        {iaFullResult.analysis_context.ocr.processed - iaFullResult.analysis_context.ocr.succeeded} document(s)
                        n'ont pas pu être analysés par OCR. La détection basée sur les métadonnées (nom de fichier) a été utilisée à la place.
                      </p>
                    </div>
                  )}

                  {/* Required vs Provided */}
                  {iaFullResult?.analysis_context && (
                    <div className="dc-result-detail dc-result-detail--info">
                      <h4>📋 Comparaison Documents Requis vs Fournis</h4>
                      <div className="dc-comparison">
                        <div className="dc-comparison__col">
                          <h5>Documents requis ({iaFullResult.analysis_context.required_documents?.length || 0})</h5>
                          <ul>
                            {(iaFullResult.analysis_context.required_documents || []).map((d: any, i: number) => (
                              <li key={i}>{typeof d === 'string' ? d : d.type_document || d.nom || JSON.stringify(d)}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="dc-comparison__col">
                          <h5>Documents fournis détectés ({iaFullResult.analysis_context.provided_documents_detected?.length || 0})</h5>
                          <ul>
                            {(iaFullResult.analysis_context.provided_documents_detected || []).map((d: any, i: number) => (
                              <li key={i}>
                                <span>{d.nom || d.type_document || `Doc #${d.id_document}`}</span>
                                {d.type_document && <span className="dc-badge dc-badge--pending" style={{marginLeft: 8, fontSize: '0.7em'}}>{d.type_document}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rapport */}
                  {iaFullResult?.conformite_rapport && (
                    <div className={`dc-result-detail dc-result-detail--${iaStatus === 'CONFORME' ? 'success' : 'warn'}`}>
                      <h4>📝 Rapport de conformité</h4>
                      <pre style={{whiteSpace: 'pre-wrap', fontSize: '0.85em'}}>
                        {typeof iaFullResult.conformite_rapport === 'string'
                          ? iaFullResult.conformite_rapport
                          : JSON.stringify(iaFullResult.conformite_rapport, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Next action */}
                  {iaFullResult?.next_action && (
                    <div className="dc-result-detail dc-result-detail--info">
                      <h4>➡️ Prochaine étape</h4>
                      <p style={{fontWeight: 600, fontSize: '1.05em'}}>
                        {iaFullResult.next_action === 'EVALUATION_TECHNIQUE'
                          ? '✅ Passer à l\'évaluation technique'
                          : '⚠️ Validation humaine requise'}
                      </p>
                    </div>
                  )}

                  {iaStatus === 'CONFORME' && (
                    <div className="dc-result-detail dc-result-detail--success">
                      <h4>✅ Tous les documents sont conformes</h4>
                      <p>La soumission respecte les exigences du cahier des charges.</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </main>

        {/* ─── Log panel ─── */}
        <aside className="dc-logs">
          <div className="dc-logs__header">
            <h3>📡 Journal des requêtes API</h3>
            <button className="dc-btn dc-btn--xs" onClick={() => setLogs([])}>Vider</button>
          </div>
          <div className="dc-logs__body">
            {logs.length === 0 && <p className="dc-muted">Aucune activité…</p>}
            {logs.map((l, i) => (
              <div key={i} className={`dc-log dc-log--${l.type}`}>
                <span className="dc-log__time">{l.ts}</span>
                <span className="dc-log__badge">
                  {l.type === 'request' ? '→' : l.type === 'response' ? '←' : l.type === 'error' ? '✕' : l.type === 'success' ? '✓' : 'ℹ'}
                </span>
                <span className="dc-log__msg">{l.msg}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
