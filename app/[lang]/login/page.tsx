'use client';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '@/lib/auth';  // ✅ new auth context
import { 
  faEnvelope, 
  faLock, 
  faEye, 
  faEyeSlash,
  faBuildingColumns
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PageProps = {
  params: Promise<{ lang: string }>;
};

// Mapping des rôles vers les URLs de redirection (identique à l'original)
const ROLE_REDIRECTS: Record<string, string> = {
  admin:                    '/fr/system-admin',
  operateur_economique:     '/fr/dashboard/operator',
  service_contractant:      '/fr/dashboard/contractant',
  commission_externe:       '/fr/validation/dashboard/validator',
  tutelle:                  '/fr/validation/dashboard/validator',
  chef_commission:          '/fr/chef_com',
  evaluateur:               '/fr/evaluateur',
  evaluateur_administratif: '/fr/evaluateur-admin',
};

function getRedirectPath(roleName: string, idRole: number): string {
  const normalized = roleName.toLowerCase().trim().replace(/\s+/g, '_');
  if (ROLE_REDIRECTS[normalized]) return ROLE_REDIRECTS[normalized];
  if (normalized.includes('admin'))   return ROLE_REDIRECTS.admin;
  if (normalized.includes('operateur')) return ROLE_REDIRECTS.operateur_economique;
  if (normalized.includes('contractant')) return ROLE_REDIRECTS.service_contractant;
  if (normalized.includes('commission')) return ROLE_REDIRECTS.commission_externe;
  if (normalized.includes('tutelle')) return ROLE_REDIRECTS.tutelle;
  const idRoleMap: Record<number, string> = {
    1: ROLE_REDIRECTS.admin,
    2: ROLE_REDIRECTS.service_contractant,
    3: ROLE_REDIRECTS.commission_externe,
    4: ROLE_REDIRECTS.operateur_economique,
    5: ROLE_REDIRECTS.tutelle,
  };
  return idRoleMap[idRole] ?? '/fr/dashboard/operator';
}

export default function LoginPage({ params }: PageProps) {
  const [lang, setLang] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();      // ✅ new login function
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const loadLang = async () => {
      const resolvedParams = await params;
      if (isMounted) setLang(resolvedParams.lang);
    };
    loadLang();
    return () => { isMounted = false; };
  }, [params]);

  const isArabic = lang === 'ar';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError(isArabic ? 'هذا الحقل مطلوب' : 'Ce champ est obligatoire');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(isArabic ? 'عنوان بريد إلكتروني غير صالح' : 'Adresse e-mail invalide');
      setLoading(false);
      return;
    }

    try {
      // ✅ Appel à la nouvelle fonction login (gère token, refresh, user)
      await login(email, password);

      // Après le login, récupérer le token stocké pour décoder le rôle
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Token non trouvé après connexion');

      // Décoder le JWT pour obtenir le rôle
      const base64Url = token.split('.')[1];
      const decoded = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
      const roleName = decoded.role || decoded.role_name || '';
      const idRole   = decoded.id_role || 0;
      const redirectPath = getRedirectPath(roleName, idRole);

      // Redirection finale
      window.location.href = redirectPath;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || (isArabic ? 'خطأ في الاتصال' : 'Erreur de connexion');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Le reste du JSX est strictement identique à votre version originale
  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#FCFFFF]">

      {/* Left Panel – Branding */}
      <section className="hidden lg:flex lg:w-1/2 bg-[#0D2527] flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 border-2 border-[#9BCFCF] rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 border-2 border-[#589C9F] rounded-full"></div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <FontAwesomeIcon icon={faBuildingColumns} className="text-[#9BCFCF] text-4xl" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 font-cairo">
            {isArabic ? 'منصة الميزان' : 'Plateforme Al-Mizan'}
          </h1>
          <p className="text-[#9BCFCF] text-lg leading-relaxed font-cairo">
            {isArabic
              ? 'منصة ذكية وسيادية لإدارة الصفقات العمومية في الجزائر'
              : 'Plateforme intelligente et souveraine de gestion des marchés publics en Algérie'}
          </p>

          <div className="mt-12 flex flex-col gap-3 text-sm text-[#589C9F]">
            {[
              { ar: 'متوافق مع القانون 23-12', fr: 'Conforme Loi 23-12' },
              { ar: 'حماية البيانات حسب القانون 18-07', fr: 'Protection des données Loi 18-07' },
              { ar: 'استضافة سيادية جزائرية', fr: 'Hébergement souverain algérien' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 justify-center">
                <span className="w-2 h-2 bg-[#9BCFCF] rounded-full"></span>
                {isArabic ? item.ar : item.fr}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right Panel – Login Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-20 h-20 bg-[#0D2527] rounded-2xl flex items-center justify-center">
              <FontAwesomeIcon icon={faBuildingColumns} className="text-[#FCFFFF] text-3xl" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0D2527] mb-2 font-cairo">
              {isArabic ? 'تسجيل الدخول' : 'Connexion'}
            </h2>
            <p className="text-[#418387] font-cairo">
              {isArabic ? 'منصة إدارة الصفقات العمومية' : 'Gestion des marchés publics'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#173C3F] mb-2 font-cairo">
                {isArabic ? 'البريد الإلكتروني' : 'Adresse e-mail'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 inset-s-0 flex items-center ps-4 pointer-events-none text-[#589C9F]">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ps-11 pe-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-[#306B6F] focus:border-[#306B6F] outline-none transition-all font-cairo
                    ${error && !email ? 'border-red-400 focus:ring-red-200' : 'border-[#9BCFCF]'}`}
                  placeholder={isArabic ? 'أدخل بريدك الإلكتروني' : 'exemple@domain.dz'}
                  required
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#173C3F] mb-2 font-cairo">
                {isArabic ? 'كلمة المرور' : 'Mot de passe'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 inset-s-0 flex items-center ps-4 pointer-events-none text-[#589C9F]">
                  <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ps-11 pe-12 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-[#306B6F] focus:border-[#306B6F] outline-none transition-all font-cairo
                    ${error && !password ? 'border-red-400 focus:ring-red-200' : 'border-[#9BCFCF]'}`}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 inset-e-0 flex items-center pe-4 text-[#589C9F] hover:text-[#306B6F] transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#9BCFCF] text-[#306B6F] focus:ring-[#306B6F] cursor-pointer"
                />
                <span className="text-sm text-[#418387] font-cairo group-hover:text-[#306B6F] transition-colors">
                  {isArabic ? 'تذكرني' : 'Se souvenir de moi'}
                </span>
              </label>
              <Link
                href={`/${lang}/forgot-password`}
                className="text-sm text-[#306B6F] hover:text-[#173C3F] font-medium font-cairo transition-colors text-end"
              >
                {isArabic ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
              </Link>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-cairo animate-pulse">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#306B6F] hover:bg-[#173C3F] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed font-cairo shadow-lg shadow-[#306B6F]/25 hover:shadow-[#173C3F]/40"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{isArabic ? 'جاري الدخول...' : 'Connexion...'}</span>
                </>
              ) : (
                <>
                  <span>{isArabic ? 'دخول' : 'Se connecter'}</span>
                  {!isArabic && <FontAwesomeIcon icon={faArrowRight} />}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-sm text-[#6B8E8F] font-cairo">
              {isArabic ? 'ليس لديك حساب؟' : 'Pas encore de compte ?'}{' '}
              <Link
                href={`/${lang}/select-organization`}
                className="text-[#306B6F] hover:text-[#173C3F] font-medium transition-colors"
              >
                {isArabic ? 'إنشاء منظمة' : 'Créer une organisation'}
              </Link>
            </p>

            {/* Language Switcher */}
            <div className="mt-6 flex justify-center gap-2">
              {(['fr', 'ar'] as const).map((l) => (
                <Link
                  key={l}
                  href={`/${l}/login`}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${lang === l
                    ? 'bg-[#306B6F] text-white'
                    : 'bg-[#FCFFFF] text-[#418387] border border-[#9BCFCF] hover:border-[#589C9F]'
                    }`}
                >
                  {l === 'fr' ? 'Français' : 'العربية'}
                </Link>
              ))}
            </div>
          </div>

          {/* Ministry Footer */}
          <div className="mt-12 flex justify-center opacity-60">
            <div className="flex items-center gap-2 text-[#418387] text-xs font-cairo">
              <FontAwesomeIcon icon={faBuildingColumns} className="w-4 h-4" />
              <span>© 2026 {isArabic ? 'وزارة المالية' : 'Ministère des Finances'}</span>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}