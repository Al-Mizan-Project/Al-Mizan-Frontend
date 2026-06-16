'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import { useEvaluation } from '@/lib/evaluation-context';

const CAPACITY_ITEMS = [
  { id: 'cap_fin_ref',  category: 'Financière',      label: 'Bilans financiers des 3 dernières années fournis' },
  { id: 'cap_fin_ca',   category: 'Financière',      label: "Chiffre d'affaires minimum requis atteint" },
  { id: 'cap_fin_bank', category: 'Financière',      label: 'Garantie bancaire ou attestation de solvabilité' },
  { id: 'cap_tec_ref',  category: 'Technique',       label: 'Références de projets similaires (3 dernières années)' },
  { id: 'cap_tec_qual', category: 'Technique',       label: 'Certifications et qualifications techniques requises' },
  { id: 'cap_tec_team', category: 'Technique',       label: 'Moyens humains qualifiés justifiés' },
  { id: 'cap_pro_reg',  category: 'Professionnelle', label: 'Inscription au registre de commerce valide' },
  { id: 'cap_pro_nif',  category: 'Professionnelle', label: 'NIF et attestation fiscale à jour' },
  { id: 'cap_pro_aff',  category: 'Professionnelle', label: 'Affiliation CNAS/CASNOS à jour' },
];

const CATEGORIES = ['Financière', 'Technique', 'Professionnelle'];

export default function CapacitesTab({ dossier }: { dossier: Dossier }) {
  const { state, updateCapacites } = useEvaluation();

  const entries: any[] = state?.registre?.entries ?? [];
  const admittedIds = new Set(
    (state?.conformites ?? [])
      .filter((c: any) => c.resultat === 'admis')
      .map((c: any) => c.id_soumission)
  );
  const admittedEntries = entries.filter((e: any) => admittedIds.has(e.id_soumission));
  const capacites: any[] = state?.capacites ?? [];

  const [activeId, setActiveId] = useState<number | null>(
    admittedEntries.length > 0 ? admittedEntries[0].id_soumission : null
  );
  const [localItems, setLocalItems] = useState<Record<number, Record<string, boolean | null>>>({});
  const [localJustif, setLocalJustif] = useState<Record<number, string>>({});
  const [showInsuffisantModal, setShowInsuffisantModal] = useState(false);
  const [insuffisantMotif, setInsuffisantMotif] = useState('');
  const [saving, setSaving] = useState(false);

  if (admittedEntries.length === 0) {
    return <p className="text-sm text-gray-400">Aucune offre admise en conformité.</p>;
  }

  if (activeId === null) return null;

  const activeEntry = admittedEntries.find((e: any) => e.id_soumission === activeId);
  const existing = capacites.find((c: any) => c.id_soumission === activeId);
  const isLocked = !!existing?.resultat;

  const savedItems: Record<string, boolean | null> = existing?.items_results ?? {};
  const items = localItems[activeId] ?? Object.fromEntries(
    CAPACITY_ITEMS.map(i => [i.id, savedItems[i.id] ?? null])
  );
  const justif = localJustif[activeId] ?? existing?.justification ?? '';

  const setItem = (key: string, value: boolean) => {
    setLocalItems(prev => ({
      ...prev,
      [activeId]: { ...(prev[activeId] ?? items), [key]: value },
    }));
  };

  const allItemsEvaluated = CAPACITY_ITEMS.every(i => items[i.id] !== null && items[i.id] !== undefined);

  const handleSuffisant = async () => {
    setSaving(true);
    try {
      await updateCapacites(activeId, {
        id_soumission: activeId,
        items_results: items,
        justification: justif,
        resultat: 'suffisant',
        motif: '',
      });
      setLocalItems(prev => { const n = { ...prev }; delete n[activeId]; return n; });
      setLocalJustif(prev => { const n = { ...prev }; delete n[activeId]; return n; });
    } finally {
      setSaving(false);
    }
  };

  const handleInsuffisant = async () => {
    if (!insuffisantMotif.trim()) return;
    setSaving(true);
    try {
      await updateCapacites(activeId, {
        id_soumission: activeId,
        items_results: items,
        justification: justif,
        resultat: 'insuffisant',
        motif: insuffisantMotif,
      });
      setShowInsuffisantModal(false);
      setInsuffisantMotif('');
      setLocalItems(prev => { const n = { ...prev }; delete n[activeId]; return n; });
      setLocalJustif(prev => { const n = { ...prev }; delete n[activeId]; return n; });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Offer tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {admittedEntries.map((e: any) => {
          const c = capacites.find((x: any) => x.id_soumission === e.id_soumission);
          return (
            <button key={e.id_soumission} onClick={() => setActiveId(e.id_soumission)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeId === e.id_soumission
                  ? 'border-[#00738C] bg-[#D6EAD4] text-[#1C4532]'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}>
              {c?.resultat === 'suffisant' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {c?.resultat === 'insuffisant' && (
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
            existing?.resultat === 'suffisant'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {existing?.resultat === 'suffisant'
              ? '✓ Capacités suffisantes'
              : `✗ Insuffisant — ${existing?.motif}`}
          </div>
        ) : (
          <>
            {CATEGORIES.map(cat => (
              <div key={cat} className="mb-6 last:mb-0">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Capacités {cat}s</h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {CAPACITY_ITEMS.filter(i => i.category === cat).map(item => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setItem(item.id, true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            items[item.id] === true
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                              : 'border-gray-200 text-gray-500 hover:border-emerald-300'
                          }`}>
                          ✓ Oui
                        </button>
                        <button onClick={() => setItem(item.id, false)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            items[item.id] === false
                              ? 'bg-red-100 border-red-300 text-red-700'
                              : 'border-gray-200 text-gray-500 hover:border-red-300'
                          }`}>
                          ✗ Non
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-2 mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-1">Observations / justifications</p>
              <textarea value={justif}
                onChange={e => setLocalJustif(prev => ({ ...prev, [activeId]: e.target.value }))}
                placeholder="Commentaires sur les capacités de l'OE…" rows={2}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none resize-none" />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-bold text-gray-800 mb-3">Résultat de l'examen des capacités</p>
              <div className="flex gap-3">
                <button onClick={handleSuffisant} disabled={!allItemsEvaluated || saving}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40">
                  ✓ Capacités suffisantes
                </button>
                <button onClick={() => setShowInsuffisantModal(true)} disabled={saving}
                  className="flex-1 py-2 rounded-xl text-sm font-bold border-2 border-red-400 text-red-600 hover:bg-red-50 transition-all">
                  ✗ Capacités insuffisantes
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      {capacites.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Récapitulatif</h3>
          {admittedEntries.map((e: any) => {
            const c = capacites.find((x: any) => x.id_soumission === e.id_soumission);
            return (
              <div key={e.id_soumission} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{e.nom_oe}</span>
                {c?.resultat ? (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    c.resultat === 'suffisant'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {c.resultat === 'suffisant' ? 'Capacités suffisantes' : `Insuffisant — ${c.motif}`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">En attente</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Insuffisant modal */}
      {showInsuffisantModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h3 className="text-lg font-black text-gray-800 mb-3">Motif d'insuffisance</h3>
            <textarea value={insuffisantMotif} onChange={e => setInsuffisantMotif(e.target.value)}
              placeholder="Motif obligatoire…" rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowInsuffisantModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                Annuler
              </button>
              <button disabled={!insuffisantMotif.trim() || saving} onClick={handleInsuffisant}
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