"use client";

import  { useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faEye, faEyeSlash, faUserPlus } from '@fortawesome/free-solid-svg-icons';

interface PageParams {
  params: Promise<{ lang: string }>;
}

export default function UserRegister({ params }: PageParams) {
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
    <main className="min-h-screen flex flex-col md:flex-row bg-white relative font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* --- SÉLECTEUR DE LANGUE (Fixed pour ne pas impacter le layout) --- */}
      <div className={`fixed top-6 ${isAr ? 'left-6' : 'right-6'} z-50`}>
        <button 
          onClick={() => toggleLanguage(isAr ? 'fr' : 'ar')}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:border-[#005c6e] hover:text-[#005c6e] transition-all shadow-sm rounded-sm"
        >
          <FontAwesomeIcon icon={faGlobe} className="opacity-50" />
          {isAr ? 'Français' : 'العربية'}
        </button>
      </div>

      {/* --- SECTION GAUCHE : IDENTITÉ VISUELLE --- */}
      <div className="hidden md:flex md:w-2/5 lg:w-[35%] bg-[#005c6e] sticky top-0 h-screen overflow-hidden p-12 flex-col justify-between text-white">
        <div className="z-10">
          <div className="text-2xl font-bold tracking-tighter mb-12 italic">AL-MIZAN</div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            {isAr ? 'إنشاء حساب جديد' : 'Créer un compte'}
          </h2>
          <p className="text-cyan-100/70 text-sm leading-relaxed max-w-xs">
            {isAr 
              ? 'ابدأ رحلتك في إدارة الصفقات العمومية بذكاء وشفافية.' 
              : 'Commencez votre gestion des marchés publics avec intelligence et transparence.'}
          </p>
        </div>
        
        <div className="z-10 bg-white/5 p-6 border border-white/10 rounded-sm">
           <p className="text-[11px] leading-relaxed opacity-80 uppercase tracking-wider font-medium">
             {isAr ? 'بوابتك الموحدة للصفقات العمومية' : 'Portail unifié des marchés publics'}
           </p>
        </div>
        
        <FontAwesomeIcon icon={faUserPlus} className="absolute -bottom-10 -right-10 text-[22rem] opacity-5 -rotate-12" />
      </div>

      {/* --- SECTION DROITE : FORMULAIRE CENTRÉ --- */}
      <div className="flex-1 bg-[#fcfcfc] flex items-center justify-center py-20 px-8 md:px-16">
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mb-10 text-center md:text-start">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                {isAr ? 'المعلومات الشخصية' : 'Informations personnelles'}
            </h3>
            <p className="text-gray-400 text-sm mt-2">
                {isAr ? 'أدخل بياناتك لإنشاء حسابك' : 'Entrez vos coordonnées pour créer votre compte'}
            </p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
                <FormInput name="user_nom" label={isAr ? "اللقب" : "Nom"} placeholder={isAr ? "فراح" : "Ferrah"} />
                <FormInput name="user_prenom" label={isAr ? "الاسم" : "Prénom"} placeholder={isAr ? "مريم" : "Meriem"} />
            </div>

            <FormInput name="user_email" label="E-mail" type="email" placeholder="example@gmail.com" />
            
            <div className="relative">
                <FormInput 
                    name="user_password" 
                    label={isAr ? "كلمة المرور" : "Mot de passe"} 
                    type={showPassword ? "text" : "password"} 
                    placeholder="@#*%" 
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isAr ? 'left-3' : 'right-3'} top-9 text-gray-400 hover:text-[#005c6e] p-1`}
                >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size="sm" />
                </button>
            </div>

            <FormInput 
                name="user_password_confirm" 
                label={isAr ? "تأكيد كلمة المرور" : "Confirmer le mot de passe"} 
                type="password" 
                placeholder="@#*%" 
            />

            <div className="flex items-center gap-2 py-1">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded-sm border-gray-300 text-[#005c6e] focus:ring-[#005c6e]" />
                <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer select-none">
                    {isAr ? 'تذكرني' : 'Se souvenir de moi'}
                </label>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#005c6e] text-white py-3.5 rounded-md font-bold text-sm shadow-sm hover:bg-gray-600 cursor-pointer transition-all mt-2"
            >
              {isAr ? 'تسجيل' : "S'inscrire"}
            </button>

            <div className="relative flex items-center py-3">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-gray-300 text-[10px] font-bold uppercase tracking-widest">{isAr ? 'أو' : 'OU'}</span>
                <div className="flex-grow border-t border-gray-100"></div>
            </div>

            
            <p className="text-center text-xs text-gray-400 ">
                {isAr ? 'لديك حساب بالفعل؟' : 'Déjà un compte ?'}{' '}
                <button 
                  type="button" 
                  onClick={() => router.push(`/${lang}/auth`)}
                  className="text-[#005c6e] font-bold hover:underline ml-1"
                >
                    {isAr ? 'تسجيل الدخول' : 'Se connecter'}
                </button>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function FormInput({ label, name, placeholder, type = "text" }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{label}</label>
      <input 
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full bg-[#f8fafb] border border-gray-100 p-3 text-sm focus:outline-none focus:border-[#005c6e] focus:bg-white transition-all rounded-md placeholder:text-gray-300"
      />
    </div>
  );
}