'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import VueGlobaleView from '@/components/VueGlobaleView';
import DossiersView from '@/components/DossiersView';
import AffectationView from '@/components/AffectationView';

export type SidebarPage = 'vue-globale' | 'dossiers' | 'affectation' | 'historique' | 'references';

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState<SidebarPage>('vue-globale');

  const PAGE_TITLES: Record<SidebarPage, { title: string; breadcrumb: string }> = {
    'vue-globale': { title: 'Vue Globale',                breadcrumb: 'Tableau de bord' },
    'dossiers':    { title: 'Dossiers',                   breadcrumb: 'Gestion' },
    'affectation': { title: 'Affectation des Dossiers',   breadcrumb: 'Gestion' },
    'historique':  { title: 'Historique des Évaluations', breadcrumb: 'Suivi' },
    'references':  { title: 'Références Réglementaires',  breadcrumb: 'Ressources' },
  };

  const { title, breadcrumb } = PAGE_TITLES[activePage];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F4]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '260px' }}>
        <TopBar title={title} breadcrumb={breadcrumb} />

        <main className="flex-1 overflow-y-auto p-6">
          {activePage === 'vue-globale' && <VueGlobaleView />}
          {activePage === 'dossiers'    && <DossiersView />}
          {activePage === 'affectation' && <AffectationView />}
          {(activePage === 'historique' || activePage === 'references') && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 pt-24">
              <span className="text-6xl">🚧</span>
              <p className="text-base font-semibold text-gray-500">{title}</p>
              <p className="text-sm">Cette section est en cours de développement.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}