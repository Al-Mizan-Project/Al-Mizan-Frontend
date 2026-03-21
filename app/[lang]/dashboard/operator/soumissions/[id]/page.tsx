'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLink,
  faCalendar,
  faMoneyBillWave,
  faFilePdf,
  faDownload,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faChartLine,
  faArrowLeft,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  findStoredSubmissionById,
  upsertStoredSubmission,
  type StoredSubmission,
} from '@/lib/operator-submissions-store';
import {
  fetchAppelOffreById,
  fetchDocumentsByIds,
  fetchSoumissionById,
  runConformiteAuto,
} from '@/lib/operator-api';

export default function SoumissionDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'details' | 'statut'>('details');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState<string>('');
  const [loadError, setLoadError] = useState<string>('');
  const [soumission, setSoumission] = useState<StoredSubmission | null>(null);
  const [analyseResult, setAnalyseResult] = useState<{
    conformite_statut: string;
    conformite_rapport?: {
      missing_documents?: string[];
      invalid_documents?: string[];
    };
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLang = async () => {
      const resolvedParams = await params;
      if (isMounted) {
        setLang(resolvedParams.lang);
        setSubmissionId(resolvedParams.id);
      }
    };

    loadLang();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const isArabic = lang === 'ar';

  const mapSoumissionStatutToUi = (statut?: string): StoredSubmission['statut'] => {
    const normalized = String(statut || '').toUpperCase();
    if (normalized === 'EN_EVALUATION' || normalized === 'EN_OUVERTURE') return 'en_evaluation';
    if (normalized === 'EVALU_TERMINEE') return 'conforme';
    if (normalized === 'RETRAITE') return 'refusee';
    return 'soumise';
  };

  useEffect(() => {
    let isMounted = true;

    const loadSoumission = async () => {
      if (!submissionId) return;
      setLoadError('');
      try {
        const [backend, localItem] = await Promise.all([
          fetchSoumissionById(Number(submissionId)),
          Promise.resolve(findStoredSubmissionById(Number(submissionId))),
        ]);
        const appel = await fetchAppelOffreById(backend.id_appel_offre);
        const linkedDocs = !localItem?.documents?.length && backend.document_ids?.length
          ? await fetchDocumentsByIds(backend.document_ids)
          : [];

        const inferredDocuments = linkedDocs.map((doc) => ({
          idDocument: doc.id_document,
          name: doc.nom,
          type: doc.is_encrypted
            ? ('financiere' as const)
            : doc.nom.toLowerCase().includes('tech')
              ? ('technique' as const)
              : ('administratif' as const),
          size: `${(doc.taille_fichier / 1024 / 1024).toFixed(2)} MB`,
          encrypted: doc.is_encrypted,
        }));

        if (!isMounted) return;
        const merged: StoredSubmission = {
          id: backend.id_soumission,
          appelOffre: {
            id: backend.id_appel_offre,
            reference: localItem?.appelOffre.reference || appel.reference,
            titre: localItem?.appelOffre.titre || appel.titre,
            serviceContractant:
              localItem?.appelOffre.serviceContractant || `Service #${appel.id_service_contractant}`,
            montantEstime: localItem?.appelOffre.montantEstime || Number(appel.montant_estime || 0),
          },
          dateSoumission: backend.date_soumission,
          montantSoumis: Number(backend.montant_financier || localItem?.montantSoumis || 0),
          statut: mapSoumissionStatutToUi(backend.statut),
          conformiteAdmin: mapConformiteStatutToUi(backend.conformite_statut || undefined),
          conformiteTechnique: localItem?.conformiteTechnique || 'en_attente',
          conformiteFinanciere: localItem?.conformiteFinanciere || 'en_attente',
          motifRefus: localItem?.motifRefus,
          dateEvaluation: localItem?.dateEvaluation,
          documents: localItem?.documents?.length ? localItem.documents : inferredDocuments,
        };
        setSoumission(merged);
        upsertStoredSubmission(merged);
      } catch (error) {
        if (!isMounted) return;
        const localItem = findStoredSubmissionById(Number(submissionId));
        if (localItem) {
          setSoumission(localItem);
          return;
        }
        const message = error instanceof Error ? error.message : 'Impossible de charger la soumission.';
        setLoadError(message);
        setSoumission(null);
      }
    };

    loadSoumission();

    return () => {
      isMounted = false;
    };
  }, [submissionId]);

  const mapConformiteStatutToUi = (statut?: string) => {
    const normalized = (statut || '').toUpperCase();
    if (normalized === 'CONFORME') return 'conforme';
    if (normalized === 'PIECES_MANQUANTES' || normalized === 'NON_CONFORME') return 'non_conforme';
    return 'en_attente';
  };

  const triggerConformiteAuto = async () => {
    if (!submissionId) return;

    setAnalyseError('');
    setIsAnalysing(true);
    try {
      if (!soumission) {
        throw new Error('Soumission introuvable dans l\'historique local.');
      }
      if (!soumission.documents.length) {
        throw new Error('Aucun document associé à cette soumission pour lancer l\'analyse IA.');
      }

      const data = await runConformiteAuto({
        soumissionId: Number(submissionId),
        idAppelOffre: soumission.appelOffre.id,
        providedDocumentIds: soumission.documents.map((doc) => doc.idDocument),
        performOcr: true,
      });

      setAnalyseResult({
        conformite_statut: data?.conformite_statut || '',
        conformite_rapport: data?.conformite_rapport || {},
      });

      const mappedStatus = mapConformiteStatutToUi(data?.conformite_statut || '');
      const updatedSoumission: StoredSubmission = {
        ...soumission,
        conformiteAdmin: mappedStatus,
      };
      setSoumission(updatedSoumission);
      upsertStoredSubmission(updatedSoumission);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setAnalyseError(message);
    } finally {
      setIsAnalysing(false);
    }
  };

  const getConformiteStatus = (status: string) => {
    if (status === 'conforme') return { 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      icon: faCheckCircle,
      label: 'Conforme' 
    };
    if (status === 'non_conforme') return { 
      color: 'text-red-600', 
      bg: 'bg-red-100',
      icon: faTimesCircle,
      label: 'Non conforme' 
    };
    return { 
      color: 'text-gray-400', 
      bg: 'bg-gray-100',
      icon: faChartLine,
      label: 'En attente' 
    };
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      soumise: isArabic ? 'Soumise' : 'Soumise',
      en_evaluation: isArabic ? 'في التقييم' : 'En cours d\'évaluation',
      conforme: isArabic ? 'مقبولة' : 'Conforme',
      refusee: isArabic ? 'مرفوضة' : 'Refusée',
      attribuee: isArabic ? 'مسنودة' : 'Attribuée'
    };
    return labels[statut] || statut;
  };

  const translations = {
    fr: {
      back: 'Retour',
      voirAppelOffre: 'Voir l\'appel d\'offres',
      detailsSoumission: 'Détails soumission',
      statutEvaluation: 'Statut & Évaluation',
      dateSoumission: 'Date de soumission',
      montantSoumis: 'Montant soumis',
      statutActuel: 'Statut actuel',
      documentsSoumis: 'Documents soumis',
      rapportConformite: 'Rapport de conformité',
      conformiteAdmin: 'Conformité administrative',
      conformiteTechnique: 'Conformité technique',
      conformiteFinanciere: 'Conformité financière',
      motifRefus: 'Motif du refus',
      traiteLe: 'Traité le',
      deposerRecours: 'Déposer un recours',
      telecharger: 'Télécharger',
      documentEncrypte: 'Document chiffré',
      offreTechnique: 'Offre technique',
      offreFinanciere: 'Offre financière chiffrée',
      documentsAdmin: 'Documents administratifs'
    },
    ar: {
      back: 'رجوع',
      voirAppelOffre: 'عرض الصفقة',
      detailsSoumission: 'تفاصيل الطلب',
      statutEvaluation: 'الحالة والتقييم',
      dateSoumission: 'تاريخ التقديم',
      montantSoumis: 'المبلغ المقدم',
      statutActuel: 'الحالة الحالية',
      documentsSoumis: 'الوثائق المقدمة',
      rapportConformite: 'تقرير المطابقة',
      conformiteAdmin: 'المطابقة الإدارية',
      conformiteTechnique: 'المطابقة التقنية',
      conformiteFinanciere: 'المطابقة المالية',
      motifRefus: 'سبب الرفض',
      traiteLe: 'تمت المعالجة في',
      deposerRecours: 'تقديم طعن',
      telecharger: 'تحميل',
      documentEncrypte: 'وثيقة مشفرة',
      offreTechnique: 'العرض التقني',
      offreFinanciere: 'العرض المالي المشفر',
      documentsAdmin: 'الوثائق الإدارية'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const effectiveConformiteAdmin = analyseResult
    ? mapConformiteStatutToUi(analyseResult.conformite_statut)
    : (soumission?.conformiteAdmin || 'en_attente');

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-DZ').format(montant) + ' DA';
  };

  if (!lang) return null;
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {loadError}
        </div>
      </div>
    );
  }
  if (!soumission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          Soumission introuvable.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Back & Link */}
        <div className="mb-6 space-y-4">
          <Link
            href={`/${lang}/dashboard/operator/soumissions`}
            className="inline-flex items-center gap-2 text-[#418387] hover:text-[#173C3F] font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className={isArabic ? 'rotate-180' : ''} />
            {t.back}
          </Link>
          
          <Link
            href={`/${lang}/dashboard/operator/appels-offres/${soumission.appelOffre.id}`}
            className="inline-flex items-center gap-2 text-[#306B6F] hover:text-[#173C3F] font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faLink} />
            {t.voirAppelOffre}
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <p className="text-sm text-[#418387] font-medium mb-2">{soumission.appelOffre.reference}</p>
          <h1 className="text-2xl font-bold text-[#0D2527] mb-4 font-cairo">{soumission.appelOffre.titre}</h1>
          <p className="text-gray-600">{soumission.appelOffre.serviceContractant}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'border-[#306B6F] text-[#306B6F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.detailsSoumission}
              </button>
              <button
                onClick={() => setActiveTab('statut')}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'statut'
                    ? 'border-[#306B6F] text-[#306B6F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.statutEvaluation}
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'details' ? (
              /* Details Tab */
              <div className="space-y-8">
                {/* Submission Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-[#FCFFFF] border border-[#9BCFCF] rounded-xl">
                    <div className="w-12 h-12 bg-[#306B6F] rounded-xl flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendar} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t.dateSoumission}</p>
                      <p className="font-bold text-[#0D2527]">
                        {new Date(soumission.dateSoumission).toLocaleString('fr-DZ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-[#FCFFFF] border border-[#9BCFCF] rounded-xl">
                    <div className="w-12 h-12 bg-[#306B6F] rounded-xl flex items-center justify-center">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t.montantSoumis}</p>
                      <p className="font-bold text-[#0D2527]">{formatMontant(soumission.montantSoumis)}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-bold text-[#0D2527] mb-4">{t.documentsSoumis}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {soumission.documents.map((doc, index) => (
                      <div key={index} className="p-4 border-2 border-[#9BCFCF] rounded-xl hover:border-[#306B6F] transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FCFFFF] rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0D2527]">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.size}</p>
                            {doc.encrypted && (
                              <span className="text-xs text-[#306B6F] font-medium">🔒 {t.documentEncrypte}</span>
                            )}
                          </div>
                        </div>
                        <button className="p-2 text-[#306B6F] hover:bg-[#FCFFFF] rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Status Tab */
              <div className="space-y-8">
                {/* Current Status */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t.statutActuel}</p>
                  <p className={`text-xl font-bold ${
                    soumission.statut === 'refusee' ? 'text-red-600' :
                    soumission.statut === 'attribuee' ? 'text-green-600' :
                    'text-yellow-600'
                  }`}>
                    {getStatutLabel(soumission.statut)}
                  </p>
                </div>

                {/* Compliance Report */}
                <div>
                  <h3 className="text-lg font-bold text-[#0D2527] mb-4">{t.rapportConformite}</h3>
                  <div className="mb-4 flex items-center gap-3">
                    <button
                      onClick={triggerConformiteAuto}
                      disabled={isAnalysing}
                      className="px-4 py-2 rounded-lg bg-[#306B6F] hover:bg-[#173C3F] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                    >
                      {isAnalysing ? (
                        <span className="inline-flex items-center gap-2">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                          Analyse IA en cours...
                        </span>
                      ) : (
                        'Lancer analyse de conformité (OCR/NLP)'
                      )}
                    </button>
                    {analyseResult && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-md">
                        Dernier statut IA: {analyseResult.conformite_statut}
                      </span>
                    )}
                  </div>
                  {analyseError && (
                    <p className="mb-4 text-sm text-red-700 bg-red-100 rounded-lg px-3 py-2">{analyseError}</p>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="font-medium text-gray-700">{t.conformiteAdmin}</span>
                      <span className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                        getConformiteStatus(effectiveConformiteAdmin).bg
                      } ${getConformiteStatus(effectiveConformiteAdmin).color}`}>
                        <FontAwesomeIcon icon={getConformiteStatus(effectiveConformiteAdmin).icon} />
                        {getConformiteStatus(effectiveConformiteAdmin).label}
                      </span>
                    </div>

                    {analyseResult?.conformite_rapport?.missing_documents && analyseResult.conformite_rapport.missing_documents.length > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm font-semibold text-amber-800 mb-2">Pièces manquantes détectées</p>
                        <p className="text-sm text-amber-700">
                          {analyseResult.conformite_rapport.missing_documents.join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="font-medium text-gray-700">{t.conformiteTechnique}</span>
                      <span className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                        getConformiteStatus(soumission.conformiteTechnique).bg
                      } ${getConformiteStatus(soumission.conformiteTechnique).color}`}>
                        <FontAwesomeIcon icon={getConformiteStatus(soumission.conformiteTechnique).icon} />
                        {getConformiteStatus(soumission.conformiteTechnique).label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="font-medium text-gray-700">{t.conformiteFinanciere}</span>
                      <span className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                        getConformiteStatus(soumission.conformiteFinanciere).bg
                      } ${getConformiteStatus(soumission.conformiteFinanciere).color}`}>
                        <FontAwesomeIcon icon={getConformiteStatus(soumission.conformiteFinanciere).icon} />
                        {getConformiteStatus(soumission.conformiteFinanciere).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Refusal Reason */}
                {soumission.motifRefus && (
                  <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-start gap-3 mb-3">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-red-800 mb-2">{t.motifRefus}</h3>
                        <p className="text-red-700 leading-relaxed">{soumission.motifRefus}</p>
                      </div>
                    </div>
                    {soumission.dateEvaluation && (
                      <p className="text-sm text-red-600 mt-4 text-end">
                        {t.traiteLe}: {new Date(soumission.dateEvaluation).toLocaleString('fr-DZ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Recourse Button */}
                {soumission.statut === 'refusee' && (
                  <div className="flex justify-end">
                    <Link
                      href={`/${lang}/dashboard/operator/recours/nouveau?submissionId=${soumission.id}`}
                      className="px-8 py-3.5 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-xl font-bold transition-colors shadow-lg"
                    >
                      {t.deposerRecours}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}