'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import { InputField } from '@/app/components/forms/InputField';
import { SelectField } from '@/app/components/forms/SelectField';
import { DatePicker } from '@/app/components/forms/DatePicker';
import FileUpload from '@/app/components/forms/FileUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding,
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
  nif: string;
  registreCommerce: string;
  rib: string;
  casnosNumero: string;
  casnosDate: string;
  cnasNumero: string;
  cnasDate: string;
  extraitRole: File | null;
  certificatCasnos: File | null;
  certificatCnas: File | null;
  registreCommerceScan: File | null;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function OperateurEconomiqueRegistration({ params }: PageProps) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    nomOfficiel: '',
    adresseSiege: '',
    emailContact: '',
    typeEntite: '',
    nif: '',
    registreCommerce: '',
    rib: '',
    casnosNumero: '',
    casnosDate: '',
    cnasNumero: '',
    cnasDate: '',
    extraitRole: null,
    certificatCasnos: null,
    certificatCnas: null,
    registreCommerceScan: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Resolve dynamic params after mount to avoid render-time state updates.
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

  // Entity type options
  const entityTypeOptions = [
    { value: 'sar', label: isArabic ? 'شركة ذات مسؤولية محدودة' : 'Société à Responsibilité Limitée (SARL)' },
    { value: 'eurl', label: isArabic ? 'مؤسسة ذات شخص واحد' : 'Entreprise Unipersonnelle (EURL)' },
    { value: 'spa', label: isArabic ? 'شركة مساهمة' : 'Société Par Actions (SPA)' },
    { value: 'snc', label: isArabic ? 'شركة ذات اسم جماعي' : 'Société en Nom Collectif (SNC)' },
    { value: 'sca', label: isArabic ? 'شركة توصية بالأسهم' : 'Société en Commandite (SCA)' },
    { value: 'personnePhysique', label: isArabic ? 'شخص طبيعي' : 'Personne Physique' },
    { value: 'groupement', label: isArabic ? 'مجموعة مؤسسات' : 'Groupement d\'entreprises' },
    { value: 'autre', label: isArabic ? 'أخرى' : 'Autre' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nom officiel
    if (!formData.nomOfficiel.trim()) {
      newErrors.nomOfficiel = isArabic ? 'الاسم الرسمي مطلوب' : 'Raison sociale requise';
    }

    // Adresse
    if (!formData.adresseSiege.trim()) {
      newErrors.adresseSiege = isArabic ? 'العنوان مطلوب' : 'Adresse requise';
    }

    // Email
    if (!formData.emailContact.trim()) {
      newErrors.emailContact = isArabic ? 'البريد الإلكتروني مطلوب' : 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailContact)) {
      newErrors.emailContact = isArabic ? 'بريد إلكتروني غير صالح' : 'Email invalide';
    }

    // Type d'entité
    if (!formData.typeEntite) {
      newErrors.typeEntite = isArabic ? 'النوع القانوني مطلوب' : 'Forme juridique requise';
    }

    // NIF - 15 digits
    if (!formData.nif.trim()) {
      newErrors.nif = isArabic ? 'الرقم الجبائي مطلوب' : 'NIF requis';
    } else if (!/^\d{15}$/.test(formData.nif.replace(/\s/g, ''))) {
      newErrors.nif = isArabic ? 'يجب أن يحتوي NIF على 15 رقمًا' : 'NIF doit contenir 15 chiffres';
    }

    // Registre de Commerce
    if (!formData.registreCommerce.trim()) {
      newErrors.registreCommerce = isArabic ? 'رقم السجل التجاري مطلوب' : 'RC requis';
    } else if (!/^\d{2}\/\d{2}-\d{7}[A-Z]\d{2}$/i.test(formData.registreCommerce.replace(/\s/g, ''))) {
      // More flexible validation
      if (formData.registreCommerce.length < 10) {
        newErrors.registreCommerce = isArabic ? 'رقم السجل التجاري غير صالح' : 'Numéro RC invalide';
      }
    }

    // RIB - 20 digits
    if (!formData.rib.trim()) {
      newErrors.rib = isArabic ? 'البيان البنكي مطلوب' : 'RIB requis';
    } else if (!/^\d{20}$/.test(formData.rib.replace(/\s/g, ''))) {
      newErrors.rib = isArabic ? 'يجب أن يحتوي RIB على 20 رقمًا' : 'RIB doit contenir 20 chiffres';
    }

    // CASNOS
    if (!formData.casnosNumero.trim()) {
      newErrors.casnosNumero = isArabic ? 'رقم الكاسنوس مطلوب' : 'Numéro CASNOS requis';
    }

    if (!formData.casnosDate) {
      newErrors.casnosDate = isArabic ? 'تاريخ الصلاحية مطلوب' : 'Date de validité requise';
    }

    // CNAS
    if (!formData.cnasNumero.trim()) {
      newErrors.cnasNumero = isArabic ? 'رقم الضمان الاجتماعي مطلوب' : 'Numéro CNAS requis';
    }

    if (!formData.cnasDate) {
      newErrors.cnasDate = isArabic ? 'تاريخ الصلاحية مطلوب' : 'Date de validité requise';
    }

    // Documents
    if (!formData.extraitRole) {
      newErrors.extraitRole = isArabic ? 'مستخلص الدور مطلوب' : 'Extrait de rôle requis';
    }

    if (!formData.certificatCasnos) {
      newErrors.certificatCasnos = isArabic ? 'شهادة الكاسنوس مطلوبة' : 'Certificat CASNOS requis';
    }

    if (!formData.certificatCnas) {
      newErrors.certificatCnas = isArabic ? 'شهادة الضمان الاجتماعي مطلوبة' : 'Certificat CNAS requis';
    }

    if (!formData.registreCommerceScan) {
      newErrors.registreCommerceScan = isArabic ? 'السجل التجاري مطلوب' : 'Registre de commerce requis';
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
        nom: formData.nomOfficiel,
        prenom: formData.nomOfficiel,
        email: formData.emailContact,
        telephone: '',
        type_membre: 'operateur_economique',
      }),
    });

    if (!membreResponse.ok) {
      const errorData = await membreResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create membre');
    }

    const membreData = await membreResponse.json();
    const idMembre = membreData.id_membre;

    // Step 2: Create Operateur Économique
    const operateurResponse = await fetch('http://localhost:18081/operateurs-economiques', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        nom_officiel: formData.nomOfficiel,
        adresse_siege: formData.adresseSiege,
        email_contact: formData.emailContact,
        type_entite: formData.typeEntite,
        nif: formData.nif,
        registre_commerce: formData.registreCommerce,
        rib: formData.rib,
        id_membre: idMembre,
      }),
    });

    if (!operateurResponse.ok) {
      const errorData = await operateurResponse.json().catch(() => ({}));
      console.error('Operateur error:', errorData);
      throw new Error(errorData.message || 'Failed to create operateur');
    }

    setSubmitted(true);
    
    setTimeout(() => {
      router.push(`/${lang}/dashboard/operator`);
    }, 2000);
    
  } catch (error: any) {
    console.error('Registration error:', error);
    alert(isArabic ? 'حدث خطأ في التسجيل' : 'Erreur lors de l\'enregistrement: ' + error.message);
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
            <div className="w-12 h-12 bg-[#418387] rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faBuilding} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0D2527] font-cairo">
                {isArabic ? 'تصريح - المتعامل الاقتصادي' : 'Déclaration - Opérateur Économique'}
              </h1>
              <p className="text-[#418387] font-cairo mt-1">
                {isArabic 
                  ? 'يرجى ملء النموذج أدناه لتسجيل مؤسستك' 
                  : 'Veuillez remplir le formulaire ci-dessous pour enregistrer votre entreprise'
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
                label={isArabic ? 'الاسم التجاري / الاسم الرسمي' : 'Raison sociale / Nom officiel'}
                value={formData.nomOfficiel}
                onChange={(e) => handleChange('nomOfficiel', e.target.value)}
                error={errors.nomOfficiel}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'شركة مثال للتكنولوجيا' : 'SARL Example Technology'}
              />

              <InputField
                label={isArabic ? 'عنوان المقر الاجتماعي' : 'Adresse du siège social'}
                value={formData.adresseSiege}
                onChange={(e) => handleChange('adresseSiege', e.target.value)}
                error={errors.adresseSiege}
                isArabic={isArabic}
                required
                placeholder={isArabic ? '15 شارع محمد بلوزداد، الجزائر' : '15 Rue Mohamed Belouizdad, Alger'}
              />

              <InputField
                label={isArabic ? 'البريد الإلكتروني المهني' : 'Email de contact professionnel'}
                type="email"
                value={formData.emailContact}
                onChange={(e) => handleChange('emailContact', e.target.value)}
                error={errors.emailContact}
                isArabic={isArabic}
                required
                placeholder="contact@entreprise.dz"
                dir="ltr"
              />

              <SelectField
                label={isArabic ? 'الشكل القانوني' : 'Forme juridique'}
                options={entityTypeOptions}
                value={formData.typeEntite}
                onChange={(e) => handleChange('typeEntite', e.target.value)}
                error={errors.typeEntite}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'اختر النوع' : 'Sélectionnez le type'}
              />
            </div>
          </section>

          {/* Section 2: Fiscal & Commercial Identification */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'التعريف الجبائي والتجاري' : 'Identification Fiscale & Commerciale'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                label={isArabic ? 'رقم التعريف الجبائي (NIF)' : 'Numéro d\'Identification Fiscale (NIF)'}
                value={formData.nif}
                onChange={(e) => handleChange('nif', e.target.value)}
                error={errors.nif}
                isArabic={isArabic}
                required
                placeholder="001234567890123"
                dir="ltr"
                maxLength={15}
              />

              <InputField
                label={isArabic ? 'رقم السجل التجاري (RC)' : 'Numéro Registre de Commerce (RC)'}
                value={formData.registreCommerce}
                onChange={(e) => handleChange('registreCommerce', e.target.value)}
                error={errors.registreCommerce}
                isArabic={isArabic}
                required
                placeholder="16/00-1234567A12"
                dir="ltr"
              />

              <InputField
                label={isArabic ? 'البيان التعريفي البنكي (RIB)' : 'Relevé d\'Identité Bancaire (RIB)'}
                value={formData.rib}
                onChange={(e) => handleChange('rib', e.target.value)}
                error={errors.rib}
                isArabic={isArabic}
                required
                placeholder="00115451510000234567"
                dir="ltr"
                maxLength={20}
              />
            </div>
          </section>

          {/* Section 3: Social Affiliations */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'الانتماءات الاجتماعية' : 'Affiliations Sociales'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                label={isArabic ? 'رقم الكاسنوس' : 'Numéro CASNOS'}
                value={formData.casnosNumero}
                onChange={(e) => handleChange('casnosNumero', e.target.value)}
                error={errors.casnosNumero}
                isArabic={isArabic}
                required
                placeholder="Numéro d'affiliation"
                dir="ltr"
              />

              <DatePicker
                label={isArabic ? 'تاريخ صلاحية الكاسنوس' : 'Date de validité CASNOS'}
                value={formData.casnosDate}
                onChange={(e) => handleChange('casnosDate', e.target.value)}
                error={errors.casnosDate}
                isArabic={isArabic}
                required
              />

              <InputField
                label={isArabic ? 'رقم الضمان الاجتماعي (CNAS)' : 'Numéro CNAS'}
                value={formData.cnasNumero}
                onChange={(e) => handleChange('cnasNumero', e.target.value)}
                error={errors.cnasNumero}
                isArabic={isArabic}
                required
                placeholder="Numéro d'affiliation"
                dir="ltr"
              />

              <DatePicker
                label={isArabic ? 'تاريخ صلاحية الضمان الاجتماعي' : 'Date de validité CNAS'}
                value={formData.cnasDate}
                onChange={(e) => handleChange('cnasDate', e.target.value)}
                error={errors.cnasDate}
                isArabic={isArabic}
                required
              />
            </div>
          </section>

          {/* Section 4: Documents */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'الوثائق الإدارية' : 'Documents Administratifs'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileUpload
                label={isArabic ? 'مستخلص الدور (وصل جبائي)' : 'Extrait de rôle (Quittance fiscale)'}
                helpText={isArabic ? 'صيغة PDF فقط. الحجم الأقصى: 5MB' : 'Format PDF uniquement. Taille max: 5MB'}
                error={errors.extraitRole}
                isArabic={isArabic}
                accept=".pdf"
                maxSizeMB={5}
                onChange={(file) => handleChange('extraitRole', file)}
              />

              <FileUpload
                label={isArabic ? 'شهادة الانتماء للكاسنوس' : 'Certificat d\'affiliation CASNOS'}
                helpText={isArabic ? 'صيغة PDF فقط. الحجم الأقصى: 5MB' : 'Format PDF uniquement. Taille max: 5MB'}
                error={errors.certificatCasnos}
                isArabic={isArabic}
                accept=".pdf"
                maxSizeMB={5}
                onChange={(file) => handleChange('certificatCasnos', file)}
              />

              <FileUpload
                label={isArabic ? 'شهادة الانتماء للضمان الاجتماعي' : 'Certificat d\'affiliation CNAS'}
                helpText={isArabic ? 'صيغة PDF فقط. الحجم الأقصى: 5MB' : 'Format PDF uniquement. Taille max: 5MB'}
                error={errors.certificatCnas}
                isArabic={isArabic}
                accept=".pdf"
                maxSizeMB={5}
                onChange={(file) => handleChange('certificatCnas', file)}
              />

              <FileUpload
                label={isArabic ? 'السجل التجاري (مسح ضوئي)' : 'Registre de Commerce (Scan)'}
                helpText={isArabic ? 'صيغة PDF أو صورة. الحجم الأقصى: 10MB' : 'Format PDF ou Image. Taille max: 10MB'}
                error={errors.registreCommerceScan}
                isArabic={isArabic}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                onChange={(file) => handleChange('registreCommerceScan', file)}
              />
            </div>
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
              className="px-8 py-3.5 bg-[#418387] hover:bg-[#306B6F] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#418387]/25 font-cairo"
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