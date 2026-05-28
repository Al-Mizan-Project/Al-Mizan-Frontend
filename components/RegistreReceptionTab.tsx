'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

interface Props { dossier: Dossier; }

export default function RegistreReceptionTab({ dossier }: Props) {
  const { state, confirmerIntegrite } = useEvaluation();
  const confirmed = !!state?.registre?.integrite_confirmed;
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const entries: any[] = state?.registre?.entries ?? [];
  const lateCount = entries.filter((r: any) => r.hors_delai).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Registre d'enregistrement des offres</h3>
        <p className="text-xs text-gray-500 mb-5">
          Avant toute ouverture, la COPEO vérifie l'intégrité du registre — aucune lacune, aucune entrée hors ordre, aucune offre tardive intégrée.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F4F7F4] border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Opérateur Économique</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Reçu le</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Soumis le</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Aucune entrée dans le registre
                  </td>
                </tr>
              ) : (
                entries.map((r: any) => (
                  <tr key={r.numero_ordre} className={r.hors_delai ? 'bg-red-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-bold text-gray-700">{r.numero_ordre}</td>
                    <td className="px-4 py-3 text-gray-800">{r.nom_oe}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.received_at).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.submitted_at).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      {r.hors_delai ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          ⚠ HORS DÉLAI — Exclu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Dans les délais
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {lateCount > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <strong>{lateCount} offre{lateCount > 1 ? 's' : ''} hors délai</strong> — {lateCount > 1 ? 'elles sont' : 'elle est'} automatiquement exclue{lateCount > 1 ? 's' : ''} et ne peuvent pas être ouvertes. L'exclusion doit être confirmée dans le PV.
          </div>
        )}
      </div>

      {confirmed ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Registre verrouillé — intégrité confirmée. Vous pouvez procéder à l'ouverture des plis.
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setShowConfirmModal(true)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
            Confirmer l'intégrité du registre
          </button>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-xl font-black text-gray-800 mb-3">Confirmer l'intégrité du registre</h3>
            <p className="text-sm text-gray-600 mb-2">En confirmant, vous certifiez que :</p>
            <ul className="text-xs text-gray-600 space-y-1 mb-6 list-disc pl-4">
              <li>Toutes les entrées sont séquentielles et sans lacune</li>
              <li>Aucune offre hors délai n'a été intégrée dans le registre</li>
              <li>{lateCount > 0 ? `${lateCount} offre(s) hors délai sont marquées comme exclues` : 'Toutes les offres sont dans les délais'}</li>
            </ul>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-5">
              Cette action verrouille le registre et génère un log signé. Elle est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => { setShowConfirmModal(false); confirmerIntegrite(); }}
                className="flex-1 py-2.5 text-white font-bold rounded-xl text-sm"
                style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                Confirmer et verrouiller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}