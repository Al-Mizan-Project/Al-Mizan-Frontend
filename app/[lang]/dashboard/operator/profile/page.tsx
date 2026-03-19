'use client';

import { useState, FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faBuilding,
  faInfoCircle,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faLock,
  faSave,
  faBell,
  faShieldHalved,
  faCheckCircle,
  faUsers,
  faBriefcase,
  faKey
} from '@fortawesome/free-solid-svg-icons';

type UserProfile = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  fonction: string;
  role: 'admin' | 'membre' | 'lecteur';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
};

type OrgProfile = {
  id: number;
  nomOfficiel: string;
  email: string;
  telephone: string;
  adresse: string;
  wilaya: string;
  commune: string;
  registreCommerce: string;
  nif: string;
  casnos: string;
  cnas: string;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'personal' | 'organization' | 'security' | 'notifications'>('personal');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useState(async () => {
    const resolvedParams = await params;
    setLang(resolvedParams.lang);
  });

  const isArabic = lang === 'ar';

  // User/Employee Profile Data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 1,
    nom: 'Benali',
    prenom: 'Ahmed',
    email: 'ahmed.benali@example-tech.dz',
    telephone: '+213 555 123 456',
    fonction: 'Responsable des Marchés',
    role: 'admin',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });

  // Organization Profile Data (Read-only for most fields)
  const [orgProfile, setOrgProfile] = useState<OrgProfile>({
    id: 1,
    nomOfficiel: 'SARL Example Technology',
    email: 'contact@example-tech.dz',
    telephone: '+213 21 555 000',
    adresse: '15 Rue Mohamed Belouizdad',
    wilaya: 'Alger',
    commune: 'Belouizdad',
    registreCommerce: '16/00-1234567A12',
    nif: '001234567890123',
    casnos: 'CASNOS-2026-001',
    cnas: 'CNAS-ALG-456789'
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmitPersonal = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuccessMessage(isArabic ? 'Profil personnel mis à jour' : 'Profil personnel mis à jour');
    setLoading(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmitOrg = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuccessMessage(isArabic ? 'Informations organisation mises à jour' : 'Informations de l\'organisation mises à jour');
    setLoading(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(isArabic ? 'كلمتا المرور غير متطابقتين' : 'Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuccessMessage(isArabic ? 'كلمة المرور تم تغييرها' : 'Mot de passe changé avec succès');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setLoading(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: isArabic ? 'مدير' : 'Administrateur',
      membre: isArabic ? 'عضو' : 'Membre',
      lecteur: isArabic ? 'قارئ' : 'Lecteur'
    };
    return labels[role] || role;
  };

  const translations = {
    fr: {
      title: 'Mon Profil',
      tabs: {
        personal: 'Profil personnel',
        organization: 'Profil de l\'organisation',
        security: 'Sécurité',
        notifications: 'Notifications'
      },
      personal: {
        title: 'Informations personnelles',
        nom: 'Nom',
        prenom: 'Prénom',
        email: 'Email professionnel',
        telephone: 'Téléphone',
        fonction: 'Fonction dans l\'organisation',
        role: 'Rôle',
        roleInfo: 'Votre rôle détermine vos permissions dans la plateforme',
        save: 'Enregistrer'
      },
      organization: {
        title: 'Informations de l\'organisation',
        nomOfficiel: 'Raison sociale',
        email: 'Email officiel',
        telephone: 'Téléphone',
        adresse: 'Adresse du siège',
        wilaya: 'Wilaya',
        commune: 'Commune',
        registreCommerce: 'Registre de Commerce',
        nif: 'NIF',
        casnos: 'CASNOS',
        cnas: 'CNAS',
        info: 'Ces informations sont vérifiées et validées par l\'administration. Pour les modifier, contactez votre administrateur.',
        save: 'Mettre à jour'
      },
      security: {
        title: 'Sécurité du compte',
        password: {
          title: 'Changer le mot de passe',
          current: 'Mot de passe actuel',
          new: 'Nouveau mot de passe',
          confirm: 'Confirmer le nouveau mot de passe',
          change: 'Changer le mot de passe',
          requirements: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre'
        },
        twoFactor: {
          title: 'Authentification à deux facteurs',
          desc: 'Ajoutez une couche de sécurité supplémentaire avec un code SMS ou une application d\'authentification',
          enable: 'Activer'
        }
      },
      notifications: {
        title: 'Préférences de notification',
        email: 'Notifications par email',
        emailDesc: 'Recevoir les notifications importantes par email',
        sms: 'Notifications par SMS',
        smsDesc: 'Recevoir les alertes urgentes par SMS',
        push: 'Notifications push',
        pushDesc: 'Recevoir des notifications dans l\'application',
        save: 'Enregistrer'
      },
      success: 'Modifications enregistrées avec succès'
    },
    ar: {
      title: 'ملفي',
      tabs: {
        personal: 'الملف الشخصي',
        organization: 'ملف المؤسسة',
        security: 'الأمان',
        notifications: 'الإشعارات'
      },
      personal: {
        title: 'المعلومات الشخصية',
        nom: 'الاسم العائلي',
        prenom: 'الاسم الشخصي',
        email: 'البريد الإلكتروني المهني',
        telephone: 'الهاتف',
        fonction: 'المنصب في المؤسسة',
        role: 'الدور',
        roleInfo: 'يحدد دورك صلاحياتك في المنصة',
        save: 'حفظ'
      },
      organization: {
        title: 'معلومات المؤسسة',
        nomOfficiel: 'الاسم التجاري',
        email: 'البريد الإلكتروني الرسمي',
        telephone: 'الهاتف',
        adresse: 'عنوان المقر',
        wilaya: 'الولاية',
        commune: 'البلدية',
        registreCommerce: 'السجل التجاري',
        nif: 'الرقم الجبائي',
        casnos: 'الكاسنوس',
        cnas: 'الضمان الاجتماعي',
        info: 'تم التحقق من هذه المعلومات واعتمادها من قبل الإدارة. لتعديلها، تواصل مع المسؤول.',
        save: 'تحديث'
      },
      security: {
        title: 'أمان الحساب',
        password: {
          title: 'تغيير كلمة المرور',
          current: 'كلمة المرور الحالية',
          new: 'كلمة المرور الجديدة',
          confirm: 'تأكيد كلمة المرور الجديدة',
          change: 'تغيير كلمة المرور',
          requirements: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، حرف كبير ورقم'
        },
        twoFactor: {
          title: 'المصادقة الثنائية',
          desc: 'أضف طبقة أمان إضافية برمز SMS أو تطبيق مصادقة',
          enable: 'تفعيل'
        }
      },
      notifications: {
        title: 'تفضيلات الإشعارات',
        email: 'الإشعارات عبر البريد الإلكتروني',
        emailDesc: 'استلام الإشعارات الهامة عبر البريد الإلكتروني',
        sms: 'الإشعارات عبر الرسائل القصيرة',
        smsDesc: 'استلام التنبيهات العاجلة عبر الرسائل القصيرة',
        push: 'الإشعارات الفورية',
        pushDesc: 'استلام الإشعارات في التطبيق',
        save: 'حفظ'
      },
      success: 'تم حفظ التغييرات بنجاح'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  if (!lang) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0D2527] mb-2 font-cairo">{t.title}</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-pulse">
          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Profile Cards */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Card */}
          <div className="bg-white rounded-xl border-2 border-[#9BCFCF] p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#306B6F] to-[#418387] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FontAwesomeIcon icon={faUser} className="text-white text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-[#0D2527]">
              {userProfile.prenom} {userProfile.nom}
            </h2>
            <p className="text-sm text-[#418387] mb-1">{userProfile.fonction}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              userProfile.role === 'admin' ? 'bg-green-100 text-green-700' :
              userProfile.role === 'membre' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {getRoleLabel(userProfile.role)}
            </span>
            <p className="text-xs text-gray-500 mt-3">{userProfile.email}</p>
          </div>

          {/* Organization Card */}
          <div className="bg-white rounded-xl border-2 border-[#9BCFCF] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#306B6F] rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faBuilding} className="text-white" />
              </div>
              <h3 className="font-bold text-[#0D2527]">{t.organization.title}</h3>
            </div>
            <p className="text-sm font-medium text-[#0D2527] mb-1">{orgProfile.nomOfficiel}</p>
            <p className="text-xs text-gray-600 mb-3">{orgProfile.registreCommerce}</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Wilaya:</span>
                <span className="font-medium">{orgProfile.wilaya}</span>
              </div>
              <div className="flex justify-between">
                <span>Membres:</span>
                <span className="font-medium flex items-center gap-1">
                  <FontAwesomeIcon icon={faUsers} className="text-[#306B6F]" />
                  12
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          
          {/* Tabs Navigation */}
          <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {[
                { id: 'personal', icon: faUser, label: t.tabs.personal },
                { id: 'organization', icon: faBuilding, label: t.tabs.organization },
                { id: 'security', icon: faShieldHalved, label: t.tabs.security },
                { id: 'notifications', icon: faBell, label: t.tabs.notifications }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[#306B6F] text-[#306B6F] bg-[#FCFFFF]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FontAwesomeIcon icon={tab.icon} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              
              {/* Personal Profile Tab */}
              {activeTab === 'personal' && (
                <form onSubmit={handleSubmitPersonal} className="space-y-6">
                  <h3 className="text-xl font-bold text-[#0D2527] mb-4 font-cairo">{t.personal.title}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.personal.nom} *
                      </label>
                      <input
                        type="text"
                        value={userProfile.nom}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, nom: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.personal.prenom} *
                      </label>
                      <input
                        type="text"
                        value={userProfile.prenom}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, prenom: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.personal.email} *
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.personal.telephone}
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={userProfile.telephone}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, telephone: e.target.value }))}
                          className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.personal.fonction}
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faBriefcase} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={userProfile.fonction}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, fonction: e.target.value }))}
                          className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.personal.role}
                      </label>
                      <div className="flex items-center gap-3 p-3 bg-[#FCFFFF] border border-[#9BCFCF] rounded-xl">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          userProfile.role === 'admin' ? 'bg-green-100 text-green-700' :
                          userProfile.role === 'membre' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getRoleLabel(userProfile.role)}
                        </span>
                        <p className="text-xs text-gray-600">{t.personal.roleInfo}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                      <FontAwesomeIcon icon={faSave} />
                      {loading ? '...' : t.personal.save}
                    </button>
                  </div>
                </form>
              )}

              {/* Organization Profile Tab */}
              {activeTab === 'organization' && (
                <form onSubmit={handleSubmitOrg} className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                    <p className="text-blue-800 text-sm flex items-center gap-2">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      {t.organization.info}
                    </p>
                  </div>

                  <h3 className="text-xl font-bold text-[#0D2527] mb-4 font-cairo">{t.organization.title}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.organization.nomOfficiel}
                      </label>
                      <input
                        type="text"
                        value={orgProfile.nomOfficiel}
                        onChange={(e) => setOrgProfile(prev => ({ ...prev, nomOfficiel: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none bg-gray-50"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.organization.email}
                      </label>
                      <input
                        type="email"
                        value={orgProfile.email}
                        onChange={(e) => setOrgProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none bg-gray-50"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.organization.telephone}
                      </label>
                      <input
                        type="tel"
                        value={orgProfile.telephone}
                        onChange={(e) => setOrgProfile(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none bg-gray-50"
                        disabled
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.organization.adresse}
                      </label>
                      <div className="relative">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={orgProfile.adresse}
                          onChange={(e) => setOrgProfile(prev => ({ ...prev, adresse: e.target.value }))}
                          className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none bg-gray-50"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.organization.wilaya}
                      </label>
                      <input
                        type="text"
                        value={orgProfile.wilaya}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#173C3F] mb-2">
                        {t.organization.commune}
                      </label>
                      <input
                        type="text"
                        value={orgProfile.commune}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                        disabled
                      />
                    </div>

                    {/* Legal IDs - Read Only */}
                    {[
                      { label: t.organization.registreCommerce, value: orgProfile.registreCommerce },
                      { label: t.organization.nif, value: orgProfile.nif },
                      { label: t.organization.casnos, value: orgProfile.casnos },
                      { label: t.organization.cnas, value: orgProfile.cnas }
                    ].map((field, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-[#173C3F] mb-2">
                          {field.label}
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                          <span className="font-mono text-sm text-gray-800">{field.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                      <FontAwesomeIcon icon={faSave} />
                      {loading ? '...' : t.organization.save}
                    </button>
                  </div>
                </form>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  
                  {/* Password Change */}
                  <div>
                    <h3 className="text-xl font-bold text-[#0D2527] mb-4 font-cairo flex items-center gap-2">
                      <FontAwesomeIcon icon={faKey} />
                      {t.security.password.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{t.security.password.requirements}</p>
                    
                    <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-[#173C3F] mb-2">
                          {t.security.password.current}
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#173C3F] mb-2">
                          {t.security.password.new}
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full ps-10 pe-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
                            required
                            minLength={8}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#173C3F] mb-2">
                          {t.security.password.confirm}
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`w-full ps-10 pe-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none ${
                              passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                ? 'border-red-400'
                                : 'border-gray-300'
                            }`}
                            required
                          />
                        </div>
                        {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                          <p className="text-red-600 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors disabled:opacity-70"
                      >
                        {loading ? '...' : t.security.password.change}
                      </button>
                    </form>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between p-4 bg-[#FCFFFF] border border-[#9BCFCF] rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#306B6F] rounded-xl flex items-center justify-center">
                          <FontAwesomeIcon icon={faShieldHalved} className="text-white text-xl" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#0D2527]">{t.security.twoFactor.title}</h4>
                          <p className="text-sm text-gray-600">{t.security.twoFactor.desc}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">
                        {t.security.twoFactor.enable}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-[#0D2527] mb-4 font-cairo">{t.notifications.title}</h3>
                  
                  <div className="space-y-4">
                    {[
                      {
                        key: 'email',
                        icon: faEnvelope,
                        color: 'blue',
                        title: t.notifications.email,
                        desc: t.notifications.emailDesc
                      },
                      {
                        key: 'sms',
                        icon: faPhone,
                        color: 'green',
                        title: t.notifications.sms,
                        desc: t.notifications.smsDesc
                      },
                      {
                        key: 'push',
                        icon: faBell,
                        color: 'purple',
                        title: t.notifications.push,
                        desc: t.notifications.pushDesc
                      }
                    ].map((item) => (
                      <label 
                        key={item.key}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center`}>
                            <FontAwesomeIcon icon={item.icon} className={`text-${item.color}-600 text-xl`} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#0D2527]">{item.title}</h4>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={userProfile.notifications[item.key as keyof typeof userProfile.notifications]}
                          onChange={(e) => setUserProfile(prev => ({
                            ...prev,
                            notifications: { 
                              ...prev.notifications, 
                              [item.key]: e.target.checked 
                            }
                          }))}
                          className="w-5 h-5 text-[#306B6F] border-gray-300 rounded focus:ring-[#306B6F]"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end pt-6">
                    <button 
                      onClick={handleSubmitPersonal}
                      className="px-8 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faSave} />
                      {t.notifications.save}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}