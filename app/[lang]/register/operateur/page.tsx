'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import { InputField } from '@/app/components/forms/InputField';
import FileUpload from '@/app/components/forms/FileUpload';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faArrowRight,
  faSpinner,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';

type PageProps = {
  params: Promise<{ lang: string }>;
};

type FormData = {
  nom_organisation: string;
  email_contact: string;
  telephone: string;
  nif: string;
  num_registre_commerce: string;
  doc_registre_commerce: File | null;
  doc_nif: File | null;
  doc_cnas_casnos: File | null;
  doc_non_faillite: File | null;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function OperateurEconomiqueRegistration({ params }: PageProps) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nom_organisation: '',
    email_contact: '',
    telephone: '',
    nif: '',
    num_registre_commerce: '',
    doc_registre_commerce: null,
    doc_nif: null,
    doc_cnas_casnos: null,
    doc_non_faillite: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nom_organisation.trim()) {
      newErrors.nom_organisation = isArabic ? 'الاسم الرسمي مطلوب' : 'Raison sociale requise';
    }

    if (!formData.email_contact.trim()) {
      newErrors.email_contact = isArabic ? 'البريد الإلكتروني مطلوب' : 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email_contact)) {
      newErrors.email_contact = isArabic ? 'بريد إلكتروني غير صالح' : 'Email invalide';
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = isArabic ? 'رقم الهاتف مطلوب' : 'Téléphone requis';
    } else if (!/^\+?[\d\s\-]{9,15}$/.test(formData.telephone.trim())) {
      newErrors.telephone = isArabic ? 'رقم هاتف غير صالح' : 'Numéro de téléphone invalide';
    }

    if (!formData.nif.trim()) {
      newErrors.nif = isArabic ? 'الرقم الجبائي مطلوب' : 'NIF requis';
    } else if (!/^\d{15}$/.test(formData.nif.replace(/\s/g, ''))) {
      newErrors.nif = isArabic ? 'يجب أن يحتوي NIF على 15 رقمًا' : 'NIF doit contenir 15 chiffres';
    }

    if (!formData.num_registre_commerce.trim()) {
      newErrors.num_registre_commerce = isArabic ? 'رقم السجل التجاري مطلوب' : 'RC requis';
    } else if (formData.num_registre_commerce.trim().length < 10) {
      newErrors.num_registre_commerce = isArabic ? 'رقم السجل التجاري غير صالح' : 'Numéro RC invalide';
    }

    if (!formData.doc_registre_commerce) {
      newErrors.doc_registre_commerce = isArabic ? 'السجل التجاري مطلوب' : 'Registre de commerce requis';
    }

    if (!formData.doc_nif) {
      newErrors.doc_nif = isArabic ? 'البطاقة الجبائية مطلوبة' : 'Carte fiscale (NIF) requise';
    }

    if (!formData.doc_cnas_casnos) {
      newErrors.doc_cnas_casnos = isArabic ? 'شهادة CNAS/CASNOS مطلوبة' : 'Attestation CNAS/CASNOS requise';
    }

    if (!formData.doc_non_faillite) {
      newErrors.doc_non_faillite = isArabic ? 'شهادة عدم الإفلاس مطلوبة' : 'Certificat de non-faillite requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setLoading(true);

    try {
      // This is a PUBLIC endpoint — no auth token required
      const payload = new FormData();
      payload.append('nom_organisation', formData.nom_organisation);
      payload.append('email_contact', formData.email_contact);
      payload.append('telephone', formData.telephone);
      payload.append('nif', formData.nif);
      payload.append('num_registre_commerce', formData.num_registre_commerce);

      if (formData.doc_registre_commerce) payload.append('doc_registre_commerce', formData.doc_registre_commerce);
      if (formData.doc_nif) payload.append('doc_nif', formData.doc_nif);
      if (formData.doc_cnas_casnos) payload.append('doc_cnas_casnos', formData.doc_cnas_casnos);
      if (formData.doc_non_faillite) payload.append('doc_non_faillite', formData.doc_non_faillite);

      // Do NOT set Content-Type manually — browser sets multipart/form-data + boundary automatically
      const res = await fetch('http://localhost:8080/demandes/soumettre/', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }

      setSubmitted(true);
      setTimeout(() => router.push(`/${lang}/demande-soumise`), 2000);

    } catch (error: any) {
      alert(isArabic ? 'حدث خطأ أثناء التسجيل' : 'Erreur lors de la soumission : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-[#FCFFFF]">
      <Header currentLang={lang} showLogo={true} showBackButton={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page Header */}
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
                  ? 'يرجى ملء النموذج أدناه لتقديم طلب التسجيل'
                  : 'Veuillez remplir le formulaire ci-dessous pour soumettre votre demande d\'inscription'}
              </p>
            </div>
          </div>

          {/* Info banner — pending review notice */}
          <div className="mt-6 p-4 bg-[#EEF8F8] border border-[#9BCFCF] rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 mt-0.5 rounded-full bg-[#418387] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <p className="text-sm text-[#306B6F] font-cairo">
              {isArabic
                ? 'بعد تقديم الطلب، سيتم مراجعته من قِبل الإدارة. ستصلك رسالة إلكترونية عند الموافقة وإنشاء حسابك.'
                : 'Après soumission, votre demande sera examinée par l\'administrateur. Vous recevrez un email à l\'approbation avec les identifiants de votre compte.'}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800 font-cairo">
                {isArabic ? 'تم إرسال طلبك بنجاح!' : 'Demande soumise avec succès !'}
              </h3>
              <p className="text-green-700 font-cairo text-sm">
                {isArabic
                  ? 'جاري إعادة التوجيه...'
                  : 'Redirection en cours...'}
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
                label={isArabic ? 'الاسم التجاري / الاسم الرسمي' : 'Raison sociale / Nom officiel'}
                value={formData.nom_organisation}
                onChange={(e) => handleChange('nom_organisation', e.target.value)}
                error={errors.nom_organisation}
                isArabic={isArabic}
                required
                placeholder={isArabic ? 'شركة مثال للتكنولوجيا' : 'SARL Example Technology'}
              />

              <InputField
                label={isArabic ? 'البريد الإلكتروني المهني' : 'Email de contact professionnel'}
                type="email"
                value={formData.email_contact}
                onChange={(e) => handleChange('email_contact', e.target.value)}
                error={errors.email_contact}
                isArabic={isArabic}
                required
                placeholder="contact@entreprise.dz"
                dir="ltr"
              />

              <InputField
                label={isArabic ? 'رقم الهاتف' : 'Numéro de téléphone'}
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                error={errors.telephone}
                isArabic={isArabic}
                required
                placeholder="+213 555 123 456"
                dir="ltr"
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
                value={formData.num_registre_commerce}
                onChange={(e) => handleChange('num_registre_commerce', e.target.value)}
                error={errors.num_registre_commerce}
                isArabic={isArabic}
                required
                placeholder="16/00-1234567A12"
                dir="ltr"
              />
            </div>
          </section>

          {/* Section 3: Documents */}
          <section className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-[#173C3F] mb-6 pb-3 border-b-2 border-[#E2E8F0] font-cairo">
              {isArabic ? 'الوثائق الإدارية' : 'Documents Administratifs'}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileUpload
                label={isArabic ? 'السجل التجاري (مسح ضوئي)' : 'Registre de Commerce (Scan)'}
                helpText={isArabic ? 'صيغة PDF أو صورة. الحجم الأقصى: 10MB' : 'Format PDF ou Image. Taille max: 10MB'}
                error={errors.doc_registre_commerce}
                isArabic={isArabic}
                accept=".pdf,.jpg,.jpeg,.png"
                maxSizeMB={10}
                onChange={(file) => handleChange('doc_registre_commerce', file)}
              />

              <FileUpload
                label={isArabic ? 'البطاقة الجبائية (NIF)' : 'Carte Fiscale (NIF)'}
                helpText={isArabic ? 'صيغة PDF فقط. الحجم الأقصى: 5MB' : 'Format PDF uniquement. Taille max: 5MB'}
                error={errors.doc_nif}
                isArabic={isArabic}
                accept=".pdf"
                maxSizeMB={5}
                onChange={(file) => handleChange('doc_nif', file)}
              />

              <FileUpload
                label={isArabic ? 'شهادة CNAS / CASNOS' : 'Attestation CNAS / CASNOS'}
                helpText={isArabic ? 'صيغة PDF فقط. الحجم الأقصى: 5MB' : 'Format PDF uniquement. Taille max: 5MB'}
                error={errors.doc_cnas_casnos}
                isArabic={isArabic}
                accept=".pdf"
                maxSizeMB={5}
                onChange={(file) => handleChange('doc_cnas_casnos', file)}
              />

              <FileUpload
                label={isArabic ? 'شهادة عدم الإفلاس' : 'Certificat de Non-Faillite'}
                helpText={isArabic ? 'صيغة PDF فقط. الحجم الأقصى: 5MB' : 'Format PDF uniquement. Taille max: 5MB'}
                error={errors.doc_non_faillite}
                isArabic={isArabic}
                accept=".pdf"
                maxSizeMB={5}
                onChange={(file) => handleChange('doc_non_faillite', file)}
              />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3.5 border-2 border-[#9BCFCF] text-[#418387] rounded-xl font-bold hover:bg-[#EEF8F8] transition-colors font-cairo"
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
                  <span>{isArabic ? 'جاري الإرسال...' : 'Envoi en cours...'}</span>
                </>
              ) : (
                <>
                  <span>{isArabic ? 'إرسال الطلب' : 'Soumettre la demande'}</span>
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