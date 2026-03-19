'use client';

import { useState } from 'react';
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

export default function AppelOffreDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');

  useState(async () => {
    const resolvedParams = await params;
    setLang(resolvedParams.lang);
  });

  const isArabic = lang === 'ar';

  // Mock data - Replace with API call using params.id
  const offre = {
    id: 1,
    reference: 'AO/N°01/2026',
    titre: 'Acquisition de matériel informatique pour les lycées de la wilaya d\'Alger',
    description: 'Fourniture et livraison de 500 ordinateurs portables, 100 imprimantes multifonctions et accessoires réseau pour équiper les établissements scolaires secondaires de la wilaya d\'Alger, conformément aux spécifications techniques du CDC joint.',
    montantEstime: 85000000,
    datePublication: '2026-03-01T08:00:00',
    dateLimiteSoumission: '2026-04-15T16:00:00',
    dateOuverturePlis: '2026-04-16T10:00:00',
    typeProcedure: 'Appel d\'offres ouvert',
    serviceContractant: 'Direction de l\'Éducation d\'Alger',
    wilaya: 'Alger',
    documents: [
      { name: 'Cahier des Charges', type: 'pdf', size: '2.5 MB' },
      { name: 'Spécifications techniques', type: 'pdf', size: '1.8 MB' },
      { name: 'Plan livraison', type: 'pdf', size: '850 KB' },
    ]
  };

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