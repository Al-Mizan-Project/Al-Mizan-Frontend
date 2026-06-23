'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuthToken } from '@/lib/api/client';

const SEVERITY_COLORS: Record<string, string> = {
  ERROR: 'bg-red-100 border-red-300 text-red-800',
  WARNING: 'bg-amber-100 border-amber-300 text-amber-800',
};

const TYPE_LABELS: Record<string, string> = {
  MONTANT_FINANCIER_MANQUANT: 'Montant financier manquant',
  MONTANT_INVALID: 'Montant invalide',
  MONTANT_TROP_ELEVE: 'Montant trop élevé',
  MONTANT_TROP_BAS: 'Montant trop bas',
  SOUMISSION_HORS_DELAI: 'Soumission hors délai',
  PRIX_ANORMALEMENT_BAS: 'Prix anormalement bas',
  PRIX_ANORMALEMENT_ELEVE: 'Prix anormalement élevé',
  DISPERSION_ANORMALE: 'Dispersion anormale des prix',
  ROTATION_SOUMISSIONNAIRES: 'Rotation des soumissionnaires',
};

interface Anomaly {
  id_anomalie_ia?: number;
  type_anomalie: string;
  niveau_severite: string;
  score_confiance: number;
  details: string;
  statut_examen: string;
  date_detection?: string;
}

interface TraceEntry {
  agent: string;
  action: string;
  details?: string;
}

export default function AnomaliesTab({ soumissionId, appelOffreId }: { soumissionId?: number; appelOffreId?: number }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const fetchAnomalies = useCallback(async () => {
    if (!soumissionId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/proxy/ia?path=ia/anomalies/soumission/${soumissionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setAnomalies(data.anomalies || []);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [soumissionId]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleDetect = async () => {
    if (!soumissionId || !appelOffreId) return;
    setDetecting(true);
    setError(null);
    setTrace([]);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/proxy/ia?path=ia/anomalies/detecter-multi-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id_soumission: soumissionId,
          id_appel_offre: appelOffreId,
          trace: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(err.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      const newAnomalies = data.anomalies_persistees || data.anomalies || [];
      if (newAnomalies.length > 0) {
        setAnomalies(prev => [...newAnomalies, ...prev]);
      }
      const journal = data.trace_collaboration?.journal;
      if (journal) {
        setTrace(journal.map((e: any) => ({
          agent: e.from,
          action: `${e.direction === 'send' ? '→' : '←'} ${e.to} (${e.type})`,
          details: e.payload_summary,
        })));
        setShowTrace(true);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de détection');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Détection d&apos;anomalies par agents IA</h3>
        <button
          onClick={handleDetect}
          disabled={detecting || !soumissionId || !appelOffreId}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}
        >
          {detecting ? 'Analyse en cours...' : 'Lancer la détection multi-agents'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-400">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          Chargement des anomalies...
        </div>
      )}

      {!loading && anomalies.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">Aucune anomalie détectée</p>
          <p className="text-sm mt-1">Cliquez sur &quot;Lancer la détection multi-agents&quot; pour analyser cette soumission</p>
        </div>
      )}

      {anomalies.length > 0 && (
        <div className="flex flex-col gap-3">
          {anomalies.map((a) => (
            <div
              key={a.id_anomalie_ia || Math.random()}
              className={`rounded-xl border p-4 ${SEVERITY_COLORS[a.niveau_severite] || 'bg-gray-50 border-gray-200 text-gray-700'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold">{TYPE_LABELS[a.type_anomalie] || a.type_anomalie}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      a.statut_examen === 'VALIDE' ? 'bg-green-200 text-green-800' :
                      a.statut_examen === 'REJETE' ? 'bg-gray-200 text-gray-600' :
                      a.statut_examen === 'EN_COURS' ? 'bg-blue-200 text-blue-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {a.statut_examen === 'EN_ATTENTE' ? 'En attente' :
                       a.statut_examen === 'EN_COURS' ? 'En cours' :
                       a.statut_examen === 'VALIDE' ? 'Validé' :
                       a.statut_examen === 'REJETE' ? 'Rejeté' : a.statut_examen}
                    </span>
                  </div>
                  <p className="text-sm opacity-80">{a.details}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs opacity-60">
                    <span>Confiance: {(a.score_confiance * 100).toFixed(0)}%</span>
                    {a.date_detection && <span>Détecté le: {new Date(a.date_detection).toLocaleDateString('fr-FR')}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {trace.length > 0 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-bold text-sm text-gray-700">Trace de collaboration des agents ({trace.length} échanges)</span>
            </div>
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${showTrace ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTrace && (
            <div className="p-4 space-y-1.5 bg-white border-t border-gray-100">
              {trace.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white ${
                    entry.action.includes('→') ? 'bg-blue-500' :
                    entry.action.includes('←') ? 'bg-green-500' :
                    'bg-gray-500'
                  }`}>
                    {entry.agent}
                  </span>
                  <span className="text-gray-700">{entry.action}</span>
                  {entry.details && <span className="text-gray-400 text-xs">{entry.details}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
