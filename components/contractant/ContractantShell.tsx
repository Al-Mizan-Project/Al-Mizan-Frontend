'use client';

import { useState, ReactNode } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import ContractantSidebar from './ContractantSidebar';
import { useSCSession } from '@/lib/sc/session';
import { Spinner } from '@/lib/sc/ui';

export default function ContractantShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const pathname = usePathname() || '';
  const router = useRouter();
  const { ready, role } = useSCSession();

  const switchLang = () => {
    const next = isArabic ? 'fr' : 'ar';
    router.push(pathname.replace(`/${lang}/`, `/${next}/`));
  };

  const logout = () => {
    ['access_token', 'refresh_token', 'user_id', 'id_membre', 'member_info'].forEach((k) =>
      window.localStorage.removeItem(k),
    );
    window.location.href = `/${lang}/login`;
  };

  if (ready && !role) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F7F4] p-6 text-center">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1C4532' }}>
            {isArabic ? 'وصول غير مصرح به' : 'Accès non autorisé'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {isArabic
              ? 'هذا الفضاء مخصص للمصلحة المتعاقدة.'
              : "Cet espace est réservé au Service Contractant."}
          </p>
          <button onClick={logout} className="mt-5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
            {isArabic ? 'تسجيل الخروج' : 'Se déconnecter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7F4]" dir={isArabic ? 'rtl' : 'ltr'}>
      <ContractantSidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden md:ml-[260px] rtl:md:ml-0 rtl:md:mr-[260px]">
        <header className="bg-white border-b border-gray-100 shadow-sm z-20 flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-8 py-3.5">
            <button onClick={() => setNavOpen(true)} className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-[#F4F7F4] text-gray-600" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button onClick={switchLang} className="px-3 h-10 rounded-xl text-sm font-semibold bg-[#F4F7F4] text-gray-600 hover:bg-[#D6EAD4] hover:text-[#1C4532] transition-all">
                {isArabic ? 'FR' : 'ع'}
              </button>
              <button onClick={logout} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F4F7F4] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all" aria-label={isArabic ? 'خروج' : 'Déconnexion'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!ready ? <Spinner /> : children}
        </main>
      </div>
    </div>
  );
}
