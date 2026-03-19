'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

export default function OperatorDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    const loadLang = async () => {
      const resolvedParams = await params;
      if (isMounted) {
        setLang(resolvedParams.lang);
      }
    };

    loadLang();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const isArabic = lang === 'ar';

  const navigation = [
    {
      name: isArabic ? 'لوحة التحكم' : 'Tableau de bord',
      href: `/${lang}/dashboard/operator`,
      icon: faChartLine,
      active: pathname === `/${lang}/dashboard/operator`
    },
    {
      name: isArabic ? 'الصفقات المعلنة' : 'Appels d\'offres',
      href: `/${lang}/dashboard/operator/appels-offres`,
      icon: faClipboardList,
      active: pathname?.includes('appels-offres')
    },
    {
      name: isArabic ? 'طلباتي' : 'Mes Soumissions',
      href: `/${lang}/dashboard/operator/soumissions`,
      icon: faFileContract,
      active: pathname?.includes('soumissions')
    },
    {
      name: isArabic ? 'عقودي' : 'Mes Contrats',
      href: `/${lang}/dashboard/operator/contrats`,
      icon: faShieldHalved,
      active: pathname?.includes('contrats')
    },
    {
      name: isArabic ? 'الطعون' : 'Recours',
      href: `/${lang}/dashboard/operator/recours`,
      icon: faExclamationTriangle,
      active: pathname?.includes('recours')
    },
    {
      name: isArabic ? 'وثائقي' : 'Mes Documents',
      href: `/${lang}/dashboard/operator/documents`,
      icon: faFolderOpen,
      active: pathname?.includes('documents')
    },
    {
      name: isArabic ? 'ملفي' : 'Mon Profil',
      href: `/${lang}/dashboard/operator/profile`,
      icon: faUser,
      active: pathname?.includes('profile')
    },
  ];

  const translations = {
    fr: {
      appName: 'Al-Mizan',
      search: 'Rechercher...',
      notifications: 'Notifications',
      logout: 'Déconnexion',
      welcome: 'Bonjour',
      company: 'Votre Entreprise'
    },
    ar: {
      appName: 'الميزان',
      search: 'بحث...',
      notifications: 'الإشعارات',
      logout: 'تسجيل الخروج',
      welcome: 'مرحباً',
      company: 'مؤسستك'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo & Mobile Menu Button */}
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

            {/* Right: Search, Notifications, Profile */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" 
                  />
                  <input
                    type="text"
                    placeholder={t.search}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#306B6F] focus:border-[#306B6F] outline-none w-64"
                  />
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Language Switcher */}
              <Link
                href={`/${lang === 'fr' ? 'ar' : 'fr'}/dashboard/operator`}
                className="px-3 py-1.5 bg-[#306B6F] text-white rounded-lg text-sm hover:bg-[#173C3F] transition-colors"
              >
                {lang === 'fr' ? 'العربية' : 'Français'}
              </Link>

              {/* Logout */}
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
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
            {/* User Info Card */}
            <div className="mb-6 p-4 bg-[#FCFFFF] border border-[#9BCFCF] rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#306B6F] rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0D2527]">{t.welcome}</p>
                  <p className="text-xs text-[#418387] truncate">SARL Example Tech</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
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

        {/* Overlay for mobile */}
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