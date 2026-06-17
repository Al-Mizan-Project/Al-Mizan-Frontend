'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

type CheckResult = true | false | null;

function Tristate({ label, value, onChange, locked }: {
  label: string; value: CheckResult; onChange: (v: CheckResult) => void; locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <button disabled={locked} onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${value === true ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
          ✓ Conforme
        </button>
        <button disabled={locked} onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${value === false ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-200 text-gray-500 hover:border-red-300'}`}>
          ✗ Non conforme
        </button>
      </div>
    </div>
  );
}

export default function ConformiteTab({ dossier }: { dossier: Dossier }) {
  const { state, updateConformite } = useEvaluation();

  const entries: any[] = state?.registre?.entries ?? [];
  const conformites: any[] = state?.conformites ?? [];

  const [activeId, setActiveId] = useState<number | null>(
    entries.length > 0 ? entries[0].id_soumission : null
  );
  const [localChecks, setLocalChecks] = useState<Record<number, Record<string, CheckResult>>>({});
  const [showEcarteModal, setShowEcarteModal] = useState(false);
  const [ecarteMotif, setEcarteMotif] = useState('');
  const [saving, setSaving] = useState(false);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">Aucune soumission dans le registre.</p>;
  }

  if (activeId === null) return null;

  const activeEntry = entries.find((e: any) => e.id_soumission === activeId);
  const existingConformite = conformites.find((c: any) => c.id_soumission === activeId);
  const isLocked = !!existingConformite?.resultat;

  const checks = localChecks[activeId] ?? {
    enveloppeAnonyme: existingConformite?.enveloppe_anonyme ?? null,
    documentsCorrects: existingConformite?.documents_corrects ?? null,
    pasPrixTechnique: existingConformite?.pas_prix_technique ?? null,
    eligibleArt75: existingConformite?.eligible_art75 ?? null,
  };

  const setCheck = (key: string, value: CheckResult) => {
    setLocalChecks(prev => ({
      ...prev,
      [activeId]: { ...(prev[activeId] ?? checks), [key]: value },
    }));
  };

  const allChecked =
    checks.enveloppeAnonyme !== null &&
    checks.documentsCorrects !== null &&
    checks.pasPrixTechnique !== null &&
    checks.eligibleArt75 !== null;

  const handleAdmis = async () => {
    setSaving(true);
    try {
      await updateConformite(activeId, {
        enveloppe_anonyme: checks.enveloppeAnonyme,
        documents_corrects: checks.documentsCorrects,
        pas_prix_technique: checks.pasPrixTechnique,
        eligible_art75: checks.eligibleArt75,
        resultat: 'admis',
      });
      setLocalChecks(prev => { const n = { ...prev }; delete n[activeId]; return n; });
    } finally {
      setSaving(false);
    }
  };

  const handleEcarte = async () => {
    if (!ecarteMotif.trim()) return;
    setSaving(true);
    try {
      await updateConformite(activeId, {
        enveloppe_anonyme: checks.enveloppeAnonyme,
        documents_corrects: checks.documentsCorrects,
        pas_prix_technique: checks.pasPrixTechnique,
        eligible_art75: checks.eligibleArt75,
        resultat: 'ecarte',
        motif_ecart: ecarteMotif,
      });
      setShowEcarteModal(false);
      setEcarteMotif('');
      setLocalChecks(prev => { const n = { ...prev }; delete n[activeId]; return n; });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Offer tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {entries.map((e: any) => {
          const c = conformites.find((x: any) => x.id_soumission === e.id_soumission);
          return (
            <button key={e.id_soumission} onClick={() => setActiveId(e.id_soumission)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeId === e.id_soumission
                  ? 'border-[#00738C] bg-[#D6EAD4] text-[#1C4532]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}>
              {c?.resultat === 'admis' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {c?.resultat === 'ecarte' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

        {isLocked ? (
          <div className={`p-3 rounded-xl text-sm font-bold ${
            existingConformite?.resultat === 'admis'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {existingConformite?.resultat === 'admis'
              ? '✓ Admis'
              : `✗ Écarté — ${existingConformite?.motif_ecart}`}
          </div>
        ) : (
          <>
            <h3 className="text-sm font-bold text-gray-800 mb-4">3A — Conformité formelle</h3>
            <div className="border border-gray-100 rounded-xl p-4 mb-6">
              <Tristate label="Enveloppe externe anonyme respectée"
                value={checks.enveloppeAnonyme} onChange={v => setCheck('enveloppeAnonyme', v)} />
              <Tristate label="Documents placés dans les bonnes enveloppes"
                value={checks.documentsCorrects} onChange={v => setCheck('documentsCorrects', v)} />
              <Tristate label="Aucun prix divulgué dans l'enveloppe technique"
                value={checks.pasPrixTechnique} onChange={v => setCheck('pasPrixTechnique', v)} />
            </div>

            <h3 className="text-sm font-bold text-gray-800 mb-4">3B — Éligibilité (Art. 75 & 77)</h3>
            <div className="border border-gray-100 rounded-xl p-4 mb-6">
              <Tristate label="OE non inscrit sur la liste des opérateurs interdits"
                value={checks.eligibleArt75} onChange={v => setCheck('eligibleArt75', v)} />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-bold text-gray-800 mb-3">Résultat de l'examen</p>
              <div className="flex gap-3">
                <button onClick={handleAdmis} disabled={!allChecked || saving}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40">
                  ✓ Admis
                </button>
                <button onClick={() => setShowEcarteModal(true)} disabled={saving}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border-2 border-red-400 text-red-600 hover:bg-red-50 transition-all">
                  ✗ Écarté
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      {conformites.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Récapitulatif</h3>
          {entries.map((e: any) => {
            const c = conformites.find((x: any) => x.id_soumission === e.id_soumission);
            return (
              <div key={e.id_soumission} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{e.nom_oe}</span>
                {c?.resultat ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    c.resultat === 'admis'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {c.resultat === 'admis' ? 'Admis' : `Écarté — ${c.motif_ecart}`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">En attente</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Écarté modal */}
      {showEcarteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Motif d'écartement</h3>
            <textarea value={ecarteMotif} onChange={e => setEcarteMotif(e.target.value)}
              placeholder="Motif obligatoire…" rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowEcarteModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button disabled={!ecarteMotif.trim() || saving} onClick={handleEcarte}
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