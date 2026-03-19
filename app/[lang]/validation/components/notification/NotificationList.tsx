'use client';

import { useState } from 'react';

interface Notification {
  id: string;
  type: 'new' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  date: string;
  reference?: string;
}

interface NotificationsByDate {
  [key: string]: Notification[];
}

export default function NotificationsList() {
  const [notifications] = useState<NotificationsByDate>({
    "Aujourd'hui": [
      {
        id: '1',
        type: 'new',
        title: 'Nouveau Dossier',
        description: 'Nouveau Dossier Reçu',
        date: new Date().toISOString(),
        reference: 'Nouveau Dossier Reçu'
      },
      {
        id: '2',
        type: 'new',
        title: 'Nouveau Dossier',
        description: 'Nouveau Dossier Reçu',
        date: new Date().toISOString(),
        reference: 'Nouveau Dossier Reçu'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Référence Dossier ID',
        description: '3 jours restants pour l\'évaluation',
        date: new Date().toISOString(),
        reference: '3 jours restants'
      }
    ],
    "Hier": [
      {
        id: '4',
        type: 'danger',
        title: 'Référence Dossier',
        description: 'Dépassement du delais pour le dossier ID',
        date: new Date(Date.now() - 86400000).toISOString(),
        reference: 'Dépassement du delais'
      },
      {
        id: '5',
        type: 'warning',
        title: 'Référence Dossier ID',
        description: '3 jours restants pour l\'évaluation',
        date: new Date(Date.now() - 86400000).toISOString(),
        reference: '3 jours restants'
      },
      {
        id: '6',
        type: 'info',
        title: 'Title. Subtitle.',
        description: 'Subtitle.',
        date: new Date(Date.now() - 86400000).toISOString(),
        reference: 'Subtitle.'
      },
      {
        id: '7',
        type: 'info',
        title: 'Référence Dossier ID soumis évalué',
        description: 'Dossier soumis par évaluateur',
        date: new Date(Date.now() - 86400000).toISOString(),
        reference: 'Dossier soumis par évaluateur'
      }
    ],
    "Le 20 Mars": [
      {
        id: '8',
        type: 'new',
        title: 'Nouveau Dossier',
        description: 'Nouveau Dossier Reçu',
        date: '2026-03-20',
        reference: 'Nouveau Dossier Reçu'
      },
      {
        id: '9',
        type: 'danger',
        title: 'Référence Dossier',
        description: 'Dépassement du delais pour le dossier ID',
        date: '2026-03-20',
        reference: 'Dépassement du delais'
      }
    ]
  });

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
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

  const handleVoirNotification = (notification: Notification) => {
    console.log('Voir notification:', notification.id);
    // TODO: Navigation vers le dossier concerné
  };

  return (
    <div className="val-notifications-container">
      {Object.entries(notifications).map(([date, dateNotifications]) => (
        <div key={date} className="val-notifications-section">
          <h3 className="val-notifications-section-title">{date}</h3>
          
          <div className="val-notifications-list">
            {dateNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`val-notification-item val-notification-item-${notification.type}`}
              >
                <div className="val-notification-border" />
                
                <div className="val-notification-content">
                  <div className="val-notification-icon-wrapper">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="val-notification-text">
                    <div className="val-notification-title">
                      {notification.title}
                      {notification.reference && (
                        <span className="val-notification-reference">
                          {' '}{notification.reference}
                        </span>
                      )}
                    </div>
                    <div className="val-notification-description">
                      {notification.description}
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
      ))}
    </div>
  );
}