'use client';

import { useState } from 'react';
import SystemAdminSidebar   from '@/components/SystemAdminSidebar';
import TopBar               from '@/components/TopBar';
import DashboardSystemView  from '@/components/DashboardSystemView';
import UtilisateursView     from '@/components/UtilisateursView';
import RolesPermissionsView from '@/components/RolesPermissionsView';
import NotificationsView    from '@/components/NotificationsView';
import MonProfilView        from '@/components/MonProfilView';
import ParametresView       from '@/components/ParametresView';
import { NotificationProvider } from '@/lib/notifications';
import { UserProfileProvider }  from '@/lib/user-profile';
import { HistoriqueProvider }   from '@/lib/historique';
import { DocumentStoreProvider } from '@/lib/document-store';

export type SystemAdminPage = 'dashboard' | 'utilisateurs' | 'roles';
type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

const PAGE_TITLES: Record<SystemAdminPage, { title: string; breadcrumb: string }> = {
  'dashboard':    { title: 'Tableau de bord',        breadcrumb: 'Vue d\'ensemble' },
  'utilisateurs': { title: 'Gestion des utilisateurs', breadcrumb: 'Administration' },
  'roles':        { title: 'Rôles & Permissions',    breadcrumb: 'Administration' },
};

const OVERLAY_TITLES: Record<NonNullable<OverlayPage>, { title: string; breadcrumb: string }> = {
  'profil':        { title: 'Mon Profil',    breadcrumb: 'Compte' },
  'parametres':    { title: 'Paramètres',    breadcrumb: 'Compte' },
  'notifications': { title: 'Notifications', breadcrumb: 'Compte' },
};

function SystemAdminDashboardInner() {
  const [activePage,  setActivePage]  = useState<SystemAdminPage>('dashboard');
  const [overlayPage, setOverlayPage] = useState<OverlayPage>(null);

  const handleNavigate = (page: OverlayPage) => {
    setOverlayPage(prev => prev === page ? null : page);
  };

  const handleSidebarNav = (page: SystemAdminPage) => {
    setOverlayPage(null);
    setActivePage(page);
  };

  // Dashboard quick-action navigation
  const handleDashboardNavigate = (page: 'utilisateurs' | 'roles') => {
    setOverlayPage(null);
    setActivePage(page);
  };

  const currentTitle = overlayPage
    ? OVERLAY_TITLES[overlayPage]
    : PAGE_TITLES[activePage];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F4]">
      <SystemAdminSidebar activePage={activePage} setActivePage={handleSidebarNav} />

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

          {/* Sidebar pages */}
          {!overlayPage && activePage === 'dashboard'    && (
            <DashboardSystemView onNavigate={handleDashboardNavigate} />
          )}
          {!overlayPage && activePage === 'utilisateurs' && <UtilisateursView />}
          {!overlayPage && activePage === 'roles'        && <RolesPermissionsView />}
        </main>
      </div>
    </div>
  );
}

export default function SystemAdminDashboard() {
  return (
    <UserProfileProvider>
      <HistoriqueProvider>
        <DocumentStoreProvider>
          <NotificationProvider>
            <SystemAdminDashboardInner />
          </NotificationProvider>
        </DocumentStoreProvider>
      </HistoriqueProvider>
    </UserProfileProvider>
  );
}