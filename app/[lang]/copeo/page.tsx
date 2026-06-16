'use client';

import { useState } from 'react';
import COPEOSidebar from '@/components/COPEOSidebar';
import TopBar from '@/components/TopBar';
import VuePersonnelleCOPEOView from '@/components/VuePersonnelleCOPEOView';
import MesDossiersCOPEOView from '@/components/MesDossiersCOPEOView';
import ReferencesView from '@/components/ReferencesView';
import NotificationsView from '@/components/NotificationsView';
import MonProfilView from '@/components/MonProfilView';
import ParametresView from '@/components/ParametresView';
import { NotificationProvider } from '@/lib/notifications';
import { UserProfileProvider } from '@/lib/user-profile';
import { HistoriqueProvider } from '@/lib/historique';
import { DocumentStoreProvider } from '@/lib/document-store';
import { SoumissionsProvider } from '@/lib/soumissions-context';
import { CommissionProvider, useCommission } from '@/lib/commission-context';
import { useAuth } from '@/lib/auth';
import { Dossier } from '@/lib/dossiers-data';
import COPEODossierDetailView from '@/components/COPEODossierDetailView';

export type COPEOPage = 'vue-personnelle' | 'mes-dossiers' | 'references';
type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

const PAGE_TITLES: Record<COPEOPage, { title: string; breadcrumb: string }> = {
  'vue-personnelle': { title: 'Vue Personnelle',           breadcrumb: 'Mon espace' },
  'mes-dossiers':    { title: 'Mes Dossiers',              breadcrumb: 'Gestion' },
  'references':      { title: 'Références Réglementaires', breadcrumb: 'Ressources' },
};

const OVERLAY_TITLES: Record<NonNullable<OverlayPage>, { title: string; breadcrumb: string }> = {
  'profil':        { title: 'Mon Profil',    breadcrumb: 'Compte' },
  'parametres':    { title: 'Paramètres',    breadcrumb: 'Compte' },
  'notifications': { title: 'Notifications', breadcrumb: 'Compte' },
};

function COPEODashboardInner() {
  const [activePage,      setActivePage]      = useState<COPEOPage>('vue-personnelle');
  const [overlayPage,     setOverlayPage]     = useState<OverlayPage>(null);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const { user } = useAuth();
  const { commission, loading: commLoading, error: commError } = useCommission();

  const handleNavigate = (page: OverlayPage) => {
    setOverlayPage(prev => prev === page ? null : page);
    setSelectedDossier(null);
  };

  const handleSidebarNav = (page: COPEOPage) => {
    setOverlayPage(null);
    setSelectedDossier(null);
    setActivePage(page);
  };

  const handleVoirDossier = (d: Dossier) => {
    setOverlayPage(null);
    setSelectedDossier(d);
  };

  const currentTitle = overlayPage
    ? OVERLAY_TITLES[overlayPage]
    : selectedDossier
      ? { title: selectedDossier.reference, breadcrumb: "Séance d'évaluation" }
      : PAGE_TITLES[activePage];

  if (commLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
        Chargement de votre commission...
      </div>
    );
  }

  if (commError || !commission) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500 text-sm">
        Aucune commission assignée à votre compte.
      </div>
    );
  }

  return (
    <SoumissionsProvider commissionId={commission.id_comission}>
      <div className="flex h-screen overflow-hidden bg-[#F4F7F4]">
        <COPEOSidebar activePage={activePage} setActivePage={handleSidebarNav} />
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

          {!overlayPage && selectedDossier && (
  <COPEODossierDetailView
    key={selectedDossier.id}
    dossier={selectedDossier}
    onBack={() => setSelectedDossier(null)}
    currentMembreId={user?.id_utilisateur ?? 0}
    commissionId={selectedDossier.commissionId ?? commission.id_comission}
  />
)}
          {!overlayPage && !selectedDossier && activePage === 'vue-personnelle' && (
  <VuePersonnelleCOPEOView
    onVoirDossier={handleVoirDossier}
    onGoToMesDossiers={() => handleSidebarNav('mes-dossiers')}
  />
)}
            {!overlayPage && !selectedDossier && activePage === 'mes-dossiers' && (
              <MesDossiersCOPEOView onVoirDossier={handleVoirDossier} />
            )}
            {!overlayPage && !selectedDossier && activePage === 'references' && (
              <ReferencesView />
            )}
          </main>
        </div>
      </div>
    </SoumissionsProvider>
  );
}

export default function COPEODashboard() {
  return (
    <UserProfileProvider>
      <HistoriqueProvider>
        <DocumentStoreProvider>
          <NotificationProvider>
            <CommissionProvider>
              <COPEODashboardInner />
            </CommissionProvider>
          </NotificationProvider>
        </DocumentStoreProvider>
      </HistoriqueProvider>
    </UserProfileProvider>
  );
}