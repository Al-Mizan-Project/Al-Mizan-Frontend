'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBars,
  faTimes,
  faSearch,
  faBuilding,
  faFileContract,
  faShieldHalved,
  faFolderOpen,
  faUser,
  faSignOutAlt,
  faChartLine,
  faClipboardList,
  faExclamationTriangle,
  faCheckDouble,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  fetchMembreProfile,
  type NotificationApi,
} from '@/lib/operator-api';

export default function OperatorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [orgName, setOrgName] = useState<string>('');
  const notifRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';

  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Load org name from profile
  useEffect(() => {
    const loadProfile = async () => {
      const membreId = typeof window !== 'undefined'
        ? localStorage.getItem('membre_id') || ''
        : '';
      if (!membreId) return;
      try {
        const data = await fetchMembreProfile(membreId);
        if (data?.organisation?.nom_officiel) {
          setOrgName(data.organisation.nom_officiel);
        }
      } catch {
        // silent
      }
    };
    loadProfile();
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifs = async () => {
      const userId = typeof window !== 'undefined'
        ? Number(localStorage.getItem('user_id') || 0)
        : 0;
      if (!userId) return;
      setNotifLoading(true);
      try {
        const data = await fetchUserNotifications(userId);
        setNotifications(data);
      } catch {
        // silent
      } finally {
        setNotifLoading(false);
      }
    };
    loadNotifs();
  }, []);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAsRead = async (notifId: number) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read_at);
    await Promise.allSettled(unread.map(n => markNotificationAsRead(n.id)));
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('membre_id');
    localStorage.removeItem('organisation_id');
    localStorage.removeItem('operateur_id');
    router.push(`/${lang}/login`);
  };

  const navigation = [
    {
      name: isArabic ? 'لوحة التحكم' : 'Tableau de bord',
      href: `/${lang}/dashboard/operator`,
      icon: faChartLine,
      active: pathname === `/${lang}/dashboard/operator`,
    },
    {
      name: isArabic ? 'الصفقات المعلنة' : "Appels d'offres",
      href: `/${lang}/dashboard/operator/appels-offres`,
      icon: faClipboardList,
      active: pathname?.includes('appels-offres'),
    },
    {
      name: isArabic ? 'طلباتي' : 'Mes Soumissions',
      href: `/${lang}/dashboard/operator/soumissions`,
      icon: faFileContract,
      active: pathname?.includes('soumissions'),
    },
    {
      name: isArabic ? 'عقودي' : 'Mes Contrats',
      href: `/${lang}/dashboard/operator/contrats`,
      icon: faShieldHalved,
      active: pathname?.includes('contrats'),
    },
    {
      name: isArabic ? 'الطعون' : 'Recours',
      href: `/${lang}/dashboard/operator/recours`,
      icon: faExclamationTriangle,
      active: pathname?.includes('recours'),
    },
    {
      name: isArabic ? 'وثائقي' : 'Mes Documents',
      href: `/${lang}/dashboard/operator/documents`,
      icon: faFolderOpen,
      active: pathname?.includes('documents'),
    },
    {
      name: isArabic ? 'ملفي' : 'Mon Profil',
      href: `/${lang}/dashboard/operator/profile`,
      icon: faUser,
      active: pathname?.includes('profile'),
    },
  ];

  const t = {
    fr: {
      appName: 'Al-Mizan',
      search: 'Rechercher...',
      logout: 'Déconnexion',
      welcome: 'Bonjour',
      notifications: 'Notifications',
      noNotifs: 'Aucune notification',
      markAllRead: 'Tout marquer comme lu',
      unread: 'Non lu',
    },
    ar: {
      appName: 'الميزان',
      search: 'بحث...',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً',
      notifications: 'الإشعارات',
      noNotifs: 'لا توجد إشعارات',
      markAllRead: 'تعليم الكل كمقروء',
      unread: 'غير مقروء',
    },
  }[lang as 'fr' | 'ar'] || {
    appName: 'Al-Mizan',
    search: 'Rechercher...',
    logout: 'Déconnexion',
    welcome: 'Bonjour',
    notifications: 'Notifications',
    noNotifs: 'Aucune notification',
    markAllRead: 'Tout marquer comme lu',
    unread: 'Non lu',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">

            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} className="w-6 h-6" />
              </button>
              <Link href={`/${lang}`} className="flex items-center gap-3 ml-2 lg:ml-0">
                <div className="w-8 h-8 bg-[#306B6F] rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-white" />
                </div>
                <span className="text-xl font-bold text-[#0D2527] hidden sm:block">{t.appName}</span>
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">

              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t.search}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#306B6F] focus:border-[#306B6F] outline-none w-64"
                  />
                </div>
              </div>

              {/* Notifications dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(prev => !prev)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-bold text-[#0D2527] text-sm">{t.notifications}</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#306B6F] hover:underline flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faCheckDouble} className="text-xs" />
                          {t.markAllRead}
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifLoading ? (
                        <div className="p-4 space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-10 text-center text-gray-400 text-sm">{t.noNotifs}</div>
                      ) : (
                        notifications.slice(0, 10).map(notif => (
                          <div
                            key={notif.id}
                            className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${!notif.read_at ? 'bg-[#F7FAFA]' : ''}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-[#0D2527] truncate">{notif.titre}</p>
                                {!notif.read_at && (
                                  <span className="w-2 h-2 bg-[#306B6F] rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-1">{notif.message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                  {new Date(notif.sent_at).toLocaleDateString('fr-DZ')}
                                </span>
                                {!notif.read_at && (
                                  <button
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    className="text-xs text-[#306B6F] hover:underline"
                                  >
                                    {t.unread}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-4 py-2.5">
                      <Link
                        href={`/${lang}/dashboard/operator/profile?tab=notifications`}
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#306B6F] hover:underline font-medium"
                      >
                        {isArabic ? 'عرض كل الإشعارات' : 'Voir toutes les notifications'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Language switcher */}
              <Link
                href={`/${lang === 'fr' ? 'ar' : 'fr'}/dashboard/operator`}
                className="px-3 py-1.5 bg-[#306B6F] text-white rounded-lg text-sm hover:bg-[#173C3F] transition-colors"
              >
                {lang === 'fr' ? 'العربية' : 'Français'}
              </Link>

              {/* Profile link */}
              <Link
                href={`/${lang}/dashboard/operator/profile`}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title={isArabic ? 'ملفي' : 'Mon profil'}
              >
                <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                title={t.logout}
              >
                <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-0
        `}>
          <div className="p-4">
            <div className="mb-6 p-4 bg-[#FCFFFF] border border-[#9BCFCF] rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#306B6F] rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0D2527]">{t.welcome}</p>
                  {orgName ? (
                    <p className="text-xs text-[#418387] truncate">{orgName}</p>
                  ) : (
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1" />
                  )}
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${item.active
                      ? 'bg-[#306B6F] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}