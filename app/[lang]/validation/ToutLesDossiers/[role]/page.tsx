'use client';

import { useState, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DossiersFilters from '../../components/ToutLesDossiers/DossierFilters';
import FilesTable from '../../components/dashboard/FilesTable';
import { fileRecord } from '../../types';
import { useAuth } from '../../../../../contexts/AuthContext';
import { appelsApi } from '@/lib/api/appels';

type UserRole = 'commission' | 'validator';

interface DossierPageProps {
  params: {
    lang: string;
    role: string;
  };
}

interface FilterState {
  search: string;
  validateur: string;
  domaine: string;
  status: string;
  periode: string;
}

interface AttributionBackendItem {
  id: number;
  service_contractant_id: number | null;
  soumission_id: number | null;
  appel_id: number | null;
  commission_id: string | number | null;
  validated_by: number | null;
  validation_level: string;
  statut: string;
  created_at: string | null;
  updated_at: string | null;
  deadline_validation?: string | null;
  soumission?: any | null;
}

function parseIsoDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatIsoDate(iso?: string | null): string {
  const date = parseIsoDate(iso);
  return date ? date.toISOString().split('T')[0] : '-';
}

function computeStatus(attribution: AttributionBackendItem): fileRecord['status'] {
  const statut = String(attribution.statut || '').toLowerCase();
  const hasValidator = attribution.validated_by !== null && attribution.validated_by !== undefined;

  if (statut === 'definitive' && hasValidator) {
    return 'Prêt';
  }

  const deadline = parseIsoDate(attribution.deadline_validation ?? null);
  if (deadline && deadline.getTime() < Date.now()) {
    return 'En Retard';
  }

  if (!hasValidator) {
    return 'En Attente';
  }

  const updatedAt = parseIsoDate(attribution.updated_at);
  if (updatedAt) {
    const createdAt = parseIsoDate(attribution.created_at);
    const ageDays = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return ageDays > 7 ? 'En Retard' : 'En Cours';
  }

  return 'En Cours';
}

function mapToFileRecord(attribution: AttributionBackendItem): fileRecord {
  const createdAt = parseIsoDate(attribution.created_at);
  const deadline = parseIsoDate(attribution.deadline_validation ?? null);
  const now = new Date();
  const ageDays = createdAt ? Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const status = computeStatus(attribution);
  const delayDays = status === 'En Retard'
    ? deadline
      ? Math.max(0, Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)))
      : Math.max(0, ageDays - 7)
    : 0;

  const soumissionaireLabel = attribution.soumission && (typeof attribution.soumission === 'object')
    ? (`Soumissionaire #${(attribution.soumission as any).id_soumissionnaire ?? attribution.soumission_id}`)
    : (attribution.soumission_id ? `Soumission #${attribution.soumission_id}` : 'Soumissionnaire inconnu');

  return {
    id: `ID-${attribution.soumission_id ?? 'unknown'}`,
    rawId: attribution.soumission_id ?? undefined,
    reference: `Soumission ${attribution.soumission_id ?? attribution.appel_id ?? 'N/A'}`,
    economicOperator: soumissionaireLabel,
    submissionDate: formatIsoDate(attribution.created_at),
    assignmentDate: attribution.validated_by ? formatIsoDate(attribution.updated_at) : undefined,
    validationDeadline: attribution.deadline_validation ? formatIsoDate(attribution.deadline_validation) : '7 jours',
    status,
    etape: 'Validation',
    delayDays,
    validator: attribution.validated_by ? { name: `Membre ${attribution.validated_by}`, id: `#${attribution.validated_by}` } : undefined,
  };
}

function getUserIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const rawUser = window.localStorage.getItem('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      // Prefer numeric id_utilisateur for backend filtering (validated_by is IntegerField)
      if (parsed?.id_utilisateur) return String(parsed.id_utilisateur);
      if (parsed?.user_id) return String(parsed.user_id);
      if (parsed?.id) return String(parsed.id);
    } catch {
      // ignore invalid JSON
    }
  }
  return window.localStorage.getItem('id_utilisateur') || window.localStorage.getItem('user_id');
}

function getUserRoleFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const rawUser = window.localStorage.getItem('user');
  if (!rawUser) return null;
  try {
    const parsed = JSON.parse(rawUser);
    return parsed?.role ? String(parsed.role) : null;
  } catch {
    return null;
  }
}

function buildRequestPath(userRole: string | null, userId: string | null, membreId: string | null): string {
  let path = '/api/proxy/contrats/user-attributions';
  const params = new URLSearchParams();
  if (userRole) params.append('role', userRole);
  if (userId) params.append('user_id', userId);
  if (membreId) params.append('membre_id', membreId);
  const queryString = params.toString();
  if (queryString) {
    path += `?${queryString}`;
  }
  return path;
}

export default function DossierPage({ params }: DossierPageProps) {

  const { lang, role } = use(params as any) as DossierPageProps['params'];
  const router = useRouter();
  const { token, user } = useAuth();

  const userRole = (role as UserRole) || 'validator';
  const isCommission = userRole === 'commission';

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    validateur: '',
    domaine: '',
    status: '',
    periode: '',
  });
  const [allDossiers, setAllDossiers] = useState<fileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dossiers from API
  useEffect(() => {
    const fetchDossiers = async () => {
      const fallbackToken = typeof window !== 'undefined'
        ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token')
        : null;
      const effectiveToken = token || fallbackToken;

      if (!effectiveToken) {
        setError('Authentification requise. Veuillez vous reconnecter.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const CURRENT_VALIDATOR_ID = user?.id_utilisateur ?? user?.id ?? user?.id_membre ?? getUserIdFromStorage();
        if (!CURRENT_VALIDATOR_ID) {
          throw new Error('Impossible de déterminer l\'identifiant du validateur.');
        }

        const roleStr = String(user?.nom_role || user?.role || getUserRoleFromStorage() || '').toUpperCase();

        if (roleStr.includes('CDC')) {
          // ===============================
          // LOGIQUE CDC (Appels d'offres)
          // ===============================
          const appelsRaw = await appelsApi.getAppelsByValidatedBy(CURRENT_VALIDATOR_ID);
          const appels: any[] = Array.isArray(appelsRaw) ? appelsRaw : (appelsRaw as any).results ?? [];

          const validatorSubmissions: fileRecord[] = appels.map((appel: any) => {
            return {
              id: `ID-${String(appel.id_appel_offres).padStart(3, '0')}`,
              rawId: appel.id_appel_offres,
              reference: appel.reference || `Appel ${appel.id_appel_offres}`,
              economicOperator: appel.wilaya || appel.type_procedure || 'Appel d\'offre',
              validator: {
                name: `Moi (Expert #${CURRENT_VALIDATOR_ID})`,
                id: `VAL-${String(appel.validated_by ?? CURRENT_VALIDATOR_ID)}`,
              },
              submissionDate: appel.created_at ? new Date(appel.created_at).toISOString().split('T')[0] : '-',
              assignmentDate: appel.assignmentDate ? new Date(appel.assignmentDate).toISOString().split('T')[0] : undefined,
              validationDeadline: appel.validationDeadline ? new Date(appel.validationDeadline).toISOString().split('T')[0] : '7 jours',
              status: appel.status || 'En Cours',
              delayDays: appel.delayDays > 0 ? appel.delayDays : 0,
              etape: 'Validation',
            };
          });
          setAllDossiers(validatorSubmissions);
        } else {
          // ===============================
          // LOGIQUE MARCHE (Attributions)
          // ===============================
          const requestPath = `/api/proxy/contrats/validator-attributions?user_id=${CURRENT_VALIDATOR_ID}`;
          
          const response = await fetch(requestPath, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${effectiveToken.trim()}`,
            },
            cache: 'no-store',
          });

          if (response.status === 401) {
            throw new Error('401 Unauthorized from upstream service');
          }

          if (!response.ok) {
            const body = await response.text();
            let parsed = body;
            try {
              const json = JSON.parse(body);
              parsed = json.detail || json.error || body;
            } catch {
              parsed = body;
            }
            throw new Error(parsed || `Erreur HTTP ${response.status}`);
          }

          const data = await response.json();
          const attributions: AttributionBackendItem[] = Array.isArray(data?.attributions) ? data.attributions : [];
          
          const allRecords = attributions.map((item) => mapToFileRecord(item));
          setAllDossiers(allRecords);
        }

      } catch (err: any) {
        setError(err?.message || 'Impossible de charger les dossiers.');
        setAllDossiers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDossiers();
  }, [token, user]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const exportToCsv = (rows: fileRecord[]) => {
    const headers = ['Dossier', 'ID', 'Opérateur Économique', 'Étape', 'Date de soumission', 'Délai de validation', 'Statut'];
    const csv = [
      headers.join(','),
      ...rows.map((row) => [
        `"${row.reference}"`,
        `"${row.id}"`,
        `"${row.economicOperator}"`,
        `"${row.etape ?? ''}"`,
        `"${row.submissionDate ?? ''}"`,
        `"${row.validationDeadline ?? ''}"`,
        `"${row.status}"`,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossiers-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    exportToCsv(filteredData);
  };

  const filteredData = useMemo(() => {
    const statusMap: Record<string, fileRecord['status']> = {
      'en-attente': 'En Attente',
      'en-cours': 'En Cours',
      'en-retard': 'En Retard',
      pret: 'Prêt',
    };

    return allDossiers.filter((item) => {
      const searchTerm = filters.search?.trim().toLowerCase() || '';
      if (searchTerm) {
        const matchesReference = item.reference.toLowerCase().includes(searchTerm);
        const matchesOperator = item.economicOperator.toLowerCase().includes(searchTerm);
        const matchesStatus = item.status.toLowerCase().includes(searchTerm);
        const matchesValidator = item.validator?.name.toLowerCase().includes(searchTerm) || false;
        if (!(matchesReference || matchesOperator || matchesStatus || matchesValidator)) {
          return false;
        }
      }

      if (filters.validateur) {
        const validatorName = item.validator?.name?.toLowerCase() || '';
        if (!validatorName.includes(filters.validateur.toLowerCase())) {
          return false;
        }
      }

      if (filters.status) {
        const targetStatus = statusMap[filters.status];
        if (targetStatus && item.status !== targetStatus) {
          return false;
        }
      }

      if (filters.periode && item.submissionDate) {
        const today = new Date();
        const submissionDate = new Date(item.submissionDate);
        if (filters.periode === 'today') {
          if (
            submissionDate.getFullYear() !== today.getFullYear() ||
            submissionDate.getMonth() !== today.getMonth() ||
            submissionDate.getDate() !== today.getDate()
          ) {
            return false;
          }
        }
        if (filters.periode === 'week') {
          const diffDays = Math.floor((today.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0 || diffDays > 7) return false;
        }
        if (filters.periode === 'month') {
          if (
            submissionDate.getFullYear() !== today.getFullYear() ||
            submissionDate.getMonth() !== today.getMonth()
          ) {
            return false;
          }
        }
        if (filters.periode === 'year') {
          if (submissionDate.getFullYear() !== today.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [filters, allDossiers]);

  const hasResults = filteredData.length > 0;

  const getFirstValidStatus = (): 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt' => {
    if (!hasResults) return 'En Attente';
    const status = filteredData[0]?.status;
    if (status === 'En Attente' || status === 'En Cours' || status === 'En Retard' || status === 'Prêt') {
      return status;
    }
    return 'En Attente';
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="val-empty-icon">
          <svg className="w-16 h-16 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">Erreur lors du chargement des données</h2>
        <p className="text-sm text-gray-400 max-w-md text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="val-reset-button">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="val-dossiers-page">

      <DossiersFilters
        onFiltersChange={handleFiltersChange}
        hasResults={hasResults}
        onExport={handleExport}
      />

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">Chargement des données...</div>
      ) : (hasResults && filteredData.length > 0 ? (

        <div className="val-table-wrapper">
          <FilesTable
            data={filteredData}
            status={getFirstValidStatus()}
            lang={lang}
            viewMode={isCommission ? 'standard' : 'validateur'}
            onAction={(dossier: any) => {
              const dossierId = dossier.rawId || dossier.id.replace('ID-', '');
              if (dossier.status === 'Prêt') {
                router.push(`/${lang}/validation/dossier/${dossierId}/commission?action=transmettre`);
              } else if (dossier.status === 'En Attente') {
                router.push(`/${lang}/validation/AffectationSoumission/${dossierId}`);
              } else {
                router.push(`/${lang}/validation/AffectationSoumission/${dossierId}`);
              }
            }}
            onView={(dossier: any) => {
              const dossierId = dossier.rawId || dossier.id.replace('ID-', '');
              router.push(`/${lang}/validation/dossier/${dossierId}`);
            }}
          />
        </div>

      ) : (

        <div className="val-empty-state">

          <div className="val-empty-icon">
            <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="val-empty-title">Aucun résultat trouvé</h2>

          <p className="val-empty-text">
            Nous n'avons trouvé aucun dossier correspondant à votre recherche.
          </p>

          <button
            onClick={() => {
              setFilters({
                search: '',
                validateur: '',
                domaine: '',
                status: '',
                periode: '',
              });
            }}
            className="val-reset-button"
          >
            Réinitialiser les filtres
          </button>

        </div>

      ))}

    </div>
  );
}
