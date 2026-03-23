"use client";

import { useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCloudUploadAlt, faArrowRight, faArrowLeft, faGlobe, faUserShield } from '@fortawesome/free-solid-svg-icons';

interface PageParams {
  params: Promise<{ lang: string }>;
}

export default function TutelleRegistration({ params }: PageParams) {
  const { lang } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentStep, setCurrentStep] = useState(1);
  const isAr = lang === 'ar';

  const toggleLanguage = (newLang: string) => {
    const segments = pathname.split('/');
    segments[1] = newLang;
    router.push(segments.join('/'));
  };

  const steps_labels = {
    1: isAr ? 'معلومات الجهة' : 'Informations de l\'Entité',
    2: isAr ? 'تفاصيل الوصاية' : 'Détails de la Tutelle'
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
            {isAr ? 'تسجيل هيئة الوصاية' : 'Inscription Tutelle'}
          </h2>
          <p className="text-cyan-100 opacity-80 text-sm leading-relaxed">
            {isAr 
              ? 'بوابة الإشراف الإداري لمتابعة وتوجيه المصلحة المتعاقدة واللجان التابعة.' 
              : 'Portail de supervision administrative pour le suivi et l\'orientation des services contractants.'}
          </p>
        </div>

        <div className="z-10 space-y-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${currentStep >= s ? 'bg-white text-[#005c6e]' : 'border-white/30 text-white/50'}`}>
                {currentStep > s ? <FontAwesomeIcon icon={faCheck} className="text-xs" /> : s}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${currentStep === s ? 'opacity-100' : 'opacity-40'}`}>
                {steps_labels[s as keyof typeof steps_labels]}
              </span>
            </div>
          ))}
        </div>
        <FontAwesomeIcon icon={faUserShield} className="absolute -bottom-10 -right-10 text-[20rem] opacity-5 -rotate-12" />
      </div>

      {/* --- SECTION DROITE : FORMULAIRE --- */}
      <div className="flex-1 bg-[#fcfcfc] p-6 md:p-16 lg:p-24 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 mt-8 md:mt-0">
            <span className="text-[#005c6e] font-bold text-xs uppercase tracking-widest block mb-2">
              {isAr ? `المرحلة ${currentStep} من 2` : `Étape ${currentStep} sur 2`}
            </span>
            <h3 className="text-2xl font-bold text-gray-900">{steps_labels[currentStep as keyof typeof steps_labels]}</h3>
          </div>

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && (
              <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <FormInput name="tu_nom_officiel" label={isAr ? "الاسم الرسمي" : "Nom officiel"} placeholder="..." />
                <FormInput name="tu_adresse_siege" label={isAr ? "عنوان المقر" : "Adresse siège"} placeholder="..." />
                <FormInput name="tu_email_contact" label={isAr ? "البريد الإلكتروني" : "Email contact"} type="email" placeholder="..." />
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <FormSelect 
                  name="tu_nom_tutelle" 
                  label={isAr ? "اسم الوصاية" : "Nom de la tutelle"} 
                  options={['Ministère', 'Wilaya', 'Présidence', 'Autre']} 
                />
                
                <FormInput 
                  name="tu_identite_autorite" 
                  label={isAr ? "هوية السلطة" : "Identité de l'autorité"} 
                  placeholder="..." 
                />

                <div className="mt-4">
                  <FileUpload 
                    name="tu_acte_officiel" 
                    label={isAr ? "عقد الوصاية / المرسوم الرسمي" : "Acte de tutelle / Arrêté officiel"} 
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-10 mt-10 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className={`flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors ${currentStep === 1 ? 'invisible' : ''}`}
              >
                <FontAwesomeIcon icon={isAr ? faArrowRight : faArrowLeft} />
                {isAr ? 'السابق' : 'Précédent'}
              </button>

              <button 
                type="button"
                onClick={() => currentStep < 2 ? setCurrentStep(currentStep + 1) : null}
                className="bg-[#005c6e] text-white px-8 py-3 rounded-sm font-bold text-sm uppercase flex items-center gap-3 hover:bg-gray-800 transition-all shadow-md shadow-gray-200"
              >
                {currentStep === 2 ? (isAr ? 'حفظ البيانات' : 'Sauvegarder') : (isAr ? 'التالي' : 'Suivant')}
                {currentStep < 2 && <FontAwesomeIcon icon={isAr ? faArrowLeft : faArrowRight} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

// --- SOUS-COMPOSANTS ---

function FormInput({ label, name, placeholder, type = "text" }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{label}</label>
      <input 
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#005c6e] transition-all rounded-sm"
      />
    </div>
  );
}

function FormSelect({ label, name, options }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{label}</label>
      <div className="relative">
        <select id={name} name={name} className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#005c6e] cursor-pointer appearance-none rounded-sm">
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-30">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}

function FileUpload({ label, name }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{label}</label>
      <label htmlFor={name} className="border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center hover:bg-[#005c6e]/5 hover:border-[#005c6e] cursor-pointer transition-all group min-h-[140px] rounded-sm">
        <input type="file" id={name} name={name} className="hidden" />
        <FontAwesomeIcon icon={faCloudUploadAlt} className="text-gray-300 group-hover:text-[#005c6e] mb-3 text-2xl" />
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-gray-600 transition-colors">
          Joindre l'acte officiel (PDF)
        </span>
      </label>
    </div>
  );
}