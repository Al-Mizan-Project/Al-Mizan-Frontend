'use client';

import { Dossier, DossierStatus } from '@/lib/dossiers-data';

// ─── Badge configs ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<DossierStatus, { bg: string; text: string; dot: string }> = {
  'En attente': {
    bg: 'bg-amber-50 border border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  'En cours': {
    bg: 'bg-blue-50 border border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  'En retard': {
    bg: 'bg-red-50 border border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  'Prêt': {
    bg: 'bg-emerald-50 border border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

const ETAPE_BADGE: Record<string, { bg: string; text: string }> = {
  Soumis:       { bg: 'bg-slate-100',   text: 'text-slate-600' },
  'En analyse': { bg: 'bg-violet-50 border border-violet-200',   text: 'text-violet-700' },
  Vérification: { bg: 'bg-sky-50 border border-sky-200',         text: 'text-sky-700' },
  Évaluation:   { bg: 'bg-orange-50 border border-orange-200',   text: 'text-orange-700' },
  Clôturé:      { bg: 'bg-[#D6EAD4] border border-[#97A675]',   text: 'text-[#1C4532]' },
};

// ─── Action config type ──────────────────────────────────────────────────────

export interface ActionButton {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: (dossier: Dossier) => void;
}

export interface ActionConfig {
  buttons: ActionButton[];
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface DossierTableProps {
  data: Dossier[];
  actionConfig: ActionConfig;
  currentPage: number;
  rowsPerPage?: number;
}

// ─── Button styles ────────────────────────────────────────────────────────────

const BTN_STYLES: Record<ActionButton['variant'], string> = {
  primary:
    'bg-[#00738C] hover:bg-[#005f75] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md',
  secondary:
    'border border-[#00738C] text-[#00738C] hover:bg-[#D6EAD4] text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
  danger:
    'bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DossierTable({
  data,
  actionConfig,
  currentPage,
  rowsPerPage = 5,
}: DossierTableProps) {
  const paginated = data;

  if (paginated.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">📭</span>
        <p className="text-sm font-medium">Aucun dossier trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#F4F7F4] border-b border-gray-100">
            {[
              'Référence Dossier',
              'Opérateur Économique',
              'Validateur',
              'Date de soumission',
              'Délai d\'évaluation',
              'Étape',
              'Statut',
              'Action',
            ].map((col) => (
              <th
                key={col}
                className="text-left px-5 py-3.5 text-xs font-700 uppercase tracking-wider text-[#1C4532] whitespace-nowrap first:rounded-tl-2xl last:rounded-tr-2xl"
                style={{ fontWeight: 700 }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-50">
          {paginated.map((row, i) => {
            const statusStyle = STATUS_BADGE[row.status];
            const etapeStyle  = ETAPE_BADGE[row.etape] ?? ETAPE_BADGE['Soumis'];

            return (
              <tr
                key={row.id}
                className={`hover:bg-[#F9FBF9] transition-colors group ${
                  i === paginated.length - 1 ? 'last:rounded-b-2xl' : ''
                }`}
              >
                {/* Reference */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <p className="font-bold text-[#1C4532] text-sm">{row.reference}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{row.id}</p>
                </td>

                {/* Operator */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}
                    >
                      {row.operateur.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{row.operateur}</span>
                  </div>
                </td>

                {/* Validator */}
                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                  {row.validateur ?? '-'}
                </td>

                {/* Date */}
                <td className="px-5 py-4 whitespace-nowrap text-gray-600 text-sm">
                  {new Date(row.dateSoumission).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>

                {/* Délai */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-[#00738C]">{row.delaiEvaluation}</span>
                </td>

                {/* Étape badge */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-600 ${etapeStyle.bg} ${etapeStyle.text}`}
                    style={{ fontWeight: 600 }}>
                    {row.etape}
                  </span>
                </td>

                {/* Status badge */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-600 ${statusStyle.bg} ${statusStyle.text}`}
                    style={{ fontWeight: 600 }}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
                    {row.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {actionConfig.buttons.map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => btn.onClick(row)}
                        className={BTN_STYLES[btn.variant]}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}