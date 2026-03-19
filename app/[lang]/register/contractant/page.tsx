'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import { InputField } from '@/app/components/forms/InputField';
import { SelectField } from '@/app/components/forms/SelectField';
import FileUpload from '@/app/components/forms/FileUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuildingColumns,
  faArrowRight,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

type PageProps = {
  params: Promise<{ lang: string }>;
};

type FormData = {
  nomOfficiel: string;
  adresseSiege: string;
  emailContact: string;
  typeEntite: string;
  categorie: string;
  codeOrdonnateur: string;
  nomTutelle: string;
  identiteAutorite: string;
  acteOfficiel: File | null;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ServiceContractantRegistration({ params }: PageProps) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    nomOfficiel: '',
    adresseSiege: '',
    emailContact: '',
    typeEntite: '',
    categorie: '',
    codeOrdonnateur: '',
    nomTutelle: '',
    identiteAutorite: '',
    acteOfficiel: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load lang
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

  // Category options
  const categoryOptions = [
    { value: 'ministere', label: isArabic ? 'وزارة' : 'Ministère' },
    { value: 'directionGenerale', label: isArabic ? 'مديرية عامة' : 'Direction Générale' },
    { value: 'etablissementPublic', label: isArabic ? 'مؤسسة عمومية' : 'Établissement Public' },
    { value: 'wilaya', label: isArabic ? 'ولاية' : 'Wilaya' },
    { value: 'commune', label: isArabic ? 'بلدية' : 'Commune' },
    { value: 'epe', label: isArabic ? 'مؤسسة عمومية اقتصادية' : 'Entreprise Publique Économique (EPE)' },
    { value: 'epic', label: isArabic ? 'مؤسسة عمومية ذات طابع صناعي وتجاري' : 'Établissement Public à Caractère Industriel et Commercial (EPIC)' },
    { value: 'epa', label: isArabic ? 'مؤسسة عمومية ذات طابع إداري' : 'Établissement Public à Caractère Administratif (EPA)' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

    if (!formData.categorie) {
      newErrors.categorie = isArabic ? 'الفئة مطلوبة' : 'Catégorie requise';
    }

    if (!formData.codeOrdonnateur.trim()) {
      newErrors.codeOrdonnateur = isArabic ? 'رمز الآمر بالصرف مطلوب' : 'Code ordonnateur requis';
    }

    if (!formData.nomTutelle.trim()) {
      newErrors.nomTutelle = isArabic ? 'اسم الوصاية مطلوب' : 'Nom de la tutelle requis';
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
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form Data:', formData);
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/register/contractant`, {
      //   method: 'POST',
      //   body: JSON.stringify(formData),
      // });

      setSubmitted(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/${lang}/dashboard`);
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      alert(isArabic ? 'حدث خطأ في التسجيل' : 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-[#FCFFFF]">
      <Header currentLang={lang} showLogo={true} showBackButton={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#306B6F] rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faBuildingColumns} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0D2527] font-cairo">
                {isArabic ? 'تصريح - الخدمة المتعاقدة' : 'Déclaration - Service Contractant'}
              </h1>
              <p className="text-[#418387] font-cairo mt-1">
                {isArabic 
                  ? 'يرجى ملء النموذج أدناه لتسجيل هيئتك العمومية' 
                  : 'Veuillez remplir le formulaire ci-dessous pour enregistrer votre entité publique'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          
          {/* Section 1: General Information */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'المعلومات العامة' : 'Informations Générales'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                label={isArabic ? 'الاسم الرسمي للهيئة' : 'Nom officiel de l\'entité'}
                value={formData.nomOfficiel}
                onChange={(e) => handleChange('nomOfficiel', e.target.value)}
                error={errors.nomOfficiel}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'مثال: وزارة الداخلية' : 'Ex: Ministère de l\'Intérieur'}
              />

              <InputField
                label={isArabic ? 'عنوان المقر' : 'Adresse du siège'}
                value={formData.adresseSiege}
                onChange={(e) => handleChange('adresseSiege', e.target.value)}
                error={errors.adresseSiege}
                isArabic={isArabic}
                required
                placeholder={isArabic ? '1 شارع ديدوش مراد، الجزائر الوسطى' : '1 Rue Didouche Mourad, Alger Centre'}
              />

              <InputField
                label={isArabic ? 'البريد الإلكتروني الرسمي' : 'Email de contact officiel'}
                type="email"
                value={formData.emailContact}
                onChange={(e) => handleChange('emailContact', e.target.value)}
                error={errors.emailContact}
                isArabic={isArabic}
                required
                placeholder="contact@exemple.gov.dz"
                dir="ltr"
              />
            </div>
          </section>

          {/* Section 2: Classification */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'التصنيف والفئة' : 'Classification & Catégorie'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SelectField
                label={isArabic ? 'الفئة' : 'Catégorie'}
                options={categoryOptions}
                value={formData.categorie}
                onChange={(e) => handleChange('categorie', e.target.value)}
                error={errors.categorie}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'اختر الفئة' : 'Sélectionnez la catégorie'}
              />

              <InputField
                label={isArabic ? 'رمز الآمر بالصرف' : 'Code Ordonnateur'}
                value={formData.codeOrdonnateur}
                onChange={(e) => handleChange('codeOrdonnateur', e.target.value)}
                error={errors.codeOrdonnateur}
                isArabic={isArabic}
                required
                placeholder="ORD-2026-001"
                dir="ltr"
              />
            </div>
          </section>

          {/* Section 3: Authority */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'سلطة الوصاية' : 'Autorité de Tutelle'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                label={isArabic ? 'اسم الوصاية' : 'Nom de la tutelle'}
                value={formData.nomTutelle}
                onChange={(e) => handleChange('nomTutelle', e.target.value)}
                error={errors.nomTutelle}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'رئاسة الحكومة' : 'Présidence du Gouvernement'}
              />

              <InputField
                label={isArabic ? 'هوية السلطة' : 'Identité de l\'autorité'}
                value={formData.identiteAutorite}
                onChange={(e) => handleChange('identiteAutorite', e.target.value)}
                error={errors.identiteAutorite}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'الاسم والمنصب' : 'Nom et fonction du responsable'}
              />
            </div>
          </section>

          {/* Section 4: Documents */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'الوثائق الرسمية' : 'Documents Officiels'}
            </h2>
            
            <FileUpload
              label={isArabic ? 'القرار الرسمي / مرسوم الإنشاء' : 'Acte officiel / Arrêté de création'}
              helpText={isArabic ? 'صيغة PDF فقط. الحجم الأقصى: 10MB' : 'Format PDF uniquement. Taille max: 10MB'}
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
              className="px-8 py-3.5 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#306B6F]/25 font-cairo"
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