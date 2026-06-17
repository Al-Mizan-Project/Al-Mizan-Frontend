'use client';

import { useState, ReactElement } from 'react';
import type { SystemAdminPage } from '@/app/[lang]/system-admin/page';
import { useAuth } from '@/lib/auth';

const navItems: { id: SystemAdminPage; label: string; icon: ReactElement }[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'utilisateurs',
    label: 'Gestion des utilisateurs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'roles',
    label: 'Rôles & Permissions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },

  {
    id: 'service-contractant',
    label: 'Service Contractant',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'commission-externe',
    label: 'Commission Externe',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

interface Props {
  activePage: SystemAdminPage;
  setActivePage: (id: SystemAdminPage) => void;
}

export default function SystemAdminSidebar({ activePage, setActivePage }: Props) {
  const [search, setSearch] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();

  const filtered = navItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

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
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
        {filtered.map(item => {
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
              style={isActive ? { background: 'linear-gradient(135deg, #1C4532, #00738C)' } : {}}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                isActive ? 'bg-white/20' : 'bg-[#F4F7F4] group-hover:bg-[#D6EAD4]'
              }`}>
                {item.icon}
              </span>
              <span className="leading-tight">{item.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
            </button>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 text-left group"
        >
          <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 group-hover:bg-red-100 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="leading-tight">Déconnexion</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#D6EAD4' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: '#1C4532' }}
          >
            SA
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: '#1C4532' }}>Administrateur</p>
            <p className="text-xs text-gray-500">Système</p>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm">
            <h3 className="text-base font-bold text-gray-800 mb-2">Confirmer la déconnexion</h3>
            <p className="text-sm text-gray-500 mb-6">
              Êtes-vous sûr de vouloir vous déconnecter de votre session administrateur ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:border-gray-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={logout}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}