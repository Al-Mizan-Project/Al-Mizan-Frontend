"use client";

import { useState, use } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Importation pour la navigation
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCloudUploadAlt, faArrowRight, faArrowLeft, faGlobe } from '@fortawesome/free-solid-svg-icons';

interface PageParams {
  params: Promise<{ lang: string }>;
}

export default function OperateurRegistration({ params }: PageParams) {
  const { lang } = use(params); 
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentStep, setCurrentStep] = useState(1);
  const isAr = lang === 'ar';

  // Fonction pour changer la langue dynamiquement
  const toggleLanguage = (newLang: string) => {
    const segments = pathname.split('/');
    segments[1] = newLang; // Remplace /[fr]/... par /[ar]/...
    router.push(segments.join('/'));
  };

  const steps_labels = {
    1: isAr ? 'المعلومات العامة' : 'Informations Générales',
    2: isAr ? 'البيانات القانونية' : 'Identifiants Légaux',
    3: isAr ? 'الوثائق المرفقة' : 'Documents Justificatifs'
  };

  return (
    <main className="h-screen flex flex-col md:flex-row bg-white relative" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* --- BOUTON DE CHANGEMENT DE LANGUE (Top Right) --- */}
      <div className={`absolute top-6 ${isAr ? 'left-6' : 'right-6'} z-50`}>
        <button 
          onClick={() => toggleLanguage(isAr ? 'fr' : 'ar')}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 hover:border-[#005c6e] hover:text-[#005c6e] transition-all shadow-sm"
        >
          <FontAwesomeIcon icon={faGlobe} className="opacity-50" />
          {isAr ? 'Français' : 'العربية'}
        </button>
      </div>

      {/* --- PARTIE GAUCHE : IMAGE & CONTEXTE --- */}
      <div className="hidden md:flex md:w-1/3 lg:w-2/5 bg-[#005c6e] relative overflow-hidden p-12 flex-col justify-between text-white">
        <div className="z-10">
          <div className="text-2xl font-bold tracking-tighter mb-10 italic">AL-MIZAN</div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            {isAr ? 'التسجيل كمتعامل اقتصادي' : 'Inscription Opérateur Économique'}
          </h2>
          <p className="text-cyan-100 opacity-80 text-sm leading-relaxed">
            {isAr 
              ? 'انضم إلى البوابة الوطنية للمناقصات العمومية وساهم في المشاريع التنموية.' 
              : 'Rejoignez le portail national des marchés publics et participez au développement économique.'}
          </p>
        </div>

        <div className="z-10 space-y-8">
          {[1, 2, 3].map((s) => (
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
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mb-32"></div>
      </div>

      {/* --- PARTIE DROITE : FORMULAIRE --- */}
      <div className="flex-1 bg-[#fcfcfc] p-6 md:p-16 lg:p-24">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 mt-8 md:mt-0">
            <span className="text-[#005c6e] font-bold text-xs uppercase tracking-widest block mb-2">
              {isAr ? `الخطوة ${currentStep} من 3` : `Étape ${currentStep} sur 3`}
            </span>
            <h3 className="text-2xl font-bold text-gray-900">{steps_labels[currentStep as keyof typeof steps_labels]}</h3>
          </div>

          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && (
              <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <FormInput name="op_name_officiel" label={isAr ? "الاسم الرسمي" : "Nom officiel"} placeholder="..." />
                <FormInput name="op_adresse_siege" label={isAr ? "عنوان المقر" : "Adresse siège"} placeholder="..." />
                <FormInput name="op_email_contact" label={isAr ? "البريد الإلكتروني" : "Email contact"} type="email" placeholder="..." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormSelect name="op_type_entite" label={isAr ? "نوع الكيان" : "Type entité"} options={['SARL', 'EURL', 'SPA', 'SNC']} />
                  <FormInput name="op_rib_bancaire" label={isAr ? "رقم الحساب البنكي" : "RIB Bancaire"} placeholder="20 chiffres" />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput name="op_nif_identifiant" label={isAr ? "الرقم الجبائي (NIF)" : "NIF"} placeholder="..." />
                  <FormInput name="op_rc_numero" label={isAr ? "رقم السجل التجاري" : "Registre de Commerce"} placeholder="..." />
                </div>
                <hr className="border-gray-100" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput name="op_casnos_num" label={isAr ? "رقم كاسنوس" : "CASNOS (numéro)"} />
                  <FormInput name="op_casnos_validity" label={isAr ? "تاريخ الصلاحية" : "CASNOS (validité)"} type="date" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput name="op_cnas_num" label={isAr ? "رقم كناس" : "CNAS (numéro)"} />
                  <FormInput name="op_cnas_validity" label={isAr ? "تاريخ الصلاحية" : "CNAS (validité)"} type="date" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                <FileUpload name="file_extrait_role" label={isAr ? "مستخرج الضرائب" : "Extrait de rôle"} />
                <FileUpload name="file_certificat_casnos" label={isAr ? "شهادة كاسنوس" : "Certificat CASNOS"} />
                <FileUpload name="file_certificat_cnas" label={isAr ? "شهادة كناس" : "Certificat CNAS"} />
                <FileUpload name="file_rc_scan_doc" label={isAr ? "نسخة السجل التجاري" : "Registre de Commerce scan"} />
              </div>
            )}

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
                onClick={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : null}
                className="bg-[#005c6e] text-white px-8 py-3 rounded-sm font-bold text-sm uppercase flex items-center gap-3 hover:bg-gray-800 transition-all shadow-md shadow-gray-200"
              >
                {currentStep === 3 ? (isAr ? 'إنشاء الحساب' : 'Créer le compte') : (isAr ? 'التالي' : 'Suivant')}
                {currentStep < 3 && <FontAwesomeIcon icon={isAr ? faArrowLeft : faArrowRight} />}
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
        className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#005c6e] transition-all"
      />
    </div>
  );
}

function FormSelect({ label, name, options }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{label}</label>
      <select id={name} name={name} className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#005c6e] cursor-pointer appearance-none">
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function FileUpload({ label, name }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{label}</label>
      <label htmlFor={name} className="border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center hover:bg-[#005c6e]/5 hover:border-[#005c6e] cursor-pointer transition-all group min-h-[120px]">
        <input type="file" id={name} name={name} className="hidden" />
        <FontAwesomeIcon icon={faCloudUploadAlt} className="text-gray-300 group-hover:text-[#005c6e] mb-2 text-xl" />
        <span className="text-[9px] text-gray-400 font-bold uppercase text-center italic">Document Scan</span>
      </label>
    </div>
  );
}