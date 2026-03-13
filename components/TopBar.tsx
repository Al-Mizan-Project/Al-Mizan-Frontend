'use client';

import { useNotifications } from '@/lib/notifications';
import { useUserProfile } from '@/lib/user-profile';

type OverlayPage = 'profil' | 'parametres' | 'notifications' | null;

interface TopBarProps {
  title: string;
  breadcrumb: string;
  onNavigate?: (page: OverlayPage) => void;
  activePage?: OverlayPage;
}

export default function TopBar({
  title,
  breadcrumb,
  onNavigate,
  activePage,
}: TopBarProps) {
  const { unreadCount } = useNotifications();
  const { profile, initials } = useUserProfile();

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm z-20 flex-shrink-0">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Title */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-0.5">
            {breadcrumb}
          </p>
          <h2 className="text-2xl font-black" style={{ color: '#1C4532' }}>
            {title}
          </h2>
        </div>

        {/* Top-right icons */}
        <div className="flex items-center gap-3">
          {/* Profile */}
          <button
            onClick={() => onNavigate?.('profil')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activePage === 'profil'
                ? 'bg-[#1C4532] text-white'
                : 'bg-[#F4F7F4] text-gray-500 hover:bg-[#D6EAD4] hover:text-[#1C4532]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          {/* Settings */}
          <button
            onClick={() => onNavigate?.('parametres')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activePage === 'parametres'
                ? 'bg-[#1C4532] text-white'
                : 'bg-[#F4F7F4] text-gray-500 hover:bg-[#D6EAD4] hover:text-[#1C4532]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          {/* Notifications */}
          <button
            onClick={() => onNavigate?.('notifications')}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activePage === 'notifications'
                ? 'bg-[#1C4532] text-white'
                : 'bg-[#F4F7F4] text-gray-500 hover:bg-[#D6EAD4] hover:text-[#1C4532]'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}