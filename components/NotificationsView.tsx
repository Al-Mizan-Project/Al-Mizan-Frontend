'use client';

import { useMemo } from 'react';
import { useNotifications, Notification, NotifType } from '@/lib/notifications';

function groupLabel(date: Date): string {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

const TYPE_CONFIG: Record<NotifType, { rowBg: string; border: string; iconBg: string; icon: React.ReactNode }> = {
  info: {
    rowBg: 'bg-blue-50', border: 'border-l-4 border-l-blue-500', iconBg: 'bg-blue-100',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  warning: {
    rowBg: 'bg-yellow-50', border: 'border-l-4 border-l-yellow-400', iconBg: 'bg-yellow-100',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  error: {
    rowBg: 'bg-red-50', border: 'border-l-4 border-l-red-500', iconBg: 'bg-red-100',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  },
  success: {
    rowBg: 'bg-emerald-50', border: 'border-l-4 border-l-emerald-500', iconBg: 'bg-emerald-100',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
  },
};

function NotifRow({ notif }: { notif: Notification }) {
  const { markRead, remove } = useNotifications();
  const cfg = TYPE_CONFIG[notif.type];

  return (
    <div
      onClick={() => markRead(notif.id)}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-lg cursor-pointer transition-opacity ${cfg.rowBg} ${cfg.border} ${notif.read ? 'opacity-55' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">
          <span className="font-bold">{notif.title}</span>{' '}
          <span className="font-semibold">{notif.subtitle}</span>{' · '}
          <span className="text-gray-600">{notif.description}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {notif.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {notif.dossierRef && <span className="ml-2 text-blue-500 font-medium">{notif.dossierRef}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
        <button
          onClick={e => { e.stopPropagation(); remove(notif.id); }}
          className="text-gray-300 hover:text-gray-500 transition-colors p-1"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function NotificationsView() {
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const groups = useMemo(() => {
    const map = new Map<string, Notification[]>();
    notifications.forEach(n => {
      const label = groupLabel(n.createdAt);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    });
    return Array.from(map.entries());
  }, [notifications]);

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-400">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p className="text-base font-semibold text-gray-500">Aucune notification</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {unreadCount > 0
            ? <><span className="font-bold text-blue-600">{unreadCount}</span> non lue{unreadCount > 1 ? 's' : ''}</>
            : 'Tout est lu'}
        </p>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-blue-600 font-semibold hover:underline">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {groups.map(([label, items]) => (
        <div key={label} className="mb-6">
          <h3 className="text-base font-bold text-gray-800 mb-3">{label}</h3>
          <div className="flex flex-col gap-2">
            {items.map(n => <NotifRow key={n.id} notif={n} />)}
          </div>
        </div>
      ))}
    </div>
  );
}