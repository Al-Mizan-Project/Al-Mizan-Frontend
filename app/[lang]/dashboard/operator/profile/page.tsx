'use client';

import { useEffect, useState, FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faBuilding, faInfoCircle, faEnvelope, faPhone,
  faMapMarkerAlt, faLock, faBell, faShieldHalved, faCheckCircle,
  faUsers, faBriefcase, faKey, faSpinner, faClock, faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchMembreProfile,
  fetchUserNotifications,
  markNotificationAsRead,
  changePassword,
  type MembreProfileApi,
  type NotificationApi,
} from '@/lib/operator-api';

export default function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'personal' | 'organization' | 'security' | 'notifications'>('personal');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Profile data from API
  const [profile, setProfile] = useState<MembreProfileApi | null>(null);
  const [notifications, setNotifications] = useState<NotificationApi[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    params.then(p => { if (isMounted) setLang(p.lang); });
    return () => { isMounted = false; };
  }, [params]);

  const isArabic = lang === 'ar';

  // Load profile on mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const membreId = typeof window !== 'undefined'
          ? localStorage.getItem('membre_id') || ''
          : '';
        if (!membreId) return;
        const data = await fetchMembreProfile(membreId);
        if (isMounted) setProfile(data);
      } catch {
        // silent — show empty state
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Load notifications when tab opens
  useEffect(() => {
    if (activeTab !== 'notifications') return;
    let isMounted = true;
    const load = async () => {
      setNotifLoading(true);
      try {
        const userId = typeof window !== 'undefined'
          ? Number(localStorage.getItem('user_id') || 0)
          : 0;
        if (!userId) return;
        const data = await fetchUserNotifications(userId);
        if (isMounted) setNotifications(data);
      } catch {
        // silent
      } finally {
        if (isMounted) setNotifLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [activeTab]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 4000);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showError(isArabic ? 'كلمة المرور 8 أحرف على الأقل' : 'Mot de passe: 8 caractères minimum');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showSuccess(isArabic ? 'تم تغيير كلمة المرور' : 'Mot de passe changé avec succès');
    } catch (err: any) {
      showError(isArabic ? 'كلمة المرور الحالية غير صحيحة' : 'Mot de passe actuel incorrect');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId: number) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch {
      // silent
    }
  };

  const getNotifIcon = (type: string) => {
    if (type === 'ALERTE') return faExclamationTriangle;
    if (type === 'INFO') return faBell;
    return faBell;
  };

  const getNotifColor = (type: string) => {
    if (type === 'ALERTE') return 'text-yellow-600 bg-yellow-50';
    return 'text-[#306B6F] bg-[#EEF7F7]';
  };

  const t = {
    fr: {
      title: 'Mon Profil',
      tabs: { personal: 'Profil personnel', organization: "Profil de l'organisation", security: 'Sécurité', notifications: 'Notifications' },
      personal: { title: 'Informations personnelles', nom: 'Nom', prenom: 'Prénom', email: 'Email', telephone: 'Téléphone', fonction: 'Fonction', editNotice: "La modification du profil n'est pas encore disponible. Contactez votre administrateur." },
      organization: { title: "Informations de l'organisation", nomOfficiel: 'Raison sociale', email: 'Email officiel', adresse: 'Adresse du siège', type: "Type d'entité", info: "Ces informations sont vérifiées par l'administration." },
      security: { title: 'Sécurité du compte', passwordTitle: 'Changer le mot de passe', current: 'Mot de passe actuel', new: 'Nouveau mot de passe', confirm: 'Confirmer', change: 'Changer', hint: '8 caractères minimum' },
      notifications: { title: 'Mes notifications', empty: 'Aucune notification', markRead: 'Marquer comme lu', unread: 'Non lu', read: 'Lu' },
    },
    ar: {
      title: 'ملفي',
      tabs: { personal: 'الملف الشخصي', organization: 'ملف المؤسسة', security: 'الأمان', notifications: 'الإشعارات' },
      personal: { title: 'المعلومات الشخصية', nom: 'اللقب', prenom: 'الاسم', email: 'البريد الإلكتروني', telephone: 'الهاتف', fonction: 'المنصب', editNotice: 'تعديل الملف الشخصي غير متاح حالياً. تواصل مع المسؤول.' },
      organization: { title: 'معلومات المؤسسة', nomOfficiel: 'الاسم التجاري', email: 'البريد الرسمي', adresse: 'عنوان المقر', type: 'نوع الكيان', info: 'تم التحقق من هذه المعلومات من قبل الإدارة.' },
      security: { title: 'أمان الحساب', passwordTitle: 'تغيير كلمة المرور', current: 'كلمة المرور الحالية', new: 'كلمة المرور الجديدة', confirm: 'التأكيد', change: 'تغيير', hint: '8 أحرف على الأقل' },
      notifications: { title: 'إشعاراتي', empty: 'لا توجد إشعارات', markRead: 'وضع علامة مقروء', unread: 'غير مقروء', read: 'مقروء' },
    },
  }[lang as 'fr' | 'ar'] || {
    title: 'Mon Profil',
    tabs: { personal: 'Profil personnel', organization: "Profil de l'organisation", security: 'Sécurité', notifications: 'Notifications' },
    personal: { title: 'Informations personnelles', nom: 'Nom', prenom: 'Prénom', email: 'Email', telephone: 'Téléphone', fonction: 'Fonction', editNotice: "La modification du profil n'est pas encore disponible. Contactez votre administrateur." },
    organization: { title: "Informations de l'organisation", nomOfficiel: 'Raison sociale', email: 'Email officiel', adresse: 'Adresse du siège', type: "Type d'entité", info: "Ces informations sont vérifiées par l'administration." },
    security: { title: 'Sécurité du compte', passwordTitle: 'Changer le mot de passe', current: 'Mot de passe actuel', new: 'Nouveau mot de passe', confirm: 'Confirmer', change: 'Changer', hint: '8 caractères minimum' },
    notifications: { title: 'Mes notifications', empty: 'Aucune notification', markRead: 'Marquer comme lu', unread: 'Non lu', read: 'Lu' },
  };

  if (!lang) return null;

  const org = profile?.organisation;
  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0D2527] mb-2 font-cairo">{t.title}</h1>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
          <p className="text-green-800 font-medium font-cairo">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
          <p className="text-red-800 font-medium font-cairo">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border-2 border-[#9BCFCF] p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#306B6F] to-[#418387] rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUser} className="text-white text-3xl" />
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse mx-auto w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse mx-auto w-1/2" />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#0D2527] font-cairo">
                  {profile?.prenom} {profile?.nom}
                </h2>
                <p className="text-sm text-[#418387] font-cairo">{profile?.fonction || '—'}</p>
                {org && (
                  <p className="text-xs text-gray-500 mt-2 font-cairo">{org.email_contact}</p>
                )}
              </>
            )}
          </div>

          {org && (
            <div className="bg-white rounded-xl border-2 border-[#9BCFCF] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-[#306B6F] rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-white text-sm" />
                </div>
                <h3 className="font-bold text-[#0D2527] text-sm font-cairo">{t.organization.title}</h3>
              </div>
              <p className="text-sm font-medium text-[#0D2527] font-cairo">{org.nom_officiel}</p>
              <p className="text-xs text-gray-500 mt-1 font-cairo">{org.type_entite_display}</p>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {([
                { id: 'personal', icon: faUser, label: t.tabs.personal },
                { id: 'organization', icon: faBuilding, label: t.tabs.organization },
                { id: 'security', icon: faShieldHalved, label: t.tabs.security },
                { id: 'notifications', icon: faBell, label: t.tabs.notifications, badge: unreadCount },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-4 font-medium text-sm transition-colors whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[#306B6F] text-[#306B6F] bg-[#FCFFFF]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} />
                  {tab.label}
                  {'badge' in tab && tab.badge > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">

              {/* Personal Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#0D2527] font-cairo">{t.personal.title}</h3>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800 font-cairo">{t.personal.editNotice}</p>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: t.personal.nom, value: profile?.nom, icon: faUser },
                        { label: t.personal.prenom, value: profile?.prenom, icon: faUser },
                        { label: t.personal.telephone, value: profile?.telephone, icon: faPhone },
                        { label: t.personal.fonction, value: profile?.fonction, icon: faBriefcase },
                      ].map((field, i) => (
                        <div key={i}>
                          <label className="block text-sm font-medium text-[#173C3F] mb-2 font-cairo">
                            {field.label}
                          </label>
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <FontAwesomeIcon icon={field.icon} className="text-gray-400" />
                            <span className="text-gray-700 font-cairo">{field.value || '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Organization Tab */}
              {activeTab === 'organization' && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-800 text-sm flex items-center gap-2 font-cairo">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      {t.organization.info}
                    </p>
                  </div>

                  <h3 className="text-xl font-bold text-[#0D2527] font-cairo">{t.organization.title}</h3>

                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : org ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: t.organization.nomOfficiel, value: org.nom_officiel },
                        { label: t.organization.email, value: org.email_contact },
                        { label: t.organization.adresse, value: org.adresse_siege || '—' },
                        { label: t.organization.type, value: org.type_entite_display },
                      ].map((field, i) => (
                        <div key={i} className={i === 0 || i === 2 ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-[#173C3F] mb-2 font-cairo">
                            {field.label}
                          </label>
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 flex-shrink-0" />
                            <span className="text-gray-800 font-cairo">{field.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 font-cairo">Aucune organisation associée.</p>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-[#0D2527] font-cairo flex items-center gap-2">
                    <FontAwesomeIcon icon={faKey} />
                    {t.security.passwordTitle}
                  </h3>
                  <p className="text-sm text-gray-600 font-cairo -mt-4">{t.security.hint}</p>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                    {[
                      { key: 'oldPassword', label: t.security.current },
                      { key: 'newPassword', label: t.security.new },
                      { key: 'confirmPassword', label: t.security.confirm },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-[#173C3F] mb-2 font-cairo">
                          {field.label}
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            value={passwordData[field.key as keyof typeof passwordData]}
                            onChange={e => setPasswordData(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none font-cairo"
                            required
                            minLength={field.key !== 'oldPassword' ? 8 : undefined}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors disabled:opacity-70 flex items-center gap-2 font-cairo"
                    >
                      {passwordLoading && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                      {t.security.change}
                    </button>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#0D2527] font-cairo">{t.notifications.title}</h3>

                  {notifLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon={faBell} className="text-gray-300 text-4xl mb-3" />
                      <p className="text-gray-500 font-cairo">{t.notifications.empty}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`p-4 rounded-xl border transition-all ${
                            notif.read_at
                              ? 'border-gray-100 bg-gray-50'
                              : 'border-[#9BCFCF] bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotifColor(notif.type_notification)}`}>
                              <FontAwesomeIcon icon={getNotifIcon(notif.type_notification)} className="text-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-semibold text-[#0D2527] text-sm font-cairo">{notif.titre}</p>
                                {!notif.read_at && (
                                  <span className="w-2 h-2 bg-[#306B6F] rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 font-cairo mb-2">{notif.message}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                  <FontAwesomeIcon icon={faClock} />
                                  <span>{new Date(notif.sent_at).toLocaleString('fr-DZ')}</span>
                                </div>
                                {!notif.read_at && (
                                  <button
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    className="text-xs text-[#306B6F] hover:underline font-cairo"
                                  >
                                    {t.notifications.markRead}
                                  </button>
                                )}
                                {notif.read_at && (
                                  <span className="text-xs text-gray-400 font-cairo">{t.notifications.read}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}