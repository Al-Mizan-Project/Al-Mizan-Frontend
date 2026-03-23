"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope, faChevronDown, faLanguage, faLock } from '@fortawesome/free-solid-svg-icons';

// On ajoute dict et lang dans les props
export default function Navbar({ dict, lang }: { dict: any, lang: string }) {
  const pathname = usePathname();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const isAr = lang === 'ar';

  const currentLangLabel = isAr ? 'العربية' : 'FRANÇAIS';

  const getLangLink = (targetLang: string) => {
    const segments = pathname.split('/');
    segments[1] = targetLang;
    return segments.join('/') || `/${targetLang}`;
  };

  return (
    <header className="w-full shadow-sm relative z-50 bg-white" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="px-6 md:px-12 flex justify-between items-center border-b">
        <div className="flex items-center gap-2 text-[#00667e] font-semibold text-sm">
          <FontAwesomeIcon icon={faPhone} className={isAr ? 'rotate-[260deg]' : ''} />
          <span dir="ltr">021 59 51 51 / 52 52</span>
        </div>
        
        <div className="hidden lg:block text-[#00667e] font-bold text-sm tracking-wide uppercase">
          {dict.nav_portal_name}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 text-[#00667e] text-sm">
            <FontAwesomeIcon icon={faEnvelope} />
            <a href="mailto:contact@marches-publics.gov.dz">contact@marches-publics.gov.dz</a>
          </div>
          <img src="/logo_blue.png" alt="Logo" className="h-10" />
        </div>
      </div>

      {/* Main Nav */}
      <nav className="bg-[#005c6e] text-white px-6 md:px-12 py-3 flex items-center justify-between">
        <ul className="flex items-center gap-6 lg:gap-8 text-[12px] lg:text-[13px] font-bold uppercase">
          <li className="hover:text-cyan-200">
            <Link href={`/${lang}`}>{dict.nav_home || "Accueil"}</Link>
          </li>
          <li className="hover:text-cyan-200">
            <Link href={`/${lang}/about`}>{dict.nav_about || "À Propos"}</Link>
          </li>
          <li className="hover:text-cyan-200">
            <Link href={`/${lang}/appel`}>{dict.nav_tenders || "Appels"}</Link>
          </li>
        </ul>

        <div className={`flex items-center gap-4 ${isAr ? 'mr-4 border-r' : 'ml-4 border-l'} border-white/20 ${isAr ? 'pr-4' : 'pl-4'}`}>
          {/* Language Switcher */}
          <div className="relative">
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-2 text-sm font-bold uppercase outline-none">
              <FontAwesomeIcon icon={faLanguage} className="text-lg" />
              <span>{currentLangLabel}</span>
              <FontAwesomeIcon icon={faChevronDown} className={`text-[10px] transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isLangOpen && (
              <div className={`absolute top-full mt-2 ${isAr ? 'left-0' : 'right-0'} bg-white text-[#005c6e] shadow-xl rounded-md min-w-[120px] py-1 border border-gray-100`}>
                <Link href={getLangLink('fr')} onClick={() => setIsLangOpen(false)} className="block px-4 py-2 hover:bg-gray-100 text-xs font-bold text-left">FRANÇAIS</Link>
                <Link href={getLangLink('ar')} onClick={() => setIsLangOpen(false)} className="block px-4 py-2 hover:bg-gray-100 text-xs font-bold text-right font-arabic">العربية</Link>
              </div>
            )}
          </div>

          {/* Login Button */}
          <Link 
            href={`/${lang}/auth`} 
            className="border border-white px-4 py-1.5 rounded hover:bg-white hover:text-[#005c6e] transition-all flex items-center gap-2 text-sm font-bold no-underline"
            >
            <FontAwesomeIcon icon={faLock} /> 
            <span>{dict.nav_login || "CONNEXION"}</span>
        </Link>
        </div>
      </nav>
    </header>
  );
}