'use client';

import { useState, useCallback } from 'react';
import {
  iaApi,
  type AnomalieIA,
  type SaucissonnageSummary,
  type NiveauSeverite,
  type NiveauRisque,
  type StatutExamen,
} from '@/lib/api/ia';

const SEVERITE_STYLE: Record<NiveauSeverite, { bg: string; text: string; dot: string; border: string }> = {
  CRITIQUE: { bg: 'bg-red-50', text: 'text-red-900', dot: 'bg-red-600', border: 'border-red-300' },
  ELEVEE: { bg: 'bg-gray-50', text: 'text-gray-900', dot: 'bg-gray-600', border: 'border-gray-300' },
  MOYEN: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', border: 'border-gray-200' },
  FAIBLE: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-300', border: 'border-gray-200' },
};

const RISQUE_STYLE: Record<NiveauRisque, { border: string; bg: string; text: string; badge: string; icon: string }> = {
  CRITIQUE: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-900', badge: 'bg-red-600 text-white', icon: '⚠' },
  ELEVE: { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-900', badge: 'bg-gray-700 text-white', icon: '●' },
  MOYEN: { border: 'border-gray-200', bg: 'bg-white', text: 'text-gray-700', badge: 'bg-gray-600 text-white', icon: '○' },
  FAIBLE: { border: 'border-gray-200', bg: 'bg-white', text: 'text-gray-600', badge: 'bg-gray-500 text-white', icon: '·' },
  AUCUN: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-900', badge: 'bg-green-600 text-white', icon: '✓' },
};

const TYPE_LABEL: Record<string, { label: string; desc: string; color: string }> = {
  SAUCISSONNAGE_PROXIMITE_SEUIL: { label: 'Proximité de seuil', desc: 'Montant proche du seuil légal (85%-100%)', color: 'text-gray-700 bg-white border-gray-200' },
  SAUCISSONNAGE_TEMPOREL: { label: 'Clustering temporel', desc: 'Plusieurs marchés similaires publiés rapidement (< 90 jours)', color: 'text-gray-700 bg-white border-gray-200' },
  SAUCISSONNAGE_CUMUL_SEUIL: { label: 'Cumul dépassant seuil', desc: 'La somme dépasse le seuil, mais chaque marché reste en dessous', color: 'text-gray-700 bg-white border-gray-200' },
  SAUCISSONNAGE_MEME_FOURNISSEUR: { label: 'Même fournisseur', desc: 'Un opérateur remporte plusieurs marchés du même acheteur (≥3)', color: 'text-gray-700 bg-white border-gray-200' },
};

const STATUT_LABEL: Record<StatutExamen, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  REJETE: 'Rejeté',
};

const STATUT_STYLE: Record<StatutExamen, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-600',
  CONFIRME: 'bg-red-100 text-red-700',
  REJETE: 'bg-green-100 text-green-700',
};

const TEST_CASES = [
  { id: 1, label: 'SC#1 — Saucissonnage CRITIQUE', desc: '3 marchés fournitures, cumul > 12M DA' },
  { id: 2, label: 'SC#2 — Proximité de seuil', desc: '1 marché travaux à 84% du seuil 25M DA' },
  { id: 3, label: 'SC#3 — Aucune anomalie', desc: 'Marché conforme, montant > seuil normal' },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#DC2626' : score >= 50 ? '#6B7280' : '#10B981';
  const label = score >= 80 ? 'Critique' : score >= 50 ? 'Modéré' : 'Faible';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#F3F4F6" strokeWidth="8" />
          <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 251} 251`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </div>
  );
}

function LegendCard({ type, count, total }: { type: string; count: number; total: number }) {
  const info = TYPE_LABEL[type] ?? { label: type, desc: '', color: 'text-gray-700 bg-white border-gray-200' };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-lg font-bold text-gray-700">{count}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-1">{info.label}</p>
        <p className="text-xs text-gray-600 leading-relaxed">{info.desc}</p>
      </div>
    </div>
  );
}

function SummaryPanel({ summary }: { summary: SaucissonnageSummary }) {
  const style = RISQUE_STYLE[summary.niveau_risque] ?? RISQUE_STYLE['AUCUN'];
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-6">
      {/* Header with Risk Level */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Résultat de l'analyse</h3>
          <p className="text-sm text-gray-600 mt-1">
            {summary.appels_analyses} appels analysés · {summary.appels_affectes} appels suspects
          </p>
        </div>
        <span className={`text-sm font-semibold px-4 py-2 rounded-lg ${style.badge}`}>
          Risque {summary.niveau_risque}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-900">{summary.total_anomalies}</p>
          <p className="text-sm text-gray-600 mt-1">Anomalies détectées</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold text-gray-900">{summary.appels_analyses}</p>
          <p className="text-sm text-gray-600 mt-1">Appels analysés</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-3xl font-bold" style={{ color: summary.appels_affectes > 0 ? '#DC2626' : '#10B981' }}>
            {summary.appels_affectes}
          </p>
          <p className="text-sm text-gray-600 mt-1">Appels affectés</p>
        </div>
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
          <ScoreGauge score={summary.score_risque_saucissonnage} />
        </div>
      </div>

      {/* Signal Types */}
      {Object.keys(summary.repartition_par_type).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Types de signaux détectés</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(summary.repartition_par_type).map(([type, count]) => (
              <LegendCard key={type} type={type} count={count} total={summary.total_anomalies} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="rounded-lg border-l-4 bg-gray-50 p-4" style={{ borderLeftColor: summary.niveau_risque === 'CRITIQUE' ? '#DC2626' : '#6B7280' }}>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Recommandation</p>
        <p className="text-sm text-gray-700 leading-relaxed">{summary.recommandation}</p>
      </div>
    </div>
  );
}

function AnomalieRow({ anomalie, onStatutChange }: { anomalie: AnomalieIA; onStatutChange: (id: number, statut: StatutExamen) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleStatut = async (statut: StatutExamen) => {
    setUpdating(true);
    try {
      await iaApi.patchStatutExamen(anomalie.id_detection_anomalie_ia, statut);
      onStatutChange(anomalie.id_detection_anomalie_ia, statut);
    } catch {
      // retry possible
    } finally {
      setUpdating(false);
    }
  };

  const isCritique = anomalie.niveau_severite === 'CRITIQUE';
  const typeInfo = TYPE_LABEL[anomalie.type_anomalie] ?? { label: anomalie.type_anomalie, desc: '' };

  return (
    <div className={`rounded-lg border p-4 ${isCritique ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isCritique && <span className="text-sm font-bold text-red-600">● CRITIQUE</span>}
            <span className="text-sm font-semibold text-gray-900">{typeInfo.label}</span>
          </div>
          <p className="text-xs text-gray-600">
            Appel d'offres #{anomalie.id_appel_offre} · Confiance: {Math.round(parseFloat(anomalie.score_confiance) * 100)}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUT_STYLE[anomalie.statut_examen]}`}>
            {STATUT_LABEL[anomalie.statut_examen]}
          </span>
          {anomalie.statut_examen === 'EN_ATTENTE' && (
            <>
              <button disabled={updating} onClick={() => handleStatut('CONFIRME')}
                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50">
                Confirmer fraude
              </button>
              <button disabled={updating} onClick={() => handleStatut('REJETE')}
                className="text-xs px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors disabled:opacity-50">
                Faux positif
              </button>
            </>
          )}
        </div>
      </div>
      <button onClick={() => setExpanded(e => !e)} className="text-xs text-gray-600 hover:text-gray-900 font-medium">
        {expanded ? '− Masquer les détails' : '+ Voir les détails'}
      </button>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">{anomalie.details}</p>
          {anomalie.appels_impliques && anomalie.appels_impliques.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-600">Appels concernés:</span>
              {anomalie.appels_impliques.map((id, idx) => (
                <span key={`${id}-${idx}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded font-mono">#{id}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InitialState({ onQuickTest }: { onQuickTest: (id: number) => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg mx-auto mb-4 flex items-center justify-center bg-gray-100">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Détecter le saucissonnage de marchés</h3>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            Analysez les appels d'offres d'un service contractant pour identifier 4 types de fractionnement artificiel contraires à la Loi 23-12.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">Les 4 signaux détectés</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(TYPE_LABEL).map(([key, info]) => (
              <div key={key} className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-gray-900 mb-1">{info.label}</p>
                <p className="text-xs text-gray-600">{info.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Tester avec des exemples</p>
          <div className="space-y-2">
            {TEST_CASES.map(tc => (
              <button key={tc.id} onClick={() => onQuickTest(tc.id)}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{tc.label}</p>
                  <p className="text-xs text-gray-600 mt-1">{tc.desc}</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" className="flex-shrink-0 ml-3">
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CleanState() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <p className="text-lg font-bold text-gray-900 mb-2">Aucune anomalie détectée</p>
      <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
        Ce service contractant ne présente aucun signe de fractionnement artificiel de marchés. Les appels d'offres sont conformes à la réglementation.
      </p>
    </div>
  );
}

export default function SaucissonnageView() {
  const [idSC, setIdSC] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SaucissonnageSummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalieIA[]>([]);
  const [filterSev, setFilterSev] = useState<string>('TOUS');
  const [hasRun, setHasRun] = useState(false);

  const runDetection = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setAnomalies([]);
    setHasRun(false);
    setFilterSev('TOUS');
    try {
      const res = await iaApi.detecterSaucissonnageAuto(id, {
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined,
      });
      setSummary(res.summary);
      setAnomalies(res.items);
      setHasRun(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue lors de la détection');
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]);

  const handleDetect = useCallback(async () => {
    const id = parseInt(idSC, 10);
    if (!id || id <= 0) {
      setError('Veuillez entrer un identifiant de service contractant valide (nombre entier > 0).');
      return;
    }
    await runDetection(id);
  }, [idSC, runDetection]);

  const handleQuickTest = useCallback((id: number) => {
    setIdSC(String(id));
    runDetection(id);
  }, [runDetection]);

  const handleStatutChange = useCallback((id: number, statut: StatutExamen) => {
    setAnomalies(prev =>
      prev.map(a => a.id_detection_anomalie_ia === id ? { ...a, statut_examen: statut } : a)
    );
  }, []);

  const filtered = filterSev === 'TOUS' ? anomalies : anomalies.filter(a => a.niveau_severite === filterSev);
  const critCount = anomalies.filter(a => a.niveau_severite === 'CRITIQUE').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Form Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Détection du saucissonnage</h2>
          <p className="text-sm text-gray-600">
            Analysez un service contractant pour détecter les fractionnements artificiels de marchés (Article 7, Loi 23-12)
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700">ID Service Contractant *</label>
            <input type="number" min={1} value={idSC} onChange={e => setIdSC(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDetect()} placeholder="Ex: 1"
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Date début (optionnel)</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Date fin (optionnel)</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <button onClick={handleDetect} disabled={loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
          </button>
          {hasRun && (
            <button onClick={() => { setSummary(null); setAnomalies([]); setHasRun(false); setIdSC(''); setError(null); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              Réinitialiser
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm text-red-900">{error}</p>
          </div>
        )}

        {hasRun && critCount > 0 && (
          <div className="mt-4 flex items-center gap-3 p-4 bg-red-600 text-white rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-sm font-medium">
              {critCount} anomalie{critCount > 1 ? 's' : ''} critique{critCount > 1 ? 's' : ''} détectée{critCount > 1 ? 's' : ''} — Violation probable de l'Article 7
            </p>
          </div>
        )}
      </div>
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-gray-300 border-t-gray-900 animate-spin" />
          <p className="text-sm font-medium text-gray-900 mb-2">Analyse en cours...</p>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Calcul des similarités, clustering des marchés, vérification des seuils réglementaires
          </p>
        </div>
      )}

      {!loading && !hasRun && !error && <InitialState onQuickTest={handleQuickTest} />}
      {!loading && summary && <SummaryPanel summary={summary} />}
      {!loading && hasRun && anomalies.length === 0 && <CleanState />}

      {!loading && anomalies.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Anomalies détectées ({filtered.length}/{anomalies.length})
            </h3>
            <div className="flex gap-2">
              {(['TOUS', 'CRITIQUE', 'ELEVEE', 'MOYEN', 'FAIBLE'] as const).map(sev => {
                const count = sev === 'TOUS' ? anomalies.length : anomalies.filter(a => a.niveau_severite === sev).length;
                if (sev !== 'TOUS' && count === 0) return null;
                return (
                  <button key={sev} onClick={() => setFilterSev(sev)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      filterSev === sev ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {sev === 'TOUS' ? `Tous (${count})` : `${sev} (${count})`}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Aucune anomalie pour ce filtre.</p>
            ) : (
              filtered.map((a, idx) => (
                <AnomalieRow 
                  key={`${a.id_detection_anomalie_ia}-${idx}`} 
                  anomalie={a} 
                  onStatutChange={handleStatutChange} 
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
