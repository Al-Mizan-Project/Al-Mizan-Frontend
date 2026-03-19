'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faFilePdf,
  faClock,
  faFileWord,
  faFileExcel,
  faDownload,
  faTrash,
  faUpload,
  faFolder,
  faCalendar,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

type Document = {
  id: number;
  nom: string;
  type: 'administratif' | 'technique' | 'financier' | 'contrat';
  categorie: string;
  dateUpload: string;
  taille: number;
  statut: 'valide' | 'expire' | 'en_attente_validation';
  dateExpiration?: string;
  url: string;
};

export default function DocumentsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const [lang, setLang] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');

  useState(async () => {
    const resolvedParams = await params;
    setLang(resolvedParams.lang);
  });

  const isArabic = lang === 'ar';

  // Mock data - Replace with API call
  const documents: Document[] = [
    {
      id: 1,
      nom: 'registre_commerce.pdf',
      type: 'administratif',
      categorie: 'Registre de Commerce',
      dateUpload: '2026-01-15T10:00:00',
      taille: 524288,
      statut: 'valide',
      dateExpiration: '2027-01-15',
      url: '/docs/registre_commerce.pdf'
    },
    {
      id: 2,
      nom: 'certificat_cnas.pdf',
      type: 'administratif',
      categorie: 'CNAS',
      dateUpload: '2026-02-20T14:30:00',
      taille: 389120,
      statut: 'expire',
      dateExpiration: '2026-01-01',
      url: '/docs/certificat_cnas.pdf'
    },
    {
      id: 3,
      nom: 'certificat_casnos.pdf',
      type: 'administratif',
      categorie: 'CASNOS',
      dateUpload: '2026-03-01T09:00:00',
      taille: 412672,
      statut: 'valide',
      dateExpiration: '2027-03-01',
      url: '/docs/certificat_casnos.pdf'
    },
    {
      id: 4,
      nom: 'extrait_role.pdf',
      type: 'administratif',
      categorie: 'Extrait de rôle',
      dateUpload: '2026-02-15T11:00:00',
      taille: 245760,
      statut: 'valide',
      dateExpiration: '2026-12-31',
      url: '/docs/extrait_role.pdf'
    },
  ];

  const formatTaille = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.pdf')) return faFilePdf;
    if (filename.endsWith('.doc') || filename.endsWith('.docx')) return faFileWord;
    if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) return faFileExcel;
    return faFilePdf;
  };

  const getStatutConfig = (statut: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      valide: {
        color: 'text-green-700',
        bg: 'bg-green-100',
        icon: faCheckCircle,
        label: isArabic ? 'صالح' : 'Valide'
      },
      expire: {
        color: 'text-red-700',
        bg: 'bg-red-100',
        icon: faTimesCircle,
        label: isArabic ? 'منتهي' : 'Expiré'
      },
      en_attente_validation: {
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        icon: faClock,
        label: isArabic ? 'في الانتظار' : 'En attente'
      }
    };
    return configs[statut] || configs.valide;
  };

  const categories = [...new Set(documents.map(d => d.categorie))];

  const translations = {
    fr: {
      title: 'Mes Documents',
      subtitle: 'Gérez vos documents administratifs et techniques',
      search: 'Rechercher...',
      filterCategorie: 'Filtrer par catégorie',
      all: 'Toutes',
      upload: 'Télécharger un document',
      nom: 'Nom',
      categorie: 'Catégorie',
      dateUpload: 'Date d\'upload',
      dateExpiration: 'Date d\'expiration',
      taille: 'Taille',
      statut: 'Statut',
      actions: 'Actions',
      telecharger: 'Télécharger',
      supprimer: 'Supprimer',
      totalDocuments: 'Total documents',
      documentsValides: 'Documents valides',
      documentsExpire: 'Documents expirés',
      aucunDocument: 'Aucun document trouvé',
      categories: {
        registre_commerce: 'Registre de Commerce',
        cnas: 'CNAS',
        casnos: 'CASNOS',
        extrait_role: 'Extrait de rôle',
        autres: 'Autres documents'
      }
    },
    ar: {
      title: 'وثائقي',
      subtitle: 'أدر وثائقك الإدارية والتقنية',
      search: 'بحث...',
      filterCategorie: 'تصفية حسب الفئة',
      all: 'الكل',
      upload: 'تحميل وثيقة',
      nom: 'الاسم',
      categorie: 'الفئة',
      dateUpload: 'تاريخ الرفع',
      dateExpiration: 'تاريخ الانتهاء',
      taille: 'الحجم',
      statut: 'الحالة',
      actions: 'الإجراءات',
      telecharger: 'تحميل',
      supprimer: 'حذف',
      totalDocuments: 'إجمالي الوثائق',
      documentsValides: 'الوثائق الصالحة',
      documentsExpire: 'الوثائق المنتهية',
      aucunDocument: 'لا توجد وثائق',
      categories: {
        registre_commerce: 'السجل التجاري',
        cnas: 'الضمان الاجتماعي',
        casnos: 'الكاسنوس',
        extrait_role: 'مستخلص الدور',
        autres: 'وثائق أخرى'
      }
    }
  };

  const t = translations[lang as 'fr' | 'ar'] || translations.fr;

  const filteredDocuments = documents.filter(d => {
    const matchSearch = d.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       d.categorie.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategorie = filterCategorie === 'all' || d.categorie === filterCategorie;
    return matchSearch && matchCategorie;
  });

  const stats = {
    total: documents.length,
    valides: documents.filter(d => d.statut === 'valide').length,
    expire: documents.filter(d => d.statut === 'expire').length
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0D2527] mb-2 font-cairo">{t.title}</h1>
          <p className="text-[#418387] font-cairo">{t.subtitle}</p>
        </div>
        <button className="px-6 py-3 bg-[#306B6F] text-white rounded-xl font-bold hover:bg-[#173C3F] transition-colors flex items-center gap-2">
          <FontAwesomeIcon icon={faUpload} />
          {t.upload}
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.totalDocuments}</p>
          <p className="text-3xl font-bold text-[#0D2527]">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.documentsValides}</p>
          <p className="text-3xl font-bold text-green-600">{stats.valides}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-[#9BCFCF] shadow-sm">
          <p className="text-sm text-[#418387] mb-1">{t.documentsExpire}</p>
          <p className="text-3xl font-bold text-red-600">{stats.expire}</p>
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
            value={filterCategorie}
            onChange={(e) => setFilterCategorie(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#306B6F] outline-none"
          >
            <option value="all">{t.filterCategorie} - {t.all}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg">{t.aucunDocument}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FCFFFF] border-b-2 border-[#9BCFCF]">
                <tr>
                  <th className="px-6 py-4 text-start text-sm font-bold text-[#0D2527]">{t.nom}</th>
                  <th className="px-6 py-4 text-start text-sm font-bold text-[#0D2527]">{t.categorie}</th>
                  <th className="px-6 py-4 text-start text-sm font-bold text-[#0D2527]">{t.dateUpload}</th>
                  {isArabic || <th className="px-6 py-4 text-start text-sm font-bold text-[#0D2527]">{t.dateExpiration}</th>}
                  <th className="px-6 py-4 text-start text-sm font-bold text-[#0D2527]">{t.taille}</th>
                  <th className="px-6 py-4 text-start text-sm font-bold text-[#0D2527]">{t.statut}</th>
                  <th className="px-6 py-4 text-start text-sm font-bold text-[#0D2527]">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => {
                  const statutConfig = getStatutConfig(doc.statut);
                  const FileIcon = getFileIcon(doc.nom);
                  
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FCFFFF] rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={FileIcon} className="text-red-500 text-xl" />
                          </div>
                          <span className="font-medium text-gray-800">{doc.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{doc.categorie}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(doc.dateUpload).toLocaleDateString('fr-DZ')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {doc.dateExpiration ? (
                          <span className={doc.statut === 'expire' ? 'text-red-600 font-bold' : ''}>
                            {new Date(doc.dateExpiration).toLocaleDateString('fr-DZ')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatTaille(doc.taille)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statutConfig.bg} ${statutConfig.color}`}>
                          <FontAwesomeIcon icon={statutConfig.icon} className="me-1" />
                          {statutConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-[#306B6F] hover:bg-[#FCFFFF] rounded-lg transition-colors">
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}