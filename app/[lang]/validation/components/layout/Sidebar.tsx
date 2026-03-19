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

type UserRole = 'commission' | 'validator';

interface SidebarProps {
  lang: string;
  role: UserRole;
}

const getMenuItems = (role: UserRole, isAr: boolean) => {
  if (role === 'commission') {
    return [
      { icon: faHome,    label: isAr ? 'نظرة عامة'    : 'Vue globale',   href: commissionRoutes.dashboard },
      { icon: faFolder,  label: isAr ? 'الملفات'       : 'Dossiers',      href: commissionRoutes.tousLesDossiers },
      { icon: faUsers,   label: isAr ? 'تعيين الملفات' : 'Affectation',   href: commissionRoutes.affectationDossiers },
      { icon: faHistory, label: isAr ? 'سجل التحققات'  : 'Historique',    href: commissionRoutes.historique },
      { icon: faBook,    label: isAr ? 'المراجع'       : 'Références',    href: commissionRoutes.references },
    ];
  } else {
    return [
      { icon: faHome,   label: isAr ? 'نظرتي الشخصية' : 'Vue personnelle', href: validatorRoutes.dashboard },
      { icon: faFolder, label: isAr ? 'ملفاتي'         : 'Dossiers',       href: validatorRoutes.tousLesDossiers },
      { icon: faBook,   label: isAr ? 'المراجع'        : 'Références',     href: validatorRoutes.references },
    ];
  }
};

export default function Sidebar({ lang, role }: SidebarProps) {
  const pathname = usePathname();
  const isAr = lang === 'ar';
  const menuItems = getMenuItems(role, isAr);

  const searchPlaceholder = isAr ? 'بحث...' : 'Rechercher...';

  return (
    <aside className="val-sidebar flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Logo */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-gray-200)' }}>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6" style={{ backgroundColor: 'var(--color-gray-600)' }} />
          <span className="val-logo ml-1">EL MIZAN</span>
        </div>
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
