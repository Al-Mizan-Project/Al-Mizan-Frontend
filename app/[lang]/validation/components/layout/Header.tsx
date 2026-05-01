'use client';

import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCog, faUser } from '@fortawesome/free-solid-svg-icons';
import { commissionRoutes, validatorRoutes } from '../../routes';

type UserRole = 'commission' | 'validator';

type HeaderVariant =
  | 'dashboard'
  | 'dossiers'
  | 'file'
  | 'affectation'
  | 'affectationDossiers'
  | 'historique'
  | 'notifications'
  | 'parametres'
  | 'profile'
  | 'references'
  | 'users';

interface HeaderProps {
  lang: string;
  role: UserRole;
  variant: HeaderVariant;
  dict?: {
    dashboard?: { title?: string };
    common?: { title?: string };
  };
  dossierId?: string;
}

function getHeaderContent(
  variant: HeaderVariant,
  role: UserRole,
  isAr: boolean,
  dict?: HeaderProps['dict'],
  dossierId?: string,
): { title: string; label?: string } {
  const isCommission = role === 'commission';

  switch (variant) {
    case 'dashboard':
      return {
        title:
          dict?.dashboard?.title ||
          (isCommission
            ? isAr ? 'نظرة عامة' : 'Vue globale'
            : isAr ? 'نظرتي الشخصية' : 'Vue personnelle'),
      };

    case 'dossiers':
      return {
        title:
          dict?.common?.title ||
          (isCommission
            ? isAr ? 'الملفات' : 'Dossiers'
            : isAr ? 'ملفاتي' : 'Mes Dossiers'),
      };

    case 'file':
      return {
        label: isAr ? 'المتعامل الاقتصادي' : 'OPÉRATEUR ÉCONOMIQUE',
        title: dossierId || (isAr ? 'مرجع رقم الملف' : 'Référence Dossier ID'),
      };

    case 'affectation':
      return {
        label: isAr ? 'مرجع رقم الملف' : 'REFERENCE DOSSIER ID',
        title: isAr ? 'تعيين ملف' : "Affectation d'un Dossier",
      };

    case 'affectationDossiers':
      return {
        title: isAr ? 'تعيين الملفات' : 'Affectation des Dossiers',
      };

    case 'historique':
      return {
        title: isAr ? 'سجل التحققات' : 'Historique des validations',
      };

    case 'notifications':
      return {
        title: isCommission
          ? isAr ? 'الإشعارات' : 'Notifications'
          : isAr ? 'إشعاراتي' : 'Mes Notifications',
      };

    case 'parametres':
      return {
        title: isCommission
          ? isAr ? 'الإعدادات' : 'Paramètres'
          : isAr ? 'إعداداتي' : 'Mes Paramètres',
      };

    case 'profile':
      return {
        title: isCommission
          ? isAr ? 'ملف اللجنة' : 'Profil Commission'
          : isAr ? 'ملفي الشخصي' : 'Mon Profil',
      };

    case 'references':
      return {
        title: isAr ? 'المراجع التنظيمية' : 'Références Réglementaires',
      };

    case 'users':
      return {
        title: isAr ? 'إدارة المستخدمين' : 'Gestion Utilisateurs',
      };
  }
}

export default function Header({ lang, role, variant, dict, dossierId }: HeaderProps) {
  const isAr = lang === 'ar';
  const router = useRouter();
  const routes = role === 'commission' ? commissionRoutes : validatorRoutes;
  const fontFamily = isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif';

  const { title, label } = getHeaderContent(variant, role, isAr, dict, dossierId);

  // 🎨 Classes utilitaires pour les icônes interactives
  const iconBaseClasses = "transition-colors duration-200 cursor-pointer";
  const iconColorDefault = "var(--color-blue-6)";
  const iconColorHover = "var(--color-blue-9)"; // Couleur au survol

  return (
    <header className="val-header flex items-center justify-between" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-6">
        <div>
          {label && (
            <p
              className="text-sm font-semibold text-[var(--color-blue-9)] uppercase mb-1"
              style={{ fontFamily }}
            >
              {label}
            </p>
          )}
          <h1 className="val-title text-3xl" style={{ fontFamily }}>
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* 🔹 User Icon */}
        <button
          className={`val-user-icon h-12 px-3 flex items-center justify-center ${iconBaseClasses} hover:opacity-80 active:scale-95`}
          onClick={() => router.push(`/${lang}${routes.profile}`)}
          title={isAr ? 'ملفي' : 'Mon profil'}
          type="button"
        >
          <FontAwesomeIcon
            icon={faUser}
            style={{
              color: iconColorDefault,
              transition: 'color 0.2s ease'
            }}
            className="w-[14px] h-5 hover:!text-[var(--color-blue-9)]"
          />
        </button>

        {/* 🔹 Settings Icon */}
        <button
          className={`h-12 px-3 flex items-center justify-center ${iconBaseClasses} hover:opacity-80 active:scale-95 rounded-lg hover:bg-[var(--color-blue-1)]`}
          onClick={() => router.push(`/${lang}${routes.parametres}`)}
          title={isAr ? 'الإعدادات' : 'Paramètres'}
          type="button"
        >
          <FontAwesomeIcon
            icon={faCog}
            style={{
              color: iconColorDefault,
              transition: 'color 0.2s ease'
            }}
            className="w-5 h-5 hover:!text-[var(--color-blue-9)]"
          />
        </button>

        {/* 🔹 Notifications Icon */}
        <button
          className={`h-12 px-3 flex items-center justify-center relative ${iconBaseClasses} hover:opacity-80 active:scale-95 rounded-lg hover:bg-[var(--color-blue-1)]`}
          onClick={() => router.push(`/${lang}${routes.notifications}`)}
          title={isAr ? 'الإشعارات' : 'Notifications'}
          type="button"
        >
          <FontAwesomeIcon
            icon={faBell}
            style={{
              color: iconColorDefault,
              transition: 'color 0.2s ease'
            }}
            className="w-[18px] h-5 hover:!text-[var(--color-blue-9)]"
          />
          <div className="val-badge-danger absolute left-6 top-2">
            <span className="val-badge-danger-text">9</span>
          </div>
        </button>
      </div>
    </header>
  );
}