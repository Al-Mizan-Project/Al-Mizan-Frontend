'use client';

import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCog, faUser } from '@fortawesome/free-solid-svg-icons';
import { commissionRoutes, validatorRoutes } from '../../routes';

type UserRole = 'commission' | 'validator';

interface FileHeaderProps {
  lang: string;
  role: UserRole;
  dict?: {
    common?: { title?: string };
  };
  dossierId?: string;
}

export default function FileHeader({ lang, role, dict, dossierId }: FileHeaderProps) {
  const isAr = lang === 'ar';
  const router = useRouter();
  const routes = role === 'commission' ? commissionRoutes : validatorRoutes;

  const label = isAr ? 'المتعامل الاقتصادي' : 'OPÉRATEUR ÉCONOMIQUE';
  const fallbackTitle = isAr ? 'مرجع رقم الملف' : 'Référence Dossier ID';

  return (
    <header className="val-header flex items-center justify-between" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-6">
        <div>
          <p
            className="text-sm font-semibold text-[var(--color-blue-9)] uppercase mb-1"
            style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
          >
            {label}
          </p>
          <h1
            className="val-title text-3xl"
            style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
          >
            {dossierId || fallbackTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User Icon */}
        <button
          className="val-user-icon"
          onClick={() => router.push(`/${lang}${routes.profile}`)}
        >
          <FontAwesomeIcon icon={faUser} style={{ color: 'var(--color-blue-6)' }} className="w-[14px] h-5" />
        </button>

        {/* Settings Icon */}
        <button
          className="h-12 px-3 flex items-center justify-center"
          onClick={() => router.push(`/${lang}${routes.parametres}`)}
        >
          <FontAwesomeIcon icon={faCog} style={{ color: 'var(--color-blue-6)' }} className="w-5 h-5" />
        </button>

        {/* Notification Icon */}
        <button
          className="h-12 px-3 flex items-center justify-center relative"
          onClick={() => router.push(`/${lang}${routes.notifications}`)}
        >
          <FontAwesomeIcon icon={faBell} style={{ color: 'var(--color-blue-6)' }} className="w-[18px] h-5" />
          <div className="val-badge-danger absolute left-6 top-2">
            <span className="val-badge-danger-text">9</span>
          </div>
        </button>
      </div>
    </header>
  );
}
