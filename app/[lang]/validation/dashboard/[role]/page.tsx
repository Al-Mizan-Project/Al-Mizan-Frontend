'use client';

import { useMemo } from 'react';
import { use } from 'react'; // Next.js 16.1+ pour unwrap des Promises
import StatCard from '../../components/dashboard/StatsCard';
import DelayChart from '../../components/dashboard/DelayChart';
import EmployeeChart from '../../components/dashboard/EmployeeChart';
import FilesTable from '../../components/dashboard/FilesTable';

type DashboardStatus = 'overview' | 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt';
type UserRole = 'commission' | 'validator';

interface DashboardPageProps {
  params: Promise<{ lang: string; role: UserRole }>;
  searchParams: Promise<{ status?: string }>;
}

// ==== MOCK DATA ====
const commissionDelayData = [
  { period: '> 7', count: 52 },
  { period: '3-7', count: 44 },
  { period: '< 3', count: 47 },
  { period: "Aujourd'hui", count: 48 },
];

const commissionEmployeeData = [
  { employee: 'EV-01', evaluation: 52, delayed: 48, ready: 35 },
  { employee: 'EV-02', evaluation: 55, delayed: 50, ready: 38 },
  { employee: 'EV-03', evaluation: 48, delayed: 45, ready: 33 },
  { employee: 'EV-04', evaluation: 42, delayed: 40, ready: 26 },
];

const validatorStats = {
  inProgress: 5,
  delayed: 2,
};

// Génération de fichiers mock
const generateMockData = (status: DashboardStatus, role: UserRole) => {
  const data = [];
  const count = role === 'commission' ? 10 : 5;

  for (let i = 1; i <= count; i++) {
    data.push({
      id: `ID-${String(i).padStart(3, '0')}`,
      reference: `Référence Dossier ${i}`,
      economicOperator: 'Opérateur',
      validator:
        status !== 'En Attente' && role === 'commission'
          ? { name: 'Nom Prénom', id: `MAT-${String(i).padStart(3, '0')}` }
          : undefined,
      submissionDate: status === 'En Attente' ? '2026-02-01' : undefined,
      assignmentDate: status === 'En Cours' ? '2026-02-01' : undefined,
      validationDeadline: '2026-02-28',
      status: status === 'overview' ? 'En Attente' : status,
      delayDays: status === 'En Retard' ? 4 : undefined,
      etape: i % 2 === 0 ? 'Evaluation Administrative' as const : ('Evaluation des Offres' as const),
    });
  }

  return data;
};

// ==== PAGE DASHBOARD ====
export default function DashboardPage(props: DashboardPageProps) {
  const { params, searchParams } = props;

  // ✅ unwrap les Promises
  const { lang, role } = use(params);
  const { status: statusParam } = use(searchParams);

  const isCommission = role === 'commission';
  const currentStatus: DashboardStatus = ['overview','En Attente','En Cours','En Retard','Prêt'].includes(statusParam ?? '')
    ? (statusParam as DashboardStatus)
    : 'overview';

  const tableData = useMemo(() => generateMockData(currentStatus, role), [currentStatus, role]);

  // Tabs dynamiques selon le rôle
  const tabs = isCommission
    ? ['overview','En Attente','En Cours','En Retard','Prêt']
    : ['overview','En Cours','En Retard'];

  // ✅ debug
  console.log('Dashboard role:', role, 'status:', currentStatus);
  console.log('FilesTable data:', tableData);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          {tabs.map(status => (
            <a
              key={status}
              href={`/${lang}/validation/dashboard/${role}?status=${status}`}
              className={currentStatus === status ? 'val-tab-active' : 'val-tab-inactive'}
            >
              <span className={currentStatus === status ? 'val-tab-active-text' : 'val-tab-inactive-text'}>
                {status === 'overview' ? 'Aperçu' : status}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {currentStatus === 'overview' ? (
        <>
          {/* StatCards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
            {isCommission ? (
              <>
                <StatCard title="Dossiers en attente d'affectation" value={42} trend={-1.5} />
                <StatCard title="Dossiers en cours de validation" value={42} trend={-1.5} />
                <StatCard title="Dossiers en retard" value={42} trend={-1.5} />
                <StatCard title="Dossiers prêts à transmettre à l'administrateur" value={42} trend={-1.5} />
              </>
            ) : (
              <>
                <StatCard title="Mes dossiers en cours de validation" value={validatorStats.inProgress} trend={2.1} />
                <StatCard title="Mes dossiers en retard" value={validatorStats.delayed} trend={-0.5} />
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 w-full">
            <DelayChart
              data={commissionDelayData}
              title="Retards par durée"
              legend="Nombre de dossiers en retard"
              lang={lang}
            />
            {isCommission && (
              <EmployeeChart
                data={commissionEmployeeData}
                title="Par évaluateur"
                legends={{ evaluation: 'En évaluation', delayed: 'En retard', ready: 'Prêt' }}
                lang={lang}
              />
            )}
          </div>
        </>
      ) : (
        // ✅ FilesTable pour tous les statuts hors overview
        <div className="mt-6 bg-white rounded-lg shadow">
          <FilesTable
            data={tableData}
            status={currentStatus as Exclude<DashboardStatus, 'overview'>}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
}