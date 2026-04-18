'use client';

import { useEffect, useState, useMemo, use } from 'react';
import StatCard from '../../components/dashboard/StatsCard';
import FilesTable from '../../components/dashboard/FilesTable';
import DelayChart from '../../components/dashboard/DelayChart';
import { useValidationAuth } from '../../context/ValidationAuthContext';

type DashboardStatus = 'overview' | 'En Cours' | 'En Retard';

interface ValidatorPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}

const tabs: DashboardStatus[] = ['overview', 'En Cours', 'En Retard'];

export default function ValidatorPage(props: ValidatorPageProps) {
  const { params, searchParams } = props;
  const { lang } = use(params);
  const { status: statusParam } = use(searchParams);

  const { token, user, isLoading: authLoading } = useValidationAuth();

  const currentStatus: DashboardStatus = tabs.includes(statusParam as DashboardStatus)
    ? (statusParam as DashboardStatus)
    : 'overview';

  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!token || !user) return;

      try {
        const authHeaders: Record<string, string> = { 'Authorization': `Bearer ${token}` };

        const [soums, evals, vals] = await Promise.all([
          fetch('/api/proxy/soumissions', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/proxy/evaluations', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/proxy/validations', { headers: authHeaders }).then(r => r.json()),
        ]);

        const soumissions: any[] = Array.isArray(soums) ? soums : (soums.results ?? []);
        const evaluations: any[] = Array.isArray(evals) ? evals : (evals.results ?? []);
        const validations: any[] = Array.isArray(vals) ? vals : (vals.results ?? []);

        // Pour le validateur, on ne s'intéresse qu'aux soumissions qui ont une évaluation ET une validation
        const evaluatedSubmissions = soumissions.filter((s: any) =>
          evaluations.some((e: any) => Number(e.id_soumission) === Number(s.id_soumission))
        );

        const validatorSubmissions: any[] = [];

        const CURRENT_VALIDATOR_ID = user.id_utilisateur;

        evaluatedSubmissions.forEach((s: any) => {
          const val = validations.find((v: any) => Number(v.id_soumission) === Number(s.id_soumission));

          // On s'intéresse uniquement aux validations assignées au validateur courant ET en attente
          if (val && val.id_utilisateur === CURRENT_VALIDATOR_ID && !val.is_validated) {
            let subStatus: DashboardStatus = 'En Cours';
            let delayDays = 0;

            const validationDate = new Date(val.created_at || new Date());
            const deadline = new Date(validationDate);
            deadline.setDate(deadline.getDate() + 7);
            const now = new Date();

            if (now > deadline) {
              subStatus = 'En Retard';
              delayDays = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 3600 * 24));
            }

            validatorSubmissions.push({
              id: `ID-${String(s.id_soumission).padStart(3, '0')}`,
              rawId: s.id_soumission,
              reference: `Dossier ${s.id_soumission}`,
              economicOperator: 'Opérateur',
              validator: {
                name: val.id_utilisateur ? `Validateur ${val.id_utilisateur}` : `Validateur ${val.id_validation}`,
                id: `VAL-${val.id_validation}`
              },
              submissionDate: s.date_soumission ? new Date(s.date_soumission).toISOString().split('T')[0] : '2026-02-01',
              assignmentDate: new Date(val.created_at).toISOString().split('T')[0],
              validationDeadline: deadline.toISOString().split('T')[0],
              status: subStatus,
              delayDays: delayDays > 0 ? delayDays : undefined,
              etape: 'Validation',
            });
          }
        });

        setAllSubmissions(validatorSubmissions);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchData();
    }
  }, [token, user, authLoading]);

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
    let gt7 = 0; let b37 = 0; let lt3 = 0; let today = 0;

    delayed.forEach(s => {
      const dd = s.delayDays || 0;
      if (dd > 7) gt7++;
      else if (dd >= 3 && dd <= 7) b37++;
      else if (dd > 0 && dd < 3) lt3++;
      else today++;
    });

    return [
      { period: '> 7 jours', count: gt7 },
      { period: '3-7 jours', count: b37 },
      { period: '< 3 jours', count: lt3 },
      { period: "Aujourd'hui", count: today },
    ];
  }, [allSubmissions]);

  return (
    <div className="space-y-6">
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          {tabs.map(status => (
            <a
              key={status}
              href={`/${lang}/validation/dashboard/validator?status=${status}`}
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
            <StatCard title="Mes dossiers en cours de validation" value={stats.enCours} trend={stats.enCoursPct} />
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
        <div className="mt-6 bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Chargement des données...</div>
          ) : (
            <FilesTable
              data={tableData}
              status={currentStatus as Exclude<DashboardStatus, 'overview'>}
              lang={lang}
              viewMode="validateur"
            />
          )}
        </div>
      )}
    </div>
  );
}