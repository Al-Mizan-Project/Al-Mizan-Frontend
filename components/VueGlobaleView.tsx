'use client';

import { useState, useMemo } from 'react';
import SummaryCards from '@/components/SummaryCards';
import BarCharts from '@/components/BarCharts';
import TabPanel from '@/components/TabPanel';
import { DossierStatus } from '@/lib/dossiers-data';
import { ActionConfig } from '@/components/DossierTable';
import { useSoumissions } from '@/lib/soumissions-context';

// ─── Action handlers ──────────────────────────────────────────────────────────
const handleAffecter   = (d: any) => console.log('[Affecter]',   d.reference);
const handleReaffecter = (d: any) => console.log('[Réaffecter]', d.reference);
const handleTransmettre = (d: any) => console.log('[Transmettre]', d.reference);
const handleVoir        = (d: any) => console.log('[Voir]',        d.reference);

const ACTION_CONFIGS: Record<string, ActionConfig> = {
  'en-attente': { buttons: [{ label: 'Affecter',    variant: 'primary',   onClick: handleAffecter }] },
  'en-cours':   { buttons: [{ label: 'Réaffecter',  variant: 'secondary', onClick: handleReaffecter }] },
  'en-retard':  { buttons: [{ label: 'Réaffecter',  variant: 'danger',    onClick: handleReaffecter }] },
  'prets':      { buttons: [
    { label: 'Transmettre', variant: 'primary',   onClick: handleTransmettre },
    { label: 'Voir',        variant: 'secondary', onClick: handleVoir },
  ]},
};

// ─── Tab config ───────────────────────────────────────────────────────────────
interface TabDef {
  id: string;
  label: string;
  status?: DossierStatus;
}

const TABS: TabDef[] = [
  { id: 'apercu',      label: 'Aperçu' },
  { id: 'en-attente',  label: 'En Attente',  status: 'En attente' },
  { id: 'en-cours',    label: 'En Cours',    status: 'En cours' },
  { id: 'en-retard',   label: 'En Retard',   status: 'En retard' },
  { id: 'prets',       label: 'Prêts',       status: 'Prêt' },
];

export default function VueGlobaleView() {
  const { dossiers: DOSSIERS, loading, error } = useSoumissions();
  const [activeTab, setActiveTab] = useState('apercu');

  const STATUS_COUNTS: Record<string, number> = {
    'en-attente': DOSSIERS.filter(d => d.status === 'En attente').length,
    'en-cours':   DOSSIERS.filter(d => d.status === 'En cours').length,
    'en-retard':  DOSSIERS.filter(d => d.status === 'En retard').length,
    'prets':      DOSSIERS.filter(d => d.status === 'Prêt').length,
  };

  const filteredData = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab);
    if (!tab?.status) return [];
    return DOSSIERS.filter(d => d.status === tab.status);
  }, [activeTab, DOSSIERS]);

  if (loading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="flex flex-col gap-0">
      {/* ── Tabs row (inline under the TopBar) ── */}
      <div className="bg-white border-b border-gray-100 -mx-6 -mt-6 px-8 mb-6 flex items-center gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.status ? STATUS_COUNTS[tab.id] : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold relative transition-all duration-200 ${
                isActive ? 'text-[#00738C]' : 'text-gray-500 hover:text-[#1C4532]'
              }`}
            >
              {tab.label}
              {count !== null && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#D6EAD4] text-[#1C4532]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#00738C' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Aperçu: cards + charts ── */}
      {activeTab === 'apercu' && (
        <div className="flex flex-col gap-6">
          <SummaryCards />
          <BarCharts />
        </div>
      )}

      {/* ── Status tabs: table ── */}
      {activeTab !== 'apercu' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Card header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1C4532, #00738C)' }}
              >
                {filteredData.length}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  {TABS.find(t => t.id === activeTab)?.label}
                </h3>
                <p className="text-xs text-gray-400">
                  {filteredData.length} dossier{filteredData.length !== 1 ? 's' : ''} trouvé{filteredData.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Rechercher un dossier…"
              className="text-xs px-3 py-2 rounded-xl border border-gray-200 bg-[#F4F7F4] focus:outline-none focus:border-[#97A675] focus:bg-white transition-all w-52 placeholder-gray-400"
              style={{ color: '#1C4532' }}
            />
          </div>

          <TabPanel
            key={activeTab}
            data={filteredData}
            actionConfig={ACTION_CONFIGS[activeTab]}
          />
        </div>
      )}
    </div>
  );
}