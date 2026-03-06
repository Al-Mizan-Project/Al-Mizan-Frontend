'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const retardData = [
  { name: '>7 jours', value: 8 },
  { name: '3–7 jours', value: 14 },
  { name: "Aujourd'hui", value: 1 },
];

const employeesData = [
  {
    name: 'A. Benali',
    enCours: 12,
    enRetard: 3,
    pret: 7,
  },
  {
    name: 'S. Hadj',
    enCours: 9,
    enRetard: 5,
    pret: 11,
  },
  {
    name: 'K. Meziane',
    enCours: 15,
    enRetard: 1,
    pret: 9,
  },
  {
    name: 'L. Ouali',
    enCours: 7,
    enRetard: 4,
    pret: 6,
  },
  {
    name: 'M. Tebbal',
    enCours: 11,
    enRetard: 2,
    pret: 13,
  },
];

const CustomTooltipRetard = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold mb-1" style={{ color: '#1C4532' }}>{label}</p>
        <p style={{ color: '#97A675' }}>{payload[0].value} dossiers</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipEmployees = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold mb-2" style={{ color: '#1C4532' }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.fill }} className="flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function BarCharts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Chart 1 - Retard par durée */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-base font-black" style={{ color: '#1C4532' }}>
              Dossiers en retard par durée
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution temporelle</p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: '#D6EAD4', color: '#1C4532' }}
          >
            23 total
          </span>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={retardData} barSize={52} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltipRetard />} cursor={{ fill: 'rgba(151,166,117,0.08)' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {retardData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={index === 0 ? '#1C4532' : index === 1 ? '#97A675' : '#81B0B2'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 justify-center">
          {[
            { color: '#1C4532', label: '>7 jours' },
            { color: '#97A675', label: '3–7 jours' },
            { color: '#81B0B2', label: "Aujourd'hui" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2 - Par employés */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-base font-black" style={{ color: '#1C4532' }}>
              Dossiers affectés par employés
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Répartition par statut</p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: '#D6EAD4', color: '#1C4532' }}
          >
            5 évaluateurs
          </span>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={employeesData} barSize={14} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltipEmployees />} cursor={{ fill: 'rgba(151,166,117,0.06)' }} />
            <Bar dataKey="enCours" name="En cours d'évaluation" fill="#97A675" radius={[5, 5, 0, 0]} />
            <Bar dataKey="enRetard" name="En retard" fill="#81B0B2" radius={[5, 5, 0, 0]} />
            <Bar dataKey="pret" name="Prêt à transmettre" fill="#00738C" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 justify-center flex-wrap">
          {[
            { color: '#97A675', label: "En cours d'évaluation" },
            { color: '#81B0B2', label: 'En retard' },
            { color: '#00738C', label: 'Prêt à transmettre' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}