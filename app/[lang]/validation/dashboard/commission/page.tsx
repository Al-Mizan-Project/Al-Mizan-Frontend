'use client';

import { useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../../components/dashboard/StatsCard';
import DelayChart from '../../components/dashboard/DelayChart';
import EmployeeChart from '../../components/dashboard/EmployeeChart';
import FilesTable from '../../components/dashboard/FilesTable';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useCommissionUserAttributions } from './useCommissionAttributions';

import '../../validation.css';

type DashboardStatus = 'overview' | 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt';

interface CommissionPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}

const tabs: DashboardStatus[] = ['overview', 'En Attente', 'En Cours', 'En Retard', 'Prêt'];

export default function CommissionPage(props: CommissionPageProps) {
  const { params, searchParams } = props;
  const { lang } = use(params);
  const { status: statusParam } = use(searchParams);
  const router = useRouter();

  const currentStatus: DashboardStatus = tabs.includes(statusParam as DashboardStatus)
    ? (statusParam as DashboardStatus)
    : 'overview';

  const auth = useAuth();
  const { appels: allSubmissions, stats, isLoading, error, refresh } = useCommissionUserAttributions();

  const tableData = useMemo(() =>
    currentStatus === 'overview' ? allSubmissions : allSubmissions.filter(s => s.status === currentStatus),
    [allSubmissions, currentStatus]);

  const overviewStats = useMemo(() => {
    if (stats) return stats;
    const total = allSubmissions.length;
    const count = (st: string) => allSubmissions.filter(s => s.status === st).length;
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
    const cA = count('En Attente'), cC = count('En Cours'), cR = count('En Retard'), cP = count('Prêt');
    return {
      enAttente: cA, enAttentePct: pct(cA),
      enCours: cC, enCoursPct: pct(cC),
      enRetard: cR, enRetardPct: pct(cR),
      pret: cP, pretPct: pct(cP),
    };
  }, [stats, allSubmissions]);

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

  const dynamicEmployeeData = useMemo(() => {
    const groups: Record<string, { evaluation: number; delayed: number; ready: number }> = {};
    allSubmissions.forEach(s => {
      const key = 'Non affecté';
      if (!groups[key]) groups[key] = { evaluation: 0, delayed: 0, ready: 0 };
      if (s.status === 'En Cours') groups[key].evaluation++;
      else if (s.status === 'En Retard') groups[key].delayed++;
      else if (s.status === 'Prêt') groups[key].ready++;
    });
    return Object.entries(groups).map(([employee, v]) => ({ employee, ...v }));
  }, [allSubmissions]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="val-empty-icon">
          <svg className="w-16 h-16 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Erreur lors du chargement des données</h2>
        <p className="text-sm text-gray-400 max-w-md text-center">{error}</p>
        <button onClick={refresh} className="val-reset-button">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          {tabs.map(status => (
            <a
              key={status}
              href={`/${lang}/validation/dashboard/commission?status=${status}`}
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
            <StatCard title="Dossiers en attente d'affectation" value={overviewStats.enAttente} trend={overviewStats.enAttentePct} />
            <StatCard title="Dossiers en cours de validation" value={overviewStats.enCours} trend={overviewStats.enCoursPct} />
            <StatCard title="Dossiers en retard" value={overviewStats.enRetard} trend={overviewStats.enRetardPct} />
            <StatCard title="Dossiers prêts à transmettre" value={overviewStats.pret} trend={overviewStats.pretPct} />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 w-full">
            <DelayChart data={dynamicDelayData} title="Dossiers en retards par durée" legend="Numero de dossiers en retard" lang={lang} />
            <EmployeeChart data={dynamicEmployeeData} title="Dossiers affectés par employés" legends={{ evaluation: "En cours de validation", delayed: 'En retard', ready: 'Prêt à transmettre' }} lang={lang} />
          </div>
        </>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Chargement des données...</div>
          ) : (tableData.length === 0 ? (
            <div className="p-10 text-center text-gray-400">Aucun dossier trouvé dans cet état.</div>
          ) : (
            <FilesTable
              data={tableData}
              status={currentStatus as Exclude<DashboardStatus, 'overview'>}
              lang={lang}
              onAction={(dossier: any) => {
                const dossierId = dossier.rawId || dossier.id.replace('ID-', '');
                if (currentStatus === 'Prêt') {
                  router.push(`/${lang}/validation/dossier/${dossierId}/commission?action=transmettre`);
                } else {
                  router.push(`/${lang}/validation/AffectationSoumission/${dossierId}`);
                }
              }}
              onView={(dossier: any) => {
                const dossierId = dossier.rawId || dossier.id.replace('ID-', '');
                router.push(`/${lang}/validation/dossier/${dossierId}/commission`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}