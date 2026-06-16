'use client';

import { useState, useEffect } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';
import { api } from '@/lib/api';

export default function PVTab({ dossier }: { dossier: Dossier }) {
  const { state, signerPV, verrouillerPV, soumettreAuSC, currentMembreId, commissionId, refresh } = useEvaluation();

  const pv = state?.pvs?.evaluation ?? null;
  const pvLocked = !!pv?.locked;
  const sentToSC = !!pv?.sent_to_sc;
  const signatures: any[] = (pv as any)?.signatures ?? [];
  const membres: any[] = state?.membres ?? [];
  const scDecision = state?.sc_decision ?? null;

  useEffect(() => {
    if (!pv) {
      api.post(`/commissions/${commissionId}/pv/evaluation/`).then(refresh).catch(() => {});
    }
  }, [pv]);

  const [reserveText, setReserveText] = useState('');
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const mySignature = signatures.find((s: any) => s.id_utilisateur === currentMembreId);
  const allSigned = membres.length > 0 && membres.every((m: any) =>
    signatures.some((s: any) => s.id_utilisateur === m.id_utilisateur)
  );

  const handleSign = async (reserve?: string) => {
    setSaving(true);
    try {
      await signerPV('evaluation', reserve);
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async () => {
    setSaving(true);
    try {
      await verrouillerPV('evaluation');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await soumettreAuSC();
    } finally {
      setSaving(false);
    }
  };

  // Find winner from classement
  const classement: any[] = state?.classement ?? [];
  const registre: any[] = state?.registre?.entries ?? [];
  const winner = classement.filter((e: any) => !e.ecarte_provisoire).sort((a: any, b: any) => a.rang - b.rang)[0];
  const winnerName = winner
    ? registre.find((e: any) => e.id_soumission === winner.id_soumission)?.nom_oe ?? `Soumission #${winner.id_soumission}`
    : '—';

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Procès-Verbal d'Évaluation des Offres</h3>
            <p className="text-xs text-gray-500">
              Généré automatiquement à partir de toutes les données d'évaluation.
            </p>
          </div>
          {pvLocked && (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              PV Verrouillé
            </span>
          )}
        </div>

        {/* PV Summary */}
        <div className="bg-[#F4F7F4] rounded-xl p-4 mb-6 text-xs text-gray-600 space-y-1 border border-gray-200">
          <p><strong>Dossier :</strong> {dossier.reference}</p>
          <p><strong>Opérateur :</strong> {dossier.operateur}</p>
          <p><strong>Date :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
          <p><strong>Offres conformes :</strong> {(state?.conformites ?? []).filter((c: any) => c.resultat === 'admis').length}</p>
          <p><strong>Offres techniquement qualifiées :</strong> {(state?.evals_technique ?? []).filter((e: any) => e.qualifie).length}</p>
          <p><strong>Attributaire provisoire :</strong> {winnerName}{winner ? ` — Score combiné : ${Number(winner.score_combine).toFixed(1)}/100` : ''}</p>
        </div>

        {/* Signatures */}
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Signatures des membres</h4>
        <div className="space-y-3">
          {membres.map((m: any) => {
            const sig = signatures.find((s: any) => s.id_utilisateur === m.id_utilisateur);
            const isMe = m.id_utilisateur === currentMembreId;
            return (
              <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                sig ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Membre {m.id_utilisateur} — {m.role_label}
                  </p>
                  {sig?.has_reserve && (
                    <p className="text-xs text-amber-600 mt-0.5">Réserve : {sig.reserve}</p>
                  )}
                  {sig?.signed_at && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Signé le {new Date(sig.signed_at).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!sig && !pvLocked && isMe && (
                    <>
                      <button
                        onClick={() => setShowReserveModal(true)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-700 bg-amber-50">
                        Réserve
                      </button>
                      <button
                        onClick={() => handleSign()}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                        Signer
                      </button>
                    </>
                  )}
                  {sig && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allSigned && !pvLocked && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleLock}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Verrouiller le PV
            </button>
          </div>
        )}
      </div>

      {/* Submit to SC */}
      {pvLocked && !sentToSC && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Soumission au Service Contractant</h3>
          <p className="text-xs text-gray-500 mb-4">
            Le PV est verrouillé et signé. La COPEO peut maintenant soumettre son avis au SC.
          </p>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
            Soumettre l'avis au Service Contractant
          </button>
        </div>
      )}

      {/* SC Decision */}
      {sentToSC && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          {scDecision ? (
            <div className={`p-3 rounded-xl text-sm font-bold ${
              (scDecision as any).decision === 'accepted'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {(scDecision as any).decision === 'accepted'
                ? '✓ SC a accepté — Attribution provisoire déclenchée'
                : `✗ SC a rejeté — ${(scDecision as any).motif}`}
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
              Avis soumis au SC — en attente de décision.
            </div>
          )}
        </div>
      )}

      {/* Reserve modal */}
      {showReserveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Ajouter une réserve</h3>
            <textarea
              value={reserveText}
              onChange={e => setReserveText(e.target.value)}
              placeholder="Contenu de la réserve…" rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReserveModal(false); setReserveText(''); }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button
                disabled={!reserveText.trim() || saving}
                onClick={() => { handleSign(reserveText); setShowReserveModal(false); setReserveText(''); }}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                Ajouter et signer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}