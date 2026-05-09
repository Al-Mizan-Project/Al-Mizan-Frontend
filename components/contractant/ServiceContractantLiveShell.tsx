'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './service-contractant.module.css';
import {
  ServiceContractantProvider,
  useServiceContractant,
} from './ServiceContractantLiveContext';

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
  const lang = String(params.lang ?? 'fr');
  const { logout } = useAuth();
  const { organisation, currentUser, member } = useServiceContractant();

  const currentPage = pathname.includes('/dashboard/contractant/marches')
    ? 'marches'
    : pathname.includes('/dashboard/contractant/organisation')
      ? 'organisation'
      : 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: `/${lang}/dashboard/contractant` },
    { id: 'marches', label: 'Marchés', href: `/${lang}/dashboard/contractant/marches` },
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
        </aside>

        <div className={styles.main}>
          <header className={styles.topbar}>
            <div className={styles.topbarTitle}>
              <h2>{pageTitle}</h2>
            </div>

            <div className={styles.searchbar}>
              <svg
                className={styles.searchbarIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input type="search" placeholder="Recherche" />
            </div>

            <div className={styles.topActions}>
              <div className={styles.orgBadge}>
                <div className={styles.orgBadgeValue}>
                  {organisation?.nom_officiel || 'Service contractant'}
                </div>
              </div>

              <button type="button" className={styles.iconBtn} aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22a2.45 2.45 0 002.2-1.4h-4.4A2.45 2.45 0 0012 22zm6-5.2v-5a6 6 0 10-12 0v5L4 18.8v1.2h16v-1.2l-2-2z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className={styles.profile}>
                <div className={styles.avatar}>{initials(profileName)}</div>
                <div>
                  <strong>{profileName}</strong>
                  <small>{currentUser?.email || organisation?.email_contact || 'sc@almizan.dz'}</small>
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
