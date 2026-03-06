'use client';

import { useState } from 'react';
import type { SidebarPage } from '@/app/[lang]/chef_com/page';

const navItems: { id: SidebarPage; label: string; icon: string }[] = [
  { id: 'vue-globale', label: 'Vue globale', icon: '⬡' },
  { id: 'dossiers', label: 'Dossiers', icon: '📁' },
  { id: 'affectation', label: 'Affectation des dossiers', icon: '📋' },
  { id: 'historique', label: 'Historique des évaluations', icon: '🕐' },
  { id: 'references', label: 'Références réglementaires', icon: '📖' },
];

interface SidebarProps {
  activePage: SidebarPage;
  setActivePage: (id: SidebarPage) => void;
}

export default function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const [searchValue, setSearchValue] = useState('');

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
         
          <input
            type="text"
            placeholder="Search for…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none focus:bg-white transition-all placeholder-gray-400"
            style={{ color: '#1C4532' }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left group ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-[#D6EAD4] hover:text-[#1C4532]'
              }`}
              style={
                isActive
                  ? { background: 'linear-gradient(135deg, #1C4532, #00738C)' }
                  : {}
              }
            >
             
              <span className="leading-tight">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: '#D6EAD4' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: '#1C4532' }}
          >
            AC
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#1C4532' }}>
              Chef Commission
            </p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <button className="ml-auto text-gray-400 hover:text-[#1C4532] transition-colors">
            ⚙
          </button>
        </div>
      </div>
    </aside>
  );
}