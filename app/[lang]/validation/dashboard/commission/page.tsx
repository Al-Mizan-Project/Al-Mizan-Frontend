'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../../components/dashboard/StatsCard';
import DelayChart from '../../components/dashboard/DelayChart';
import EmployeeChart from '../../components/dashboard/EmployeeChart';
import FilesTable from '../../components/dashboard/FilesTable';

import { soumissionsApi } from '../../../../../lib/api/soumissions';
import { evaluationsApi } from '../../../../../lib/api/evaluations';
import { validationsApi } from '../../../../../lib/api/validation';
import { useValidationAuth } from '../../context/ValidationAuthContext';

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

  const { token, organisationId, isLoading: authLoading } = useValidationAuth();

  const currentStatus: DashboardStatus = tabs.includes(statusParam as DashboardStatus)
    ? (statusParam as DashboardStatus)
    : 'overview';

  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      
      try {
        const authHeaders: Record<string, string> = { 'Authorization': `Bearer ${token}` };

        const [soums, evals, vals] = await Promise.all([
          fetch('/api/proxy/soumissions', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/proxy/evaluations', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/proxy/validations', { headers: authHeaders }).then(r => r.json()),
        ]);

        // Normalise paginated or list responses
        const soumissions: any[] = Array.isArray(soums) ? soums : (soums.results ?? []);
        const evaluations: any[] = Array.isArray(evals) ? evals : (evals.results ?? []);
        const validations: any[] = Array.isArray(vals) ? vals : (vals.results ?? []);

        // Soumissions évaluées: qui ont une évaluation
        const evaluatedSubmissions = soumissions.filter((s: any) =>
          evaluations.some((e: any) => Number(e.id_soumission) === Number(s.id_soumission))
        );

        const processed = evaluatedSubmissions.map((s: any) => {
          const val = validations.find((v: any) => Number(v.id_soumission) === Number(s.id_soumission));

          let subStatus: DashboardStatus = 'overview';
          let delayDays = 0;
          let validationDl;

          if (!val) {
            // Evaluée et non validée (pas de validation créée)
            subStatus = 'En Attente';
          } else if (val.is_validated) {
            // Validation créée avec is_validated = true
            subStatus = 'Prêt';
          } else {
            // Validation créée avec is_validated = false
            const validationDate = new Date(val.created_at || new Date());
            const deadline = new Date(validationDate);
            deadline.setDate(deadline.getDate() + 7); // Durée de validation de 7 jours
            validationDl = deadline;
            const now = new Date();

            if (now > deadline) {
              subStatus = 'En Retard';
              delayDays = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 3600 * 24));
            } else {
              subStatus = 'En Cours';
            }
          }

          return {
            id: `ID-${String(s.id_soumission).padStart(3, '0')}`,
            rawId: s.id_soumission,
            reference: `Dossier ${s.id_soumission}`,
            economicOperator: 'Opérateur',
            validator: val ? {
              name: val.id_utilisateur ? `Validateur ${val.id_utilisateur}` : `Validateur ${val.id_validation}`,
              id: `VAL-${val.id_validation}`
            } : undefined,
            submissionDate: s.date_soumission ? new Date(s.date_soumission).toISOString().split('T')[0] : '2026-02-01',
            assignmentDate: val ? new Date(val.created_at).toISOString().split('T')[0] : undefined,
            validationDeadline: validationDl ? validationDl.toISOString().split('T')[0] : '2026-02-28',
            status: subStatus, // on attribue le statut calculé
            delayDays: delayDays > 0 ? delayDays : undefined,
            etape: 'Evaluation Administrative' as const,
          };
        });

        setAllSubmissions(processed);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchData();
    }
  }, [token, authLoading]);

  const tableData = useMemo(() => {
    if (currentStatus === 'overview') return allSubmissions;
    return allSubmissions.filter(s => s.status === currentStatus);
  }, [allSubmissions, currentStatus]);

  const stats = useMemo(() => {
    const total = allSubmissions.length;
    const countAttente = allSubmissions.filter(s => s.status === 'En Attente').length;
    const countCours = allSubmissions.filter(s => s.status === 'En Cours').length;
    const countRetard = allSubmissions.filter(s => s.status === 'En Retard').length;
    const countPret = allSubmissions.filter(s => s.status === 'Prêt').length;

    return {
      enAttente: countAttente,
      enAttentePct: total > 0 ? Math.round((countAttente / total) * 100) : 0,
      enCours: countCours,
      enCoursPct: total > 0 ? Math.round((countCours / total) * 100) : 0,
      enRetard: countRetard,
      enRetardPct: total > 0 ? Math.round((countRetard / total) * 100) : 0,
      pret: countPret,
      pretPct: total > 0 ? Math.round((countPret / total) * 100) : 0,
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

  const dynamicEmployeeData = useMemo(() => {
    const validatorGroups: Record<string, { evaluation: number; delayed: number; ready: number }> = {};

    allSubmissions.forEach(s => {
      if (!s.validator) return; // 'En Attente' n'a pas de validateur

      const vName = s.validator.name || s.validator.id || 'Inconnu';
      if (!validatorGroups[vName]) {
        validatorGroups[vName] = { evaluation: 0, delayed: 0, ready: 0 };
      }

      if (s.status === 'En Cours') {
        validatorGroups[vName].evaluation += 1;
      } else if (s.status === 'En Retard') {
        validatorGroups[vName].delayed += 1;
      } else if (s.status === 'Prêt') {
        validatorGroups[vName].ready += 1;
      }
    });

    return Object.keys(validatorGroups).map(vName => ({
      employee: vName,
      evaluation: validatorGroups[vName].evaluation,
      delayed: validatorGroups[vName].delayed,
      ready: validatorGroups[vName].ready,
    }));
  }, [allSubmissions]);

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
            <StatCard title="Dossiers en attente d'affectation" value={stats.enAttente} trend={stats.enAttentePct} />
            <StatCard title="Dossiers en cours de validation" value={stats.enCours} trend={stats.enCoursPct} />
            <StatCard title="Dossiers en retard" value={stats.enRetard} trend={stats.enRetardPct} />
            <StatCard title="Dossiers prêts à transmettre à l'administrateur" value={stats.pret} trend={stats.pretPct} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 w-full">
            <DelayChart
              data={dynamicDelayData}
              title="Dossiers en retards par durée"
              legend="Numero de dossiers en retard"
              lang={lang}
            />
            <EmployeeChart
              data={dynamicEmployeeData}
              title="Dossiers affectés par employés"
              legends={{ evaluation: "En cours de validation", delayed: 'En retard', ready: 'Prêt à transmettre' }}
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
              onAffecter={(dossier) => {
                router.push(`/${lang}/validation/affectation/${dossier.rawId || dossier.id.replace('ID-', '')}`);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}