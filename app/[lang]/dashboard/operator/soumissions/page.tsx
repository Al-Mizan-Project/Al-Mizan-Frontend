'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faCalendar,
  faMoneyBillWave,
  faEye,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faExclamationTriangle,
  faFileSignature
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

type Soumission = {
  id: number;
  appelOffreReference: string;
  appelOffreTitre: string;
  serviceContractant: string;
  dateSoumission: string;
  montantSoumis: number;
  statut: 'soumise' | 'en_evaluation' | 'conforme' | 'refusee' | 'attribuee';
  conformiteAdmin: 'conforme' | 'non_conforme' | 'en_attente';
  conformiteTechnique: 'conforme' | 'non_conforme' | 'en_attente';
  conformiteFinanciere: 'conforme' | 'non_conforme' | 'en_attente';
  motifRefus?: string;
  dateEvaluation?: string;
  noteTechnique?: number;
  noteFinanciere?: number;
  noteGlobale?: number;
  rang?: number;
};

export default function MesSoumissionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');

  useState(async () => {
    const resolvedParams = await params;
    setLang(resolvedParams.lang);
  });

  const isArabic = lang === 'ar';

  // Mock data - Replace with API call
  const soumissions: Soumission[] = [
    {
      id: 1,
      appelOffreReference: 'AO/N°01/2026',
      appelOffreTitre: 'Acquisition de matériel informatique pour les lycées de la wilaya d\'Alger',
      serviceContractant: 'Direction de l\'Éducation d\'Alger',
      dateSoumission: '2026-03-01T08:00:00',
      montantSoumis: 72500000,
      statut: 'refusee',
      conformiteAdmin: 'non_conforme',
      conformiteTechnique: 'conforme',
      conformiteFinanciere: 'conforme',
      motifRefus: 'Le certificat CNAS fourni est expiré depuis le 01/01/2026. Veuillez renouveler votre attestation pour les prochaines soumissions.',
      dateEvaluation: '2026-04-20T10:45:00',
    },
    {
      id: 2,
      appelOffreReference: 'AO/N°02/2026',
      appelOffreTitre: 'Travaux de rénovation des routes communales',
      serviceContractant: 'APC Hydra',
      dateSoumission: '2026-03-10T14:30:00',
      montantSoumis: 115000000,
      statut: 'en_evaluation',
      conformiteAdmin: 'conforme',
      conformiteTechnique: 'en_attente',
      conformiteFinanciere: 'en_attente',
    },
    {
      id: 3,
      appelOffreReference: 'AO/N°05/2025',
      appelOffreTitre: 'Fourniture de mobilier scolaire',
      serviceContractant: 'Direction de l\'Éducation Oran',
      dateSoumission: '2025-12-15T09:00:00',
      montantSoumis: 45000000,
      statut: 'attribuee',
      conformiteAdmin: 'conforme',
      conformiteTechnique: 'conforme',
      conformiteFinanciere: 'conforme',
      dateEvaluation: '2026-01-10T14:00:00',
      noteTechnique: 85,
      noteFinanciere: 90,
      noteGlobale: 87.5,
      rang: 1,
    },
    {
      id: 4,
      appelOffreReference: 'AO/N°03/2026',
      appelOffreTitre: 'Maintenance des équipements médicaux',
      serviceContractant: 'CHU Mustapha Pacha',
      dateSoumission: '2026-03-05T11:00:00',
      montantSoumis: 38000000,
      statut: 'conforme',
      conformiteAdmin: 'conforme',
      conformiteTechnique: 'conforme',
      conformiteFinanciere: 'conforme',
      dateEvaluation: '2026-03-25T16:00:00',
      noteTechnique: 78,
      noteFinanciere: 82,
      noteGlobale: 80,
      rang: 3,
    },
  ];

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-DZ').format(montant) + ' DA';
  };

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      soumise: {
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: faFileSignature,
        label: isArabic ? 'Soumise' : 'Soumise'
      },
      en_evaluation: {
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        icon: faClock,
        label: isArabic ? 'في التقييم' : 'En évaluation'
      },
      conforme: {
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: faCheckCircle,
        label: isArabic ? 'مقبولة' : 'Conforme'
      },
      refusee: {
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: faTimesCircle,
        label: isArabic ? 'مرفوضة' : 'Refusée'
      },
      attribuee: {
        color: 'text-green-700',
        bg: 'bg-green-200',
        icon: faCheckCircle,
        label: isArabic ? 'مسنودة' : 'Attribuée'
      }
    };
    return configs[statut] || configs.soumise;
  };

  const getConformiteStatus = (status: string) => {
    if (status === 'conforme') return { color: 'text-green-600', label: 'Conforme' };
    if (status === 'non_conforme') return { color: 'text-red-600', label: 'Non conforme' };
    return { color: 'text-gray-400', label: 'En attente' };
  };

  const translations = {
    fr: {
      title: 'Mes Soumissions',
      subtitle: 'Suivez l\'état d\'avancement de vos offres',
      search: 'Rechercher...',
      filterStatut: 'Filtrer par statut',
      all: 'Tous',
      reference: 'Référence',
      titre: 'Titre',
      dateSoumission: 'Date de soumission',
      montant: 'Montant soumis',
      statut: 'Statut',
      evaluation: 'Évaluation',
      details: 'Voir les détails',
      totalSoumissions: 'Total soumissions',
      enCours: 'En cours',
      acceptees: 'Acceptées',
      refusees: 'Refusées',
      aucuneSoumission: 'Aucune soumission trouvée',
      conformiteAdmin: 'Administrative',
      conformiteTechnique: 'Technique',
      conformiteFinanciere: 'Financière'
    },
    ar: {
      title: 'طلباتي',
      subtitle: 'تابع حالة عروضك',
      search: 'بحث...',
      filterStatut: 'تصفية حسب الحالة',
      all: 'الكل',
      reference: 'المرجع',
      titre: 'العنوان',
      dateSoumission: 'تاريخ التقديم',
      montant: 'المبلغ المقدم',
      statut: 'الحالة',
      evaluation: 'التقييم',
      details: 'عرض التفاصيل',
      totalSoumissions: 'إجمالي الطلبات',
      enCours: 'قيد المعالجة',
      acceptees: 'المقبولة',
      refusees: 'المرفوضة',
      aucuneSoumission: 'لا توجد طلبات',
      conformiteAdmin: 'إدارية',
      conformiteTechnique: 'تقنية',
      conformiteFinanciere: 'مالية'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const filteredSoumissions = soumissions.filter(s => {
    const matchSearch = s.appelOffreTitre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       s.appelOffreReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'all' || s.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const stats = {
    total: soumissions.length,
    enCours: soumissions.filter(s => ['soumise', 'en_evaluation'].includes(s.statut)).length,
    acceptees: soumissions.filter(s => ['conforme', 'attribuee'].includes(s.statut)).length,
    refusees: soumissions.filter(s => s.statut === 'refusee').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0D2527] mb-2 font-cairo">{t.title}</h1>
        <p className="text-[#418387] font-cairo">{t.subtitle}</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.totalSoumissions}</p>
          <p className="text-3xl font-bold text-[#0D2527]">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.enCours}</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.enCours}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.acceptees}</p>
          <p className="text-3xl font-bold text-green-600">{stats.acceptees}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.refusees}</p>
          <p className="text-3xl font-bold text-red-600">{stats.refusees}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#306B6F] outline-none"
              />
            </div>
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#306B6F] outline-none"
          >
            <option value="all">{t.filterStatut} - {t.all}</option>
            <option value="soumise">Soumise</option>
            <option value="en_evaluation">En évaluation</option>
            <option value="conforme">Conforme</option>
            <option value="refusee">Refusée</option>
            <option value="attribuee">Attribuée</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSoumissions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">{t.aucuneSoumission}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSoumissions.map((soumission) => {
            const statutConfig = getStatutConfig(soumission.statut);
            return (
              <div key={soumission.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#306B6F] transition-all shadow-sm">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-[#418387]">{soumission.appelOffreReference}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutConfig.bg} ${statutConfig.color}`}>
                          <FontAwesomeIcon icon={statutConfig.icon} className="me-1" />
                          {statutConfig.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0D2527] mb-1">{soumission.appelOffreTitre}</h3>
                      <p className="text-sm text-gray-600">{soumission.serviceContractant}</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-end">
                        <p className="text-xs text-gray-500 mb-1">{t.montant}</p>
                        <p className="text-lg font-bold text-[#173C3F]">{formatMontant(soumission.montantSoumis)}</p>
                      </div>
                      <Link
                        href={`/${lang}/dashboard/operator/soumissions/${soumission.id}`}
                        className="px-6 py-2.5 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        {t.details}
                      </Link>
                    </div>
                  </div>

                  {/* Quick Status Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendar} className="text-[#418387]" />
                      <div>
                        <p className="text-xs text-gray-500">{t.dateSoumission}</p>
                        <p className="text-sm font-medium">
                          {new Date(soumission.dateSoumission).toLocaleString('fr-DZ')}
                        </p>
                      </div>
                    </div>
                    
                    {soumission.statut !== 'soumise' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t.conformiteAdmin}</p>
                          <span className={`text-sm font-medium ${getConformiteStatus(soumission.conformiteAdmin).color}`}>
                            {getConformiteStatus(soumission.conformiteAdmin).label}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">{t.conformiteTechnique}</p>
                          <span className={`text-sm font-medium ${getConformiteStatus(soumission.conformiteTechnique).color}`}>
                            {getConformiteStatus(soumission.conformiteTechnique).label}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Refusal Reason */}
                  {soumission.statut === 'refusee' && soumission.motifRefus && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mt-1" />
                        <div>
                          <p className="text-sm font-bold text-red-800 mb-1">Motif du refus</p>
                          <p className="text-sm text-red-700">{soumission.motifRefus}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Results */}
                  {soumission.noteGlobale && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Note technique</p>
                          <p className="text-lg font-bold text-green-700">{soumission.noteTechnique}/100</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Note financière</p>
                          <p className="text-lg font-bold text-green-700">{soumission.noteFinanciere}/100</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Note globale</p>
                          <p className="text-lg font-bold text-green-700">{soumission.noteGlobale}/100</p>
                        </div>
                      </div>
                      {soumission.rang && (
                        <p className="text-sm text-green-800 mt-2 text-center font-bold">
                          Rang: {soumission.rang}{soumission.rang === 1 ? 'er' : 'ème'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}