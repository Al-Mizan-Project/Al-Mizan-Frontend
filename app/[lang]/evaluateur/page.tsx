'use client';

import { useState } from 'react';
import EvaluateurSidebar from '@/components/EvaluateurSidebar';
import TopBar from '@/components/TopBar';
import VuePersonnelleView from '@/components/VuePersonnelleView';
import MesDossiersView from '@/components/MesDossiersView';
import ReferencesView from '@/components/ReferencesView';
import NotificationsView from '@/components/NotificationsView';
import MonProfilView from '@/components/MonProfilView';
import ParametresView from '@/components/ParametresView';
import { NotificationProvider } from '@/lib/notifications';
import { UserProfileProvider } from '@/lib/user-profile';
import { HistoriqueProvider } from '@/lib/historique';
import { DocumentStoreProvider } from '@/lib/document-store';

export type EvaluateurPage = 'vue-personnelle' | 'mes-dossiers' | 'references';
type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

const PAGE_TITLES: Record<EvaluateurPage, { title: string; breadcrumb: string }> = {
  'vue-personnelle': { title: 'Vue Personnelle',           breadcrumb: 'Mon espace' },
  'mes-dossiers':    { title: 'Mes Dossiers',              breadcrumb: 'Gestion' },
  'references':      { title: 'Références Réglementaires', breadcrumb: 'Ressources' },
};

const OVERLAY_TITLES: Record<NonNullable<OverlayPage>, { title: string; breadcrumb: string }> = {
  'profil':        { title: 'Mon Profil',    breadcrumb: 'Compte' },
  'parametres':    { title: 'Paramètres',    breadcrumb: 'Compte' },
  'notifications': { title: 'Notifications', breadcrumb: 'Compte' },
};

function EvaluateurDashboardInner() {
  const [activePage,  setActivePage]  = useState<EvaluateurPage>('vue-personnelle');
  const [overlayPage, setOverlayPage] = useState<OverlayPage>(null);

  const handleNavigate = (page: OverlayPage) => {
    setOverlayPage(prev => prev === page ? null : page);
  };

  const handleSidebarNav = (page: EvaluateurPage) => {
    setOverlayPage(null);
    setActivePage(page);
  };

  const currentTitle = overlayPage
    ? OVERLAY_TITLES[overlayPage]
    : PAGE_TITLES[activePage];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F4]">
      <EvaluateurSidebar activePage={activePage} setActivePage={handleSidebarNav} />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '260px' }}>
        <TopBar
          title={currentTitle.title}
          breadcrumb={currentTitle.breadcrumb}
          onNavigate={handleNavigate}
          activePage={overlayPage}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {overlayPage === 'notifications' && <NotificationsView />}
          {overlayPage === 'profil'        && <MonProfilView />}
          {overlayPage === 'parametres'    && <ParametresView />}

          {!overlayPage && activePage === 'vue-personnelle' && <VuePersonnelleView />}
          {!overlayPage && activePage === 'mes-dossiers'    && <MesDossiersView />}
          {!overlayPage && activePage === 'references'      && <ReferencesView />}
        </main>
      </div>
    </div>
  );
}

export default function EvaluateurDashboard() {
  return (
    <UserProfileProvider>
      <HistoriqueProvider>
    <DocumentStoreProvider>
        <NotificationProvider>
          <EvaluateurDashboardInner />
        </NotificationProvider>
      </DocumentStoreProvider>
      </HistoriqueProvider>
    </UserProfileProvider>
  );
}