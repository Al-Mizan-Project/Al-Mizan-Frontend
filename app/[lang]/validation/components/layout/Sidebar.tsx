'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faFolder,
  faUsers,
  faHistory,
  faBook,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

import { commissionRoutes, validatorRoutes } from '../../../validation/routes';
import { useValidationAuth } from '../../context/ValidationAuthContext';

type UserRole = 'commission' | 'validator';

interface SidebarProps {
  lang: string;
  role: UserRole;
}

const getMenuItems = (role: UserRole, isAr: boolean, user: any) => {
  if (role === 'commission') {
    const items = [
      { icon: faHome, label: isAr ? 'نظرة عامة' : 'Vue globale', href: commissionRoutes.dashboard },
      { icon: faFolder, label: isAr ? 'الملفات' : 'Dossiers', href: commissionRoutes.tousLesDossiers },
      { icon: faUsers, label: isAr ? 'تعيين الملفات' : 'Affectation', href: commissionRoutes.affectationDossiers },
      { icon: faHistory, label: isAr ? 'سجل التحققات' : 'Historique', href: commissionRoutes.historique },
      { icon: faBook, label: isAr ? 'المراجع' : 'Références', href: commissionRoutes.references },
    ];

    // Afficher Gestion des utilisateurs seulement pour Externe (6) et Tutelle (7)
    if (user?.id_role === 6 || user?.id_role === 7) {
      items.push({ 
        icon: faUsers, 
        label: isAr ? 'إدارة المستخدمين' : 'Gestion des utilisateurs', 
        href: '/validation/users' 
      });
    }

    return items;
  } else {
    return [
      { icon: faHome, label: isAr ? 'نظرتي الشخصية' : 'Vue personnelle', href: validatorRoutes.dashboard },
      { icon: faFolder, label: isAr ? 'ملفاتي' : 'Dossiers', href: validatorRoutes.tousLesDossiers },
      { icon: faBook, label: isAr ? 'المراجع' : 'Références', href: validatorRoutes.references },
    ];
  }
};

export default function Sidebar({ lang, role }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useValidationAuth();
  const isAr = lang === 'ar';
  const menuItems = getMenuItems(role, isAr, user);

  const searchPlaceholder = isAr ? 'بحث...' : 'Rechercher...';

  return (
    <aside className="val-sidebar flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Logo Section */}
      <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Link href={`/${lang}/validation/dashboard/${role}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="relative w-10 h-10 flex-shrink-0">
            <img
              src="/LogoAlMizan.png"
              alt="Al Mizan Logo"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
          <span className="text-[20px] font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--color-blue-9)' }}>
            Al Mizan
          </span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="val-search-input">
          <FontAwesomeIcon
            icon={faSearch}
            style={{ color: 'var(--color-blue-6)' }}
            className="w-[18.21px] h-[18.21px]"
          />
          <span className="val-search-input-text">{searchPlaceholder}</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 space-y-0">
        {menuItems.map((item, index) => {
          const fullHref = `/${lang}${item.href}`;
          const isActive = pathname.startsWith(fullHref);

          return (
            <Link
              key={index}
              href={fullHref}
              className={`
                flex items-center gap-2 px-2 py-3 mb-0
                min-h-[48px] h-[48px]
                ${isActive ? 'val-sidebar-item-active' : 'val-sidebar-item-inactive'}
              `}
            >
              <FontAwesomeIcon
                icon={item.icon}
                style={{ color: isActive ? 'var(--color-blue-0)' : 'var(--color-blue-9)' }}
                className="w-6 h-6 flex-shrink-0"
              />
              <span className={`
                flex-1 text-[16px] font-medium leading-[16px] truncate
                ${isActive ? 'val-sidebar-item-active-text' : 'val-sidebar-item-inactive-text'}
              `}
                style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'inherit' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
