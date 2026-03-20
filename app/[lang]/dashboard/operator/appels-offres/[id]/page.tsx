'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faMoneyBillWave,
  faMapMarkerAlt,
  faClock,
  faDownload,
  faFilePdf,
  faArrowLeft,
  faFileSignature
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAppelDocuments, fetchAppelOffreById, fetchDocumentsByIds } from '@/lib/operator-api';

export default function AppelOffreDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');
  const [appelId, setAppelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [offre, setOffre] = useState({
    id: 1,
    reference: 'AO/N°01/2026',
    titre: 'Appel d\'offres',
    description: '',
    montantEstime: 0,
    datePublication: new Date().toISOString(),
    dateLimiteSoumission: new Date().toISOString(),
    dateOuverturePlis: new Date().toISOString(),
    typeProcedure: '',
    serviceContractant: '',
    wilaya: 'N/A',
    documents: [] as { name: string; type: string; size: string }[],
  });

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

    const loadDetails = async () => {
      if (!appelId) return;
      setLoading(true);
      setLoadError('');
      try {
        const appel = await fetchAppelOffreById(appelId);
        const linkRows = await fetchAppelDocuments(appelId);
        const docs = await fetchDocumentsByIds(linkRows.map((item) => item.id_document));
        if (!isMounted) return;
        setOffre({
          id: appel.id_appel_offres,
          reference: appel.reference,
          titre: appel.titre,
          description: appel.description,
          montantEstime: Number(appel.montant_estime || 0),
          datePublication: appel.date_publication,
          dateLimiteSoumission: appel.date_limite_soumission,
          dateOuverturePlis: appel.date_ouverture_plis,
          typeProcedure: appel.type_procedure,
          serviceContractant: `Service #${appel.id_service_contractant}`,
          wilaya: 'N/A',
          documents: docs.map((doc) => ({
            name: doc.nom,
            type: doc.type_document,
            size: `${(doc.taille_fichier / 1024 / 1024).toFixed(2)} MB`,
          })),
        });
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Impossible de charger cet appel d\'offres.';
        setLoadError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [appelId]);

  const getTimeRemaining = () => {
    const now = new Date();
    const limite = new Date(offre.dateLimiteSoumission);
    const diff = limite.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, text: 'Expiré' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { 
      expired: false, 
      text: `${days} jours ${hours}h ${minutes}min`,
      days, hours, minutes
    };
  };

  const timeRemaining = getTimeRemaining();

  const translations = {
    fr: {
      back: 'Retour',
      reference: 'Référence',
      titre: 'Titre',
      description: 'Description',
      montantEstime: 'Montant estimé',
      dates: 'Dates importantes',
      datePublication: 'Date de publication',
      dateLimite: 'Date limite de soumission',
      dateOuverture: 'Date d\'ouverture des plis',
      tempsRestant: 'Temps restant',
      documents: 'Les documents',
      documentsInfo: 'Veuillez déposer votre offre technique et votre offre financière. Vos documents administratifs (registre de commerce, certificat CASNOS, certificat CNAS, extrait de rôle) seront récupérés automatiquement depuis votre profil.',
      offreTechnique: 'Offre technique',
      offreFinanciere: 'Offre financière',
      upload: 'Télécharger',
      soumettre: 'Soumettre',
      postuler: 'Postuler à cet appel d\'offres',
      download: 'Télécharger',
      typeProcedure: 'Type de procédure',
      serviceContractant: 'Service contractant'
    },
    ar: {
      back: 'رجوع',
      reference: 'المرجع',
      titre: 'العنوان',
      description: 'الوصف',
      montantEstime: 'المبلغ المقدر',
      dates: 'التواريخ الهامة',
      datePublication: 'تاريخ النشر',
      dateLimite: 'تاريخ الحد الأقصى للتقديم',
      dateOuverture: 'تاريخ فتح الأظرفة',
      tempsRestant: 'الوقت المتبقي',
      documents: 'الوثائق',
      documentsInfo: 'يرجى إيداع عرضك التقني وعرضك المالي. سيتم استرجاع وثائقك الإدارية (السجل التجاري، شهادة الكاسنوس، شهادة الضمان الاجتماعي، مستخلص الدور) تلقائياً من ملفك.',
      offreTechnique: 'العرض التقني',
      offreFinanciere: 'العرض المالي',
      upload: 'تحميل',
      soumettre: 'تقديم',
      postuler: 'التقدم لهذه الصفقة',
      download: 'تحميل',
      typeProcedure: 'نوع الإجراء',
      serviceContractant: 'الخدمة المتعاقدة'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-DZ').format(montant) + ' DA';
  };

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href={`/${lang}/dashboard/operator/appels-offres`}
          className="inline-flex items-center gap-2 text-[#418387] hover:text-[#173C3F] font-medium transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className={isArabic ? 'rotate-180' : ''} />
          {t.back}
        </Link>
      </div>

      <div className="max-w-5xl mx-auto">
        {loadError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {loading && (
          <div className="mb-6 rounded-xl border border-[#9BCFCF] bg-[#FCFFFF] px-4 py-3 text-sm text-[#173C3F]">
            Chargement des détails de l'appel d'offres...
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-[#418387] font-medium mb-2">{offre.reference}</p>
              <h1 className="text-3xl font-bold text-[#0D2527] mb-4 font-cairo">{offre.titre}</h1>
            </div>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold">
              Ouverte
            </span>
          </div>
          
          <p className="text-gray-700 leading-relaxed mb-6">{offre.description}</p>

          {/* Montant */}
          <div className="flex items-center gap-3 p-4 bg-[#FCFFFF] border-2 border-[#9BCFCF] rounded-xl inline-flex">
            <FontAwesomeIcon icon={faMoneyBillWave} className="text-[#306B6F] text-xl" />
            <div>
              <p className="text-xs text-[#418387]">{t.montantEstime}</p>
              <p className="text-xl font-bold text-[#0D2527]">{formatMontant(offre.montantEstime)}</p>
            </div>
          </div>
        </div>

        {/* Time Remaining - Highlighted */}
        {!timeRemaining.expired && (
          <div className="bg-gradient-to-r from-[#306B6F] to-[#418387] text-white rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faClock} className="text-2xl" />
                </div>
                <div>
                  <p className="text-sm opacity-90 mb-1">{t.tempsRestant}</p>
                  <p className="text-2xl font-bold">
                    {timeRemaining.days}j {timeRemaining.hours}h {timeRemaining.minutes}min
                  </p>
                </div>
              </div>
              <Link
                href={`/${lang}/dashboard/operator/appels-offres/${offre.id}/soumettre`}
                className="px-6 py-3 bg-white text-[#306B6F] rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFileSignature} />
                {t.postuler}
              </Link>
            </div>
          </div>
        )}

        {/* Dates Section */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0D2527] mb-6 font-cairo">{t.dates}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCalendar} className="text-[#306B6F]" />
                <span className="text-sm text-gray-600">{t.datePublication}</span>
              </div>
              <span className="font-bold text-[#0D2527]">
                {new Date(offre.datePublication).toLocaleString('fr-DZ')}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faClock} className="text-[#306B6F]" />
                <span className="text-sm text-gray-600">{t.dateLimite}</span>
              </div>
              <span className="font-bold text-[#0D2527]">
                {new Date(offre.dateLimiteSoumission).toLocaleString('fr-DZ')}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCalendar} className="text-[#306B6F]" />
                <span className="text-sm text-gray-600">{t.dateOuverture}</span>
              </div>
              <span className="font-bold text-[#0D2527]">
                {new Date(offre.dateOuverturePlis).toLocaleString('fr-DZ')}
              </span>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#0D2527] mb-4 font-cairo">{t.documents}</h2>
          <p className="text-sm text-gray-600 mb-6">{t.documentsInfo}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {offre.documents.map((doc, index) => (
              <div key={index} className="p-4 border-2 border-[#9BCFCF] rounded-xl hover:border-[#306B6F] transition-colors flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FCFFFF] rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0D2527]">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.size}</p>
                  </div>
                </div>
                <button className="p-2 text-[#306B6F] hover:bg-[#FCFFFF] rounded-lg transition-colors">
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">{t.offreTechnique}</label>
              <div className="border-2 border-dashed border-[#9BCFCF] rounded-xl p-6 text-center hover:border-[#306B6F] transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faDownload} className="text-[#418387] text-2xl mb-2" />
                <p className="text-sm text-gray-600">example</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#173C3F] mb-2">{t.offreFinanciere}</label>
              <div className="border-2 border-dashed border-[#9BCFCF] rounded-xl p-6 text-center hover:border-[#306B6F] transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faDownload} className="text-[#418387] text-2xl mb-2" />
                <p className="text-sm text-gray-600">example</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Link
            href={`/${lang}/dashboard/operator/appels-offres/${offre.id}/soumettre`}
            className="px-8 py-3.5 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-xl font-bold transition-colors shadow-lg"
          >
            {t.soumettre}
          </Link>
        </div>
      </div>
    </div>
  );
}