'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

const SC_METHODOLOGY: 'price_only' | 'weighted' = 'weighted';
const TECH_WEIGHT = 60;
const FIN_WEIGHT = 40;

export default function ClassementTab({ dossier }: { dossier: Dossier }) {
  const { state, calculerClassement, ecarterProvisional } = useEvaluation();

  const classement: any[] = state?.classement ?? [];
  const registreEntries: any[] = state?.registre?.entries ?? [];
  const finEntries: any[] = state?.evals_financiere ?? [];

  const [showEliminateModal, setShowEliminateModal] = useState(false);
  const [eliminateMotif, setEliminateMotif] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const getName = (id_soumission: number) =>
    registreEntries.find((e: any) => e.id_soumission === id_soumission)?.nom_oe ?? `Soumission #${id_soumission}`;

  const getAmount = (id_soumission: number) => {
    const fin = finEntries.find((e: any) => e.id_soumission === id_soumission);
    return Number(fin?.montant_evaluation ?? fin?.montant_corrige ?? fin?.montant_declare ?? 0);
  };

  const fmt = (n: number) => n > 0 ? n.toLocaleString('fr-FR') + ' DA' : '—';

  const handleCalculer = async () => {
    setSaving(true);
    try {
      await calculerClassement();
    } finally {
      setSaving(false);
    }
  };

  const handleEliminate = async () => {
    if (!eliminateMotif.trim() || classement.length === 0) return;
    const winner = classement.find((e: any) => e.rang === 1 && !e.ecarte_provisoire);
    if (!winner) return;
    setSaving(true);
    try {
      await ecarterProvisional(winner.id_soumission, eliminateMotif);
      setShowEliminateModal(false);
      setEliminateMotif('');
    } finally {
      setSaving(false);
    }
  };

  const activeClassement = classement.filter((e: any) => !e.ecarte_provisoire);
  const winner = activeClassement.find((e: any) => e.rang === 1) ?? activeClassement[0] ?? null;
  const ecartees = classement.filter((e: any) => e.ecarte_provisoire);

  if (confirmed) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 font-semibold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Classement confirmé. Attributaire provisoire : {winner ? getName(winner.id_soumission) : '—'}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Methodology banner */}
      <div className="bg-[#F4F7F4] border border-[#97A675] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#1C4532] uppercase tracking-wider mb-2">
          Méthodologie de choix — définie par le SC, lecture seule
        </p>
        <div className="flex items-center gap-6 text-sm text-gray-700">
          {SC_METHODOLOGY === 'price_only' ? (
            <span>Critère unique : <strong>Offre la moins disante</strong></span>
          ) : (
            <>
              <span>Technique : <strong>{TECH_WEIGHT}%</strong></span>
              <span>Financier : <strong>{FIN_WEIGHT}%</strong></span>
            </>
          )}
          <span className="text-xs text-gray-500">(Art. 72 — la COPEO applique mécaniquement)</span>
        </div>
      </div>

      {/* Calculate button if no classement yet */}
      {classement.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-gray-500 mb-4">Le classement n'a pas encore été calculé.</p>
          <button
            onClick={handleCalculer}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
            {saving ? 'Calcul en cours…' : 'Calculer le classement'}
          </button>
        </div>
      )}

      {classement.length > 0 && (
        <>
          {ecartees.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {ecartees.map((e: any) => (
                <p key={e.id_soumission}>
                  {getName(e.id_soumission)} écarté — motif : {e.motif_ecart}
                </p>
              ))}
              Le classement a été repris à partir du rang suivant.
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Tableau de classement</h3>
              <button
                onClick={handleCalculer}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] disabled:opacity-40">
                Recalculer
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F4F7F4] border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rang</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Opérateur</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Score Tech.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Score Fin.</th>
                    {SC_METHODOLOGY === 'weighted' && (
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Score Combiné</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeClassement.map((entry: any) => (
                    <tr key={entry.id_soumission} className={entry.rang === 1 ? 'bg-[#F4F7F4]' : 'bg-white'}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                          entry.rang === 1 ? 'text-white' : 'bg-gray-100 text-gray-600'
                        }`} style={entry.rang === 1 ? { background: 'linear-gradient(135deg, #1C4532, #00738C)' } : {}}>
                          {entry.rang}
                        </span>
                        {entry.rang === 1 && (
                          <span className="ml-2 text-xs font-bold text-[#1C4532]">Attributaire provisoire</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{getName(entry.id_soumission)}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.score_technique}/100</td>
                      <td className="px-4 py-3 text-gray-600">{Number(entry.score_financier).toFixed(1)}/100</td>
                      {SC_METHODOLOGY === 'weighted' && (
                        <td className="px-4 py-3 font-bold text-[#1C4532]">{Number(entry.score_combine).toFixed(1)}/100</td>
                      )}
                      <td className="px-4 py-3 text-gray-600">{fmt(getAmount(entry.id_soumission))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {winner && ecartees.length === 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowEliminateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Écarter l'attributaire provisoire
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setConfirmed(true)}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
              Confirmer le classement
            </button>
          </div>
        </>
      )}

      {/* Eliminate modal */}
      {showEliminateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Motif d'écartement</h3>
            <textarea
              value={eliminateMotif}
              onChange={e => setEliminateMotif(e.target.value)}
              placeholder="Motif obligatoire…" rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setShowEliminateModal(false); setEliminateMotif(''); }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button
                disabled={!eliminateMotif.trim() || saving}
                onClick={handleEliminate}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}