'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuildingColumns, 
  faGlobe,
  faScaleBalanced,
  faShieldHalved 
} from '@fortawesome/free-solid-svg-icons';

type HeaderProps = {
  currentLang: string;
  showLogo?: boolean;
  showBackButton?: boolean;
};

export default function Header({ 
  currentLang, 
  showLogo = true,
  showBackButton = false 
}: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isArabic = currentLang === 'ar';

  // Determine other language
  const otherLang = currentLang === 'fr' ? 'ar' : 'fr';
  const otherLangLabel = currentLang === 'fr' ? 'العربية' : 'Français';

  // Replace lang in current path
  const switchLangPath = pathname?.replace(`/${currentLang}`, `/${otherLang}`) || `/${otherLang}`;

  const translations = {
    fr: {
      appName: 'Al-Mizan',
      tagline: 'Plateforme de Gestion des Marchés Publics',
      back: 'Retour',
      menu: 'Menu',
      close: 'Fermer'
    },
    ar: {
      appName: 'الميزان',
      tagline: 'منصة إدارة الصفقات العمومية',
      back: 'رجوع',
      menu: 'القائمة',
      close: 'إغلاق'
    }
  };

  const t = translations[currentLang as 'fr' | 'ar'];

  return (
    <header className="bg-white border-b border-[#9BCFCF] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Section - Logo & Brand */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href={`/${currentLang}`}
                className="text-[#418387] hover:text-[#173C3F] transition-colors p-2 rounded-lg hover:bg-[#FCFFFF]"
                aria-label={t.back}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${isArabic ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            )}
            
            {showLogo && (
              <Link href={`/${currentLang}`} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#306B6F] rounded-xl flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faScaleBalanced} className="text-white text-xl" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-[#0D2527] font-cairo">{t.appName}</h1>
                  <p className="text-xs text-[#418387] font-cairo">{t.tagline}</p>
                </div>
              </Link>
            )}
          </div>

          {/* Right Section - Language Switcher & Security Badge */}
          <div className="flex items-center gap-3">
            
            {/* Security Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FCFFFF] border border-[#9BCFCF] rounded-lg">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#589C9F] text-sm" />
              <span className="text-xs text-[#418387] font-medium font-cairo">
                {isArabic ? 'آمن ومشفر' : 'Sécurisé & Chiffré'}
              </span>
            </div>

            {/* Language Switcher */}
            <Link
              href={switchLangPath}
              className="flex items-center gap-2 px-4 py-2 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FontAwesomeIcon icon={faGlobe} className="text-sm" />
              <span className="text-sm font-medium font-cairo">{otherLangLabel}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-[#418387] hover:bg-[#FCFFFF] rounded-lg transition-colors"
              aria-label={isMenuOpen ? t.close : t.menu}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#9BCFCF]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#FCFFFF] rounded-lg">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[#589C9F]" />
                <span className="text-sm text-[#418387] font-cairo">
                  {isArabic ? 'حماية البيانات حسب القانون 18-07' : 'Protection des données Loi 18-07'}
                </span>
              </div>
              <Link
                href={`/${currentLang}/login`}
                className="px-4 py-2 bg-[#306B6F] text-white rounded-lg text-center font-cairo hover:bg-[#173C3F] transition-colors"
              >
                {isArabic ? 'تسجيل الدخول' : 'Connexion'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}