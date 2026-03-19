'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import VueGlobaleView from '@/components/VueGlobaleView';
import DossiersView from '@/components/DossiersView';
import AffectationView from '@/components/AffectationView';
import HistoriqueView from '@/components/HistoriqueView';
import ReferencesView from '@/components/ReferencesView';
import NotificationsView from '@/components/NotificationsView';
import MonProfilView from '@/components/MonProfilView';
import ParametresView from '@/components/ParametresView';
import { NotificationProvider } from '@/lib/notifications';
import { UserProfileProvider, useUserProfile } from '@/lib/user-profile';
import { HistoriqueProvider } from '@/lib/historique';
import { DocumentStoreProvider } from '@/lib/document-store';

export type SidebarPage = 'vue-globale' | 'dossiers' | 'affectation' | 'historique' | 'references';
type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

// Page title config
const PAGE_TITLES: Record<SidebarPage, { title: string; breadcrumb: string }> = {
  'vue-globale': { title: 'Vue Globale',                breadcrumb: 'Tableau de bord' },
  'dossiers':    { title: 'Dossiers',                   breadcrumb: 'Gestion' },
  'affectation': { title: 'Affectation des Dossiers',   breadcrumb: 'Gestion' },
  'historique':  { title: 'Historique des évaluations', breadcrumb: 'Suivi' },
  'references':  { title: 'Références Réglementaires',  breadcrumb: 'Ressources' },
};

const OVERLAY_TITLES: Record<NonNullable<OverlayPage>, { title: string; breadcrumb: string }> = {
  'profil':        { title: 'Mon Profil',    breadcrumb: 'Compte' },
  'parametres':    { title: 'Paramètres',    breadcrumb: 'Compte' },
  'notifications': { title: 'Notifications', breadcrumb: 'Compte' },
};

export default function AdminDashboard() {
  const [activePage,   setActivePage]   = useState<SidebarPage>('vue-globale');
  const [overlayPage,  setOverlayPage]  = useState<OverlayPage>(null);

  // Overlay pages take over the main content area
  const handleNavigate = (page: OverlayPage) => {
    // Toggle: clicking the same icon closes it
    setOverlayPage(prev => prev === page ? null : page);
  };

  const currentTitle = overlayPage
    ? OVERLAY_TITLES[overlayPage]
    : PAGE_TITLES[activePage];

  const handleSidebarNav = (page: SidebarPage) => {
    setOverlayPage(null); // close any overlay when navigating sidebar
    setActivePage(page);
  };

  return (
    <UserProfileProvider>
    <HistoriqueProvider>
    <DocumentStoreProvider>
    <NotificationProvider>
    <div className="flex h-screen overflow-hidden bg-[#F4F7F4]">
      <Sidebar activePage={activePage} setActivePage={handleSidebarNav} />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '260px' }}>
        <TopBar
          title={currentTitle.title}
          breadcrumb={currentTitle.breadcrumb}
          onNavigate={handleNavigate}
          activePage={overlayPage}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Overlay pages */}
          {overlayPage === 'profil'        && <MonProfilView />}
          {overlayPage === 'parametres'    && <ParametresView />}
          {overlayPage === 'notifications' && <NotificationsView />}

          {/* Sidebar pages (hidden when overlay is active) */}
          {!overlayPage && activePage === 'vue-globale' && <VueGlobaleView />}
          {!overlayPage && activePage === 'dossiers'    && <DossiersView />}
          {!overlayPage && activePage === 'affectation' && <AffectationView />}
          {!overlayPage && activePage === 'historique'  && <HistoriqueView />}
          {!overlayPage && activePage === 'references'  && <ReferencesView />}
        </main>
      </div>
    </div>
    </NotificationProvider>
    </DocumentStoreProvider>
    </HistoriqueProvider>
    </UserProfileProvider>
  );
}