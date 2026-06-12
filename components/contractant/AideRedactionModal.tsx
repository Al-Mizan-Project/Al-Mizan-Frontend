'use client';

import { useRef, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface AlerteCritique {
  id: string;
  type: string;
  niveau: 'critique' | 'attention' | 'info';
  extrait: string;
  article_loi: string;
  message: string;
  suggestion: string;
}

interface AnalyseSection {
  section: string;
  statut: 'present_conforme' | 'present_attention' | 'present_non_conforme' | 'absent';
  commentaire: string;
}

interface SuggestionAmelioration {
  priorite: 'haute' | 'moyenne' | 'faible';
  titre: string;
  description: string;
}

interface AideRedactionResponse {
  score_conformite: number;
  resume_general: string;
  alertes_critiques: AlerteCritique[];
  analyse_sections: AnalyseSection[];
  suggestions_amelioration: SuggestionAmelioration[];
  needs_human_validation: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TYPES_PROCEDURE = [
  'appel_offres_ouvert',
  'appel_offres_restreint',
  'gre_a_gre',
  'consultation',
  'concours',
];

const TYPES_PRESTATION = [
  'travaux',
  'fournitures',
  'services',
  'etudes',
];

const SECTION_LABELS: Record<string, string> = {
  objet_marche: 'Objet du marché',
  specifications_techniques: 'Spécifications techniques',
  criteres_eligibilite: "Critères d'éligibilité",
  criteres_evaluation: "Critères d'évaluation",
  conditions_execution: "Conditions d'exécution",
  clauses_administratives: 'Clauses administratives',
  protection_donnees: 'Protection des données',
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  present_conforme:     { label: 'Conforme',      color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  present_attention:    { label: 'À vérifier',     color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  present_non_conforme: { label: 'Non conforme',    color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
  absent:               { label: 'Absent',          color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' },
};

const NIVEAU_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critique:  { label: 'Critique',  color: '#991B1B', bg: '#FEF2F2', border: '#FCA5A5' },
  attention: { label: 'Attention', color: '#92400E', bg: '#FFFBEB', border: '#FCD34D' },
  info:      { label: 'Info',      color: '#1E40AF', bg: '#EFF6FF', border: '#93C5FD' },
};

const PRIORITE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  haute:   { label: 'Haute',   color: '#991B1B', bg: '#FEF2F2' },
  moyenne: { label: 'Moyenne', color: '#92400E', bg: '#FFFBEB' },
  faible:  { label: 'Faible',  color: '#065F46', bg: '#D1FAE5' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <svg width="88" height="88" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="48" y="54" textAnchor="middle" fontSize="22" fontWeight="600" fill={color}>{score}</text>
    </svg>
  );
}

// ── Modal component ──────────────────────────────────────────────────────────

interface AideRedactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Base URL of the IA backend */
  apiBaseUrl?: string;
}

export default function AideRedactionModal({
  isOpen,
  onClose,
  apiBaseUrl = 'http://localhost:8080',
}: AideRedactionModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [typeProcedure, setTypeProcedure]     = useState('');
  const [typePrestation, setTypePrestation]   = useState('');
  const [montant, setMontant]                 = useState('');
  const [wilaya, setWilaya]                   = useState('');
  const [poidsTech, setPoidsTech]             = useState(50);
  const [poidsFin, setPoidsFin]               = useState(50);
  const [qualifCat, setQualifCat]             = useState('');
  const [minExp, setMinExp]                   = useState(0);
  const [minRevenu, setMinRevenu]             = useState(0);
  const [docsAdmin, setDocsAdmin]             = useState('');
  const [docsTech, setDocsTech]               = useState('');
  const [fichier, setFichier]                 = useState<File | null>(null);

  // UI state
  const [step, setStep]         = useState<'form' | 'loading' | 'result'>('form');
  const [error, setError]       = useState('');
  const [result, setResult]     = useState<AideRedactionResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'alertes' | 'sections' | 'suggestions'>('alertes');

  if (!isOpen) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handlePoidsTech(v: number) {
    setPoidsTech(v);
    setPoidsFin(100 - v);
  }

  async function handleSubmit() {
    if (!typeProcedure || !typePrestation || !fichier) {
      setError('Veuillez remplir les champs obligatoires et joindre le fichier CDC.');
      return;
    }
    setError('');
    setStep('loading');

    const fd = new FormData();
    fd.append('type_procedure', typeProcedure);
    fd.append('type_prestation', typePrestation);
    if (montant) fd.append('montant_estime', montant);
    fd.append('wilaya', wilaya);
    fd.append('poids_technique', String(poidsTech));
    fd.append('poids_financier', String(poidsFin));
    fd.append('qualification_category', qualifCat);
    fd.append('minimum_experience_years', String(minExp));
    fd.append('minimum_revenue_da', String(minRevenu));
    docsAdmin.split('\n').filter(Boolean).forEach(d => fd.append('required_docs_admin', d.trim()));
    docsTech.split('\n').filter(Boolean).forEach(d => fd.append('required_docs_tech', d.trim()));
    fd.append('fichier_cdc', fichier);

    try {
      const res = await fetch(`${apiBaseUrl}/aide-redaction/`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Erreur ${res.status}: ${body}`);
      }
      const data: AideRedactionResponse = await res.json();
      setResult(data);
      setStep('result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
      setStep('form');
    }
  }

  function handleReset() {
    setStep('form');
    setResult(null);
    setError('');
    setFichier(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E5E7EB',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: '#E6F4F1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: '#111827' }}>
                Aide IA — Analyse CDC
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', marginTop: '1px' }}>
                Vérification de conformité du cahier des charges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9CA3AF', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4B5563'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

          {/* ── FORM ── */}
          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: '8px',
                  background: '#FEF2F2', border: '1px solid #FCA5A5',
                  fontSize: '13px', color: '#991B1B', fontWeight: 500
                }}>
                  {error}
                </div>
              )}

              {/* Required fields */}
              <div>
                <p style={sectionTitleStyle}>Champs obligatoires</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Type de procédure *</label>
                    <select value={typeProcedure} onChange={e => setTypeProcedure(e.target.value)} style={inputStyle}>
                      <option value="">— Sélectionner —</option>
                      {TYPES_PROCEDURE.map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Type de prestation *</label>
                    <select value={typePrestation} onChange={e => setTypePrestation(e.target.value)} style={inputStyle}>
                      <option value="">— Sélectionner —</option>
                      {TYPES_PRESTATION.map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label style={labelStyle}>Fichier CDC (PDF) *</label>
                <div
                  style={{
                    border: `2px dashed ${fichier ? '#10B981' : '#D1D5DB'}`,
                    borderRadius: '10px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: fichier ? '#F0FDF4' : '#FAFAFA',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => setFichier(e.target.files?.[0] ?? null)}
                  />
                  {fichier ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      <span style={{ fontSize: '14px', color: '#065F46', fontWeight: 600 }}>{fichier.name}</span>
                    </div>
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', fontWeight: 500 }}>
                        Cliquez pour importer le fichier PDF du CDC
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Optional fields */}
              <div>
                <p style={sectionTitleStyle}>Informations complémentaires</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Montant estimé (DA)</label>
                    <input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="Ex. 5000000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Wilaya</label>
                    <input type="text" value={wilaya} onChange={e => setWilaya(e.target.value)} placeholder="Ex. Alger" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Catégorie qualification</label>
                    <input type="text" value={qualifCat} onChange={e => setQualifCat(e.target.value)} placeholder="Ex. Bâtiment" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Expérience minimum (années)</label>
                    <input type="number" min={0} value={minExp} onChange={e => setMinExp(Number(e.target.value))} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Poids */}
              <div>
                <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pondération technique / financière</span>
                  <span style={{ fontWeight: 600, color: '#00738C' }}>{poidsTech}% / {poidsFin}%</span>
                </label>
                <input
                  type="range" min={0} max={100} step={5}
                  value={poidsTech}
                  onChange={e => handlePoidsTech(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#00738C', marginTop: '4px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                  <span>100% Financier</span>
                  <span>100% Technique</span>
                </div>
              </div>

              {/* Documents */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Documents admin requis (un par ligne)</label>
                  <textarea
                    value={docsAdmin}
                    onChange={e => setDocsAdmin(e.target.value)}
                    placeholder={'Extrait de rôle\nStatut juridique\n...'}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Documents techniques requis (un par ligne)</label>
                  <textarea
                    value={docsTech}
                    onChange={e => setDocsTech(e.target.value)}
                    placeholder={'Attestation de qualification\nRéférences similaires\n...'}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── LOADING ── */}
          {step === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: '16px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid #E5E7EB',
                borderTopColor: '#00738C',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', fontWeight: 500 }}>
                Analyse du document en cours…
              </p>
            </div>
          )}

          {/* ── RESULT ── */}
          {step === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Score + résumé */}
              <div style={{
                display: 'flex', gap: '20px', alignItems: 'center',
                padding: '20px',
                background: '#FAFAFA',
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
              }}>
                <ScoreRing score={result.score_conformite} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Score de conformité
                  </p>
                  <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
                    {result.resume_general}
                  </p>
                  {result.needs_human_validation && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '6px',
                      background: '#FEF3C7', color: '#92400E', fontSize: '12px', fontWeight: 600,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Validation humaine recommandée
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #E5E7EB' }}>
                {(['alertes', 'sections', 'suggestions'] as const).map(tab => {
                  const labels = {
                    alertes: `Alertes (${result.alertes_critiques.length})`,
                    sections: 'Analyse par section',
                    suggestions: `Suggestions (${result.suggestions_amelioration.length})`
                  };
                  const isSelected = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '10px 4px', fontSize: '14px', fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#00738C' : '#6B7280',
                        borderBottom: isSelected ? '2px solid #00738C' : '2px solid transparent',
                        marginBottom: '-1px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Tab: Alertes */}
              {activeTab === 'alertes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.alertes_critiques.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '32px 0' }}>
                      Aucune alerte détectée. Le document respecte les critères fondamentaux.
                    </p>
                  ) : result.alertes_critiques.map(a => {
                    const cfg = NIVEAU_CONFIG[a.niveau];
                    return (
                      <div key={a.id} style={{
                        borderRadius: '8px', border: `1px solid ${cfg.border}`,
                        background: cfg.bg, padding: '14px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                            background: '#ffffff', color: cfg.color, border: `1px solid ${cfg.border}`
                          }}>{cfg.label}</span>
                          <span style={{ fontSize: '12px', color: cfg.color, fontWeight: 600 }}>{a.article_loi}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '11px', color: cfg.color, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{a.type.replace(/_/g, ' ')}</span>
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>{a.message}</p>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#4B5563', lineHeight: 1.4, background: 'rgba(255,255,255,0.5)', padding: '6px 10px', borderRadius: '4px' }}>
                          <span style={{ fontWeight: 500, color: '#374151' }}>Extrait :</span> <em>"{a.extrait}"</em>
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', color: cfg.color, fontWeight: 500 }}>
                          💡 {a.suggestion}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Sections */}
              {activeTab === 'sections' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.analyse_sections.map(s => {
                    const cfg = STATUT_CONFIG[s.statut];
                    return (
                      <div key={s.section} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '14px', borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #E5E7EB',
                      }}>
                        <div style={{
                          marginTop: '5px', width: 8, height: 8, borderRadius: '50%',
                          background: cfg.dot, flexShrink: 0,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                              {SECTION_LABELS[s.section] ?? s.section}
                            </span>
                            <span style={{
                              padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                              background: cfg.bg, color: cfg.color,
                            }}>{cfg.label}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.4 }}>
                            {s.commentaire}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Suggestions */}
              {activeTab === 'suggestions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.suggestions_amelioration.map((s, i) => {
                    const cfg = PRIORITE_CONFIG[s.priorite];
                    return (
                      <div key={i} style={{
                        padding: '14px', borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #E5E7EB',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                            background: cfg.bg, color: cfg.color,
                          }}>{cfg.label}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                            {s.titre}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.4 }}>
                          {s.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #F3F4F6',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          flexShrink: 0,
          background: '#FAFAFA'
        }}>
          {step === 'result' ? (
            <>
              <button onClick={handleReset} style={btnSecondaryStyle}>
                Nouvelle analyse
              </button>
              <button onClick={onClose} style={btnPrimaryStyle}>
                Fermer
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={btnSecondaryStyle} disabled={step === 'loading'}>
                Annuler
              </button>
              <button onClick={handleSubmit} style={btnPrimaryStyle} disabled={step === 'loading'}>
                {step === 'loading' ? 'Analyse en cours…' : 'Analyser le CDC'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Style helpers ────────────────────────────────────────────────────────────

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#9CA3AF',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  background: '#ffffff',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: '#4B5563',
  marginBottom: '6px',
  fontWeight: 500,
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #0F6E56, #00738C)',
  color: '#ffffff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  background: '#ffffff',
  color: '#374151',
  cursor: 'pointer',
};