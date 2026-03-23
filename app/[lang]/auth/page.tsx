"use client";

import { useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faEye, faEyeSlash, faUnlockKeyhole } from '@fortawesome/free-solid-svg-icons';

interface PageParams {
  params: Promise<{ lang: string }>;
}

export default function UserLogin({ params }: PageParams) {
  const { lang } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  
  const [showPassword, setShowPassword] = useState(false);
  const isAr = lang === 'ar';

  const toggleLanguage = (newLang: string) => {
    const segments = pathname.split('/');
    segments[1] = newLang;
    router.push(segments.join('/'));
  };

  return (
    <main className="h-screen flex flex-col md:flex-row bg-white relative" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* --- SÉLECTEUR DE LANGUE --- */}
      <div className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} z-50`}>
        <button 
          onClick={() => toggleLanguage(isAr ? 'fr' : 'ar')}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 hover:border-[#005c6e] hover:text-[#005c6e] transition-all shadow-sm rounded-sm"
        >
          <FontAwesomeIcon icon={faGlobe} className="opacity-50" />
          {isAr ? 'Français' : 'العربية'}
        </button>
      </div>

      {/* --- SECTION GAUCHE : VISUEL --- */}
      <div className="hidden md:flex md:w-1/3 lg:w-2/5 bg-[#005c6e] relative overflow-hidden p-12 flex-col justify-between text-white">
        <div className="z-10">
          <div className="text-2xl font-bold tracking-tighter mb-10 italic">AL-MIZAN</div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            {isAr ? 'مرحباً بك مجدداً' : 'Bon retour parmi nous'}
          </h2>
          <p className="text-cyan-100 opacity-80 text-sm leading-relaxed">
            {isAr 
              ? 'قم بتسجيل الدخول للوصول إلى لوحة التحكم وإدارة ملفاتك.' 
              : 'Connectez-vous pour accéder à votre tableau de bord et gérer vos dossiers.'}
          </p>
        </div>

        <div className="z-10 bg-white/10 p-6 rounded-sm backdrop-blur-sm border border-white/10">
           <p className="text-xs leading-relaxed opacity-90">
             {isAr 
               ? 'بوابتك الموحدة للصفقات العمomية الرقمية في الجزائر.' 
               : 'Votre portail unique pour les marchés publics numérisés en Algérie.'}
           </p>
        </div>
        
        <FontAwesomeIcon icon={faUnlockKeyhole} className="absolute -bottom-10 -right-10 text-[20rem] opacity-5 -rotate-12" />
      </div>

      {/* --- SECTION DROITE : FORMULAIRE --- */}
      <div className="flex-1 bg-[#fcfcfc] p-6 md:p-16 lg:p-24 overflow-y-auto flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900">
                {isAr ? 'تسجيل الدخول' : 'Se connecter'}
            </h3>
            <p className="text-gray-400 text-sm mt-2">
                {isAr ? 'أدخل بيانات اعتمادك للوصول إلى حسابك' : 'Entrez vos identifiants pour accéder à votre compte'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <FormInput 
              name="login_email" 
              label={isAr ? "البريد الإلكتروني" : "E-mail"} 
              type="email" 
              placeholder="example@gmail.com" 
            />
            
            <div className="relative">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                        {isAr ? 'كلمة المرور' : 'Mot de passe'}
                    </label>
                    <button type="button" className="text-[10px] text-[#005c6e] font-bold hover:underline">
                        {isAr ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
                    </button>
                </div>
                <div className="relative">
                    <input 
                        name="login_password"
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#005c6e] transition-all rounded-sm placeholder:text-gray-300"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute ${isAr ? 'left-3' : 'right-3'} top-3 text-gray-400 hover:text-[#005c6e]`}
                    >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size="sm" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input type="checkbox" id="remember_login" className="rounded-sm border-gray-300 text-[#005c6e] focus:ring-[#005c6e]" />
                <label htmlFor="remember_login" className="text-xs text-gray-500 cursor-pointer select-none">
                    {isAr ? 'تذكرني' : 'Se souvenir de moi'}
                </label>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#005c6e] text-white py-3.5 rounded-sm font-bold text-sm uppercase tracking-widest hover:bg-gray-600 cursor-pointer transition-all shadow-md mt-4"
            >
              {isAr ? 'دخول' : 'Se connecter'}
            </button>
                <div className="relative flex items-center py-3">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-bold uppercase tracking-widest">{isAr ? 'أو' : 'OU'}</span>
                <div className="flex-grow border-t border-gray-100"></div>
            </div>
            <p className="text-center text-xs text-gray-400 ">
                {isAr ? 'ليس لديك حساب؟' : "Vous n'avez pas de compte ?"}{' '}
                <button 
                  type="button" 
                  onClick={() => router.push(`/${lang}/register/user`)}
                  className="text-[#005c6e] font-bold hover:underline"
                >
                    {isAr ? 'إنشاء حساب جديد' : "S'inscrire"}
                </button>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

// --- SOUS-COMPOSANT INPUT ---

function FormInput({ label, name, placeholder, type = "text" }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{label}</label>
      <input 
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#005c6e] transition-all rounded-sm placeholder:text-gray-300"
      />
    </div>
  );
}