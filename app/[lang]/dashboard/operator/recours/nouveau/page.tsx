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
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import {
  createRecours,
  fetchSoumissionById,
  fetchSoumissionsByOperator,
  uploadDocument,
  type SoumissionApi,
} from '@/lib/operator-api';

type FormData = {
  typeRecours: string;
  objet: string;
  motif: string;
  explications: string;
  documents: File[];
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
  const [soumission, setSoumission] = useState<SoumissionApi | null>(null);
  const [soumissionError, setSoumissionError] = useState('');

  // For soumission picker when no submissionId in URL
  const [soumissions, setSoumissions] = useState<SoumissionApi[]>([]);
  const [selectedSoumissionId, setSelectedSoumissionId] = useState<string>('');

  const submissionIdParam = searchParams.get('submissionId');
  const effectiveSubmissionId = submissionIdParam || selectedSoumissionId;

  const [formData, setFormData] = useState<FormData>({
    typeRecours: '',
    objet: '',
    motif: '',
    explications: '',
    documents: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let isMounted = true;
    params.then((p) => { if (isMounted) setLang(p.lang); });
    return () => { isMounted = false; };
  }, [params]);

  const isArabic = lang === 'ar';

  // If no submissionId in URL, load soumissions list for picker
  useEffect(() => {
    if (submissionIdParam) return;
    const operateurId = Number(
      typeof window !== 'undefined' ? localStorage.getItem('operateur_id') || '1' : '1'
    );
    fetchSoumissionsByOperator(operateurId)
      .then(setSoumissions)
      .catch(() => {});
  }, [submissionIdParam]);

  // Fetch soumission detail when ID is known
  useEffect(() => {
    if (!effectiveSubmissionId) return;
    setSoumissionError('');
    fetchSoumissionById(Number(effectiveSubmissionId))
      .then(setSoumission)
      .catch(() => setSoumissionError('Impossible de charger les informations de la soumission.'));
  }, [effectiveSubmissionId]);

  const typeRecoursOptions = [
    {
      value: 'GRACIEUX',
      label: isArabic ? 'تظلم ودي' : 'Recours gracieux',
      desc: isArabic ? 'موجه للجهة المتعاقدة مباشرة' : 'Adressé directement au service contractant',
    },
    {
      value: 'HIERARCHIQUE',
      label: isArabic ? 'تظلم هرمي' : 'Recours hiérarchique',
      desc: isArabic ? 'موجه للسلطة الوصية' : "Adressé à l'autorité de tutelle",
    },
    {
      value: 'CONTENTIEUX',
      label: isArabic ? 'طعن قضائي' : 'Recours contentieux',
      desc: isArabic ? 'أمام الجهة القضائية المختصة' : 'Devant la juridiction compétente',
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!effectiveSubmissionId) {
      newErrors.objet = isArabic ? 'يرجى اختيار طلب' : 'Veuillez sélectionner une soumission';
    }

    if (!formData.typeRecours) {
      newErrors.typeRecours = isArabic ? 'نوع الطعن مطلوب' : 'Type de recours requis';
    }

    if (!formData.motif.trim()) {
      newErrors.motif = isArabic ? 'الدوافع مطلوبة' : 'Motif requis';
    } else if (formData.motif.length < 50) {
      newErrors.motif = isArabic
        ? 'يجب أن يكون الدوافع 50 حرفاً على الأقل'
        : 'Le motif doit contenir au moins 50 caractères';
    }

    if (formData.documents.length === 0) {
      newErrors.documents = isArabic
        ? 'يجب إرفاق وثيقة واحدة على الأقل'
        : 'Au moins un document justificatif requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf');
    setFormData((prev) => ({ ...prev, documents: [...prev.documents, ...pdfs] }));
    if (errors.documents) setErrors((prev) => ({ ...prev, documents: undefined }));
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 1. Upload documents
      const uploadedIds: number[] = [];
      for (const file of formData.documents) {
        const uploaded = await uploadDocument({
          file,
          relatedType: `recours:${effectiveSubmissionId}`,
          isEncrypted: false,
        });
        uploadedIds.push(uploaded.id_document);
      }

      // 2. Get operator ID from localStorage
      const operateurId = Number(
        typeof window !== 'undefined' ? localStorage.getItem('operateur_id') || '1' : '1'
      );

      // 3. Create recours
      await createRecours({
        id_operateur_economique: operateurId,
        id_soumission: Number(effectiveSubmissionId),
        motif: formData.motif,
        type_recours: formData.typeRecours as 'GRACIEUX' | 'HIERARCHIQUE' | 'CONTENTIEUX',
        objet: formData.objet,
        explications: formData.explications || formData.motif,
        document_ids: uploadedIds,
      });

      router.push(`/${lang}/dashboard/operator/recours`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(isArabic ? `حدث خطأ: ${msg}` : `Erreur lors du dépôt: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number | string | null) => {
    if (!montant) return '—';
    return new Intl.NumberFormat('fr-DZ').format(Number(montant)) + ' DA';
  };

  const translations = {
    fr: {
      back: 'Retour',
      title: 'Déposer un recours',
      subtitle: 'Contester une décision',
      pickSoumission: 'Sélectionner la soumission concernée',
      pickSoumissionPlaceholder: '— Choisir une soumission —',
      soumissionInfo: {
        title: 'Soumission concernée',
        id: 'Référence',
        appelOffre: "Appel d'offres",
        montant: 'Montant soumis',
        dateSoumission: 'Date de soumission',
      },
      form: {
        title: 'Détails du recours',
        typeRecours: 'Type de recours',
        objet: 'Objet du recours',
        objetPlaceholder: 'Résumé en une phrase de votre recours',
        motif: 'Motif détaillé',
        motifPlaceholder:
          'Expliquez en détail les raisons de votre recours. Citez les faits et les preuves. (Minimum 50 caractères)',
        explications: 'Explications complémentaires (optionnel)',
        explicationsPlaceholder: "Tout élément de contexte supplémentaire utile à l'examen du recours.",
        documents: 'Documents justificatifs',
        documentsHelp: 'Format PDF uniquement. Taille max : 10 MB par fichier.',
        upload: 'Ajouter des documents PDF',
        warning: "Le dépôt d'un recours ne suspend pas automatiquement la procédure d'attribution.",
      },
      submit: 'Déposer le recours',
      submitting: 'Dépôt en cours...',
      characters: 'caractères',
    },
    ar: {
      back: 'رجوع',
      title: 'تقديم طعن',
      subtitle: 'الطعن في قرار',
      pickSoumission: 'اختر الطلب المعني',
      pickSoumissionPlaceholder: '— اختر طلباً —',
      soumissionInfo: {
        title: 'الطلب المعني',
        id: 'المرجع',
        appelOffre: 'نداء العروض',
        montant: 'المبلغ المقدم',
        dateSoumission: 'تاريخ التقديم',
      },
      form: {
        title: 'تفاصيل الطعن',
        typeRecours: 'نوع الطعن',
        objet: 'موضوع الطعن',
        objetPlaceholder: 'ملخص طعنك في جملة واحدة',
        motif: 'دوافع الطعن بالتفصيل',
        motifPlaceholder: 'اشرح بالتفصيل أسباب طعنك. استشهد بالوقائع والأدلة. (50 حرفاً على الأقل)',
        explications: 'توضيحات إضافية (اختياري)',
        explicationsPlaceholder: 'أي سياق إضافي مفيد لدراسة الطعن.',
        documents: 'الوثائق المثبتة',
        documentsHelp: 'صيغة PDF فقط. الحجم الأقصى: 10 ميجا بايت لكل ملف.',
        upload: 'إضافة وثائق PDF',
        warning: 'تقديم الطعن لا يوقف تلقائياً إجراء إسناد الصفقة.',
      },
      submit: 'تقديم الطعن',
      submitting: 'جاري التقديم...',
      characters: 'حرف',
    },
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <div className="mb-6">
          <Link
            href={`/${lang}/dashboard/operator/recours`}
            className="inline-flex items-center gap-2 text-[#418387] hover:text-[#173C3F] font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className={isArabic ? 'rotate-180' : ''} />
            {t.back}
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#306B6F] rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faGavel} className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0D2527] font-cairo">{t.title}</h1>
              <p className="text-[#418387]">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Soumission picker — only shown if no submissionId in URL */}
        {!submissionIdParam && (
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
            <label className="block text-sm font-medium text-[#173C3F] mb-2">
              {t.pickSoumission} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSoumissionId}
              onChange={(e) => setSelectedSoumissionId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
            >
              <option value="">{t.pickSoumissionPlaceholder}</option>
              {soumissions.map((s) => (
                <option key={s.id_soumission} value={String(s.id_soumission)}>
                  {s.reference || `#${s.id_soumission}`} — AO #{s.id_appel_offre}
                  {s.reference_ao ? ` (${s.reference_ao})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Soumission info */}
        {soumissionError && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {soumissionError}
          </div>
        )}
        {soumission && (
          <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#0D2527] mb-6 font-cairo">
              {t.soumissionInfo.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.id}</p>
                <p className="font-bold text-[#0D2527]">
                  {soumission.reference || `#${soumission.id_soumission}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.appelOffre}</p>
                <p className="font-bold text-[#0D2527]">
                  {soumission.reference_ao || `AO #${soumission.id_appel_offre}`}
                </p>
              </div>
              {soumission.titre_ao && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Titre</p>
                  <p className="font-bold text-[#0D2527]">{soumission.titre_ao}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.montant}</p>
                <p className="font-bold text-[#173C3F]">
                  {formatMontant(soumission.montant_financier)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t.soumissionInfo.dateSoumission}</p>
                <p className="font-bold text-[#0D2527]">
                  {new Date(soumission.date_soumission).toLocaleString('fr-DZ')}
                </p>
              </div>
            </div>
            {soumission.conformite_statut && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Statut de conformité</p>
                <p className="text-red-800 font-medium">{soumission.conformite_statut}</p>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#0D2527] mb-6 font-cairo">{t.form.title}</h2>

          <div className="space-y-6">

            {/* Type de recours */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-3">
                {t.form.typeRecours} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {typeRecoursOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-col gap-1 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      formData.typeRecours === option.value
                        ? 'border-[#306B6F] bg-[#EEF8F8]'
                        : 'border-gray-200 hover:border-[#9BCFCF]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="typeRecours"
                      value={option.value}
                      checked={formData.typeRecours === option.value}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, typeRecours: e.target.value }));
                        if (errors.typeRecours)
                          setErrors((prev) => ({ ...prev, typeRecours: undefined }));
                      }}
                      className="sr-only"
                    />
                    <span className="font-bold text-[#0D2527] text-sm">{option.label}</span>
                    <span className="text-xs text-gray-500">{option.desc}</span>
                  </label>
                ))}
              </div>
              {errors.typeRecours && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {errors.typeRecours}
                </p>
              )}
            </div>

            {/* Objet */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">
                {t.form.objet}
              </label>
              <input
                type="text"
                value={formData.objet}
                onChange={(e) => setFormData((prev) => ({ ...prev, objet: e.target.value }))}
                placeholder={t.form.objetPlaceholder}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none"
              />
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">
                {t.form.motif} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.motif}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, motif: e.target.value }));
                  if (errors.motif) setErrors((prev) => ({ ...prev, motif: undefined }));
                }}
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

            {/* Explications */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">
                {t.form.explications}
              </label>
              <textarea
                value={formData.explications}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, explications: e.target.value }))
                }
                placeholder={t.form.explicationsPlaceholder}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#306B6F] outline-none resize-none"
              />
            </div>

            {/* Documents */}
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">
                {t.form.documents} <span className="text-red-500">*</span>
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
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
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

            {/* Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600 mt-1 flex-shrink-0" />
                <p className="text-yellow-800 text-sm">{t.form.warning}</p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
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