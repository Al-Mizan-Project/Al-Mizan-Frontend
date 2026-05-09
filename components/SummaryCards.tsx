'use client';

import { useSoumissions } from '@/lib/soumissions-context';
import type { Dossier } from '@/lib/dossiers-data';

export default function SummaryCards() {
  const { dossiers, loading } = useSoumissions();

  const enAttente = dossiers.filter((d: Dossier) => d.status === 'En attente').length;
  const enCours   = dossiers.filter((d: Dossier) => d.status === 'En cours').length;
  const enRetard  = dossiers.filter((d: Dossier) => d.status === 'En retard').length;
  const pret      = dossiers.filter((d: Dossier) => d.status === 'Prêt').length;

  const total = dossiers.length || 1;

  const cards = [
    {
      label: "Dossiers en attente d'affectation",
      value: enAttente,
      icon: '',
    },
    {
      label: "Dossiers en cours d'évaluation",
      value: enCours,
      icon: '',
    },
    {
      label: 'Dossiers en retard',
      value: enRetard,
      icon: '',
    },
    {
      label: "Dossiers prêts à transmettre à l'administration",
      value: pret,
      icon: '',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 shadow-sm border border-[#C2DDBF] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: '#D6EAD4' }}
        >
          <div className="flex items-start justify-between mb-4">
            <span className="text-xl">{card.icon}</span>
          </div>

          <div
            className="text-4xl font-black mb-1 tabular-nums"
            style={{ color: '#00738C' }}
          >
            {loading ? '—' : card.value}
          </div>

          <p className="text-xs font-semibold leading-snug mb-1" style={{ color: '#1C4532' }}>
            {card.label}
          </p>

          <p className="text-xs" style={{ color: '#81B0B2' }}>
            sur {loading ? '…' : dossiers.length} dossiers au total
          </p>

          <div className="mt-3 h-1.5 rounded-full bg-white/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((card.value / total) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #81B0B2, #00738C)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}