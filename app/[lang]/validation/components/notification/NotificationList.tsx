'use client';

import { useMemo } from 'react';
import { useNotifications, BackendNotification } from './useNotifications';
import { useRouter } from 'next/navigation';

export default function NotificationsList() {
  const { notifications, isLoading, error, refresh, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const router = useRouter();

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, BackendNotification[]> = {};

    notifications.forEach((notif) => {
      // Basic grouping by date string or "Aujourd'hui" / "Hier"
      const dateObj = new Date(notif.date_creation);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey = '';
      if (dateObj.toDateString() === today.toDateString()) {
        groupKey = "Aujourd'hui";
      } else if (dateObj.toDateString() === yesterday.toDateString()) {
        groupKey = "Hier";
      } else {
        groupKey = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notif);
    });

    return groups;
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    const lowerType = (type || 'INFO').toLowerCase();
    switch (lowerType) {
      case 'new':
        return (
          <div className="val-notification-icon val-notification-icon-new">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="val-notification-icon val-notification-icon-warning">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'danger':
        return (
          <div className="val-notification-icon val-notification-icon-danger">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="val-notification-icon val-notification-icon-info">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const handleVoirNotification = async (notification: BackendNotification) => {
    if (!notification.est_lu) {
      await markAsRead(notification.id);
    }
    if (notification.lien_relatif) {
      router.push(notification.lien_relatif);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Chargement des notifications...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={refresh} className="px-4 py-2 bg-blue-600 text-white rounded">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="val-notifications-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Notifications {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">{unreadCount} non lues</span>}</h2>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:underline">
            Marquer tout comme lu
          </button>
        )}
      </div>

      {Object.keys(groupedNotifications).length === 0 ? (
        <div className="p-10 text-center text-gray-400">Aucune notification pour le moment.</div>
      ) : (
        Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
          <div key={date} className="val-notifications-section">
            <h3 className="val-notifications-section-title">{date}</h3>
            
            <div className="val-notifications-list">
              {dateNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`val-notification-item val-notification-item-${(notification.type || 'info').toLowerCase()} ${!notification.est_lu ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="val-notification-border" />
                  
                  <div className="val-notification-content">
                    <div className="val-notification-icon-wrapper">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="val-notification-text">
                      <div className={`val-notification-title ${!notification.est_lu ? 'font-semibold' : ''}`}>
                        {notification.titre}
                        {notification.reference_dossier && (
                          <span className="val-notification-reference">
                            {' '}{notification.reference_dossier}
                          </span>
                        )}
                      </div>
                      <div className="val-notification-description">
                        {notification.message}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleVoirNotification(notification)}
                    className="val-notification-action"
                  >
                    Voir
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}