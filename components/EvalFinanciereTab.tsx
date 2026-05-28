'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

const SC_CORRECTION_RULE: 'unit_price' | 'total' = 'unit_price';

export default function EvalFinanciereTab({ dossier }: { dossier: Dossier }) {
  const { state, updateEvalFinanciere, lockFinanciereOffer } = useEvaluation();

  const entries: any[] = state?.registre?.entries ?? [];
  const techQualifiedIds = new Set(
    (state?.evals_technique ?? [])
      .filter((e: any) => e.qualifie === true)
      .map((e: any) => e.id_soumission)
  );
  const qualifiedEntries = entries.filter((e: any) => techQualifiedIds.has(e.id_soumission));
  const evals: any[] = state?.evals_financiere ?? [];

  const [activeId, setActiveId] = useState<number | null>(
    qualifiedEntries.length > 0 ? qualifiedEntries[0].id_soumission : null
  );
  const [localData, setLocalData] = useState<Record<number, Record<string, any>>>({});
  const [showRefusModal, setShowRefusModal] = useState(false);
  const [refusMotif, setRefusMotif] = useState('');
  const [saving, setSaving] = useState(false);

  if (qualifiedEntries.length === 0) {
    return <p className="text-sm text-gray-400 p-8 text-center">Aucune offre techniquement qualifiée.</p>;
  }
  if (activeId === null) return null;

  const activeEntry = qualifiedEntries.find((e: any) => e.id_soumission === activeId);
  const existing = evals.find((e: any) => e.id_soumission === activeId);
  const isLocked = !!existing?.locked;

  const local = localData[activeId] ?? {};

  const montantDeclare = local.montant_declare ?? existing?.montant_declare ?? null;
  const montantBpu = local.montant_bpu_calcule ?? existing?.montant_bpu_calcule ?? null;
  const hasArithmeticError = montantDeclare !== null && montantBpu !== null && montantDeclare !== montantBpu;

  const montantCorrige = existing?.montant_corrige ?? null;
  const margeAppliquee = existing?.marge_appliquee ?? false;
  const montantEvaluation = existing?.montant_evaluation ?? null;
  const refuseCorrection = existing?.refuse_correction ?? false;

  const fmt = (n: number | null) => n != null ? Number(n).toLocaleString('fr-FR') + ' DA' : '—';

  const setLocal = (key: string, value: any) => {
    setLocalData(prev => ({ ...prev, [activeId]: { ...(prev[activeId] ?? {}), [key]: value } }));
  };

  const handleSave = async (extra: Record<string, any> = {}) => {
    setSaving(true);
    try {
      await updateEvalFinanciere(activeId, {
        id_soumission: activeId,
        montant_declare: montantDeclare,
        montant_bpu_calcule: montantBpu,
        correction_rule: SC_CORRECTION_RULE,
        ...extra,
      });
      setLocalData(prev => { const n = { ...prev }; delete n[activeId]; return n; });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyCorrection = () => {
    const corrected = SC_CORRECTION_RULE === 'unit_price' ? montantBpu : montantDeclare;
    handleSave({ montant_corrige: corrected });
  };

  const handleRefuseCorrection = async () => {
    if (!refusMotif.trim()) return;
    setSaving(true);
    try {
      await updateEvalFinanciere(activeId, {
        id_soumission: activeId,
        refuse_correction: true,
        refuse_motif: refusMotif,
      });
      setShowRefusModal(false);
      setRefusMotif('');
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    setSaving(true);
    try {
      await lockFinanciereOffer(activeId);
      setLocalData(prev => { const n = { ...prev }; delete n[activeId]; return n; });
    } finally {
      setSaving(false);
    }
  };

  const canLock = !refuseCorrection && (!hasArithmeticError || montantCorrige !== null);

  return (
    <div className="flex flex-col gap-6">
      {/* SC correction rule banner */}
      <div className="bg-[#F4F7F4] border border-[#97A675] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#1C4532] uppercase tracking-wider mb-1">
          Règle de correction SC — lecture seule
        </p>
        <p className="text-sm text-gray-700">
          En cas d'erreur arithmétique : <strong>
            {SC_CORRECTION_RULE === 'unit_price' ? 'Le prix unitaire prévaut' : 'Le total prévaut'}
          </strong>
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
              {ev?.locked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
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
          <div className="mb-4 p-3 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Évaluation financière verrouillée
          </div>
        )}

        {/* Amount inputs */}
        {!isLocked && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Montant déclaré (DA)</p>
              <input type="number" min={0}
                value={montantDeclare ?? ''}
                onChange={e => setLocal('montant_declare', Number(e.target.value))}
                placeholder="Montant déclaré…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Montant calculé BPU/DQE (DA)</p>
              <input type="number" min={0}
                value={montantBpu ?? ''}
                onChange={e => setLocal('montant_bpu_calcule', Number(e.target.value))}
                placeholder="Montant calculé…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
        )}

        {/* Arithmetic check */}
        {montantDeclare !== null && montantBpu !== null && (
          <div className={`p-4 rounded-xl border mb-4 ${hasArithmeticError ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-xs font-bold mb-2">
              {hasArithmeticError ? '⚠ Erreur arithmétique détectée' : '✓ Vérification arithmétique — aucune anomalie'}
            </p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Montant déclaré : <strong>{fmt(montantDeclare)}</strong></p>
              <p>Montant calculé : <strong>{fmt(montantBpu)}</strong></p>
              {hasArithmeticError && (
                <p className="text-amber-700 font-semibold">
                  Écart : {fmt(Math.abs(montantBpu - montantDeclare))}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Correction */}
        {hasArithmeticError && !isLocked && !refuseCorrection && montantCorrige === null && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-700 mb-2">
              Règle SC : <strong>{SC_CORRECTION_RULE === 'unit_price' ? 'Prix unitaire prévaut' : 'Total prévaut'}</strong>
            </p>
            <div className="flex gap-3">
              <button onClick={handleApplyCorrection} disabled={saving}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#D6EAD4] border border-[#00738C] text-[#1C4532] disabled:opacity-40">
                Appliquer → {fmt(SC_CORRECTION_RULE === 'unit_price' ? montantBpu : montantDeclare)}
              </button>
              <button onClick={() => setShowRefusModal(true)} disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-red-300 text-red-600 hover:bg-red-50">
                Refus du candidat
              </button>
            </div>
          </div>
        )}

        {montantCorrige !== null && !isLocked && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            Montant corrigé appliqué : <strong>{fmt(montantCorrige)}</strong>
          </div>
        )}

        {refuseCorrection && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
            ✗ Candidat a refusé la correction — offre rejetée. Motif : {existing?.refuse_motif}
          </div>
        )}

        {/* Marge de préférence */}
        {margeAppliquee && (
          <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 mb-4">
            <p className="text-xs font-bold mb-2">⚠ Marge de préférence nationale appliquée (+25%)</p>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Montant réel (contrat) : <strong>{fmt(montantCorrige ?? montantDeclare)}</strong></p>
              <p className="text-amber-700 font-semibold">
                Montant d'évaluation : <strong>{fmt(montantEvaluation)}</strong>
              </p>
              <p className="text-xs text-gray-500">Le classement s'effectue sur le montant d'évaluation. Le contrat est signé au montant réel.</p>
            </div>
          </div>
        )}

        {!margeAppliquee && montantEvaluation !== null && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 mb-4">
            Montant d'évaluation : <strong>{fmt(montantEvaluation)}</strong>
          </div>
        )}

        {/* Summary row for locked */}
        {isLocked && (
          <div className="space-y-1 text-sm text-gray-700">
            <p>Montant déclaré : <strong>{fmt(existing?.montant_declare)}</strong></p>
            {existing?.montant_corrige && <p>Montant corrigé : <strong>{fmt(existing.montant_corrige)}</strong></p>}
            {existing?.marge_appliquee && (
              <p className="text-amber-700 font-semibold">
                Montant évaluation (+25%) : <strong>{fmt(existing.montant_evaluation)}</strong>
              </p>
            )}
            {!existing?.marge_appliquee && existing?.montant_evaluation && (
              <p>Montant évaluation : <strong>{fmt(existing.montant_evaluation)}</strong></p>
            )}
          </div>
        )}

        {/* Actions */}
        {!isLocked && !refuseCorrection && (
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => handleSave()} disabled={saving || montantDeclare === null}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] disabled:opacity-40">
              Enregistrer
            </button>
            <button onClick={handleLock} disabled={!canLock || saving || montantDeclare === null}
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
          <h3 className="text-sm font-bold text-gray-800 mb-3">Récapitulatif financier</h3>
          {qualifiedEntries.map((e: any) => {
            const ev = evals.find((x: any) => x.id_soumission === e.id_soumission);
            return (
              <div key={e.id_soumission} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{e.nom_oe}</span>
                {ev?.locked ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                    {fmt(ev.montant_evaluation ?? ev.montant_declare)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">En attente</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Refus correction modal */}
      {showRefusModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Refus de correction par le candidat</h3>
            <textarea value={refusMotif} onChange={e => setRefusMotif(e.target.value)}
              placeholder="Motif du refus (obligatoire)…" rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowRefusModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button disabled={!refusMotif.trim() || saving} onClick={handleRefuseCorrection}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}