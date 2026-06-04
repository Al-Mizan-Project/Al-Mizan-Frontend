'use client';

import { useEffect, useState, useMemo, useCallback, use } from 'react';
import StatCard from '../../components/dashboard/StatsCard';
import FilesTable from '../../components/dashboard/FilesTable';
import DelayChart from '../../components/dashboard/DelayChart';
import ValidationCDCModal from '../../components/dashboard/ValidationCDCModal';
import { useAuth } from '@/contexts/AuthContext';
import { appelsApi, AppelOffre } from '@/lib/api/appels';
import { fileRecord } from '../../types';

import '../../validation.css';

type DashboardStatus = 'overview' | 'En Cours' | 'En Retard';

interface ValidatorPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}

const tabs: DashboardStatus[] = ['overview', 'En Cours', 'En Retard'];

const parseIsoDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function ValidatorPage(props: ValidatorPageProps) {
  const { params, searchParams } = props;
  const { lang } = use(params);
  const { status: statusParam } = use(searchParams);

  const { token, user, isLoading: authLoading } = useAuth();

  const currentStatus: DashboardStatus = tabs.includes(statusParam as DashboardStatus)
    ? (statusParam as DashboardStatus)
    : 'overview';

  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDossier, setSelectedDossier] = useState<fileRecord | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || !user) return;

    try {
      const CURRENT_VALIDATOR_ID = user.id_utilisateur ?? user.id ?? user.id_membre;
      if (!CURRENT_VALIDATOR_ID) {
        throw new Error('Impossible de déterminer l\'identifiant du validateur.');
      }
      const appelsRaw = await appelsApi.getAppelsByValidatedBy(CURRENT_VALIDATOR_ID);
      const appels: AppelOffre[] = Array.isArray(appelsRaw) ? appelsRaw : (appelsRaw as any).results ?? [];

      const validatorSubmissions: any[] = appels.map((appel: any) => {
        return {
          id: `ID-${String(appel.id_appel_offres).padStart(3, '0')}`,
          rawId: appel.id_appel_offres,
          id_doc_cdc: appel.id_doc_cdc ?? null,
          reference: appel.reference || `Appel ${appel.id_appel_offres}`,
          economicOperator: appel.wilaya || appel.type_procedure || 'Appel d\'offre',
          validator: {
            name: `Moi (Expert #${CURRENT_VALIDATOR_ID})`,
            id: `VAL-${String(appel.validated_by ?? CURRENT_VALIDATOR_ID)}`,
          },
          submissionDate: appel.created_at ? new Date(appel.created_at).toISOString().split('T')[0] : '—',
          assignmentDate: appel.assignmentDate ? new Date(appel.assignmentDate).toISOString().split('T')[0] : '—',
          validationDeadline: appel.validationDeadline ? new Date(appel.validationDeadline).toISOString().split('T')[0] : '—',
          status: appel.status || 'En Cours',
          delayDays: appel.delayDays > 0 ? appel.delayDays : undefined,
          etape: 'Validation en cours',
        };
      });

      setAllSubmissions(validatorSubmissions);
    } catch (err) {
      console.error('Erreur dashboard validateur:', err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchData();
    }
  }, [token, user, authLoading, fetchData]);

  const tableData = useMemo(() => {
    if (currentStatus === 'overview') return allSubmissions;
    return allSubmissions.filter(s => s.status === currentStatus);
  }, [allSubmissions, currentStatus]);

  const stats = useMemo(() => {
    const total = allSubmissions.length;
    const countCours = allSubmissions.filter(s => s.status === 'En Cours').length;
    const countRetard = allSubmissions.filter(s => s.status === 'En Retard').length;

    return {
      enCours: countCours,
      enCoursPct: total > 0 ? Math.round((countCours / total) * 100) : 0,
      enRetard: countRetard,
      enRetardPct: total > 0 ? Math.round((countRetard / total) * 100) : 0,
    };
  }, [allSubmissions]);

  const dynamicDelayData = useMemo(() => {
    const delayed = allSubmissions.filter(s => s.status === 'En Retard');
    let gt7 = 0, b37 = 0, lt3 = 0, today = 0;

    delayed.forEach(s => {
      const dd = s.delayDays || 0;
      if (dd > 7) gt7++;
      else if (dd >= 3) b37++;
      else if (dd > 0) lt3++;
      else today++;
    });

    return [
      { period: '> 7 jours', count: gt7 },
      { period: '3-7 jours', count: b37 },
      { period: '< 3 jours', count: lt3 },
      { period: "Aujourd'hui", count: today },
    ];
  }, [allSubmissions]);

  // Handle row click: open the validation modal
  const handleRowClick = useCallback((dossier: fileRecord) => {
    setSelectedDossier(dossier);
  }, []);

  // After successful validation, refresh the data
  const handleValidated = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          {tabs.map(status => (
            <a
              key={status}
              href={`/${lang}/validation/dashboard/validatorCDC?status=${status}`}
              className={currentStatus === status ? 'val-tab-active' : 'val-tab-inactive'}
            >
              <span className={currentStatus === status ? 'val-tab-active-text' : 'val-tab-inactive-text'}>
                {status === 'overview' ? 'Aperçu' : status}
              </span>
            </a>
          ))}
        </div>
      </div>

      {currentStatus === 'overview' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
            <StatCard title="Mes dossiers en cours" value={stats.enCours} trend={stats.enCoursPct} />
            <StatCard title="Mes dossiers en retard" value={stats.enRetard} trend={stats.enRetardPct} />
          </div>

          <div className="grid grid-cols-1 gap-6 mt-6 w-full lg:w-1/2">
            <DelayChart
              data={dynamicDelayData}
              title="Dossiers en retards par durée"
              legend="Numero d'offres en retard"
              lang={lang}
            />
          </div>
        </>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow min-h-[300px]">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Chargement de vos dossiers...</div>
          ) : tableData.length === 0 ? (
            <div className="p-20 text-center text-gray-400">Aucun dossier ne vous est affecté pour le moment.</div>
          ) : (
            <FilesTable
              data={tableData}
              status={currentStatus as Exclude<DashboardStatus, 'overview'>}
              lang={lang}
              viewMode="validateur"
              onRowClick={handleRowClick}
            />
          )}
        </div>
      )}

      {/* Modal de validation CDC */}
      {selectedDossier && (
        <ValidationCDCModal
          dossier={selectedDossier}
          onClose={() => setSelectedDossier(null)}
          onValidated={handleValidated}
        />
      )}
    </div>
  );
}