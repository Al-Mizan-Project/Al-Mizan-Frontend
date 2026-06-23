// app/[lang]/system-admin/page.tsx
'use client';

import { useState } from 'react';
import SystemAdminSidebar    from '@/components/SystemAdminSidebar';
import TopBar                from '@/components/TopBar';
import DashboardSystemView   from '@/components/DashboardSystemView';
import UtilisateursView      from '@/components/UtilisateursView';
import RolesPermissionsView  from '@/components/RolesPermissionsView';
import NotificationsView     from '@/components/NotificationsView';
import MonProfilView         from '@/components/MonProfilView';
import ParametresView        from '@/components/ParametresView';
import { NotificationProvider }  from '@/lib/notifications';
import { UserProfileProvider }   from '@/lib/user-profile';
import { HistoriqueProvider }    from '@/lib/historique';
import { DocumentStoreProvider } from '@/lib/document-store';
import DemandesOEPage        from '@/components/DemandesOEPage';
import DemandeReviewPage     from '@/components/DemandeReviewPage';
import OrganisationsListPage from '@/components/OrganisationsListPage';
import SaucissonnageView     from '@/components/SaucissonnageView';
import { DemandeOE, Organisation } from '@/lib/types';

export type SystemAdminPage =
  | 'dashboard'
  | 'utilisateurs'
  | 'roles'
  | 'parametres-generaux'
  | 'audit'
  | 'rapports-systeme'
  | 'operateurs-demandes'
  | 'operateurs-organisations'
  | 'tutelle'
  | 'service-contractant'
  | 'commission-externe'
  | 'saucissonnage';

type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

const PAGE_TITLES: Record<SystemAdminPage, { title: string; breadcrumb: string }> = {
  'dashboard':                { title: 'Tableau de bord',                       breadcrumb: 'Vue d\'ensemble' },
  'utilisateurs':             { title: 'Gestion des utilisateurs',               breadcrumb: 'Administration' },
  'roles':                    { title: 'Rôles & Permissions',                    breadcrumb: 'Administration' },
  'operateurs-demandes':      { title: 'Demandes — Opérateurs Économiques',      breadcrumb: 'Gestion des opérateurs' },
  'operateurs-organisations': { title: 'Organisations — Opérateurs Économiques', breadcrumb: 'Gestion des opérateurs' },
  'tutelle':                  { title: 'Tutelles',                               breadcrumb: 'Gestion des tutelles' },
  'service-contractant':      { title: 'Services Contractants',                  breadcrumb: 'Gestion des services' },
  'commission-externe':       { title: 'Commissions Externes',                   breadcrumb: 'Gestion des commissions' },
  'parametres-generaux':      { title: 'Paramètres généraux',                    breadcrumb: 'Configuration' },
  'audit':                    { title: 'Audit & Logs',                           breadcrumb: 'Sécurité' },
  'rapports-systeme':         { title: 'Rapports système',                       breadcrumb: 'Analyses' },
  'saucissonnage':            { title: 'Détection du Saucissonnage',             breadcrumb: 'IA & Conformité' },
};

const OVERLAY_TITLES: Record<NonNullable<OverlayPage>, { title: string; breadcrumb: string }> = {
  'profil':        { title: 'Mon Profil',    breadcrumb: 'Compte' },
  'parametres':    { title: 'Paramètres',    breadcrumb: 'Compte' },
  'notifications': { title: 'Notifications', breadcrumb: 'Compte' },
};

function SystemAdminDashboardInner() {
  const [activePage,      setActivePage]      = useState<SystemAdminPage>('dashboard');
  const [overlayPage,     setOverlayPage]     = useState<OverlayPage>(null);
  const [selectedDemande, setSelectedDemande] = useState<DemandeOE | null>(null);
  const [approvedOrg, setApprovedOrg] = useState<Organisation | undefined>(undefined);
  const [rolesDefaultTab, setRolesDefaultTab] = useState<'matrice' | 'affectation' | 'affectation-permissions'>('matrice');

  const handleNavigate = (page: OverlayPage) => {
    setOverlayPage(prev => prev === page ? null : page);
  };

  const handleSidebarNav = (page: SystemAdminPage) => {
    setOverlayPage(null);
    setSelectedDemande(null);
    setApprovedOrg(undefined);
    setActivePage(page);
  };

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
          {overlayPage === 'notifications' && <NotificationsView />}
          {overlayPage === 'profil'        && <MonProfilView />}
          {overlayPage === 'parametres'    && <ParametresView />}

          {!overlayPage && activePage === 'dashboard' && (
            <DashboardSystemView onNavigate={handleDashboardNavigate} />
          )}

          {!overlayPage && activePage === 'utilisateurs' && (
            <UtilisateursView
              onNavigateToRoles={() => {
                setRolesDefaultTab('affectation');
                setActivePage('roles');
              }}
              onNavigateToPermissions={() => {
                setRolesDefaultTab('affectation-permissions');
                setActivePage('roles');
              }}
            />
          )}

          {!overlayPage && activePage === 'roles' && (
            <RolesPermissionsView defaultTab={rolesDefaultTab} />
          )}

          {!overlayPage && activePage === 'operateurs-demandes' && !selectedDemande && (
            <DemandesOEPage onReview={(d) => setSelectedDemande(d)} />
          )}
          {!overlayPage && activePage === 'operateurs-demandes' && selectedDemande && (
            <DemandeReviewPage
              demande={selectedDemande}
              onBack={() => setSelectedDemande(null)}
              onApproved={(org: Organisation) => {
                setSelectedDemande(null);
                setApprovedOrg(org);
                setActivePage('operateurs-organisations');
              }}
            />
          )}

          {!overlayPage && activePage === 'operateurs-organisations' && (
            <OrganisationsListPage
              orgType="operateur_economique"
              title="Organisations — Opérateurs Économiques"
              initialOrg={approvedOrg}
              onInitialOrgConsumed={() => setApprovedOrg(undefined)}
            />
          )}
          {!overlayPage && activePage === 'tutelle' && (
            <OrganisationsListPage orgType="tutelle" title="Tutelles" />
          )}
          {!overlayPage && activePage === 'service-contractant' && (
            <OrganisationsListPage orgType="service_contractant" title="Services Contractants" />
          )}
          {!overlayPage && activePage === 'commission-externe' && (
            <OrganisationsListPage orgType="commission_externe" title="Commissions Externes" />
          )}

          {!overlayPage && activePage === 'parametres-generaux' && (
            <div className="p-8 text-center text-gray-500">Paramètres généraux (en construction)</div>
          )}
          {!overlayPage && activePage === 'audit' && (
            <div className="p-8 text-center text-gray-500">Audit & Logs (en construction)</div>
          )}
          {!overlayPage && activePage === 'rapports-systeme' && (
            <div className="p-8 text-center text-gray-500">Rapports système (en construction)</div>
          )}

          {!overlayPage && activePage === 'saucissonnage' && (
            <SaucissonnageView />
          )}
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