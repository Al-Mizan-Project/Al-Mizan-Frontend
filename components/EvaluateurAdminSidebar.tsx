'use client';

import { useState, ReactElement } from 'react';
import type { EvaluateurAdminPage } from '@/app/[lang]/evaluateur-admin/page';

const navItems: { id: EvaluateurAdminPage; label: string; icon: ReactElement }[] = [
  {
    id: 'vue-personnelle',
    label: 'Vue Personnelle',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'mes-dossiers',
    label: 'Mes Dossiers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: 'references',
    label: 'Références Réglementaires',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

interface Props {
  activePage: EvaluateurAdminPage;
  setActivePage: (id: EvaluateurAdminPage) => void;
}

export default function EvaluateurAdminSidebar({ activePage, setActivePage }: Props) {
  const [searchValue, setSearchValue] = useState('');

  const filtered = searchValue.trim()
    ? navItems.filter(n => n.label.toLowerCase().includes(searchValue.toLowerCase()))
    : navItems;

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-white shadow-lg flex flex-col z-30"
      style={{ width: '260px' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <img src="/logo.png" alt="El Mizan" className="w-full object-contain" />
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search for…"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none focus:bg-white transition-all placeholder-gray-400"
            style={{ color: '#1C4532' }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {filtered.map(item => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 text-left ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-[#F4F7F4] hover:text-[#1C4532]'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #1C4532, #00738C)' } : {}}
              >
                <span className={isActive ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #97A675, #1C4532)' }}
          >
            EA
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-gray-700 truncate">Évaluateur Admin.</p>
            <p className="text-xs text-gray-400 truncate">evaluateur@mizan.dz</p>
          </div>
        </div>
      </div>
    </aside>
  );
}