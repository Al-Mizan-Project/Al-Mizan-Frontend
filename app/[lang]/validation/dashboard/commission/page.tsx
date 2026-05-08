'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../../components/dashboard/StatsCard';
import DelayChart from '../../components/dashboard/DelayChart';
import EmployeeChart from '../../components/dashboard/EmployeeChart';
import FilesTable from '../../components/dashboard/FilesTable';
import { useValidationAuth } from '../../context/ValidationAuthContext';

// Import des APIs officielles
import { soumissionsApi } from '@/lib/api/soumissions';
import { evaluationsApi } from '@/lib/api/evaluations';
import { validationsApi } from '@/lib/api/validation';

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
  const { token, isLoading: authLoading } = useValidationAuth();

  const currentStatus: DashboardStatus = tabs.includes(statusParam as DashboardStatus)
    ? (statusParam as DashboardStatus)
    : 'overview';

  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const effectiveToken =
          token ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          localStorage.getItem('validation_token');

        if (!effectiveToken && !authLoading) {
          router.push(`/${lang}/validation/login`);
          return;
        }

        // On n'envoie pas de Authorization header aux proxies car ils utilisent 
        // le X-Internal-Service-Token qui suffit et évite les erreurs 401 si le JWT est expiré.
        
        // ── Étape 1 : identifier les services liés aux commissions ────────
        const commissionsRaw = await fetch('/api/proxy/contractant?path=commissions-internes')
          .then(r => r.ok ? r.json() : []);

        const commissions = Array.isArray(commissionsRaw) ? commissionsRaw : (commissionsRaw.results ?? []);

        // Stratégie : On collecte tous les services liés aux commissions internes.
        // En mode test, on affiche les soumissions de tous les services si on ne peut pas filtrer par utilisateur.
        const allServiceIds = [...new Set(commissions.filter((c: any) => c.id_service).map((c: any) => Number(c.id_service)))];

        // ── Étape 2 : Utilisation des APIs officielles ───────────────────
        const [soumissionsRaw, evaluationsRaw, validationsRaw] = await Promise.all([
          soumissionsApi.getSoumissions(),
          evaluationsApi.getEvaluations(),
          validationsApi.getValidations(),
        ]);

        const soumissions = Array.isArray(soumissionsRaw) ? soumissionsRaw : (soumissionsRaw as any).results ?? [];
        const evaluations = Array.isArray(evaluationsRaw) ? evaluationsRaw : (evaluationsRaw as any).results ?? [];
        const validations = Array.isArray(validationsRaw) ? validationsRaw : (validationsRaw as any).results ?? [];

        // ── Étape 3 : identifier les appels d'offres des services ─────────
        let allowedAoIds = new Set<number>();
        for (const svcId of allServiceIds) {
          try {
            const appelsRaw = await fetch(`/api/proxy/appels?path=services-contractants/${svcId}/appels-offres`)
              .then(r => r.ok ? r.json() : []);
            const appels = Array.isArray(appelsRaw) ? appelsRaw : (appelsRaw.results ?? []);
            appels.forEach((a: any) => allowedAoIds.add(Number(a.id_appel_offres)));
          } catch { /* silence */ }
        }

        // ── Étape 4 : Filtrage et mapping ────────────────────────────────
        const filteredSoums = soumissions.filter((s: any) => allowedAoIds.has(Number(s.id_appel_offre)));

        const processed = filteredSoums
          .filter((s: any) => {
            const sEvals = evaluations.filter((e: any) => Number(e.id_soumission) === Number(s.id_soumission));
            const types = sEvals.map((e: any) => (e.type ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
            const hasAdm = types.includes('administrative');
            const hasTec = types.includes('technique');
            // 'financiere' ou 'financière' normalisé
            const hasFin = types.includes('financiere');
            return hasAdm && hasTec && hasFin;
          })
          .map((s: any) => {
            const val = validations.find((v: any) => Number(v.id_soumission) === Number(s.id_soumission));
            let subStatus: DashboardStatus = 'En Attente';
            let delayDays = 0;

            if (val) {
              if (val.is_validated) {
                subStatus = 'Prêt';
              } else {
                const deadline = new Date(val.created_at || new Date());
                deadline.setDate(deadline.getDate() + 7);
                if (new Date() > deadline) {
                  subStatus = 'En Retard';
                  delayDays = Math.floor((Date.now() - deadline.getTime()) / (1000 * 3600 * 24));
                } else {
                  subStatus = 'En Cours';
                }
              }
            }

            return {
              id: `ID-${String(s.id_soumission).padStart(3, '0')}`,
              rawId: s.id_soumission,
              reference: `Dossier ${s.id_soumission}`,
              economicOperator: 'Opérateur',
              submissionDate: s.date_soumission ? new Date(s.date_soumission).toISOString().split('T')[0] : '—',
              status: subStatus,
              delayDays: delayDays > 0 ? delayDays : undefined,
              etape: 'Evaluation Administrative',
            };
          });

        setAllSubmissions(processed);
      } catch (err) {
        console.error('Erreur dashboard commission:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchData();
  }, [token, authLoading, router, lang]);

  const tableData = useMemo(() =>
    currentStatus === 'overview' ? allSubmissions : allSubmissions.filter(s => s.status === currentStatus),
    [allSubmissions, currentStatus]);

  const stats = useMemo(() => {
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
            <StatCard title="Dossiers prêts à transmettre" value={stats.pret} trend={stats.pretPct} />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6 w-full">
            <DelayChart data={dynamicDelayData} title="Dossiers en retards par durée" legend="Numero de dossiers en retard" lang={lang} />
            <EmployeeChart data={dynamicEmployeeData} title="Dossiers affectés par employés" legends={{ evaluation: "En cours de validation", delayed: 'En retard', ready: 'Prêt à transmettre' }} lang={lang} />
          </div>
        </>
      ) : (
        <div className="mt-6 bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Chargement des données...</div>
          ) : (tableData.length === 0 ? (
            <div className="p-10 text-center text-gray-400">Aucun dossier trouvé dans cet état.</div>
          ) : (
            <FilesTable
              data={tableData}
              status={currentStatus as Exclude<DashboardStatus, 'overview'>}
              lang={lang}
              onAffecter={(dossier: any) => {
                router.push(`/${lang}/validation/affectation/${dossier.rawId || dossier.id.replace('ID-', '')}`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}