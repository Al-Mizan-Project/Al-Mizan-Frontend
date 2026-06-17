'use client';

import { useState, useEffect } from 'react';
import ComiteTechniqueSidebar from '@/components/ComiteTechniqueSidebar';
import TopBar from '@/components/TopBar';
import MesAnalysesView from '@/components/MesAnalysesView';
import ReferencesView from '@/components/ReferencesView';
import NotificationsView from '@/components/NotificationsView';
import MonProfilView from '@/components/MonProfilView';
import ParametresView from '@/components/ParametresView';
import RapportTechniqueView from '@/components/RapportTechniqueView';
import { NotificationProvider } from '@/lib/notifications';
import { UserProfileProvider } from '@/lib/user-profile';
import { SoumissionsProvider } from '@/lib/soumissions-context';
import { ctAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Dossier } from '@/lib/dossiers-data';

export type ComiteTechniquePage = 'mes-analyses' | 'references';
type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

const PAGE_TITLES: Record<ComiteTechniquePage, { title: string; breadcrumb: string }> = {
  'mes-analyses': { title: 'Mes Analyses Techniques', breadcrumb: 'Comité Technique' },
  'references':   { title: 'Références Réglementaires', breadcrumb: 'Ressources' },
};

const OVERLAY_TITLES: Record<NonNullable<OverlayPage>, { title: string; breadcrumb: string }> = {
  'profil':        { title: 'Mon Profil',    breadcrumb: 'Compte' },
  'parametres':    { title: 'Paramètres',    breadcrumb: 'Compte' },
  'notifications': { title: 'Notifications', breadcrumb: 'Compte' },
};

function ComiteTechniqueDashboardInner() {
  const [activePage,      setActivePage]      = useState<ComiteTechniquePage>('mes-analyses');
  const [overlayPage,     setOverlayPage]     = useState<OverlayPage>(null);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [commission, setCommission]           = useState<{ id_comission: number; nom_comission: string; categorie: string } | null>(null);
  const [commLoading, setCommLoading]         = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id_utilisateur) return;
    ctAPI.getCommission(user.id_utilisateur)
      .then(data => setCommission(data))
      .catch(() => setCommission(null))
      .finally(() => setCommLoading(false));
  }, [user?.id_utilisateur]);

  const handleNavigate = (page: OverlayPage) => {
    setOverlayPage(prev => prev === page ? null : page);
    setSelectedDossier(null);
  };

  const handleSidebarNav = (page: ComiteTechniquePage) => {
    setOverlayPage(null);
    setSelectedDossier(null);
    setActivePage(page);
  };

  const currentTitle = overlayPage
    ? OVERLAY_TITLES[overlayPage]
    : selectedDossier
      ? { title: selectedDossier.reference, breadcrumb: 'Analyse Technique' }
      : PAGE_TITLES[activePage];

  if (commLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
        Chargement…
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500 text-sm">
        Aucune assignation CT trouvée pour ce compte.
      </div>
    );
  }

  return (
    <SoumissionsProvider commissionId={commission.id_comission}>
      <div className="flex h-screen overflow-hidden bg-[#F4F7F4]">
        <ComiteTechniqueSidebar activePage={activePage} setActivePage={handleSidebarNav} />
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
              <RapportTechniqueView
                key={selectedDossier.id}
                dossier={selectedDossier}
                onBack={() => setSelectedDossier(null)}
                commissionId={commission.id_comission}
              />
            )}
            {!overlayPage && !selectedDossier && activePage === 'mes-analyses' && (
              <MesAnalysesView onVoirDossier={setSelectedDossier} />
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

export default function ComiteTechniqueDashboard() {
  return (
    <UserProfileProvider>
      <NotificationProvider>
        <ComiteTechniqueDashboardInner />
      </NotificationProvider>
    </UserProfileProvider>
  );
}