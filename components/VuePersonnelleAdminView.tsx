'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DOSSIERS, Dossier } from '@/lib/dossiers-data';
import Pagination from '@/components/Pagination';

// ─── Assigned dossier pool for this evaluateur admin ─────────────────────────
const ASSIGNED_REFS = [
  'REF-2024-0022', 'REF-2024-0023', 'REF-2024-0024', 'REF-2024-0025', 'REF-2024-0026',
  'REF-2024-0011', 'REF-2024-0012', 'REF-2024-0013', 'REF-2024-0014', 'REF-2024-0015',
];
const MY_DOSSIERS = DOSSIERS.filter(d => ASSIGNED_REFS.includes(d.reference));
const EN_COURS    = MY_DOSSIERS.filter(d => d.status === 'En cours');
const EN_RETARD   = MY_DOSSIERS.filter(d => d.status === 'En retard');

const ROWS_PER_PAGE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function joursDeRetard(d: Dossier): number {
  const soumis   = new Date(d.dateSoumission);
  const delai    = parseInt(d.delaiEvaluation);
  const echeance = new Date(soumis.getTime() + delai * 24 * 60 * 60 * 1000);
  const diff = Math.floor((Date.now() - echeance.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff); // always at least 1j if retard
}

function buildChartData() {
  let gt7 = 0, b3_7 = 0, lt3 = 0, today = 0;
  EN_RETARD.forEach(d => {
    const j = joursDeRetard(d);
    if (j === 0)     today++;
    else if (j < 3)  lt3++;
    else if (j <= 7) b3_7++;
    else             gt7++;
  });
  return [
    { label: '> 7',        value: gt7,   fill: '#EF4444' },
    { label: '3–7',        value: b3_7,  fill: '#F97316' },
    { label: '< 3',        value: lt3,   fill: '#EAB308' },
    { label: "Aujourd'hui", value: today, fill: '#3B82F6' },
  ];
}

const CHART_DATA = buildChartData();

const STATUS_BADGE: Record<string, string> = {
  'En cours':   'text-blue-700',
  'En retard':  'text-red-600',
  'En attente': 'text-amber-700',
  'Prêt':       'text-emerald-700',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-gray-500">{payload[0].value} dossier{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

type Tab     = 'apercu' | 'en-cours' | 'en-retard';
type SortDir = 'asc' | 'desc' | null;

function ColHeader({ label, sortKey, sortBy, sortDir, onSort }: {
  label: string; sortKey: string;
  sortBy: string | null; sortDir: SortDir;
  onSort: (k: string) => void;
}) {
  const active = sortBy === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-bold text-gray-600 uppercase tracking-wider hover:text-[#1C4532] transition-colors"
    >
      {label}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className={active ? 'text-[#1C4532]' : 'text-gray-400'}>
        <polyline points={(!active || sortDir === 'asc') ? '6 9 12 15 18 9' : '18 15 12 9 6 15'} />
      </svg>
    </button>
  );
}

// ─── En Cours table ───────────────────────────────────────────────────────────
function EnCoursTable({ onVoir }: { onVoir: (d: Dossier) => void }) {
  const [sortBy,  setSortBy]  = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page,    setPage]    = useState(1);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    const list = [...EN_COURS];
    if (!sortBy) return list;
    return list.sort((a, b) => {
      const av = sortBy === 'reference' ? a.reference : sortBy === 'operateur' ? a.operateur
               : sortBy === 'date' ? a.dateSoumission : sortBy === 'delai' ? a.delaiEvaluation : a.status;
      const bv = sortBy === 'reference' ? b.reference : sortBy === 'operateur' ? b.operateur
               : sortBy === 'date' ? b.dateSoumission : sortBy === 'delai' ? b.delaiEvaluation : b.status;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [sortBy, sortDir]);

  const total = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const paged = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-[#F4F7F4]">
              <th className="px-4 py-3 w-8" />
              <th className="px-4 py-3 text-left"><ColHeader label="Dossier" sortKey="reference" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><ColHeader label="Opérateur Économique" sortKey="operateur" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><ColHeader label="Date d'affectation" sortKey="date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><ColHeader label="Délai d'évaluation" sortKey="delai" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><ColHeader label="Status" sortKey="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(d => (
              <tr key={d.id} onClick={() => onVoir(d)}
                className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors">
                <td className="px-4 py-3 text-gray-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">{d.reference}</p>
                  <p className="text-xs text-gray-400">{d.id}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.operateur}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{d.dateSoumission}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{d.delaiEvaluation}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${STATUS_BADGE[d.status]}`}>{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 1 && <Pagination currentPage={page} totalPages={total} onPageChange={setPage} totalItems={EN_COURS.length} rowsPerPage={ROWS_PER_PAGE} />}
    </div>
  );
}

// ─── En Retard table ──────────────────────────────────────────────────────────
function EnRetardTable({ onVoir }: { onVoir: (d: Dossier) => void }) {
  const [sortBy,  setSortBy]  = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page,    setPage]    = useState(1);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  };

  const withRetard = useMemo(() => EN_RETARD.map(d => ({ ...d, joursRetard: joursDeRetard(d) })), []);

  const sorted = useMemo(() => {
    const list = [...withRetard];
    if (!sortBy) return list;
    return list.sort((a, b) => {
      if (sortBy === 'retard') return sortDir === 'asc' ? a.joursRetard - b.joursRetard : b.joursRetard - a.joursRetard;
      const av = sortBy === 'reference' ? a.reference : sortBy === 'operateur' ? a.operateur : a.status;
      const bv = sortBy === 'reference' ? b.reference : sortBy === 'operateur' ? b.operateur : b.status;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [sortBy, sortDir, withRetard]);

  const total = Math.ceil(sorted.length / ROWS_PER_PAGE);
  const paged = sorted.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-[#F4F7F4]">
              <th className="px-4 py-3 w-8" />
              <th className="px-4 py-3 text-left"><ColHeader label="Dossier" sortKey="reference" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><ColHeader label="Opérateur Économique" sortKey="operateur" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><ColHeader label="Jours de retard" sortKey="retard" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="px-4 py-3 text-left"><ColHeader label="Status" sortKey="status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(d => (
              <tr key={d.id} onClick={() => onVoir(d)}
                className="border-b border-gray-50 hover:bg-red-50/40 cursor-pointer transition-colors">
                <td className="px-4 py-3 text-gray-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">{d.reference}</p>
                  <p className="text-xs text-gray-400">{d.id}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.operateur}</td>
                <td className="px-4 py-3">
                  <span className="text-sm font-bold text-red-600">{d.joursRetard}j</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${STATUS_BADGE[d.status]}`}>{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 1 && <Pagination currentPage={page} totalPages={total} onPageChange={setPage} totalItems={EN_RETARD.length} rowsPerPage={ROWS_PER_PAGE} />}
    </div>
  );
}

// ─── Aperçu tab ───────────────────────────────────────────────────────────────
function ApercuTab({ onTabChange }: { onTabChange: (t: Tab) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <button onClick={() => onTabChange('en-cours')}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:border-blue-200 transition-all group">
          <p className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">Mes dossiers en cours d'évaluation</p>
          <p className="text-4xl font-black mt-2" style={{ color: '#1C4532' }}>{EN_COURS.length}</p>
        </button>
        <button onClick={() => onTabChange('en-retard')}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:border-red-200 transition-all group">
          <p className="text-sm text-gray-500 group-hover:text-red-600 transition-colors">Mes dossiers en retard</p>
          <p className="text-4xl font-black mt-2 text-red-600">{EN_RETARD.length}</p>
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-xl">
        <h3 className="text-sm font-bold text-gray-700 mb-1">Dossiers en retards par durée</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-400">Nombre de dossiers en retard</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={CHART_DATA} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {CHART_DATA.map((e, i) => <Cell key={i} fill={e.value === 0 ? '#E5E7EB' : e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface Props { onVoirDossier: (d: Dossier) => void; }

export default function VuePersonnelleAdminView({ onVoirDossier }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('apercu');

  const TABS = [
    { id: 'apercu'    as Tab, label: 'Aperçu' },
    { id: 'en-cours'  as Tab, label: 'En Cours',  count: EN_COURS.length },
    { id: 'en-retard' as Tab, label: 'En Retard', count: EN_RETARD.length, red: true },
  ];

  return (
    <div className="flex flex-col gap-0">
      <div className="border-b border-gray-200 -mx-6 -mt-6 px-6 mb-6 flex items-center gap-0 bg-white">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold relative transition-all ${
              activeTab === tab.id ? 'text-[#00738C]' : 'text-gray-500 hover:text-gray-800'
            }`}>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? tab.red ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#00738C' }} />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'apercu'    && <ApercuTab onTabChange={setActiveTab} />}
      {activeTab === 'en-cours'  && <EnCoursTable onVoir={onVoirDossier} />}
      {activeTab === 'en-retard' && <EnRetardTable onVoir={onVoirDossier} />}
    </div>
  );
}