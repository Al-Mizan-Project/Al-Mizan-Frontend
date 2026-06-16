'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

const SC_CRITERIA = [
  { id: 'methodologie', label: "Méthodologie d'exécution", max: 30 },
  { id: 'equipe',       label: 'Équipe proposée',          max: 40 },
  { id: 'materiels',    label: 'Moyens matériels',         max: 20 },
  { id: 'references',   label: 'Références similaires',    max: 10 },
];
const SC_THRESHOLD = 70;

export default function EvalTechniqueTab({ dossier }: { dossier: Dossier }) {
  const { state, updateEvalTechnique, lockTechniqueOffer } = useEvaluation();

  const entries: any[] = state?.registre?.entries ?? [];
  const qualifiedIds = new Set(
    (state?.capacites ?? [])
      .filter((c: any) => c.resultat === 'suffisant')
      .map((c: any) => c.id_soumission)
  );
  const qualifiedEntries = entries.filter((e: any) => qualifiedIds.has(e.id_soumission));
  const evals: any[] = state?.evals_technique ?? [];

  const [activeId, setActiveId] = useState<number | null>(
    qualifiedEntries.length > 0 ? qualifiedEntries[0].id_soumission : null
  );
  const [localScores, setLocalScores] = useState<Record<number, Record<string, number | null>>>({});
  const [localJustif, setLocalJustif] = useState<Record<number, Record<string, string>>>({});
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  if (qualifiedEntries.length === 0) {
    return <p className="text-sm text-gray-400">Aucune offre ayant des capacités suffisantes.</p>;
  }
  if (activeId === null) return null;

  const activeEntry = qualifiedEntries.find((e: any) => e.id_soumission === activeId);
  const existing = evals.find((e: any) => e.id_soumission === activeId);
  const isLocked = !!existing?.locked;

  const savedScores: Record<string, number> = existing?.scores ?? {};
  const savedJustif: Record<string, string> = existing?.justifications ?? {};

  const scores: Record<string, number | null> = localScores[activeId] ??
    Object.fromEntries(SC_CRITERIA.map(c => [c.id, savedScores[c.id] ?? null]));
  const justifs: Record<string, string> = localJustif[activeId] ??
    Object.fromEntries(SC_CRITERIA.map(c => [c.id, savedJustif[c.id] ?? '']));

  const totalScore = SC_CRITERIA.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0);
  const allScoresEntered = SC_CRITERIA.every(c => scores[c.id] !== null && scores[c.id] !== undefined);

  const setScore = (criteriaId: string, value: number) => {
    setLocalScores(prev => ({
      ...prev,
      [activeId]: { ...(prev[activeId] ?? scores), [criteriaId]: value },
    }));
  };

  const setJustif = (criteriaId: string, value: string) => {
    setLocalJustif(prev => ({
      ...prev,
      [activeId]: { ...(prev[activeId] ?? justifs), [criteriaId]: value },
    }));
  };

  const buildPayload = () => ({
    scores: Object.fromEntries(SC_CRITERIA.map(c => [c.id, Number(scores[c.id]) || 0])),
    justifications: Object.fromEntries(SC_CRITERIA.map(c => [c.id, justifs[c.id] ?? ''])),
    score_total: totalScore,
  });

  const clearLocal = () => {
    setLocalScores(prev => { const n = { ...prev }; delete n[activeId!]; return n; });
    setLocalJustif(prev => { const n = { ...prev }; delete n[activeId!]; return n; });
  };

  const handleSaveScores = async () => {
    setSaving(true);
    try {
      await updateEvalTechnique(activeId, buildPayload());
      clearLocal();
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    setSaving(true);
    try {
      await updateEvalTechnique(activeId, buildPayload());
      await lockTechniqueOffer(activeId, totalScore, SC_THRESHOLD);
      clearLocal();
      setShowValidateModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* SC params banner */}
      <div className="bg-[#F4F7F4] border border-[#97A675] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#1C4532] uppercase tracking-wider mb-1">
          Paramètres SC — lecture seule
        </p>
        <p className="text-sm text-gray-700">
          Seuil minimum : <strong>{SC_THRESHOLD}/100</strong> &nbsp;·&nbsp;
          Méthodologie : <strong>Pondération technique + financière</strong>
        </p>
      </div>

      {/* Offer tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {qualifiedEntries.map((e: any) => {
          const ev = evals.find((x: any) => x.id_soumission === e.id_soumission);
          return (
            <button key={e.id_soumission} onClick={() => setActiveId(e.id_soumission)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeId === e.id_soumission
                  ? 'border-[#00738C] bg-[#D6EAD4] text-[#1C4532]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}>
              {ev?.locked && ev?.qualifie === true && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {ev?.locked && ev?.qualifie === false && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
              {e.nom_oe}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-[#00738C] mb-4">
          {activeEntry?.nom_oe}
        </p>

        {isLocked && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-bold ${
            existing?.qualifie
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {existing?.qualifie
              ? `✓ Techniquement qualifié — score : ${existing.score_total}/100`
              : `✗ Non qualifié — score : ${existing?.score_total}/100 < seuil ${SC_THRESHOLD}`}
            <p className="text-xs font-normal mt-1 text-gray-500">
              Scores verrouillés — aucune modification rétroactive possible.
            </p>
          </div>
        )}

        <h3 className="text-sm font-bold text-gray-800 mb-4">Grille de notation</h3>
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Critère</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Max</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {SC_CRITERIA.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-gray-700">{c.label}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.max}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min={0} max={c.max}
                      value={isLocked ? (savedScores[c.id] ?? '') : (scores[c.id] ?? '')}
                      onChange={e => setScore(c.id, Math.min(c.max, Math.max(0, Number(e.target.value))))}
                      disabled={isLocked}
                      placeholder={`0–${c.max}`}
                      className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none disabled:bg-gray-50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={isLocked ? (savedJustif[c.id] ?? '') : (justifs[c.id] ?? '')}
                      onChange={e => setJustif(c.id, e.target.value)}
                      disabled={isLocked}
                      placeholder="Justification…"
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none disabled:bg-gray-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-[#F4F7F4] flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Score total</span>
            <span className={`text-lg font-black ${totalScore >= SC_THRESHOLD ? 'text-emerald-600' : 'text-red-600'}`}>
              {isLocked ? existing?.score_total : totalScore} / 100
              {allScoresEntered && !isLocked && (
                <span className="text-xs font-normal ml-2">
                  {totalScore >= SC_THRESHOLD
                    ? `≥ ${SC_THRESHOLD} → Qualifié`
                    : `< ${SC_THRESHOLD} → Non qualifié`}
                </span>
              )}
            </span>
          </div>
        </div>

        {!isLocked && (
          <div className="flex justify-end gap-3">
            <button onClick={handleSaveScores} disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] disabled:opacity-40">
              Enregistrer
            </button>
            <button
              onClick={() => setShowValidateModal(true)}
              disabled={!allScoresEntered || saving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
              Valider et verrouiller
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {evals.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Récapitulatif technique</h3>
          {qualifiedEntries.map((e: any) => {
            const ev = evals.find((x: any) => x.id_soumission === e.id_soumission);
            return (
              <div key={e.id_soumission}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{e.nom_oe}</span>
                {ev?.locked ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    ev.qualifie
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {ev.qualifie
                      ? `Qualifié — ${ev.score_total}/100`
                      : `Non qualifié — ${ev.score_total}/100`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">En cours</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Validate modal */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Valider et verrouiller</h3>
            <p className="text-sm text-gray-600 mb-2">Score : <strong>{totalScore}/100</strong></p>
            <p className={`text-sm font-bold mb-4 ${totalScore >= SC_THRESHOLD ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalScore >= SC_THRESHOLD
                ? `✓ Techniquement qualifié (seuil : ${SC_THRESHOLD})`
                : `✗ Non qualifié — enveloppe financière retournée sans ouverture`}
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-5">
              Les scores seront verrouillés. Aucune modification rétroactive ne sera possible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowValidateModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button onClick={handleLock} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}