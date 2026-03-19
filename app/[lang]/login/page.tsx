'use client';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useState, FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faLock, 
  faEye, 
  faEyeSlash,
  faBuildingColumns 
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default function LoginPage({ params }: PageProps) {
  const [lang, setLang] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load lang from params on mount
  useState(async () => {
    const resolvedParams = await params;
    setLang(resolvedParams.lang);
  });

  const isArabic = lang === 'ar';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Basic validation
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

    // TODO: Replace with actual API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API
      console.log('Login attempt:', { email, password, remember, lang });
      
      // Redirect to dashboard on success
      router.push(`/${lang}/dashboard`);
    } catch (err) {
      setError(isArabic ? 'بيانات الدخول غير صحيحة' : 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-[#FCFFFF]">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <section className="hidden lg:flex lg:w-1/2 bg-[#0D2527] flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 border-2 border-[#9BCFCF] rounded-full"></div>
          <div className="absolute bottom-20 left-20 w-48 h-48 border-2 border-[#589C9F] rounded-full"></div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          {/* Ministry Logo - White Version */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <FontAwesomeIcon icon={faBuildingColumns} className="text-[#9BCFCF] text-4xl" />
              {/* Replace with actual logo: <Image src="/logos/ministry-white.svg" alt="وزارة المالية" width={96} height={96} /> */}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 font-cairo">
            {isArabic ? 'منصة الميزان' : 'Plateforme Al-Mizan'}
          </h1>
          <p className="text-[#9BCFCF] text-lg leading-relaxed font-cairo">
            {isArabic 
              ? 'منصة ذكية وسيادية لإدارة الصفقات العمومية في الجزائر' 
              : 'Plateforme intelligente et souveraine de gestion des marchés publics en Algérie'
            }
          </p>
          
          {/* Trust Badges */}
          <div className="mt-12 flex flex-col gap-3 text-sm text-[#589C9F]">
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2 h-2 bg-[#9BCFCF] rounded-full"></span>
              {isArabic ? 'متوافق مع القانون 23-12' : 'Conforme Loi 23-12'}
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2 h-2 bg-[#9BCFCF] rounded-full"></span>
              {isArabic ? 'حماية البيانات حسب القانون 18-07' : 'Protection des données Loi 18-07'}
            </div>
            <div className="flex items-center gap-2 justify-center">
              <span className="w-2 h-2 bg-[#9BCFCF] rounded-full"></span>
              {isArabic ? 'استضافة سيادية جزائرية' : 'Hébergement souverain algérien'}
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel - Login Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-20 h-20 bg-[#0D2527] rounded-2xl flex items-center justify-center">
              <FontAwesomeIcon icon={faBuildingColumns} className="text-[#FCFFFF] text-3xl" />
              {/* Replace with: <Image src="/logos/ministry-blue.svg" alt="وزارة المالية" width={80} height={80} /> */}
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
            
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-[#173C3F] mb-2 font-cairo"
              >
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

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[#173C3F] mb-2 font-cairo"
              >
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
                  placeholder={isArabic ? '••••••••' : '••••••••'}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 inset-e-0 flex items-center pe-4 text-[#589C9F] hover:text-[#306B6F] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-cairo animate-pulse">
                {error}
              </div>
            )}

            {/* Submit Button */}
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
                  {!isArabic && (
  <FontAwesomeIcon icon={faArrowRight} />
)}
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
              <Link
                href="/fr/login"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  lang === 'fr' 
                    ? 'bg-[#306B6F] text-white' 
                    : 'bg-[#FCFFFF] text-[#418387] border border-[#9BCFCF] hover:border-[#589C9F]'
                }`}
              >
                Français
              </Link>
              <Link
                href="/ar/login"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  lang === 'ar' 
                    ? 'bg-[#306B6F] text-white' 
                    : 'bg-[#FCFFFF] text-[#418387] border border-[#9BCFCF] hover:border-[#589C9F]'
                }`}
              >
                العربية
              </Link>
            </div>
          </div>

          {/* Ministry Footer Logo - Blue Version */}
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