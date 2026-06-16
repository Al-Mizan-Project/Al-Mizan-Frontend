'use client';

import { useMemo, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Dossier } from '@/lib/dossiers-data';
import { SoumissionsContext } from '@/lib/soumissions-context';
import { useCommission } from '@/lib/commission-context';

function joursDeRetard(d: Dossier): number {
  const soumis   = new Date(d.dateSoumission);
  const delai    = parseInt(d.delaiEvaluation);
  const echeance = new Date(soumis.getTime() + delai * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.floor((Date.now() - echeance.getTime()) / (1000 * 60 * 60 * 24)));
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-gray-500">{payload[0].value} dossier{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

interface Props {
  onVoirDossier: (d: Dossier) => void;
  onGoToMesDossiers: () => void;
}

export default function VuePersonnelleCOPEOView({ onVoirDossier, onGoToMesDossiers }: Props) {
  const ctx = useContext(SoumissionsContext);
  const { commission } = useCommission();
  const dossiers = ctx?.dossiers ?? [];

  const EN_COURS  = dossiers.filter(d => d.status === 'En cours');
  const EN_RETARD = dossiers.filter(d => d.status === 'En retard');

  const commissionDossier: Dossier | null = commission ? {
    id: String(commission.id_comission),
    reference: commission.nom_comission,
    operateur: `${dossiers.length} soumission${dossiers.length !== 1 ? 's' : ''}`,
    dateSoumission: dossiers[0]?.dateSoumission ?? '—',
    delaiEvaluation: '—',
    etape: 'Évaluation',
    status: dossiers.some(d => d.status === 'En cours') ? 'En cours' : 'En attente',
    commissionId: commission.id_comission,
  } : null;

  const chartData = useMemo(() => {
    let gt7 = 0, b3_7 = 0, lt3 = 0, today = 0;
    EN_RETARD.forEach(d => {
      const j = joursDeRetard(d);
      if (j === 0) today++; else if (j < 3) lt3++; else if (j <= 7) b3_7++; else gt7++;
    });
    return [
      { label: '> 7',         value: gt7,   fill: '#EF4444' },
      { label: '3–7',         value: b3_7,  fill: '#F97316' },
      { label: '< 3',         value: lt3,   fill: '#EAB308' },
      { label: "Aujourd'hui", value: today, fill: '#3B82F6' },
    ];
  }, [EN_RETARD]);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <button onClick={onGoToMesDossiers}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:border-blue-200 transition-all">
          <p className="text-sm text-gray-500">Dossiers en cours d'évaluation</p>
          <p className="text-4xl font-black mt-2" style={{ color: '#1C4532' }}>{EN_COURS.length}</p>
        </button>
        <button onClick={onGoToMesDossiers}
          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:border-red-200 transition-all">
          <p className="text-sm text-gray-500">Dossiers en retard</p>
          <p className="text-4xl font-black mt-2 text-red-600">{EN_RETARD.length}</p>
        </button>
      </div>

      {/* Retard chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-xl">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Dossiers en retard par durée</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((e, i) => <Cell key={i} fill={e.value === 0 ? '#E5E7EB' : e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Commission card */}
      {commissionDossier && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm max-w-xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ma commission active</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">{commissionDossier.reference}</p>
              <p className="text-xs text-gray-400 mt-0.5">{commissionDossier.operateur}</p>
            </div>
            <button onClick={() => onVoirDossier(commissionDossier)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}>
              Ouvrir la séance
            </button>
          </div>
        </div>
      )}
    </div>
  );
}