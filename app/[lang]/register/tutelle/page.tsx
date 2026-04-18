'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import { InputField } from '@/app/components/forms/InputField';
import FileUpload from '@/app/components/forms/FileUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLandmark,
  faArrowRight,
  faSpinner,
  faBuildingColumns
} from '@fortawesome/free-solid-svg-icons';

type PageProps = {
  params: Promise<{ lang: string }>;
};

type FormData = {
  nomTutelle: string;
  nomOfficiel: string;
  adresseSiege: string;
  emailContact: string;
  identiteAutorite: string;
  acteOfficiel: File | null;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function TutelleRegistration({ params }: PageProps) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    nomTutelle: '',
    nomOfficiel: '',
    adresseSiege: '',
    emailContact: '',
    identiteAutorite: '',
    acteOfficiel: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let isMounted = true;

    const loadLang = async () => {
      const resolvedParams = await params;
      if (isMounted) {
        setLang(resolvedParams.lang);
      }
    };

    loadLang();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const isArabic = lang === 'ar';

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nomTutelle.trim()) {
      newErrors.nomTutelle = isArabic ? 'اسم الوصاية مطلوب' : 'Nom de la tutelle requis';
    }

    if (!formData.nomOfficiel.trim()) {
      newErrors.nomOfficiel = isArabic ? 'الاسم الرسمي مطلوب' : 'Nom officiel requis';
    }

    if (!formData.adresseSiege.trim()) {
      newErrors.adresseSiege = isArabic ? 'العنوان مطلوب' : 'Adresse requise';
    }

    if (!formData.emailContact.trim()) {
      newErrors.emailContact = isArabic ? 'البريد الإلكتروني مطلوب' : 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailContact)) {
      newErrors.emailContact = isArabic ? 'بريد إلكتروني غير صالح' : 'Email invalide';
    }

    if (!formData.identiteAutorite.trim()) {
      newErrors.identiteAutorite = isArabic ? 'هوية السلطة مطلوبة' : 'Identité de l\'autorité requise';
    }

    if (!formData.acteOfficiel) {
      newErrors.acteOfficiel = isArabic ? 'القرار الرسمي مطلوب' : 'Acte officiel requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      alert(isArabic ? 'Veuillez vous connecter d\'abord' : 'Please login first');
      router.push(`/${lang}/login`);
      return;
    }

    // Step 1: Create Membre
    const membreResponse = await fetch('http://localhost:18081/membres', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        nom: formData.nomTutelle,
        prenom: formData.nomOfficiel,
        email: formData.emailContact,
        telephone: '',
        type_membre: 'tutelle',
      }),
    });

    if (!membreResponse.ok) {
      const errorData = await membreResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create membre');
    }

    const membreData = await membreResponse.json();
    const idMembre = membreData.id_membre;

    // Step 2: Create Tutelle
    const tutelleResponse = await fetch('http://localhost:18081/tutelles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        nom_officiel: formData.nomOfficiel,
        nom_tutelle: formData.nomTutelle,
        adresse_siege: formData.adresseSiege,
        email_contact: formData.emailContact,
        identite_autorite: formData.identiteAutorite,
        id_membre: idMembre,
      }),
    });

    if (!tutelleResponse.ok) {
      const errorData = await tutelleResponse.json().catch(() => ({}));
      console.error('Tutelle error:', errorData);
      throw new Error(errorData.message || 'Failed to create tutelle');
    }

    setSubmitted(true);
    
    setTimeout(() => {
      router.push(`/${lang}/dashboard`);
    }, 2000);
    
  } catch (error: any) {
    console.error('Registration error:', error);
    alert(isArabic ? 'حدث خطأ في التسجيل' : 'Erreur: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const handleChange = (field: keyof FormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-[#FCFFFF]">
      <Header currentLang={lang} showLogo={true} showBackButton={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#173C3F] rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faLandmark} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0D2527] font-cairo">
                {isArabic ? 'تصريح - سلطة الوصاية' : 'Déclaration - Autorité de Tutelle'}
              </h1>
              <p className="text-[#418387] font-cairo mt-1">
                {isArabic 
                  ? 'يرجى ملء النموذج أدناه لتسجيل سلطة الوصاية' 
                  : 'Veuillez remplir le formulaire ci-dessous pour enregistrer l\'autorité de tutelle'
                }
              </p>
            </div>
          </div>
        </div>

        {submitted && (
          <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800 font-cairo">
                {isArabic ? 'تم التسجيل بنجاح!' : 'Enregistrement réussi!'}
              </h3>
              <p className="text-green-700 font-cairo">
                {isArabic ? 'جاري إعادة التوجيه...' : 'Redirecting...'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          
          {/* Section 1: General Information */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'المعلومات العامة' : 'Informations Générales'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                label={isArabic ? 'اسم سلطة الوصاية' : 'Nom de l\'autorité de tutelle'}
                value={formData.nomTutelle}
                onChange={(e) => handleChange('nomTutelle', e.target.value)}
                error={errors.nomTutelle}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'وزارة المالية' : 'Ministère des Finances'}
              />

              <InputField
                label={isArabic ? 'الاسم الرسمي الكامل' : 'Nom officiel complet'}
                value={formData.nomOfficiel}
                onChange={(e) => handleChange('nomOfficiel', e.target.value)}
                error={errors.nomOfficiel}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'وزارة الداخلية والجماعات المحلية' : 'Ministère de l\'Intérieur et des Collectivités Locales'}
              />

              <InputField
                label={isArabic ? 'عنوان المقر' : 'Adresse du siège'}
                value={formData.adresseSiege}
                onChange={(e) => handleChange('adresseSiege', e.target.value)}
                error={errors.adresseSiege}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'حي بشير الحدادن، الجزائر' : 'Cité Bachir Ihaddaden, Alger'}
              />

              <InputField
                label={isArabic ? 'البريد الإلكتروني الرسمي' : 'Email de contact officiel'}
                type="email"
                value={formData.emailContact}
                onChange={(e) => handleChange('emailContact', e.target.value)}
                error={errors.emailContact}
                isArabic={isArabic}
                required
                placeholder="tutelle@exemple.gov.dz"
                dir="ltr"
              />
            </div>
          </section>

          {/* Section 2: Authority Information */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'سلطة الإشراف' : 'Autorité de Supervision'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                label={isArabic ? 'هوية السلطة' : 'Identité de l\'autorité'}
                value={formData.identiteAutorite}
                onChange={(e) => handleChange('identiteAutorite', e.target.value)}
                error={errors.identiteAutorite}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'الاسم والمنصب (مثال: السيد الوزير)' : 'Nom et fonction (Ex: Le Ministre)'}
              />
            </div>
          </section>

          {/* Section 3: Official Documents */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'الوثائق الرسمية' : 'Documents Officiels'}
            </h2>
            
            <FileUpload
              label={isArabic ? 'القرار الرسمي للإنشاء' : 'Acte officiel de création'}
              helpText={isArabic ? 'الجريدة الرسمية أو المرسوم الإنشائي. صيغة PDF فقط. الحجم الأقصى: 10MB' : 'Journal Officiel ou décret de création. Format PDF uniquement. Taille max: 10MB'}
              error={errors.acteOfficiel}
              isArabic={isArabic}
              accept=".pdf"
              maxSizeMB={10}
              onChange={(file) => handleChange('acteOfficiel', file)}
            />
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3.5 border-2 border-[#9BCFCF] text-[#418387] rounded-xl font-bold hover:bg-[#FCFFFF] transition-colors font-cairo"
            >
              {isArabic ? 'إلغاء' : 'Annuler'}
            </button>
            
            <button
              type="submit"
              disabled={loading || submitted}
              className="px-8 py-3.5 bg-[#173C3F] hover:bg-[#0D2527] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#173C3F]/25 font-cairo"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  <span>{isArabic ? 'جاري الحفظ...' : 'Enregistrement...'}</span>
                </>
              ) : (
                <>
                  <span>{isArabic ? 'حفظ' : 'Sauvegarder'}</span>
                  <FontAwesomeIcon icon={faArrowRight} className={isArabic ? 'rotate-180' : ''} />
                </>
              )}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}