'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faCalendar,
  faMoneyBillWave,
  faClipboardList,
  faMapMarkerAlt,
  faEye,
  faFileSignature,
  faClock,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { fetchAppelsOffres } from '@/lib/operator-api';

type AppelOffre = {
  id: number;
  reference: string;
  titre: string;
  description: string;
  montantEstime: number;
  datePublication: string;
  dateLimiteSoumission: string;
  dateOuverturePlis: string;
  typeProcedure: string;
  serviceContractant: string;
  wilaya: string;
  statut: 'ouverte' | 'close' | 'en_evaluation';
};

export default function AppelsOffresPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterWilaya, setFilterWilaya] = useState('all');
  const [appelsOffres, setAppelsOffres] = useState<AppelOffre[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

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

  useEffect(() => {
    let isMounted = true;

    const loadAppels = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const raw = await fetchAppelsOffres();
        if (!isMounted) return;
        const mapped: AppelOffre[] = raw.map((item) => ({
          id: item.id_appel_offres,
          reference: item.reference,
          titre: item.titre,
          description: item.description,
          montantEstime: Number(item.montant_estime || 0),
          datePublication: item.date_publication,
          dateLimiteSoumission: item.date_limite_soumission,
          dateOuverturePlis: item.date_ouverture_plis,
          typeProcedure: item.type_procedure,
          serviceContractant: `Service #${item.id_service_contractant}`,
          wilaya: 'N/A',
          statut: item.statut === 'PUBLIE' ? 'ouverte' : item.statut === 'CLOTURE_DEPOT' ? 'close' : 'en_evaluation',
        }));
        setAppelsOffres(mapped);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : 'Impossible de charger les appels d\'offres.';
        setLoadError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAppels();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-DZ').format(montant) + ' DA';
  };

  const getTimeRemaining = (dateLimite: string) => {
    const now = new Date();
    const limite = new Date(dateLimite);
    const diff = limite.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expiré';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}j ${hours}h ${minutes}min`;
  };

  // Normalize raw backend value to a display label + color
  const getProcedureConfig = (type: string) => {
    const normalized = (type || '').toUpperCase().replace(/[-_\s]/g, '_');

    if (normalized.includes('RESTREINT')) {
      return { label: isArabic ? 'مقيد' : 'Restreint', color: 'bg-purple-100 text-purple-700' };
    }
    if (normalized.includes('GRE') || normalized.includes('GRÉ')) {
      return { label: isArabic ? 'تراضي' : 'Gré à gré', color: 'bg-orange-100 text-orange-700' };
    }
    if (normalized.includes('OUVERT')) {
      return { label: isArabic ? 'مفتوح' : 'Ouvert', color: 'bg-blue-100 text-blue-700' };
    }
    // Fallback: display raw value as-is
    return { label: type || '—', color: 'bg-gray-100 text-gray-600' };
  };

  const translations = {
    fr: {
      title: 'Appels d\'offres publiés',
      search: 'Rechercher...',
      filterType: 'Type de procédure',
      filterWilaya: 'Wilaya',
      all: 'Tous',
      reference: 'Référence',
      titre: 'Titre',
      montant: 'Montant estimé',
      dateLimite: 'Date limite',
      tempsRestant: 'Temps restant',
      details: 'Détails',
      postuler: 'Postuler',
      typeProcedure: 'Type de procédure',
      serviceContractant: 'Service contractant',
      datePublication: 'Date de publication',
      dateOuverture: 'Date d\'ouverture des plis',
      documents: 'Documents',
      cahierCharges: 'Cahier des Charges',
      specifications: 'Spécifications techniques',
      aucunResultat: 'Aucun appel d\'offres trouvé',
      statistiques: {
        total: 'Total appels d\'offres',
        ouverts: 'Ouverts',
        expires: 'Expirés'
      }
    },
    ar: {
      title: 'الصفقات المعلنة',
      search: 'بحث...',
      filterType: 'نوع الإجراء',
      filterWilaya: 'الولاية',
      all: 'الكل',
      reference: 'المرجع',
      titre: 'العنوان',
      montant: 'المبلغ المقدر',
      dateLimite: 'تاريخ الحد الأقصى',
      tempsRestant: 'الوقت المتبقي',
      details: 'التفاصيل',
      postuler: 'تقديم عرض',
      typeProcedure: 'نوع الإجراء',
      serviceContractant: 'الخدمة المتعاقدة',
      datePublication: 'تاريخ النشر',
      dateOuverture: 'تاريخ فتح الأظرفة',
      documents: 'الوثائق',
      cahierCharges: 'كراسة الشروط',
      specifications: 'المواصفات التقنية',
      aucunResultat: 'لا توجد صفقات',
      statistiques: {
        total: 'إجمالي الصفقات',
        ouverts: 'مفتوحة',
        expires: 'منتهية'
      }
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const filteredOffres = appelsOffres.filter(offre => {
    const matchSearch = offre.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       offre.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || offre.typeProcedure.includes(filterType);
    const matchWilaya = filterWilaya === 'all' || offre.wilaya === filterWilaya;
    
    return matchSearch && matchType && matchWilaya;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0D2527] mb-2 font-cairo">{t.title}</h1>
        <p className="text-[#418387] font-cairo">
          {isArabic ? 'تصفح جميع الصفقات العمومية المتاحة' : 'Parcourez tous les appels d\'offres disponibles'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#418387] mb-1">{t.statistiques.total}</p>
              <p className="text-3xl font-bold text-[#0D2527]">{appelsOffres.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#306B6F] rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faClipboardList} className="text-white text-xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#418387] mb-1">{t.statistiques.ouverts}</p>
              <p className="text-3xl font-bold text-green-600">
                {appelsOffres.filter(o => o.statut === 'ouverte').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-white text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#418387] mb-1">{t.statistiques.expires}</p>
              <p className="text-3xl font-bold text-red-600">
                {appelsOffres.filter(o => o.statut !== 'ouverte').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faClock} className="text-white text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
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

          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#306B6F] outline-none"
          >
            <option value="all">{t.filterType} - {t.all}</option>
            <option value="ouvert">Appel d'offres ouvert</option>
            <option value="restreint">Appel d'offres restreint</option>
            <option value="gre">Gré à gré</option>
          </select>

          {/* Filter by Wilaya */}
          <select
            value={filterWilaya}
            onChange={(e) => setFilterWilaya(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#306B6F] outline-none"
          >
            <option value="all">{t.filterWilaya} - {t.all}</option>
            <option value="Alger">Alger</option>
            <option value="Oran">Oran</option>
            <option value="Constantine">Constantine</option>
          </select>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Chargement des appels d'offres...</p>
        </div>
      ) : filteredOffres.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t.aucunResultat}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredOffres.map((offre) => {
            const procedureConfig = getProcedureConfig(offre.typeProcedure);
            return (
              <div key={offre.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#306B6F] transition-all shadow-sm hover:shadow-lg">
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-[#418387] font-medium mb-1">{offre.reference}</p>
                      <h3 className="text-xl font-bold text-[#0D2527] mb-2 line-clamp-2">{offre.titre}</h3>
                    </div>
                    {/* Procedure type badge */}
                    <div className="flex-shrink-0 ms-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${procedureConfig.color}`}>
                        {procedureConfig.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">{offre.description}</p>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Montant */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FCFFFF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-[#306B6F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t.montant}</p>
                      <p className="font-bold text-[#173C3F]">{formatMontant(offre.montantEstime)}</p>
                    </div>
                  </div>

                  {/* Service Contractant */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FCFFFF] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#306B6F]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t.serviceContractant}</p>
                      <p className="font-medium text-[#173C3F]">{offre.serviceContractant} - {offre.wilaya}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faCalendar} className="text-[#418387] text-sm" />
                        <p className="text-xs text-gray-500">{t.dateLimite}</p>
                      </div>
                      <p className="text-sm font-medium text-[#0D2527]">
                        {new Date(offre.dateLimiteSoumission).toLocaleDateString('fr-DZ')}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faClock} className="text-[#418387] text-sm" />
                        <p className="text-xs text-gray-500">{t.tempsRestant}</p>
                      </div>
                      <p className={`text-sm font-bold ${
                        getTimeRemaining(offre.dateLimiteSoumission) === 'Expiré' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {getTimeRemaining(offre.dateLimiteSoumission)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3">
                  <Link
                    href={`/${lang}/dashboard/operator/appels-offres/${offre.id}`}
                    className="flex-1 px-4 py-2.5 border-2 border-[#306B6F] text-[#306B6F] rounded-xl font-bold hover:bg-[#FCFFFF] transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    {t.details}
                  </Link>
                  
                  {offre.statut === 'ouverte' && (
                    <Link
                      href={`/${lang}/dashboard/operator/appels-offres/${offre.id}/soumettre`}
                      className="flex-1 px-4 py-2.5 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faFileSignature} />
                      {t.postuler}
                    </Link>
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