'use client';

import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

export default function RapportCTTab({ dossier }: { dossier: Dossier }) {
  const { state } = useEvaluation();
  const rapport = (state as any)?.rapport_ct ?? null;
  const entries: any[] = state?.registre?.entries ?? [];

  if (!rapport) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">📋</div>
        <p className="text-sm font-semibold text-gray-600">Rapport CT non encore soumis</p>
        <p className="text-xs text-gray-400">Le Comité Technique n'a pas encore remis son rapport d'analyse à la COPEO.</p>
      </div>
    );
  }

  if (!rapport.submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">⏳</div>
        <p className="text-sm font-semibold text-gray-600">Rapport CT en cours de rédaction</p>
        <p className="text-xs text-gray-400">Le Comité Technique a démarré son rapport mais ne l'a pas encore soumis.</p>
      </div>
    );
  }

  const avisColor = rapport.avis_global === 'favorable' ? 'emerald'
    : rapport.avis_global === 'reserve' ? 'amber' : 'red';

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        <strong>Lecture seule.</strong> Ce rapport a été produit par le Comité Technique. Il est fourni à titre d'analyse — la COPEO évalue collectivement et de façon indépendante.
      </div>

      {/* Avis global banner */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border font-semibold text-sm ${
        avisColor === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
        avisColor === 'amber'   ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                  'bg-red-50 border-red-200 text-red-700'
      }`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {avisColor === 'emerald'
            ? <polyline points="20 6 9 17 4 12"/>
            : avisColor === 'amber'
              ? <><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/></>
              : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
          }
        </svg>
        Avis CT : {rapport.avis_global === 'favorable' ? 'Favorable'
          : rapport.avis_global === 'reserve' ? 'Avec réserves' : 'Défavorable'}
        {rapport.submitted_at && (
          <span className="ml-auto text-xs font-normal opacity-70">
            Soumis le {new Date(rapport.submitted_at).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {/* Soumissions covered */}
      {entries.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Soumissions analysées par le CT
          </p>
          {entries.map((e: any) => (
            <div key={e.id_soumission}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm font-semibold text-gray-700">{e.nom_oe}</span>
              <span className="text-xs text-gray-400">Soumission #{e.id_soumission}</span>
            </div>
          ))}
        </div>
      )}

      {/* Report content */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Méthodologie d'exécution
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{rapport.methodologie || '—'}</p>
        </div>

        <div className="border-t border-gray-50 pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Équipe proposée
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{rapport.equipe || '—'}</p>
        </div>

        <div className="border-t border-gray-50 pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Moyens matériels
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{rapport.materiels || '—'}</p>
        </div>

        {rapport.anomalies ? (
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
              ⚠ Anomalies relevées
            </p>
            <p className="text-sm text-amber-700 whitespace-pre-wrap">{rapport.anomalies}</p>
          </div>
        ) : (
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
              Anomalies
            </p>
            <p className="text-sm text-emerald-600 font-semibold">✓ Aucune anomalie relevée</p>
          </div>
        )}
      </div>
    </div>
  );
}