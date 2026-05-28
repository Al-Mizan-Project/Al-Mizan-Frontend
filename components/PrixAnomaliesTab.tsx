'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

const ADMIN_ESTIMATE = 50_000_000;
const LOW_THRESHOLD = 0.70;
const HIGH_THRESHOLD = 1.30;

export default function PrixAnomaliesTab({ dossier }: { dossier: Dossier }) {
  const { state, ecarterProvisional, calculerClassement } = useEvaluation();

  const classement: any[] = state?.classement ?? [];
  const finEntries: any[] = state?.evals_financiere ?? [];
  const registreEntries: any[] = state?.registre?.entries ?? [];

  const [localFlags, setLocalFlags] = useState<Record<number, 'bas' | 'excessif' | 'justified' | 'rejected'>>({});
  const [showJustifModal, setShowJustifModal] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (classement.length === 0) {
    return <p className="text-sm text-gray-400 p-8 text-center">Classement non encore calculé.</p>;
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 font-semibold">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Vérification des prix anomalies confirmée.
      </div>
    );
  }

  const getName = (id_soumission: number) =>
    registreEntries.find((e: any) => e.id_soumission === id_soumission)?.nom_oe ?? `Soumission #${id_soumission}`;

  const getAmount = (id_soumission: number) => {
    const fin = finEntries.find((e: any) => e.id_soumission === id_soumission);
    return Number(fin?.montant_evaluation ?? fin?.montant_corrige ?? fin?.montant_declare ?? 0);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await calculerClassement();
      setConfirmed(true);
    } finally {
      setSaving(false);
    }
  };

  const handleRejectExcessif = async (id_soumission: number) => {
    setSaving(true);
    try {
      await ecarterProvisional(id_soumission, 'Prix excessif — rejet direct');
      setLocalFlags(prev => ({ ...prev, [id_soumission]: 'excessif' }));
    } finally {
      setSaving(false);
    }
  };

  const handleJustifResult = async (id_soumission: number, result: 'acceptable' | 'reject') => {
    if (result === 'reject') {
      setSaving(true);
      try {
        await ecarterProvisional(id_soumission, 'Justification prix bas insuffisante');
        setLocalFlags(prev => ({ ...prev, [id_soumission]: 'rejected' }));
      } finally {
        setSaving(false);
      }
    } else {
      setLocalFlags(prev => ({ ...prev, [id_soumission]: 'justified' }));
    }
    setShowJustifModal(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#F4F7F4] border border-[#97A675] rounded-2xl p-4">
        <p className="text-xs font-bold text-[#1C4532] uppercase tracking-wider mb-1">
          Estimation administrative — référence SC
        </p>
        <p className="text-sm text-gray-700">
          Seuil bas : &lt; <strong>{(ADMIN_ESTIMATE * LOW_THRESHOLD).toLocaleString('fr-FR')} DA</strong> ({LOW_THRESHOLD * 100}%)
          &nbsp;|&nbsp;
          Seuil excessif : &gt; <strong>{(ADMIN_ESTIMATE * HIGH_THRESHOLD).toLocaleString('fr-FR')} DA</strong> ({HIGH_THRESHOLD * 100}%)
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
        {classement.map((entry: any) => {
          const id = entry.id_soumission;
          const amount = getAmount(id);
          const name = getName(id);
          const flag = localFlags[id];
          const isBas = amount > 0 && amount < ADMIN_ESTIMATE * LOW_THRESHOLD;
          const isExcessif = amount > 0 && amount > ADMIN_ESTIMATE * HIGH_THRESHOLD;
          const isEcarte = entry.ecarte_provisoire;

          return (
            <div key={id} className={`border rounded-xl p-4 ${
              isEcarte || flag === 'rejected' ? 'border-red-200 bg-red-50' :
              flag === 'justified' ? 'border-emerald-200 bg-emerald-50' :
              isBas ? 'border-amber-200 bg-amber-50' :
              isExcessif ? 'border-red-200 bg-red-50' :
              'border-gray-100 bg-white'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Rang {entry.rang} · Montant : {amount > 0 ? amount.toLocaleString('fr-FR') + ' DA' : '—'}
                  </p>
                  {isBas && !flag && (
                    <p className="text-xs text-amber-700 font-semibold mt-1">
                      ⚠ Prix anormalement bas — procédure contradictoire requise
                    </p>
                  )}
                  {flag === 'bas' && (
                    <p className="text-xs text-amber-600 mt-1">Demande de justification envoyée — délai 10 jours</p>
                  )}
                  {flag === 'justified' && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Justification acceptable — offre maintenue</p>
                  )}
                  {(flag === 'rejected' || (isEcarte && entry.motif_ecart?.includes('bas'))) && (
                    <p className="text-xs text-red-600 font-semibold mt-1">✗ Justification insuffisante — offre écartée</p>
                  )}
                  {isExcessif && !flag && (
                    <p className="text-xs text-red-700 font-semibold mt-1">
                      ⚠ Prix excessif — rejet direct, pas de dialogue
                    </p>
                  )}
                  {(flag === 'excessif' || (isEcarte && entry.motif_ecart?.includes('excessif'))) && (
                    <p className="text-xs text-red-600 font-semibold mt-1">✗ Prix excessif — offre rejetée</p>
                  )}
                  {!isBas && !isExcessif && !flag && !isEcarte && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Prix normal</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {isBas && !flag && !isEcarte && (
                    <button
                      onClick={() => setLocalFlags(prev => ({ ...prev, [id]: 'bas' }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-400 text-amber-700 bg-amber-100 hover:bg-amber-200">
                      Déclencher procédure contradictoire
                    </button>
                  )}
                  {flag === 'bas' && (
                    <button
                      onClick={() => setShowJustifModal(id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-400 text-amber-700 bg-amber-100">
                      Enregistrer réponse justification
                    </button>
                  )}
                  {isExcessif && !flag && !isEcarte && (
                    <button
                      onClick={() => handleRejectExcessif(id)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-400 text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-40">
                      Rejeter — prix excessif
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
          Confirmer — passer au classement
        </button>
      </div>

      {showJustifModal !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-4">Résultat de la procédure contradictoire</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleJustifResult(showJustifModal, 'acceptable')}
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                ✓ Justification acceptable
              </button>
              <button
                onClick={() => handleJustifResult(showJustifModal, 'reject')}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                ✗ Insuffisante — rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}