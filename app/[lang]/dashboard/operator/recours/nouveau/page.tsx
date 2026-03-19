'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faExclamationTriangle,
  faFileUpload,
  faFilePdf,
  faGavel,
  faShieldHalved,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

type FormData = {
  typeRecours: string;
  motif: string;
  documents: File[];
  accepterConditions: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function DeposerRecoursPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const submissionId = searchParams.get('submissionId');

  const [formData, setFormData] = useState<FormData>({
    typeRecours: '',
    motif: '',
    documents: [],
    accepterConditions: false,
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

  // Mock data - Replace with API call
  const soumission = {
    id: 1,
    appelOffreReference: 'AO/N°01/2026',
    appelOffreTitre: 'Acquisition de matériel informatique pour les lycées de la wilaya d\'Alger',
    dateSoumission: '2026-03-01T08:00:00',
    montantSoumis: 72500000,
    statut: 'refusee',
    motifRefus: 'Le certificat CNAS fourni est expiré depuis le 01/01/2026.',
    dateNotification: '2026-04-20T10:45:00',
  };

  const typeRecoursOptions = [
    { value: 'conformite_admin', label: isArabic ? 'طعن في المطابقة الإدارية' : 'Recours sur la conformité administrative' },
    { value: 'conformite_technique', label: isArabic ? 'طعن في المطابقة التقنية' : 'Recours sur la conformité technique' },
    { value: 'conformite_financiere', label: isArabic ? 'طعن في المطابقة المالية' : 'Recours sur la conformité financière' },
    { value: 'procedure', label: isArabic ? 'طعن في الإجراءات' : 'Recours sur la procédure' },
    { value: 'autre', label: isArabic ? 'أخرى' : 'Autre' },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.typeRecours) {
      newErrors.typeRecours = isArabic ? 'نوع الطعن مطلوب' : 'Type de recours requis';
    }

    if (!formData.motif.trim()) {
      newErrors.motif = isArabic ? 'التفصيل مطلوب' : 'Motif détaillé requis';
    } else if (formData.motif.length < 50) {
      newErrors.motif = isArabic ? 'يجب أن يكون التفصيل 50 حرفاً على الأقل' : 'Le motif doit contenir au moins 50 caractères';
    }

    if (formData.documents.length === 0) {
      newErrors.documents = isArabic ? 'يجب إرفاق وثيقة واحدة على الأقل' : 'Au moins un document requis';
    }

    if (!formData.accepterConditions) {
      newErrors.accepterConditions = isArabic ? 'يجب قبول الشروط' : 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...newFiles] }));
      if (errors.documents) {
        setErrors(prev => ({ ...prev, documents: undefined }));
      }
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      console.log('Submitting recours:', {
        submissionId,
        typeRecours: formData.typeRecours,
        motif: formData.motif,
        documents: formData.documents.map(d => d.name),
        timestamp: new Date().toISOString(),
      });

      // Redirect to recours list
      router.push(`/${lang}/dashboard/operator/recours`);
      
    } catch (error) {
      console.error('Recours error:', error);
      alert(isArabic ? 'حدث خطأ في تقديم الطعن' : 'Erreur lors du dépôt du recours');
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-DZ').format(montant) + ' DA';
  };

  const translations = {
    fr: {
      back: 'Retour',
      title: 'Déposer un recours',
      subtitle: 'Contester la décision de rejet',
      soumissionInfo: {
        title: 'Informations sur la soumission',
        reference: 'Référence',
        titre: 'Titre',
        dateSoumission: 'Date de soumission',
        montant: 'Montant soumis',
        motifRefus: 'Motif du refus',
        dateNotification: 'Date de notification'
      },
      form: {
        title: 'Détails du recours',
        typeRecours: 'Type de recours',
        typeRecoursPlaceholder: 'Sélectionnez le type de recours',
        motif: 'Motif détaillé du recours',
        motifPlaceholder: 'Expliquez en détail les raisons de votre recours. Soyez précis et fournissez tous les éléments justificatifs nécessaires. (Minimum 50 caractères)',
        documents: 'Documents justificatifs',
        documentsHelp: 'Formats acceptés: PDF uniquement. Taille max: 10MB par fichier.',
        upload: 'Télécharger des documents',
        conditions: 'Je déclare que:',
        condition1: 'Les informations fournies sont exactes et complètes',
        condition2: 'Je respecte le délai légal de recours (15 jours à compter de la notification)',
        condition3: 'Je suis conscient que ce recours sera examiné par la commission compétente',
        warning: 'Attention: Le dépôt d\'un recours ne suspend pas automatiquement la procédure d\'attribution du marché.'
      },
      submit: 'Déposer le recours',
      submitting: 'Dépôt en cours...',
      success: 'Recours déposé avec succès',
      characters: 'caractères'
    },
    ar: {
      back: 'رجوع',
      title: 'تقديم طعن',
      subtitle: 'الطعن في قرار الرفض',
      soumissionInfo: {
        title: 'معلومات عن الطلب',
        reference: 'المرجع',
        titre: 'العنوان',
        dateSoumission: 'تاريخ التقديم',
        montant: 'المبلغ المقدم',
        motifRefus: 'سبب الرفض',
        dateNotification: 'تاريخ الإشعار'
      },
      form: {
        title: 'تفاصيل الطعن',
        typeRecours: 'نوع الطعن',
        typeRecoursPlaceholder: 'اختر نوع الطعن',
        motif: 'تفصيل الطعن',
        motifPlaceholder: 'اشرح بالتفصيل أسباب طعنك. كن دقيقاً وقدم جميع العناصر المبررة اللازمة. (50 حرفاً على الأقل)',
        documents: 'الوثائق المثبتة',
        documentsHelp: 'الصيغ المقبولة: PDF فقط. الحجم الأقصى: 10 ميجا بايت لكل ملف.',
        upload: 'تحميل الوثائق',
        conditions: 'أصرح بأن:',
        condition1: 'المعلومات المقدمة دقيقة وكاملة',
        condition2: 'أحترم المهلة القانونية للطعن (15 يوماً من تاريخ الإشعار)',
        condition3: 'أدرك أن هذا الطعن ستدرسه اللجنة المختصة',
        warning: 'تنبيه: تقديم الطعن لا يوقف تلقائياً إجراء إسناد الصفقة.'
      },
      submit: 'تقديم الطعن',
      submitting: 'جاري التقديم...',
      success: 'تم تقديم الطعن بنجاح',
      characters: 'حرف'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href={`/${lang}/dashboard/operator/soumissions/${submissionId}`}
            className="inline-flex items-center gap-2 text-[#418387] hover:text-[#173C3F] font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className={isArabic ? 'rotate-180' : ''} />
            {t.back}
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#306B6F] rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faGavel} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2527] font-cairo">{t.title}</h1>
              <p className="text-[#418387]">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Submission Info */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0D2527] mb-6 font-cairo">{t.soumissionInfo.title}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.reference}</p>
              <p className="font-bold text-[#0D2527]">{soumission.appelOffreReference}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.dateSoumission}</p>
              <p className="font-bold text-[#0D2527]">
                {new Date(soumission.dateSoumission).toLocaleString('fr-DZ')}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.titre}</p>
              <p className="font-bold text-[#0D2527]">{soumission.appelOffreTitre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.montant}</p>
              <p className="font-bold text-[#173C3F]">{formatMontant(soumission.montantSoumis)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.dateNotification}</p>
              <p className="font-bold text-[#0D2527]">
                {new Date(soumission.dateNotification).toLocaleString('fr-DZ')}
              </p>
            </div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">{t.soumissionInfo.motifRefus}</p>
            <p className="text-red-800 font-medium">{soumission.motifRefus}</p>
          </div>
        </div>

        {/* Recours Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#0D2527] mb-6 font-cairo">{t.form.title}</h2>

          <div className="space-y-6">
            {/* Type de recours */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">
                {t.form.typeRecours}
                <span className="text-red-500 ms-1">*</span>
              </label>
              <select
                value={formData.typeRecours}
                onChange={(e) => setFormData(prev => ({ ...prev, typeRecours: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none ${
                  errors.typeRecours ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <option value="">{t.form.typeRecoursPlaceholder}</option>
                {typeRecoursOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.typeRecours && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {errors.typeRecours}
                </p>
              )}
            </div>

            {/* Motif détaillé */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">
                {t.form.motif}
                <span className="text-red-500 ms-1">*</span>
              </label>
              <textarea
                value={formData.motif}
                onChange={(e) => setFormData(prev => ({ ...prev, motif: e.target.value }))}
                placeholder={t.form.motifPlaceholder}
                rows={8}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none resize-none ${
                  errors.motif ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              <div className="flex justify-between items-center mt-2">
                {errors.motif ? (
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {errors.motif}
                  </p>
                ) : (
                  <span />
                )}
                <span className={`text-sm ${formData.motif.length < 50 ? 'text-gray-500' : 'text-green-600'}`}>
                  {formData.motif.length} {t.characters}
                </span>
              </div>
            </div>

            {/* Documents justificatifs */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">
                {t.form.documents}
                <span className="text-red-500 ms-1">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">{t.form.documentsHelp}</p>
              
              <div className="border-2 border-dashed border-[#9BCFCF] rounded-xl p-8 text-center hover:border-[#306B6F] transition-colors bg-[#FCFFFF]">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={(e) => handleFileChange(e.target.files)}
                  className="hidden"
                  id="recours-documents"
                />
                <label htmlFor="recours-documents" className="cursor-pointer block">
                  <FontAwesomeIcon icon={faFileUpload} className="text-[#306B6F] text-4xl mb-4" />
                  <p className="font-bold text-[#0D2527] mb-2">{t.form.upload}</p>
                </label>
              </div>

              {formData.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faFilePdf} className="text-red-500 text-xl" />
                        <div>
                          <p className="font-medium text-gray-800">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {isArabic ? 'إزالة' : 'Supprimer'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.documents && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {errors.documents}
                </p>
              )}
            </div>

            {/* Conditions */}
            <div className="border-t border-gray-200 pt-6">
              <p className="font-bold text-[#0D2527] mb-4">{t.form.conditions}</p>
              
              {[
                t.form.condition1,
                t.form.condition2,
                t.form.condition3
              ].map((condition, index) => (
                <label key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors mb-3">
                  <input
                    type="checkbox"
                    checked={formData.accepterConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, accepterConditions: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-[#306B6F] border-gray-300 rounded focus:ring-[#306B6F]"
                  />
                  <span className="text-gray-700">{condition}</span>
                </label>
              ))}
              {errors.accepterConditions && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {errors.accepterConditions}
                </p>
              )}
            </div>

            {/* Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600 mt-1" />
                <p className="text-yellow-800 text-sm font-medium">{t.form.warning}</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faShieldHalved} />
                    <span>{t.submit}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}