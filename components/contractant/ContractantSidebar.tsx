'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { CONTRACTANT_NAV } from './nav';
import { useSCSession } from '@/lib/sc/session';

export default function ContractantSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() || '';
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { can, displayName, initials, roleLabelText } = useSCSession();
  const [search, setSearch] = useState('');

  const base = `/${lang}/dashboard/contractant`;

  const items = CONTRACTANT_NAV.filter((it) => (it.anyOf ? it.anyOf.some((p) => can(p)) : true)).filter((it) =>
    (isArabic ? it.ar : it.fr).toLowerCase().includes(search.toLowerCase()),
  );

  const isActive = (segment: string) => {
    const href = segment ? `${base}/${segment}` : base;
    if (!segment) return pathname === base || pathname === `${base}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 ${isArabic ? 'right-0' : 'left-0'} h-full bg-white shadow-lg flex flex-col z-40 transition-transform duration-200
          ${open ? 'translate-x-0' : isArabic ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ width: '260px' }}
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <img src="/logo.png" alt="El Mizan" className="w-full object-contain" />
        </div>

        <div className="px-4 py-4">
          <div className="relative">
            <svg className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder={isArabic ? 'بحث…' : 'Rechercher…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full ${isArabic ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none focus:bg-white transition-all placeholder-gray-400`}
              style={{ color: '#1C4532' }}
            />
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
            {isArabic ? 'التنقل' : 'Navigation'}
          </p>
          {items.map((item) => {
            const active = isActive(item.segment);
            const href = item.segment ? `${base}/${item.segment}` : base;
            return (
              <Link
                key={item.key}
                href={href}
                onClick={onClose}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active ? 'text-white shadow-md' : 'text-gray-600 hover:bg-[#D6EAD4] hover:text-[#1C4532]'
                }`}
                style={active ? { background: 'linear-gradient(135deg, #1C4532, #00738C)' } : {}}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-white/20' : 'bg-[#F4F7F4] group-hover:bg-[#D6EAD4]'}`}>
                  {item.icon}
                </span>
                <span className="leading-tight">{isArabic ? item.ar : item.fr}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#D6EAD4' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: '#1C4532' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: '#1C4532' }}>{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{roleLabelText(lang)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
