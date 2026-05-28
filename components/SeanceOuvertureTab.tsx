'use client';

import { useState, useEffect } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

function membreLabel(role_label: string, id_utilisateur: number, currentMembreId: number): string {
  const base = role_label === 'president' ? 'Président de séance' : 'Membre évaluateur';
  return id_utilisateur === currentMembreId ? `${base} (vous)` : base;
}

export default function SeanceOuvertureTab({ dossier }: { dossier: Dossier }) {

  
  const [montantInputs, setMontantInputs] = useState<Record<number, string>>({});
  const {
    state,
    demarrerSeance,
    cloturerSeance,
    ouvrirPli,
    parapherPli,
    signerPV,
    verrouillerPV,
    currentMembreId,
  } = useEvaluation();

  const [now, setNow] = useState(new Date());
  const [showPVReserveModal, setShowPVReserveModal] = useState(false);
  const [pvReserveText, setPvReserveText] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const membres = state?.membres ?? [];
  const seance = (state?.seance?.data as any) ?? null;
  const plis: any[] = state?.seance?.plis ?? [];
  const registreEntries: any[] = state?.registre?.entries ?? [];
  const sessionState: string = seance?.statut ?? 'not_started';

  const pvOuverture = (state?.pvs?.ouverture as any) ?? null;
  const signatures: any[] = pvOuverture?.signatures ?? [];

  const allOpenedPlis = plis.filter((p: any) => !!p.opened_at);
  const allPliParaphed =
    allOpenedPlis.length > 0 &&
    allOpenedPlis.length === plis.length &&
    allOpenedPlis.every((p: any) =>
      p.paraphes?.some((ph: any) => ph.id_utilisateur === currentMembreId)
    );

  const allSigned =
    membres.length > 0 &&
    membres.every((m: any) =>
      signatures.some((s: any) => s.id_utilisateur === m.id_utilisateur)
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Session control */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Séance d'ouverture des plis</h3>
            <p className="text-xs text-gray-500">Heure actuelle : <strong>{now.toLocaleString('fr-FR')}</strong></p>
            {seance?.anomalie && (
              <p className="text-xs text-red-600 mt-1">⚠ {seance.anomalie}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            sessionState === 'not_started' ? 'bg-gray-100 text-gray-600' :
            sessionState === 'in_progress'  ? 'bg-blue-100 text-blue-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {sessionState === 'not_started' ? 'Non démarrée' :
             sessionState === 'in_progress'  ? 'En cours' : 'Clôturée'}
          </span>
        </div>

        {sessionState === 'not_started' && (
          <button onClick={() => demarrerSeance()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
            Démarrer la séance
          </button>
        )}
        {sessionState === 'in_progress' && seance?.started_at && (
          <p className="text-xs text-blue-600 font-semibold">
            Séance démarrée à {new Date(seance.started_at).toLocaleTimeString('fr-FR')}
          </p>
        )}
        {sessionState === 'closed' && seance?.closed_at && (
          <p className="text-xs text-emerald-600 font-semibold">
            Séance clôturée à {new Date(seance.closed_at).toLocaleTimeString('fr-FR')}
          </p>
        )}
      </div>

      {/* Plis list */}
      {sessionState !== 'not_started' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Ouverture des plis — ordre séquentiel</h3>
          {plis.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun pli disponible.</p>
          ) : (
            <div className="space-y-4">
              {plis.map((pli: any, idx: number) => {
                  console.log('pli paraphes:', pli.id_soumission, pli.paraphes, 'currentMembreId:', currentMembreId);

                const isOpened = !!pli.opened_at;
                const prevOpened = idx === 0 || !!plis[idx - 1]?.opened_at;
const registreEntry = registreEntries.find((r: any) => Number(r.id_soumission) === Number(pli.id_soumission));      const oeName = registreEntry?.nom_oe ?? `Soumission ${pli.id_soumission}`;

                return (
                  <div key={pli.id_soumission}
                    className={`border rounded-xl p-4 ${isOpened ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Pli #{idx + 1} — {oeName}</p>
                        {isOpened && (
  <>
    {pli.montant_declare ? (
      <p className="text-xs text-gray-500 mt-0.5">
        Montant déclaré : <strong>{Number(pli.montant_declare).toLocaleString('fr-FR')} DA</strong>
      </p>
    ) : (
      <p className="text-xs text-gray-400 mt-0.5">Montant non renseigné</p>
    )}
    {pli.document_ids && pli.document_ids.length > 0 ? (
      <div className="mt-1">
        <p className="text-xs font-semibold text-gray-600">Documents :</p>
        <ul className="list-disc pl-4 mt-0.5">
          {pli.document_ids.map((docId: string, i: number) => (
            <li key={i} className="text-xs text-[#00738C]">{docId}</li>
          ))}
        </ul>
      </div>
    ) : (
      <p className="text-xs text-gray-400 mt-0.5">Aucun document joint</p>
    )}
  </>
)}
                      </div>
                     {!isOpened && sessionState === 'in_progress' && (
  <div className="flex items-center gap-2">
    <input
      type="number"
      placeholder="Montant déclaré (DA)"
      value={montantInputs[pli.id_soumission] ?? ''}
      onChange={e => setMontantInputs(prev => ({ ...prev, [pli.id_soumission]: e.target.value }))}
      disabled={!prevOpened}
      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs w-44 focus:outline-none disabled:opacity-40"
    />
    <button
      onClick={() => ouvrirPli(pli.id_soumission, montantInputs[pli.id_soumission] ? Number(montantInputs[pli.id_soumission]) : undefined)}
      disabled={!prevOpened}
      className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40"
      style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
      Ouvrir le pli
    </button>
  </div>
)}
                      {isOpened && <span className="text-xs font-bold text-emerald-600">✓ Pli ouvert</span>}
                    </div>

                    {isOpened && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Paraphes des membres :</p>
                        <div className="flex flex-wrap gap-2">
                          {membres.map((m: any) => {
const hasSigned = pli.paraphes?.some((ph: any) => Number(ph.id_utilisateur) === Number(m.id_utilisateur));                            const isMe = m.id_utilisateur === currentMembreId;
                            const plis: any[] = state?.seance?.plis ?? [];
const registreEntries: any[] = state?.registre?.entries ?? [];
console.log('registreEntries:', registreEntries);
console.log('plis:', plis);
                            return (
                              <button key={m.id_utilisateur}
                                onClick={() => {
                                  if (isMe && !hasSigned && sessionState === 'in_progress') {
                                    parapherPli(pli.id_soumission);
                                  }
                                }}
                                disabled={hasSigned || !isMe || sessionState === 'closed'}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  hasSigned
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : isMe
                                      ? 'bg-white border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4]'
                                      : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}>
                                {hasSigned && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                )}
                                {membreLabel(m.role_label, m.id_utilisateur, currentMembreId)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sessionState === 'in_progress' && (
            <div className="flex items-center justify-end gap-3 mt-6">
              {!allPliParaphed && (
                <p className="text-xs text-gray-400">Ouvrez et paraphez tous les plis pour clôturer</p>
              )}
              <button
                onClick={() => cloturerSeance()}
                disabled={!allPliParaphed}
                className="px-6 py-2.5 rounded-xl text-sm font-bold border-2 border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] disabled:opacity-40 disabled:cursor-not-allowed">
                Clôturer la séance
              </button>
            </div>
          )}
        </div>
      )}

      {/* PV Ouverture signing */}
      {sessionState === 'closed' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-1">PV d'Ouverture — signature</h3>
          <p className="text-xs text-gray-500 mb-4">
            Le PV doit être signé par tous les membres avant de passer à la conformité.
          </p>
          {membres.map((m: any) => {
            const sig = signatures.find((s: any) => s.id_utilisateur === m.id_utilisateur);
            const isMe = m.id_utilisateur === currentMembreId;
            return (
              <div key={m.id_utilisateur}
                className={`flex items-center justify-between p-3 rounded-xl border mb-2 ${sig ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {membreLabel(m.role_label, m.id_utilisateur, currentMembreId)}
                  </p>
                  {sig?.reserve && <p className="text-xs text-amber-600 mt-0.5">Réserve : {sig.reserve}</p>}
                </div>
                <div className="flex gap-2">
                  {!sig && isMe && (
                    <>
                      <button onClick={() => setShowPVReserveModal(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-700 bg-amber-50">
                        Réserve
                      </button>
                      <button onClick={() => signerPV('ouverture')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
                        Signer
                      </button>
                    </>
                  )}
                  {!sig && !isMe && (
                    <span className="text-xs text-gray-400">En attente</span>
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

          {allSigned && !pvOuverture?.locked && (
            <button onClick={() => verrouillerPV('ouverture')}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white w-full"
              style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
              Verrouiller le PV et passer à la conformité
            </button>
          )}
          {pvOuverture?.locked && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              PV verrouillé — passez à l'étape Conformité
            </div>
          )}
        </div>
      )}

      {/* Reserve modal */}
      {showPVReserveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Ajouter une réserve</h3>
            <textarea value={pvReserveText} onChange={e => setPvReserveText(e.target.value)}
              placeholder="Contenu de la réserve…" rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setShowPVReserveModal(false); setPvReserveText(''); }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button disabled={!pvReserveText.trim()}
                onClick={() => { signerPV('ouverture', pvReserveText); setShowPVReserveModal(false); setPvReserveText(''); }}
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