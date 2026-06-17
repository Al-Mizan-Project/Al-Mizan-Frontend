'use client';

import { useMemo, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useCommissionAppels } from './useCommissionAppels';
import { useAuth } from '@/contexts/AuthContext';
import { useAppels } from '@/contexts/AppelsContext';
import { appelsApi } from '@/lib/api/appels';
import { documentsApi } from '@/lib/api/documents';
import StatCard from '../../components/dashboard/StatsCard';
import DelayChart from '../../components/dashboard/DelayChart';
import EmployeeChart from '../../components/dashboard/EmployeeChart';
import FilesTable from '../../components/dashboard/FilesTable';
import DocumentViewer from '../../components/dossier/DocumentViewer';

import '../../validation.css';

type DashboardStatus = 'overview' | 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string; appel_id?: string }>;
}

const tabs: DashboardStatus[] = ['overview', 'En Attente', 'En Cours', 'En Retard', 'Prêt'];

// ── Fonction utilitaire pour extraire l'ID numérique ────────────────────────
function extractNumericId(appel: any): number | null {
  // Try rawId first (should be numeric but may be string due to transformation)
  if (appel.rawId) {
    let id: number | null = null;
    if (typeof appel.rawId === 'number') {
      id = appel.rawId;
    } else if (typeof appel.rawId === 'string') {
      id = parseInt(appel.rawId.replace(/\D/g, ''), 10);
    }
    if (id && id > 0) return id;
  }

  // Try id field
  if (appel.id) {
    let id: number | null = null;
    if (typeof appel.id === 'number') {
      id = appel.id;
    } else if (typeof appel.id === 'string') {
      id = parseInt(appel.id.replace(/\D/g, ''), 10);
    }
    if (id && id > 0) return id;
  }

  return null;
}

// ── Squelette de chargement ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/4" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

// ── Page principale ─────────────────────────────────────────────────────────
export default function CommissionAppelsOffresPage(props: PageProps) {
  const { params, searchParams } = props;
  const { lang } = use(params);
  const { status: statusParam, appel_id: appelIdParam } = use(searchParams);
  const router = useRouter();
  const { setSelectedAppel } = useAppels();

  // ── Parse et store l'ID de l'appel d'offre ────────────────────────────────
  const appelId = appelIdParam ? parseInt(appelIdParam, 10) : null;

  // ── Données réelles depuis l'API (backend unifié gère la logique) ───────────
  const auth = useAuth();
  const { appels, stats, isLoading, error, refresh } = useCommissionAppels();

  const isAr = lang === 'ar';

  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);

  const currentStatus: DashboardStatus = tabs.includes(statusParam as DashboardStatus)
    ? (statusParam as DashboardStatus)
    : 'overview';

  // ── Filtrage côté client selon l'onglet actif ─────────────────────────────
  const tableData = useMemo(() =>
    currentStatus === 'overview'
      ? appels
      : appels.filter(a => a.status === currentStatus),
    [appels, currentStatus]
  );

  // Enrich tableData with validation status fetched from the detailed endpoint
  const [enrichedTableData, setEnrichedTableData] = useState<any[]>([]);

  useMemo(() => {
    let mounted = true;
    (async () => {
      if (!tableData || tableData.length === 0) {
        setEnrichedTableData([]);
        return;
      }

      const results = await Promise.all(tableData.map(async (a: any) => {
        try {
          const id = extractNumericId(a) || Number(a.id_appel_offres || a.rawId || a.id);
          if (!id) return { ...a, statutValidation: a.statut };
          const details = await appelsApi.getAppelOffre(id);
          return { ...a, statutValidation: details.statut ?? a.statut };
        } catch (err) {
          return { ...a, statutValidation: a.statut };
        }
      }));

      if (mounted) setEnrichedTableData(results);
    })();
    return () => { mounted = false; };
  }, [tableData]);

  // ── Données graphique retards (calculées depuis la liste réelle) ──────────
  const delayChartData = useMemo(() => {
    const retards = appels.filter(a => a.status === 'En Retard');
    const buckets = { gt7: 0, bt3_7: 0, lt3: 0, today: 0 };
    for (const a of retards) {
      const days = a.delayDays || 0;
      if (days > 7) buckets.gt7++;
      else if (days >= 3) buckets.bt3_7++;
      else if (days > 0) buckets.lt3++;
      else buckets.today++;
    }
    return [
      { period: '> 7 jours', count: buckets.gt7 },
      { period: '3-7 jours', count: buckets.bt3_7 },
      { period: '< 3 jours', count: buckets.lt3 },
      { period: "Aujourd'hui", count: buckets.today },
    ];
  }, [appels]);

  const handleViewDocument = async (file: any) => {
    setViewerError(null);
    setViewerLoading(true);
    setViewerUrl(null);
    setViewerTitle(file.reference || file.id);

    const appelId = extractNumericId(file);
    if (!appelId) {
      setViewerError(isAr ? 'ID غير صالح' : 'ID d\'appel invalide');
      setViewerLoading(false);
      return;
    }

    try {
      const appelDetails = await appelsApi.getAppelOffre(appelId);
      
      if (!appelDetails.id_doc_cdc) {
        throw new Error(isAr ? 'لم يتم العثور على دفتر الشروط.' : 'Aucun CDC (Cahier des charges) trouvé pour cet appel d\'offres.');
      }

      const response = await documentsApi.getDownloadUrl(Number(appelDetails.id_doc_cdc));
      if (!response?.download_url) {
        throw new Error(isAr ? 'مستحيل الحصول على رابط المستند.' : 'Impossible de récupérer l\'URL du document.');
      }
      setViewerUrl(response.download_url);
      setViewerTitle(`${file.reference || file.id} - Statut de validation: ${appelDetails.statut || 'Inconnu'}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setViewerError(message);
    } finally {
      setViewerLoading(false);
    }
  };

  // ── Dictionnaire i18n ─────────────────────────────────────────────────────
  const customDict = useMemo(() => ({
    files: {
      table: {
        headers: {
          file: isAr ? 'طلب عروض' : "Appel d'offres",
          economicOperator: isAr ? 'المتعامل الاقتصادي' : 'Opérateur Économique',
          assignmentDate: isAr ? 'تاريخ التعيين' : "Date d'affectation",
          validationDeadline: isAr ? 'مهلة التقييم' : 'Délai de validation',
          delayDays: isAr ? 'أيام التأخير' : 'Jours de retard',
          submissionDate: isAr ? 'تاريخ التقديم' : 'Date de soumission',
          validator: isAr ? 'المثبت' : 'Validateur',
          stage: isAr ? 'المرحلة' : 'Étape',
          actions: isAr ? 'الإجراء' : 'Action',
          status: isAr ? 'الحالة' : 'Statut',
          id: 'ID',
        },
        empty: isAr ? 'لا توجد طلبات عروض في هذه الحالة.' : "Aucun appel d'offres dans cet état.",
        status: {
          'En Attente': isAr ? 'في الانتظار' : 'En Attente',
          'En Cours': isAr ? 'قيد المعالجة' : 'En Cours',
          'En Retard': isAr ? 'متأخر' : 'En Retard',
          'Prêt': isAr ? 'جاهز' : 'Prêt',
        },
        actions: {
          Affecter: isAr ? 'تعيين' : 'Affecter',
          Réaffecter: isAr ? 'إعادة تعيين' : 'Réaffecter',
          Transmettre: isAr ? 'إرسال' : 'Transmettre',
          Voir: isAr ? 'عرض' : 'Voir',
        },
      },
    },
  }), [isAr]);

  // ── Rendu de l'état d'erreur ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-4">
        <div className="val-empty-icon">
          <svg className="w-16 h-16 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">
          {isAr ? 'حدث خطأ أثناء تحميل البيانات' : 'Erreur lors du chargement des données'}
        </h2>
        <p className="text-sm text-gray-400 max-w-md text-center">{error}</p>
        <button onClick={refresh} className="val-reset-button">
          {isAr ? 'إعادة المحاولة' : 'Réessayer'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Affichage de l'ID de l'appel si disponible ── */}
      {appelId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Appel d'offre sélectionné:</span> ID #{appelId}
          </p>
        </div>
      )}

      {/* ── Onglets de filtrage ── */}
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          {tabs.map(tab => (
            <a
              key={tab}
              href={`/${lang}/validation/appels-offres/commission?status=${tab}${appelId ? `&appel_id=${appelId}` : ''}`}
              className={currentStatus === tab ? 'val-tab-active' : 'val-tab-inactive'}
            >
              <span className={currentStatus === tab ? 'val-tab-active-text' : 'val-tab-inactive-text'}>
                {tab === 'overview' ? (isAr ? 'نظرة عامة' : 'Aperçu') : tab}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Vue Aperçu ── */}
      {currentStatus === 'overview' ? (
        <>
          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
            {isLoading ? (
              [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <StatCard
                  title={isAr ? "طلبات عروض في انتظار التعيين" : "En attente d'affectation"}
                  value={stats?.enAttente ?? 0}
                  trend={stats?.enAttentePct ?? 0}
                />
                <StatCard
                  title={isAr ? "طلبات عروض قيد التحقق" : "En cours de validation"}
                  value={stats?.enCours ?? 0}
                  trend={stats?.enCoursPct ?? 0}
                />
                <StatCard
                  title={isAr ? "طلبات عروض متأخرة" : "En retard"}
                  value={stats?.enRetard ?? 0}
                  trend={stats?.enRetardPct ?? 0}
                />
                <StatCard
                  title={isAr ? "طلبات عروض جاهزة للإرسال" : "Prêts à transmettre"}
                  value={stats?.pret ?? 0}
                  trend={stats?.pretPct ?? 0}
                />
              </>
            )}
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 w-full">
            <DelayChart
              data={delayChartData}
              title={isAr ? "طلبات عروض متأخرة حسب المدة" : "Appels d'offres en retard par durée"}
              legend={isAr ? "عدد طلبات العروض المتأخرة" : "Nombre d'appels d'offres en retard"}
              lang={lang}
            />
            {/* EmployeeChart : données statiques — à brancher sur une API dédiée */}
            <EmployeeChart
              data={[
                { employee: isAr ? 'غير معين' : 'Non affecté', evaluation: stats?.enAttente ?? 0, delayed: stats?.enRetard ?? 0, ready: stats?.pret ?? 0 },
              ]}
              title={isAr ? "توزيع طلبات العروض" : "Répartition des appels d'offres"}
              legends={{
                evaluation: isAr ? "قيد التحقق" : "En cours de validation",
                delayed: isAr ? "متأخر" : 'En retard',
                ready: isAr ? "جاهز للإرسال" : 'Prêt à transmettre',
              }}
              lang={lang}
            />
          </div>
        </>
      ) : (
        /* ── Vue tableau filtrée par statut ── */
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <table className="w-full">
              <tbody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : tableData.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              {isAr
                ? 'لم يتم العثور على أي طلب عروض في هذه الحالة.'
                : "Aucun appel d'offres trouvé dans cet état."}
            </div>
          ) : (
            <>
              <FilesTable
                data={(enrichedTableData.length > 0 ? enrichedTableData : tableData).map((a: any) => ({ ...a, statutValidation: a.statutValidation ?? a.statut }))}
                status={currentStatus as Exclude<DashboardStatus, 'overview'>}
                lang={lang}
                dict={customDict}
                hideEconomicOperator={true}
                disableRowClick={true}
                onAffecter={(appel: any) => {
                  // Extract numeric ID robustly from string or number
                  const effectiveId = extractNumericId(appel);
                  
                  if (effectiveId && effectiveId > 0) {
                    // Save the appel to context before navigating
                    console.log('Navigating to AffectationAppel with ID:', effectiveId, 'appel:', appel);
                    setSelectedAppel(appel);
                    // Navigate to AffectationAppel with the appel ID
                    router.push(`/${lang}/validation/AffectationAppel/${effectiveId}`);
                  } else {
                    console.error('Invalid appel ID. rawId:', appel?.rawId, 'id:', appel?.id, 'full appel:', appel);
                    alert('Erreur: ID d\'appel invalide. Veuillez vérifier les données.');
                  }
                }}
                onView={handleViewDocument}
              />

              {(viewerUrl || viewerLoading || viewerError) && (
                <div className="mt-6 bg-white rounded-lg shadow p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">{viewerTitle || (isAr ? 'عرض المستند' : 'Visualiseur de document')}</h2>
                      <p className="text-sm text-gray-500">{isAr ? 'عرض المستند دون مغادرة الصفحة' : 'Affichage du document sans quitter la page'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewerUrl(null);
                        setViewerError(null);
                        setViewerLoading(false);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {isAr ? 'إغلاق' : 'Fermer'}
                    </button>
                  </div>

                  {viewerLoading ? (
                    <div className="py-20 text-center text-gray-500">{isAr ? 'جارٍ تحميل المستند...' : 'Chargement du document...'}</div>
                  ) : viewerError ? (
                    <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{viewerError}</div>
                  ) : (
                    <div className="overflow-hidden rounded border border-gray-200">
                      <DocumentViewer url={viewerUrl ?? undefined} lang={lang} dict={customDict} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
