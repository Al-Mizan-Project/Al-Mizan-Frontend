'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faGavel,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { fetchRecours, type RecoursApi } from '@/lib/operator-api';

export default function RecoursPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [recours, setRecours] = useState<RecoursApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    params.then((p) => { if (isMounted) setLang(p.lang); });
    return () => { isMounted = false; };
  }, [params]);

  const isArabic = lang === 'ar';

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchRecours();
        if (isMounted) setRecours(data);
      } catch (e) {
        if (isMounted) setLoadError(e instanceof Error ? e.message : 'Erreur de chargement');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const getTypeRecoursLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      GRACIEUX: isArabic ? 'تظلم ودي' : 'Gracieux',
      HIERARCHIQUE: isArabic ? 'تظلم هرمي' : 'Hiérarchique',
      CONTENTIEUX: isArabic ? 'طعن قضائي' : 'Contentieux',
    };
    return type ? (labels[type] || type) : '—';
  };

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      DEPOSE: {
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        icon: faClock,
        label: isArabic ? 'مودع' : 'Déposé',
      },
      EN_INSTRUCTION: {
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: faGavel,
        label: isArabic ? 'قيد الدراسة' : 'En instruction',
      },
      DECISION_PRISE: {
        color: 'text-purple-700',
        bg: 'bg-purple-100',
        icon: faGavel,
        label: isArabic ? 'قرار صدر' : 'Décision prise',
      },
      ACCEPTE: {
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: faCheckCircle,
        label: isArabic ? 'مقبول' : 'Accepté',
      },
      REJETE: {
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: faTimesCircle,
        label: isArabic ? 'مرفوض' : 'Rejeté',
      },
      CLOTURE: {
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: faTimesCircle,
        label: isArabic ? 'مغلق' : 'Clôturé',
      },
    };
    return configs[statut] || configs.DEPOSE;
  };

  const translations = {
    fr: {
      title: 'Mes Recours',
      subtitle: "Suivez l'état d'avancement de vos recours",
      search: 'Rechercher...',
      filterStatut: 'Filtrer par statut',
      all: 'Tous',
      nouveauRecours: 'Nouveau recours',
      typeRecours: 'Type de recours',
      dateDepot: 'Date de dépôt',
      statut: 'Statut',
      decision: 'Décision',
      documents: 'documents',
      details: 'Voir les détails',
      totalRecours: 'Total recours',
      enCours: 'En cours',
      acceptes: 'Acceptés',
      rejetes: 'Rejetés / Clôturés',
      aucunRecours: 'Aucun recours trouvé',
      motif: 'Motif',
    },
    ar: {
      title: 'طعوني',
      subtitle: 'تابع حالة طعونك',
      search: 'بحث...',
      filterStatut: 'تصفية حسب الحالة',
      all: 'الكل',
      nouveauRecours: 'طعن جديد',
      typeRecours: 'نوع الطعن',
      dateDepot: 'تاريخ الإيداع',
      statut: 'الحالة',
      decision: 'القرار',
      documents: 'وثائق',
      details: 'عرض التفاصيل',
      totalRecours: 'إجمالي الطعون',
      enCours: 'قيد المعالجة',
      acceptes: 'المقبولة',
      rejetes: 'المرفوضة / المغلقة',
      aucunRecours: 'لا توجد طعون',
      motif: 'السبب',
    },
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const filteredRecours = recours.filter((r) => {
    const matchSearch =
      r.motif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.id_soumission).includes(searchTerm);
    const matchStatut = filterStatut === 'all' || r.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const stats = {
    total: recours.length,
    enCours: recours.filter((r) =>
      ['DEPOSE', 'EN_INSTRUCTION', 'DECISION_PRISE'].includes(r.statut)
    ).length,
    acceptes: recours.filter((r) => r.statut === 'ACCEPTE').length,
    rejetes: recours.filter((r) => ['REJETE', 'CLOTURE'].includes(r.statut)).length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0D2527] mb-2 font-cairo">{t.title}</h1>
          <p className="text-[#418387] font-cairo">{t.subtitle}</p>
        </div>
        <Link
          href={`/${lang}/dashboard/operator/recours/nouveau`}
          className="px-6 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faGavel} />
          {t.nouveauRecours}
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.totalRecours}</p>
          <p className="text-3xl font-bold text-[#0D2527]">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.enCours}</p>
          <p className="text-3xl font-bold text-blue-600">{stats.enCours}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.acceptes}</p>
          <p className="text-3xl font-bold text-green-600">{stats.acceptes}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.rejetes}</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejetes}</p>
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
            <option value="DEPOSE">Déposé</option>
            <option value="EN_INSTRUCTION">En instruction</option>
            <option value="DECISION_PRISE">Décision prise</option>
            <option value="ACCEPTE">Accepté</option>
            <option value="REJETE">Rejeté</option>
            <option value="CLOTURE">Clôturé</option>
          </select>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">Chargement des recours...</p>
        </div>
      ) : filteredRecours.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">{t.aucunRecours}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecours.map((recour) => {
            const statutConfig = getStatutConfig(recour.statut);
            return (
              <div
                key={recour.id_recours}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#306B6F] transition-all shadow-sm"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-[#418387]">
                          Soumission #{recour.id_soumission}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statutConfig.bg} ${statutConfig.color}`}
                        >
                          <FontAwesomeIcon icon={statutConfig.icon} className="me-1" />
                          {statutConfig.label}
                        </span>
                        {recour.type_recours && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EEF8F8] text-[#306B6F]">
                            {getTypeRecoursLabel(recour.type_recours)}
                          </span>
                        )}
                      </div>
                      {recour.objet && (
                        <h3 className="text-lg font-bold text-[#0D2527] mb-1">{recour.objet}</h3>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2 italic">
                        "{recour.motif}"
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-end">
                        <p className="text-xs text-gray-500 mb-1">{t.dateDepot}</p>
                        <p className="text-sm font-medium">
                          {new Date(recour.date_depot).toLocaleDateString('fr-DZ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {recour.document_ids.length} {t.documents}
                        </p>
                      </div>
                      <Link
                        href={`/${lang}/dashboard/operator/recours/${recour.id_recours}`}
                        className="px-6 py-2.5 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        {t.details}
                      </Link>
                    </div>
                  </div>

                  {/* Decision */}
                  {recour.decision && (
                    <div
                      className={`mt-4 p-4 rounded-xl ${
                        recour.statut === 'ACCEPTE'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon
                          icon={recour.statut === 'ACCEPTE' ? faCheckCircle : faTimesCircle}
                          className={
                            recour.statut === 'ACCEPTE' ? 'text-green-600 mt-1' : 'text-red-600 mt-1'
                          }
                        />
                        <div className="flex-1">
                          <p
                            className={`text-sm font-bold mb-1 ${
                              recour.statut === 'ACCEPTE' ? 'text-green-800' : 'text-red-800'
                            }`}
                          >
                            {t.decision}
                          </p>
                          <p
                            className={`text-sm ${
                              recour.statut === 'ACCEPTE' ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {recour.decision}
                          </p>
                          {recour.date_decision && (
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(recour.date_decision).toLocaleString('fr-DZ')}
                            </p>
                          )}
                        </div>
                      </div>
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