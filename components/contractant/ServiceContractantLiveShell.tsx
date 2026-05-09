'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './service-contractant.module.css';
import {
  ServiceContractantProvider,
  useServiceContractant,
} from './ServiceContractantLiveContext';
import { CONTRACTANT_PERMISSION_OPTIONS, canManageMembers, canUseMarches, normalizePermissionName } from './ServiceContractantLiveShared';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function initials(value: string) {
  const parts = value
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((item) => item[0]?.toUpperCase() || '').join('') || 'SC';
}

function ServiceContractantShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const lang = String(params.lang ?? 'fr');
  const { logout } = useAuth();
  const { organisation, currentPermissions, member } = useServiceContractant();

  const permLabel = CONTRACTANT_PERMISSION_OPTIONS.find(
    (opt) => currentPermissions.some(
      (p) => normalizePermissionName(p.nom_permission) === normalizePermissionName(opt.value)
    )
  )?.label || '';
  const mayUseMarches = canUseMarches(currentPermissions);
  const mayManageMembers = canManageMembers(currentPermissions);

  useEffect(() => {
    if (
      pathname.includes('/dashboard/contractant/organisation/permissions') ||
      (pathname.includes('/dashboard/contractant/organisation/membres') && !mayManageMembers)
    ) {
      router.replace(`/${lang}/dashboard/contractant/organisation`);
      return;
    }

    if (pathname.includes('/dashboard/contractant/marches') && currentPermissions.length > 0 && !mayUseMarches) {
      router.replace(`/${lang}/dashboard/contractant`);
    }
  }, [currentPermissions.length, lang, mayManageMembers, mayUseMarches, pathname, router]);

  const currentPage = pathname.includes('/dashboard/contractant/marches')
    ? 'marches'
    : pathname.includes('/dashboard/contractant/organisation')
      ? 'organisation'
      : 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: `/${lang}/dashboard/contractant` },
    ...(mayUseMarches
      ? [{ id: 'marches', label: 'Marchés', href: `/${lang}/dashboard/contractant/marches` }]
      : []),
    { id: 'organisation', label: 'Organisation', href: `/${lang}/dashboard/contractant/organisation` },
  ];

  const pageTitle =
    currentPage === 'marches' ? 'Marchés' : currentPage === 'organisation' ? 'Organisation' : 'Dashboard';
  const profileName = [member?.prenom, member?.nom].filter(Boolean).join(' ') || 'Service contractant';

  return (
    <div className={styles.root}>
      <div className={styles.app}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <h1 className={styles.brandTitle}>Al-Mizan</h1>
            {organisation && (
              <p className={styles.brandSub}>{organisation.nom_officiel}</p>
            )}
          </div>

          <nav className={styles.sideNav} aria-label="Navigation principale">
            {navItems.map((item) => (
              <div
                key={item.id}
                className={cn(styles.navItem, currentPage === item.id && styles.navItemActive)}
              >
                <Link href={item.href} className={styles.navMain}>
                  <div>
                    <b className={styles.navMainText}>{item.label}</b>
                  </div>
                </Link>
              </div>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.profileCompact}>
              <div className={styles.avatar}>{initials(profileName)}</div>
              <div className={styles.profileCompactInfo}>
                <strong>{profileName}</strong>
                {permLabel && <small>{permLabel}</small>}
              </div>
            </div>
          </div>
        </aside>

        <div className={styles.main}>
          <header className={styles.topbar}>
            <div className={styles.topbarTitle}>
              <h2>{pageTitle}</h2>
            </div>

            <div className={styles.topActions}>
              <div className={styles.orgBadge}>
                <div className={styles.orgBadgeValue}>
                  {organisation?.nom_officiel || 'Service contractant'}
                </div>
              </div>

              <button
                type="button"
                className={cn(styles.btn, styles.btnGhost)}
                onClick={() => logout()}
              >
                {lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
              </button>
            </div>
          </header>

          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function ServiceContractantLiveShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ServiceContractantProvider>
      <ServiceContractantShellLayout>{children}</ServiceContractantShellLayout>
    </ServiceContractantProvider>
  );
}
