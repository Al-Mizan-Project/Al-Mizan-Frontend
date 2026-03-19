'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faFileContract,
  faTimesCircle,
  faCheckCircle,
  faClock,
  faEye,
  faDownload,
  faCalendar,
  faMoneyBillWave,
  faMapMarkerAlt,
  faSignature
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

type Contrat = {
  id: number;
  numero: string;
  appelOffreReference: string;
  titre: string;
  serviceContractant: string;
  wilaya: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  statut: 'en_cours' | 'termine' | 'resilie' | 'en_attente_signature';
  tauxExecution: number;
  documents: string[];
};

export default function ContratsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');

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
  const contrats: Contrat[] = [
    {
      id: 1,
      numero: 'CTR-2026-001',
      appelOffreReference: 'AO/N°05/2025',
      titre: 'Fourniture de mobilier scolaire',
      serviceContractant: 'Direction de l\'Éducation Oran',
      wilaya: 'Oran',
      dateSignature: '2026-01-15T10:00:00',
      dateDebut: '2026-02-01',
      dateFin: '2026-08-01',
      montant: 45000000,
      statut: 'en_cours',
      tauxExecution: 65,
      documents: ['contrat_signe.pdf', 'avenant_01.pdf']
    },
    {
      id: 2,
      numero: 'CTR-2025-089',
      appelOffreReference: 'AO/N°12/2024',
      titre: 'Maintenance des équipements informatiques',
      serviceContractant: 'CHU Mustapha Pacha',
      wilaya: 'Alger',
      dateSignature: '2025-06-20T14:00:00',
      dateDebut: '2025-07-01',
      dateFin: '2026-06-30',
      montant: 28000000,
      statut: 'en_cours',
      tauxExecution: 90,
      documents: ['contrat_signe.pdf']
    },
    {
      id: 3,
      numero: 'CTR-2024-156',
      appelOffreReference: 'AO/N°08/2024',
      titre: 'Travaux de rénovation',
      serviceContractant: 'APC Hydra',
      wilaya: 'Alger',
      dateSignature: '2024-09-10T09:00:00',
      dateDebut: '2024-10-01',
      dateFin: '2025-03-31',
      montant: 67000000,
      statut: 'termine',
      tauxExecution: 100,
      documents: ['contrat_signe.pdf', 'pv_reception.pdf']
    },
  ];

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-DZ').format(montant) + ' DA';
  };

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      en_cours: {
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: faClock,
        label: isArabic ? 'قيد التنفيذ' : 'En cours'
      },
      termine: {
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: faCheckCircle,
        label: isArabic ? 'منتهي' : 'Terminé'
      },
      resilie: {
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: faTimesCircle,
        label: isArabic ? 'ملغى' : 'Résilier'
      },
      en_attente_signature: {
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        icon: faSignature,
        label: isArabic ? 'في انتظار التوقيع' : 'En attente de signature'
      }
    };
    return configs[statut] || configs.en_cours;
  };

  const translations = {
    fr: {
      title: 'Mes Contrats',
      subtitle: 'Gérez et suivez l\'exécution de vos contrats',
      search: 'Rechercher...',
      filterStatut: 'Filtrer par statut',
      all: 'Tous',
      numero: 'Numéro',
      reference: 'Référence AO',
      titre: 'Titre',
      serviceContractant: 'Service contractant',
      dateSignature: 'Date de signature',
      periode: 'Période',
      montant: 'Montant',
      execution: 'Taux d\'exécution',
      statut: 'Statut',
      documents: 'Documents',
      details: 'Voir les détails',
      totalContrats: 'Total contrats',
      enCours: 'En cours',
      termines: 'Terminés',
      montantTotal: 'Montant total',
      aucunContrat: 'Aucun contrat trouvé',
      telecharger: 'Télécharger'
    },
    ar: {
      title: 'عقودي',
      subtitle: 'أدر وتابع تنفيذ عقودك',
      search: 'بحث...',
      filterStatut: 'تصفية حسب الحالة',
      all: 'الكل',
      numero: 'الرقم',
      reference: 'مرجع الصفقة',
      titre: 'العنوان',
      serviceContractant: 'الخدمة المتعاقدة',
      dateSignature: 'تاريخ التوقيع',
      periode: 'الفترة',
      montant: 'المبلغ',
      execution: 'معدل التنفيذ',
      statut: 'الحالة',
      documents: 'الوثائق',
      details: 'عرض التفاصيل',
      totalContrats: 'إجمالي العقود',
      enCours: 'قيد التنفيذ',
      termines: 'المنتهية',
      montantTotal: 'المبلغ الإجمالي',
      aucunContrat: 'لا توجد عقود',
      telecharger: 'تحميل'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const filteredContrats = contrats.filter(c => {
    const matchSearch = c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       c.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'all' || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const stats = {
    total: contrats.length,
    enCours: contrats.filter(c => c.statut === 'en_cours').length,
    termines: contrats.filter(c => c.statut === 'termine').length,
    montantTotal: contrats.filter(c => c.statut === 'en_cours').reduce((acc, c) => acc + c.montant, 0)
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
          <p className="text-sm text-[#418387] mb-1">{t.totalContrats}</p>
          <p className="text-3xl font-bold text-[#0D2527]">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.enCours}</p>
          <p className="text-3xl font-bold text-blue-600">{stats.enCours}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.termines}</p>
          <p className="text-3xl font-bold text-green-600">{stats.termines}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.montantTotal}</p>
          <p className="text-2xl font-bold text-[#173C3F]">{formatMontant(stats.montantTotal)}</p>
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
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="resilie">Résilier</option>
            <option value="en_attente_signature">En attente de signature</option>
          </select>
        </div>
      </div>

      {/* Contrats List */}
      {filteredContrats.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">{t.aucunContrat}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredContrats.map((contrat) => {
            const statutConfig = getStatutConfig(contrat.statut);
            return (
              <div key={contrat.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#306B6F] transition-all shadow-sm">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-[#418387]">{contrat.numero}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutConfig.bg} ${statutConfig.color}`}>
                          <FontAwesomeIcon icon={statutConfig.icon} className="me-1" />
                          {statutConfig.label}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[#0D2527] mb-1">{contrat.titre}</h3>
                      <p className="text-sm text-gray-600">{contrat.appelOffreReference}</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-end">
                        <p className="text-xs text-gray-500 mb-1">{t.montant}</p>
                        <p className="text-xl font-bold text-[#173C3F]">{formatMontant(contrat.montant)}</p>
                      </div>
                      <Link
                        href={`/${lang}/dashboard/operator/contrats/${contrat.id}`}
                        className="px-6 py-2.5 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        {t.details}
                      </Link>
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center gap-3 p-3 bg-[#FCFFFF] rounded-lg">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#306B6F]" />
                      <div>
                        <p className="text-xs text-gray-500">{t.serviceContractant}</p>
                        <p className="text-sm font-medium text-[#0D2527]">
                          {contrat.serviceContractant} - {contrat.wilaya}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[#FCFFFF] rounded-lg">
                      <FontAwesomeIcon icon={faCalendar} className="text-[#306B6F]" />
                      <div>
                        <p className="text-xs text-gray-500">{t.dateSignature}</p>
                        <p className="text-sm font-medium text-[#0D2527]">
                          {new Date(contrat.dateSignature).toLocaleDateString('fr-DZ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-[#FCFFFF] rounded-lg">
                      <FontAwesomeIcon icon={faClock} className="text-[#306B6F]" />
                      <div>
                        <p className="text-xs text-gray-500">{t.periode}</p>
                        <p className="text-sm font-medium text-[#0D2527]">
                          {new Date(contrat.dateDebut).toLocaleDateString('fr-DZ')} - {new Date(contrat.dateFin).toLocaleDateString('fr-DZ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Execution Progress */}
                  {contrat.statut === 'en_cours' && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{t.execution}</span>
                        <span className="text-sm font-bold text-[#306B6F]">{contrat.tauxExecution}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-[#306B6F] to-[#418387] h-3 rounded-full transition-all duration-500"
                          style={{ width: `${contrat.tauxExecution}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  <div className="pt-6 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">{t.documents}</p>
                    <div className="flex flex-wrap gap-3">
                      {contrat.documents.map((doc, index) => (
                        <button
                          key={index}
                          className="flex items-center gap-2 px-4 py-2 bg-[#FCFFFF] border border-[#9BCFCF] rounded-lg hover:border-[#306B6F] transition-colors"
                        >
                          <FontAwesomeIcon icon={faFileContract} className="text-[#306B6F]" />
                          <span className="text-sm text-gray-700">{doc}</span>
                          <FontAwesomeIcon icon={faDownload} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}