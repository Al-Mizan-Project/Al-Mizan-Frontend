'use client';

const cards = [
  {
    label: "Dossiers en attente d'affectation",
    value: 48,
    change: '+12%',
    positive: false,
    icon: '⏳',
    sub: 'vs mois dernier',
  },
  {
    label: "Dossiers en cours d'évaluation",
    value: 127,
    change: '+8%',
    positive: true,
    icon: '🔄',
    sub: 'vs mois dernier',
  },
  {
    label: 'Dossiers en retard',
    value: 23,
    change: '-3%',
    positive: false,
    icon: '⚠️',
    sub: 'vs mois dernier',
  },
  {
    label: "Dossiers prêts à transmettre à l'administration",
    value: 61,
    change: '+21%',
    positive: true,
    icon: '✅',
    sub: 'vs mois dernier',
  },
];

export default function SummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 shadow-sm border border-[#C2DDBF] hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: '#D6EAD4' }}
        >
          <div className="flex items-start justify-between mb-4">
          
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: card.positive ? 'rgba(0,115,140,0.12)' : 'rgba(220,38,38,0.1)',
                color: card.positive ? '#00738C' : '#DC2626',
              }}
            >
              {card.change}
            </span>
          </div>

          <div
            className="text-4xl font-black mb-1 tabular-nums"
            style={{ color: '#00738C' }}
          >
            {card.value}
          </div>

          <p
            className="text-xs font-semibold leading-snug mb-1"
            style={{ color: '#1C4532' }}
          >
            {card.label}
          </p>

          <p
            className="text-xs"
            style={{ color: '#81B0B2' }}
          >
            {card.sub}
          </p>

          {/* Mini progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-white/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min((card.value / 150) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #81B0B2, #00738C)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}