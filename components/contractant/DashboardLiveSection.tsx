'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppelOffre, Recours, Soumission } from '@/lib/api/service-contractant';
import { serviceContractantApi } from '@/lib/api/service-contractant';
import styles from './service-contractant.module.css';
import { useServiceContractant } from './ServiceContractantLiveContext';
import {
  Badge,
  LoadingOrErrorBlock,
  cn,
  formatDateTime,
  toBadgeFromStatus,
} from './ServiceContractantLiveShared';

export default function DashboardLiveSection() {
  const { service, isLoading, error } = useServiceContractant();
  const [appels, setAppels] = useState<AppelOffre[]>([]);
  const [soumissionsCount, setSoumissionsCount] = useState(0);
  const [commissionsCount, setCommissionsCount] = useState(0);
  const [contractsCount, setContractsCount] = useState(0);
  const [recoursCount, setRecoursCount] = useState(0);

  const serviceId = service?.id_service ?? null;

  useEffect(() => {
    if (!serviceId) {
      setAppels([]);
      setSoumissionsCount(0);
      setCommissionsCount(0);
      setContractsCount(0);
      setRecoursCount(0);
      return;
    }

    let isMounted = true;

    async function loadDashboard() {
      try {
        const [loadedAppels, loadedCommissions, loadedContracts] = await Promise.all([
          serviceContractantApi.listAppels({ service_id: serviceId }),
          serviceContractantApi.getServiceCommissions(serviceId).catch(() => ({
            commissions_evaluation: [],
            commissions_internes: [],
          })),
          serviceContractantApi.listContrats().catch(() => []),
        ]);

        const soumissionsGroups = await Promise.all(
          loadedAppels.map((appel) =>
            serviceContractantApi
              .listAppelSoumissions(appel.id_appel_offres)
              .catch(() => [] as Soumission[])
          )
        );

        const flattenedSoumissions = soumissionsGroups.flat();
        const loadedRecours = await serviceContractantApi
          .listRecours()
          .catch(() => [] as Recours[]);

        const filteredContracts = loadedContracts.filter(
          (contrat) => contrat.id_service_contractants === serviceId
        );
        const soumissionIds = new Set(
          flattenedSoumissions.map((s) => s.id_soumission)
        );
        const filteredRecours = loadedRecours.filter((r) =>
          soumissionIds.has(r.id_soumission)
        );

        if (!isMounted) return;

        setAppels(loadedAppels);
        setSoumissionsCount(flattenedSoumissions.length);
        setCommissionsCount(
          loadedCommissions.commissions_evaluation.length +
            loadedCommissions.commissions_internes.length
        );
        setContractsCount(filteredContracts.length);
        setRecoursCount(filteredRecours.length);
      } catch {
        if (!isMounted) return;
        setAppels([]);
        setSoumissionsCount(0);
        setCommissionsCount(0);
        setContractsCount(0);
        setRecoursCount(0);
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  const sortedAppels = useMemo(
    () =>
      [...appels]
        .sort((left, right) => {
          const leftDate = new Date(
            left.updated_at || left.date_publication || 0
          ).getTime();
          const rightDate = new Date(
            right.updated_at || right.date_publication || 0
          ).getTime();
          return rightDate - leftDate;
        })
        .slice(0, 4),
    [appels]
  );

  const dashboardKpis = [
    { label: 'Appels d\'offres', value: String(appels.length) },
    { label: 'Soumissions reçues', value: String(soumissionsCount) },
    { label: 'Commissions actives', value: String(commissionsCount) },
    { label: 'Contrats / recours', value: String(contractsCount + recoursCount) },
  ];

  const activityItems = [
    service
      ? {
          title: `Service #${service.id_service} chargé`,
          badge: { label: 'Service', tone: 'info' as const },
        }
      : null,
    appels[0]
      ? {
          title: `Dernier AO mis à jour : ${appels[0].reference}`,
          badge: { label: 'AO', tone: 'success' as const },
        }
      : null,
    appels.length === 0
      ? {
          title: 'Aucun appel d\'offre encore relié à ce service',
          badge: { label: 'Info', tone: 'gray' as const },
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    badge: { label: string; tone: 'info' | 'success' | 'gray' };
  }>;

  return (
    <>
      <LoadingOrErrorBlock isLoading={isLoading} error={error} />

      <div className={cn(styles.grid, styles.grid4)}>
        {dashboardKpis.map((item) => (
          <div key={item.label} className={styles.kpi}>
            <div className={styles.kpiLabel}>{item.label}</div>
            <div className={styles.kpiValue}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className={cn(styles.grid, styles.split55)} style={{ marginTop: 18 }}>
        <div className={styles.card}>
          <div className={cn(styles.cardHeader, styles.dashboardHeader)}>
            <div>
              <h4>Appels d'offre récents</h4>
            </div>
          </div>
          <div className={styles.cardBodyCompact}>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Titre</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Dates clés</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAppels.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Aucun appel d'offre disponible.</td>
                    </tr>
                  ) : (
                    sortedAppels.map((offer) => (
                      <tr key={offer.id_appel_offres}>
                        <td>
                          <strong>{offer.reference}</strong>
                        </td>
                        <td>{offer.titre}</td>
                        <td>{offer.type_procedure}</td>
                        <td>
                          <Badge badge={toBadgeFromStatus(offer.statut)} compact />
                        </td>
                        <td>
                          Publication {formatDateTime(offer.date_publication)} · Dépôt{' '}
                          {formatDateTime(offer.date_limite_soumission)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Journal d'activité</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.list}>
              {activityItems.map((item, index) => (
                <div key={`${item.title}-${index}`} className={styles.listItem}>
                  <Badge badge={item.badge} compact />
                  <div className={styles.grow}>
                    <strong>{item.title}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}