'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DossierTable, { ActionConfig } from '@/components/DossierTable';
import Pagination from '@/components/Pagination';
import { Dossier } from '@/lib/dossiers-data';
import { useSoumissions } from '@/lib/soumissions-context';

// ─── Mock: dossiers assigned to this evaluateur ───────────────────────────────
// In real app this would be filtered by logged-in user id
// Now using all dossiers from API

const RETARD_CHART_DATA = [
  { name: '> 7',        value: 3 },
  { name: '3–7',        value: 5 },
  { name: '< 3',        value: 2 },
  { name: "Aujourd'hui",value: 2 },
];

const ROWS_PER_PAGE = 5;

// ─── Action handlers ──────────────────────────────────────────────────────────
const enCoursActions = {
  buttons: [{
    label: 'Soumettre',
    variant: 'primary' as const,
    onClick: (d: Dossier) => console.log('[Soumettre]', d.reference),
  }, {
    label: 'Voir',
    variant: 'secondary' as const,
    onClick: (d: Dossier) => console.log('[Voir]', d.reference),
  }],
};

const enRetardActions = {
  buttons: [{
    label: 'Voir',
    variant: 'danger' as const,
    onClick: (d: Dossier) => console.log('[Voir retard]', d.reference),
  }],
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg text-sm">
        <p className="font-bold text-[#1C4532] mb-1">{label}</p>
        <p style={{ color: '#97A675' }}>{payload[0].value} dossiers</p>
      </div>
    );
  }
  return null;
};

// ─── Summary card ─────────────────────────────────────────────────────────────
function SummaryCard({ title, value, icon, accent }: { title: string; value: number; icon: string; accent: string }) {
  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition-all">
      
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-4xl font-black tabular-nums" style={{ color: accent }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Aperçu content ───────────────────────────────────────────────────────────
function ApercuContent({ enCoursCount, enRetardCount }: { enCoursCount: number; enRetardCount: number }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="flex gap-5">
        <SummaryCard
          title="Mes dossiers en cours d'évaluation"
          value={enCoursCount}
          icon="🔄"
          accent="#00738C"
        />
        <SummaryCard
          title="Mes dossiers en retard"
          value={enRetardCount}
          icon="⚠️"
          accent="#EF4444"
        />
      </div>

      {/* Chart card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" style={{ maxWidth: '600px' }}>
        <h3 className="text-base font-black text-[#1C4532] mb-1">Dossiers en retard par durée</h3>

        {/* Legend */}
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#97A675] flex-shrink-0" />
          <span className="text-xs text-gray-500">Nombre de dossiers en retard</span>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={RETARD_CHART_DATA} barSize={48} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 50]}
              tickCount={6}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(151,166,117,0.08)' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {RETARD_CHART_DATA.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === 0 ? '#1C4532' : i === 1 ? '#97A675' : i === 2 ? '#81B0B2' : '#00738C'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Table tab content ────────────────────────────────────────────────────────
function TableContent({
  data,
  actionConfig,
  emptyIcon,
  emptyLabel,
}: {
  data: Dossier[];
  actionConfig: ActionConfig;
  emptyIcon: string;
  emptyLabel: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / ROWS_PER_PAGE));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}
        >
          {data.length}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">{emptyLabel}</h3>
          <p className="text-xs text-gray-400">
            {data.length} dossier{data.length !== 1 ? 's' : ''} trouvé{data.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <span className="text-5xl">{emptyIcon}</span>
          <p className="text-sm font-medium">{emptyLabel}</p>
        </div>
      ) : (
        <>
          <DossierTable
            data={data}
            actionConfig={actionConfig}
            currentPage={currentPage}
            rowsPerPage={ROWS_PER_PAGE}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={data.length}
            rowsPerPage={ROWS_PER_PAGE}
          />
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VuePersonnelleView() {
  const { dossiers: MES_DOSSIERS, loading, error } = useSoumissions();
  const [activeTab, setActiveTab] = useState<'apercu' | 'en-cours' | 'en-retard'>('apercu');

  if (loading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  const EN_COURS_DATA  = MES_DOSSIERS.filter(d => d.status === 'En cours');
  const EN_RETARD_DATA = MES_DOSSIERS.filter(d => d.status === 'En retard');

  const TABS = [
    { id: 'apercu'     as const, label: 'Aperçu',    badge: null },
    { id: 'en-cours'   as const, label: 'En Cours',  badge: EN_COURS_DATA.length },
    { id: 'en-retard'  as const, label: 'En Retard', badge: EN_RETARD_DATA.length },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Tab row */}
      <div className="bg-white border-b border-gray-100 -mx-6 -mt-6 px-8 mb-6 flex items-center gap-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold relative transition-all duration-200 ${
                isActive ? 'text-[#00738C]' : 'text-gray-500 hover:text-[#1C4532]'
              }`}
            >
              {tab.label}
              {tab.badge !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-[#D6EAD4] text-[#1C4532]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#00738C' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'apercu' && <ApercuContent enCoursCount={EN_COURS_DATA.length} enRetardCount={EN_RETARD_DATA.length} />}
      {activeTab === 'en-cours' && (
        <TableContent
          data={EN_COURS_DATA}
          actionConfig={enCoursActions}
          emptyIcon="📭"
          emptyLabel="Mes dossiers en cours d'évaluation"
        />
      )}
      {activeTab === 'en-retard' && (
        <TableContent
          data={EN_RETARD_DATA}
          actionConfig={enRetardActions}
          emptyIcon="✅"
          emptyLabel="Mes dossiers en retard"
        />
      )}
    </div>
  );
}