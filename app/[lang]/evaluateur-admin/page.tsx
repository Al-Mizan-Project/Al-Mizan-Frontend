'use client';

import { useState } from 'react';
import EvaluateurAdminSidebar from '@/components/EvaluateurAdminSidebar';
import TopBar from '@/components/TopBar';
import VuePersonnelleAdminView from '@/components/VuePersonnelleAdminView';
import MesDossiersAdminView from '@/components/MesDossiersAdminView';
import DossierDetailAdminView from '@/components/DossierDetailAdminView';
import ReferencesView from '@/components/ReferencesView';
import NotificationsView from '@/components/NotificationsView';
import MonProfilView from '@/components/MonProfilView';
import ParametresView from '@/components/ParametresView';
import { NotificationProvider } from '@/lib/notifications';
import { UserProfileProvider } from '@/lib/user-profile';
import { HistoriqueProvider } from '@/lib/historique';
import { DocumentStoreProvider } from '@/lib/document-store';
import { Dossier } from '@/lib/dossiers-data';
import { SoumissionsProvider } from '@/lib/soumissions-context';

export type EvaluateurAdminPage = 'vue-personnelle' | 'mes-dossiers' | 'references';
type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

const PAGE_TITLES: Record<EvaluateurAdminPage, { title: string; breadcrumb: string }> = {
  'vue-personnelle': { title: 'Vue Personnelle',           breadcrumb: 'Mon espace' },
  'mes-dossiers':    { title: 'Mes Dossiers',              breadcrumb: 'Gestion' },
  'references':      { title: 'Références Réglementaires', breadcrumb: 'Ressources' },
};

const OVERLAY_TITLES: Record<NonNullable<OverlayPage>, { title: string; breadcrumb: string }> = {
  'profil':        { title: 'Mon Profil',    breadcrumb: 'Compte' },
  'parametres':    { title: 'Paramètres',    breadcrumb: 'Compte' },
  'notifications': { title: 'Notifications', breadcrumb: 'Compte' },
};

function EvaluateurAdminDashboardInner() {
  const [activePage,       setActivePage]       = useState<EvaluateurAdminPage>('vue-personnelle');
  const [overlayPage,      setOverlayPage]      = useState<OverlayPage>(null);
  const [selectedDossier,  setSelectedDossier]  = useState<Dossier | null>(null);

  const handleNavigate = (page: OverlayPage) => {
    setOverlayPage(prev => prev === page ? null : page);
    setSelectedDossier(null);
  };

  const handleSidebarNav = (page: EvaluateurAdminPage) => {
    setOverlayPage(null);
    setSelectedDossier(null);
    setActivePage(page);
  };

  const handleVoirDossier = (d: Dossier) => {
    setOverlayPage(null);
    setSelectedDossier(d);
  };

  // Determine title shown in TopBar
  const currentTitle = overlayPage
    ? OVERLAY_TITLES[overlayPage]
    : selectedDossier
      ? { title: `${selectedDossier.reference} · ${selectedDossier.id}`, breadcrumb: 'Dossier' }
      : PAGE_TITLES[activePage];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F4]">
      <EvaluateurAdminSidebar activePage={activePage} setActivePage={handleSidebarNav} />

      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '260px' }}>
        <TopBar
          title={currentTitle.title}
          breadcrumb={currentTitle.breadcrumb}
          onNavigate={handleNavigate}
          activePage={overlayPage}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Overlay pages */}
          {overlayPage === 'notifications' && <NotificationsView />}
          {overlayPage === 'profil'        && <MonProfilView />}
          {overlayPage === 'parametres'    && <ParametresView />}

          {/* Dossier detail */}
          {!overlayPage && selectedDossier && (
            <DossierDetailAdminView
              dossier={selectedDossier}
              onBack={() => setSelectedDossier(null)}
            />
          )}

          {/* Sidebar pages */}
          {!overlayPage && !selectedDossier && activePage === 'vue-personnelle' && (
            <VuePersonnelleAdminView onVoirDossier={handleVoirDossier} />
          )}
          {!overlayPage && !selectedDossier && activePage === 'mes-dossiers' && (
            <MesDossiersAdminView onVoirDossier={handleVoirDossier} />
          )}
          {!overlayPage && !selectedDossier && activePage === 'references' && (
            <ReferencesView />
          )}
        </main>
      </div>
    </div>
  );
}

export default function EvaluateurAdminDashboard() {
  return (
    <SoumissionsProvider>
    <UserProfileProvider>
      <HistoriqueProvider>
        <DocumentStoreProvider>
          <NotificationProvider>
            <EvaluateurAdminDashboardInner />
          </NotificationProvider>
        </DocumentStoreProvider>
      </HistoriqueProvider>
    </UserProfileProvider>
    </SoumissionsProvider>
  );
}