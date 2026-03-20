'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faFilePdf,
  faLock,
  faUpload,
  faCheckCircle,
  faExclamationTriangle,
  faFileSignature,
  faShieldHalved,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import {
  createSoumission,
  fetchAppelOffreById,
  fetchOperatorDocuments,
  uploadDocument,
} from '@/lib/operator-api';
import { upsertStoredSubmission } from '@/lib/operator-submissions-store';

type FormData = {
  offreTechnique: File | null;
  offreFinanciere: File | null;
  accepterConditions: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function SoumettreOffrePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');
  const [appelId, setAppelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(1);
  const [operatorId] = useState<number>(() => Number(process.env.NEXT_PUBLIC_OPERATOR_ID || 1));
  
  const [formData, setFormData] = useState<FormData>({
    offreTechnique: null,
    offreFinanciere: null,
    accepterConditions: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [appelOffre, setAppelOffre] = useState({
    id: 1,
    reference: 'AO/N°--/----',
    titre: 'Appel d\'offres',
    montantEstime: 0,
    dateLimiteSoumission: new Date().toISOString(),
    dateOuverturePlis: new Date().toISOString(),
    serviceContractant: 'Service #0',
  });
  const [documentsProfile, setDocumentsProfile] = useState<Array<{ id: number; name: string; type: string; valide: boolean }>>([]);

  useEffect(() => {
    let isMounted = true;

    const loadLang = async () => {
      const resolvedParams = await params;
      if (isMounted) {
        setLang(resolvedParams.lang);
        setAppelId(Number(resolvedParams.id));
      }
    };

    loadLang();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const isArabic = lang === 'ar';

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!appelId) return;
      setLoadError('');
      try {
        const [appel, operatorDocs] = await Promise.all([
          fetchAppelOffreById(appelId),
          fetchOperatorDocuments(operatorId),
        ]);
        if (!isMounted) return;
        setAppelOffre({
          id: appel.id_appel_offres,
          reference: appel.reference,
          titre: appel.titre,
          montantEstime: Number(appel.montant_estime || 0),
          dateLimiteSoumission: appel.date_limite_soumission,
          dateOuverturePlis: appel.date_ouverture_plis,
          serviceContractant: `Service #${appel.id_service_contractant}`,
        });
        setDocumentsProfile(
          operatorDocs.map((doc) => ({
            id: doc.id_document,
            name: doc.nom,
            type: doc.type_document,
            valide: true,
          }))
        );
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Impossible de charger les données de soumission.';
        setLoadError(message);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [appelId, operatorId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.offreTechnique) {
      newErrors.offreTechnique = isArabic ? 'العرض التقني مطلوب' : 'Offre technique requise';
    }

    if (!formData.offreFinanciere) {
      newErrors.offreFinanciere = isArabic ? 'العرض المالي مطلوب' : 'Offre financière requise';
    }

    if (!formData.accepterConditions) {
      newErrors.accepterConditions = isArabic ? 'يجب قبول الشروط' : 'Vous devez accepter les conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const [techDoc, finDoc] = await Promise.all([
        uploadDocument({
          file: formData.offreTechnique as File,
          relatedType: `soumission:${operatorId}`,
          isEncrypted: false,
        }),
        uploadDocument({
          file: formData.offreFinanciere as File,
          relatedType: `soumission:${operatorId}`,
          isEncrypted: true,
        }),
      ]);

      const documentsBase = process.env.NEXT_PUBLIC_DOCUMENTS_SERVICE_URL || 'http://localhost:8003';
      const financialUrl = `${documentsBase}/api/documents/${finDoc.id_document}/`;

      const created = await createSoumission({
        id_appel_offre: appelOffre.id,
        id_soumissionnaire: operatorId,
        offre_financiere_chiffree_url: financialUrl,
        cle_dechiffrement_hash: 'frontend-placeholder-key-hash',
      });

      upsertStoredSubmission({
        id: created.id,
        appelOffre: {
          id: appelOffre.id,
          reference: appelOffre.reference,
          titre: appelOffre.titre,
          serviceContractant: appelOffre.serviceContractant,
          montantEstime: appelOffre.montantEstime,
        },
        dateSoumission: new Date().toISOString(),
        montantSoumis: 0,
        statut: 'soumise',
        conformiteAdmin: 'en_attente',
        conformiteTechnique: 'en_attente',
        conformiteFinanciere: 'en_attente',
        documents: [
          {
            idDocument: techDoc.id_document,
            name: techDoc.nom,
            type: 'technique',
            size: `${(techDoc.taille_fichier / 1024 / 1024).toFixed(2)} MB`,
          },
          {
            idDocument: finDoc.id_document,
            name: finDoc.nom,
            type: 'financiere',
            size: `${(finDoc.taille_fichier / 1024 / 1024).toFixed(2)} MB`,
            encrypted: true,
          },
          ...documentsProfile.map((doc) => ({
            idDocument: doc.id,
            name: doc.name,
            type: 'administratif' as const,
            size: 'N/A',
          })),
        ],
      });

      router.push(`/${lang}/dashboard/operator/soumissions`);
    } catch (error) {
      console.error('Submission error:', error);
      alert(isArabic ? 'حدث خطأ في التقديم' : 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-DZ').format(montant) + ' DA';
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const limite = new Date(appelOffre.dateLimiteSoumission);
    const diff = limite.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, text: 'Expiré' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { expired: false, text: `${days}j ${hours}h ${minutes}min` };
  };

  const timeRemaining = getTimeRemaining();

  const translations = {
    fr: {
      back: 'Retour',
      title: 'Soumission à l\'appel d\'offres',
      reference: 'Référence',
      montantEstime: 'Montant estimé',
      tempsRestant: 'Temps restant',
      steps: {
        1: 'Vérification',
        2: 'Documents',
        3: 'Confirmation'
      },
      section1: {
        title: 'Vos documents administratifs',
        subtitle: 'Ces documents sont récupérés automatiquement de votre profil',
        info: 'Vos documents administratifs ont été vérifiés et sont valides. Ils seront joints automatiquement à votre soumission.'
      },
      section2: {
        title: 'Offre Technique',
        subtitle: 'Cahier des charges technique détaillé',
        help: 'Format PDF uniquement. Taille max: 20MB',
        label: 'Télécharger votre offre technique'
      },
      section3: {
        title: 'Offre Financière',
        subtitle: 'Offre chiffrée et détaillée',
        help: 'Format PDF uniquement. Taille max: 10MB. Cette offre sera chiffrée et ne sera décryptée qu\'à l\'ouverture des plis.',
        label: 'Télécharger votre offre financière',
        encryption: 'Chiffrement AES-256 activé'
      },
      section4: {
        title: 'Confirmation',
        conditions: 'Je déclare sur l\'honneur que:',
        condition1: 'Les informations fournies sont exactes et conformes',
        condition2: 'Mon offre est valable pendant 120 jours',
        condition3: 'Je m\'engage à respecter le cahier des charges',
        condition4: 'Je n\'ai fait l\'objet d\'aucune exclusion légale',
        warning: 'Attention: Une fois soumise, votre offre ne peut plus être modifiée'
      },
      submit: 'Soumettre l\'offre',
      submitting: 'Soumission en cours...',
      success: 'Offre soumise avec succès',
      next: 'Continuer',
      previous: 'Retour'
    },
    ar: {
      back: 'رجوع',
      title: 'تقديم عرض للصفقة',
      reference: 'المرجع',
      montantEstime: 'المبلغ المقدر',
      tempsRestant: 'الوقت المتبقي',
      steps: {
        1: 'التحقق',
        2: 'الوثائق',
        3: 'التأكيد'
      },
      section1: {
        title: 'وثائقك الإدارية',
        subtitle: 'يتم استرجاع هذه الوثائق تلقائياً من ملفك',
        info: 'تم التحقق من وثائقك الإدارية وهي صالحة. سيتم إرفاقها تلقائياً بطلبك.'
      },
      section2: {
        title: 'العرض التقني',
        subtitle: 'كراسة الشروط التقنية المفصلة',
        help: 'صيغة PDF فقط. الحجم الأقصى: 20 ميجا بايت',
        label: 'تحميل عرضك التقني'
      },
      section3: {
        title: 'العرض المالي',
        subtitle: 'العرض المفصل والمقدر',
        help: 'صيغة PDF فقط. الحجم الأقصى: 10 ميجا بايت. سيتم تشفير هذا العرض ولن يتم فك تشفيره إلا عند فتح الأظرفة.',
        label: 'تحميل عرضك المالي',
        encryption: 'التشفير AES-256 مفعل'
      },
      section4: {
        title: 'التأكيد',
        conditions: 'أصرح على الشرف بأن:',
        condition1: 'المعلومات المقدمة دقيقة ومتوافقة',
        condition2: 'عرضي ساري المفعول لمدة 120 يوماً',
        condition3: 'ألتزم باحترام كراسة الشروط',
        condition4: 'لم أكن موضوع أي إقصاء قانوني',
        warning: 'تنبيه: بمجرد التقديم، لا يمكن تعديل عرضك'
      },
      submit: 'تقديم العرض',
      submitting: 'جاري التقديم...',
      success: 'تم تقديم العرض بنجاح',
      next: 'متابعة',
      previous: 'رجوع'
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
            href={`/${lang}/dashboard/operator/appels-offres/${appelOffre.id}`}
            className="inline-flex items-center gap-2 text-[#418387] hover:text-[#173C3F] font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className={isArabic ? 'rotate-180' : ''} />
            {t.back}
          </Link>
        </div>

        {/* Header */}
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-[#418387] font-medium mb-2">{appelOffre.reference}</p>
              <h1 className="text-2xl font-bold text-[#0D2527] mb-2 font-cairo">{appelOffre.titre}</h1>
              <p className="text-gray-600">{appelOffre.serviceContractant}</p>
            </div>
            <div className="text-end">
              <p className="text-sm text-gray-600 mb-1">{t.montantEstime}</p>
              <p className="text-xl font-bold text-[#173C3F]">{formatMontant(appelOffre.montantEstime)}</p>
            </div>
          </div>

          {/* Time Remaining Alert */}
          {!timeRemaining.expired ? (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 text-xl" />
              <div className="flex-1">
                <p className="font-bold text-yellow-800">{t.tempsRestant}</p>
                <p className="text-yellow-700">{timeRemaining.text}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
              <p className="font-bold text-red-800">Appel d'offres expiré</p>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  stepNum <= step 
                    ? 'bg-[#306B6F] text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum < step ? <FontAwesomeIcon icon={faCheckCircle} /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-24 h-1 ${stepNum < step ? 'bg-[#306B6F]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-2">
            <span className={`text-sm ${step >= 1 ? 'text-[#306B6F] font-bold' : 'text-gray-500'}`}>
              {t.steps[1 as keyof typeof t.steps]}
            </span>
            <span className={`text-sm ${step >= 2 ? 'text-[#306B6F] font-bold' : 'text-gray-500'}`}>
              {t.steps[2 as keyof typeof t.steps]}
            </span>
            <span className={`text-sm ${step >= 3 ? 'text-[#306B6F] font-bold' : 'text-gray-500'}`}>
              {t.steps[3 as keyof typeof t.steps]}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Administrative Documents */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0D2527] mb-2 font-cairo">{t.section1.title}</h2>
              <p className="text-[#418387] mb-6">{t.section1.subtitle}</p>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 mt-1" />
                  <p className="text-blue-800 text-sm">{t.section1.info}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentsProfile.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-2 border-green-200 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <p className="text-xs text-gray-500">Document administratif</p>
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors"
                >
                  {t.next}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Technical & Financial Offers */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Technical Offer */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-[#0D2527] mb-2 font-cairo">{t.section2.title}</h2>
                <p className="text-[#418387] mb-4">{t.section2.subtitle}</p>
                
                <div className="border-2 border-dashed border-[#9BCFCF] rounded-xl p-8 text-center hover:border-[#306B6F] transition-colors cursor-pointer bg-[#FCFFFF]">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('offreTechnique', e.target.files?.[0] || null)}
                    className="hidden"
                    id="offre-technique"
                  />
                  <label htmlFor="offre-technique" className="cursor-pointer block">
                    <FontAwesomeIcon icon={faUpload} className="text-[#306B6F] text-4xl mb-4" />
                    <p className="font-bold text-[#0D2527] mb-2">{t.section2.label}</p>
                    <p className="text-sm text-gray-600">{t.section2.help}</p>
                    {formData.offreTechnique && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">{formData.offreTechnique.name}</p>
                        <p className="text-xs text-green-600">
                          {(formData.offreTechnique.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {errors.offreTechnique && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {errors.offreTechnique}
                  </p>
                )}
              </div>

              {/* Financial Offer */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#0D2527] font-cairo">{t.section3.title}</h2>
                    <p className="text-[#418387]">{t.section3.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                    <FontAwesomeIcon icon={faLock} />
                    <span className="text-sm font-bold">{t.section3.encryption}</span>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-[#9BCFCF] rounded-xl p-8 text-center hover:border-[#306B6F] transition-colors cursor-pointer bg-[#FCFFFF]">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange('offreFinanciere', e.target.files?.[0] || null)}
                    className="hidden"
                    id="offre-financiere"
                  />
                  <label htmlFor="offre-financiere" className="cursor-pointer block">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-[#306B6F] rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faLock} className="text-white text-2xl" />
                      </div>
                    </div>
                    <p className="font-bold text-[#0D2527] mb-2">{t.section3.label}</p>
                    <p className="text-sm text-gray-600 mb-2">{t.section3.help}</p>
                    {formData.offreFinanciere && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">{formData.offreFinanciere.name}</p>
                        <p className="text-xs text-green-600">
                          {(formData.offreFinanciere.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                {errors.offreFinanciere && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    {errors.offreFinanciere}
                  </p>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3 border-2 border-[#9BCFCF] text-[#418387] rounded-xl font-bold hover:bg-[#FCFFFF] transition-colors"
                >
                  {t.previous}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors"
                >
                  {t.next}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[#0D2527] mb-6 font-cairo">{t.section4.title}</h2>
              
              <div className="space-y-4 mb-8">
                <p className="font-bold text-[#0D2527] mb-4">{t.section4.conditions}</p>
                
                {[
                  t.section4.condition1,
                  t.section4.condition2,
                  t.section4.condition3,
                  t.section4.condition4
                ].map((condition, index) => (
                  <label key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.accepterConditions}
                      onChange={(e) => setFormData(prev => ({ ...prev, accepterConditions: e.target.checked }))}
                      className="mt-1 w-5 h-5 text-[#306B6F] border-gray-300 rounded focus:ring-[#306B6F]"
                    />
                    <span className="text-gray-700">{condition}</span>
                  </label>
                ))}
              </div>

              {errors.accepterConditions && (
                <p className="text-red-600 text-sm mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  {errors.accepterConditions}
                </p>
              )}

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-1" />
                  <p className="text-red-800 font-bold">{t.section4.warning}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 border-2 border-[#9BCFCF] text-[#418387] rounded-xl font-bold hover:bg-[#FCFFFF] transition-colors"
                >
                  {t.previous}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
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
                      <FontAwesomeIcon icon={faFileSignature} />
                      <span>{t.submit}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}