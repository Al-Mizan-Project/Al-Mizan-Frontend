'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faGavel,
  faCheckCircle,
  faTimesCircle,
  faClock,
  faEye,
  faExclamationTriangle,
  faCalendar,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

type Recours = {
  id: number;
  soumissionId: number;
  appelOffreReference: string;
  appelOffreTitre: string;
  typeRecours: 'conformite_admin' | 'conformite_technique' | 'conformite_financiere' | 'procedure' | 'autre';
  dateDepot: string;
  statut: 'en_attente' | 'en_examen' | 'accepte' | 'rejete';
  motif: string;
  decision?: string;
  dateDecision?: string;
  documentsCount: number;
};

export default function RecoursPage({
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
  const recours: Recours[] = [
    {
      id: 1,
      soumissionId: 1,
      appelOffreReference: 'AO/N°01/2026',
      appelOffreTitre: 'Acquisition de matériel informatique pour les lycées de la wilaya d\'Alger',
      typeRecours: 'conformite_admin',
      dateDepot: '2026-04-22T09:00:00',
      statut: 'en_examen',
      motif: 'Contestation du refus concernant le certificat CNAS. Notre certificat était valide au moment de la soumission.',
      documentsCount: 3,
    },
    {
      id: 2,
      soumissionId: 5,
      appelOffreReference: 'AO/N°08/2025',
      appelOffreTitre: 'Travaux de maintenance des équipements',
      typeRecours: 'conformite_technique',
      dateDepot: '2026-03-15T14:30:00',
      statut: 'accepte',
      motif: 'Erreur d\'évaluation de notre offre technique. Les spécifications étaient conformes.',
      decision: 'Recours accepté. Nouvelle évaluation ordonnée.',
      dateDecision: '2026-04-01T10:00:00',
      documentsCount: 5,
    },
    {
      id: 3,
      soumissionId: 8,
      appelOffreReference: 'AO/N°12/2025',
      appelOffreTitre: 'Fourniture de mobilier de bureau',
      typeRecours: 'procedure',
      dateDepot: '2026-02-10T11:00:00',
      statut: 'rejete',
      motif: 'Non-respect des délais de notification par le service contractant.',
      decision: 'Recours rejeté. Les délais ont été respectés.',
      dateDecision: '2026-03-05T15:00:00',
      documentsCount: 2,
    },
  ];

  const getTypeRecoursLabel = (type: string) => {
    const labels: Record<string, string> = {
      conformite_admin: isArabic ? 'مطابقة إدارية' : 'Conformité administrative',
      conformite_technique: isArabic ? 'مطابقة تقنية' : 'Conformité technique',
      conformite_financiere: isArabic ? 'مطابقة مالية' : 'Conformité financière',
      procedure: isArabic ? 'إجراء' : 'Procédure',
      autre: isArabic ? 'أخرى' : 'Autre'
    };
    return labels[type] || type;
  };

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      en_attente: {
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        icon: faClock,
        label: isArabic ? 'في الانتظار' : 'En attente'
      },
      en_examen: {
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        icon: faGavel,
        label: isArabic ? 'قيد الدراسة' : 'En examen'
      },
      accepte: {
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: faCheckCircle,
        label: isArabic ? 'مقبول' : 'Accepté'
      },
      rejete: {
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: faTimesCircle,
        label: isArabic ? 'مرفوض' : 'Rejeté'
      }
    };
    return configs[statut] || configs.en_attente;
  };

  const translations = {
    fr: {
      title: 'Mes Recours',
      subtitle: 'Suivez l\'état d\'avancement de vos recours',
      search: 'Rechercher...',
      filterStatut: 'Filtrer par statut',
      all: 'Tous',
      nouveauRecours: 'Nouveau recours',
      reference: 'Référence',
      titre: 'Titre',
      typeRecours: 'Type de recours',
      dateDepot: 'Date de dépôt',
      statut: 'Statut',
      decision: 'Décision',
      documents: 'Documents',
      details: 'Voir les détails',
      totalRecours: 'Total recours',
      enCours: 'En cours',
      acceptes: 'Acceptés',
      rejetes: 'Rejetés',
      aucunRecours: 'Aucun recours trouvé',
      motif: 'Motif'
    },
    ar: {
      title: 'طعوني',
      subtitle: 'تابع حالة طعونك',
      search: 'بحث...',
      filterStatut: 'تصفية حسب الحالة',
      all: 'الكل',
      nouveauRecours: 'طعن جديد',
      reference: 'المرجع',
      titre: 'العنوان',
      typeRecours: 'نوع الطعن',
      dateDepot: 'تاريخ الإيداع',
      statut: 'الحالة',
      decision: 'القرار',
      documents: 'الوثائق',
      details: 'عرض التفاصيل',
      totalRecours: 'إجمالي الطعون',
      enCours: 'قيد المعالجة',
      acceptes: 'المقبولة',
      rejetes: 'المرفوضة',
      aucunRecours: 'لا توجد طعون',
      motif: 'السبب'
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const filteredRecours = recours.filter(r => {
    const matchSearch = r.appelOffreTitre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       r.appelOffreReference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'all' || r.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const stats = {
    total: recours.length,
    enCours: recours.filter(r => ['en_attente', 'en_examen'].includes(r.statut)).length,
    acceptes: recours.filter(r => r.statut === 'accepte').length,
    rejetes: recours.filter(r => r.statut === 'rejete').length
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
            <option value="en_attente">En attente</option>
            <option value="en_examen">En examen</option>
            <option value="accepte">Accepté</option>
            <option value="rejete">Rejeté</option>
          </select>
        </div>
      </div>

      {/* Recours List */}
      {filteredRecours.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">{t.aucunRecours}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecours.map((recour) => {
            const statutConfig = getStatutConfig(recour.statut);
            return (
              <div key={recour.id} className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#306B6F] transition-all shadow-sm">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-[#418387]">{recour.appelOffreReference}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutConfig.bg} ${statutConfig.color}`}>
                          <FontAwesomeIcon icon={statutConfig.icon} className="me-1" />
                          {statutConfig.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0D2527] mb-1">{recour.appelOffreTitre}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {t.typeRecours}: <span className="font-medium">{getTypeRecoursLabel(recour.typeRecours)}</span>
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2 italic">"{recour.motif}"</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-end">
                        <p className="text-xs text-gray-500 mb-1">{t.dateDepot}</p>
                        <p className="text-sm font-medium">
                          {new Date(recour.dateDepot).toLocaleDateString('fr-DZ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {recour.documentsCount} {t.documents}
                        </p>
                      </div>
                      <Link
                        href={`/${lang}/dashboard/operator/recours/${recour.id}`}
                        className="px-6 py-2.5 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        {t.details}
                      </Link>
                    </div>
                  </div>

                  {/* Decision Info */}
                  {recour.decision && (
                    <div className={`mt-4 p-4 rounded-xl ${
                      recour.statut === 'accepte' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-start gap-3">
                        <FontAwesomeIcon 
                          icon={recour.statut === 'accepte' ? faCheckCircle : faTimesCircle} 
                          className={recour.statut === 'accepte' ? 'text-green-600 mt-1' : 'text-red-600 mt-1'} 
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-bold mb-1 ${
                            recour.statut === 'accepte' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {t.decision}
                          </p>
                          <p className={`text-sm ${
                            recour.statut === 'accepte' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {recour.decision}
                          </p>
                          {recour.dateDecision && (
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(recour.dateDecision).toLocaleString('fr-DZ')}
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