'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fileRecord } from '@/app/[lang]/validation/types';

type AttributionBackendItem = {
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
};

interface CommissionDashboardStats {
  enAttente: number;
  enCours: number;
  enRetard: number;
  pret: number;
  enAttentePct: number;
  enCoursPct: number;
  enRetardPct: number;
  pretPct: number;
}

interface UseCommissionAttributionsReturn {
  appels: fileRecord[];
  stats: CommissionDashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  backendResponse: AttributionBackendItem[] | null;
  onePerState: fileRecord[];
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

function computeStats(files: fileRecord[]): CommissionDashboardStats {
  const enAttente = files.filter((file) => file.status === 'En Attente').length;
  const enCours = files.filter((file) => file.status === 'En Cours').length;
  const enRetard = files.filter((file) => file.status === 'En Retard').length;
  const pret = files.filter((file) => file.status === 'Prêt').length;
  const total = enAttente + enCours + enRetard + pret;

  const percent = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return {
    enAttente,
    enCours,
    enRetard,
    pret,
    enAttentePct: percent(enAttente),
    enCoursPct: percent(enCours),
    enRetardPct: percent(enRetard),
    pretPct: percent(pret),
  };
}

function computeStatus(attribution: AttributionBackendItem): fileRecord['status'] {
  const statut = String(attribution.statut || '').toLowerCase();
  const hasValidator = attribution.validated_by !== null && attribution.validated_by !== undefined;

  if (statut === 'definitive' && hasValidator) {
    return 'Prêt';
  }

  // Prioritize deadline check: mark as En Retard if deadline passed, even without validator
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

  const soumissionaireLabel = attribution.soumission && typeof attribution.soumission === 'object' && attribution.soumission.nom_operateur
    ? attribution.soumission.nom_operateur
    : (attribution.soumission && typeof attribution.soumission === 'object'
        ? (`Soumissionaire #${(attribution.soumission as any).id_soumissionnaire ?? attribution.soumission_id}`)
        : (attribution.soumission_id ? `Soumission #${attribution.soumission_id}` : 'Soumissionnaire inconnu'));

  return {
    id: `ID-${attribution.soumission_id ?? 'unknown'}`,
    rawId: attribution.soumission_id ?? undefined,
    reference: `Soumission ${attribution.soumission_id ?? attribution.appel_id ?? 'N/A'}`,
    economicOperator: soumissionaireLabel,
    submissionDate: formatIsoDate(attribution.created_at),
    assignmentDate: attribution.validated_by ? formatIsoDate(attribution.updated_at) : undefined,
    validationDeadline: attribution.deadline_validation ? formatIsoDate(attribution.deadline_validation) : '7 jours',
    status,
    etape: attribution.validation_level === 'interne' ? ('Évaluation' as any) : ('Évaluation' as any),
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
      if (parsed?.id_membre) return String(parsed.id_membre);
      if (parsed?.user_id) return String(parsed.user_id);
    } catch {
      // ignore invalid JSON
    }
  }
  return window.localStorage.getItem('id_membre') || window.localStorage.getItem('user_id');
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

function useCommissionAttributions(): UseCommissionAttributionsReturn {
  const { token, user, isLoading: authLoading } = useAuth();
  const [appels, setAppels] = useState<fileRecord[]>([]);
  const [stats, setStats] = useState<CommissionDashboardStats | null>(null);
  const [backendResponse, setBackendResponse] = useState<AttributionBackendItem[] | null>(null);
  const [onePerState, setOnePerState] = useState<fileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDossiers = useCallback(async () => {
    const fallbackToken = typeof window !== 'undefined'
      ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token')
      : null;
    const effectiveToken = token || fallbackToken;

    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!effectiveToken) {
      setError('Authentification requise. Veuillez vous reconnecter.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = user?.id_membre ? String(user.id_membre) : getUserIdFromStorage();
      const userRole = user?.role ? String(user.role) : getUserRoleFromStorage();
      const memberId = user?.id_membre ? String(user.id_membre) : getUserIdFromStorage();
      const requestPath = buildRequestPath(userRole, userId, memberId);
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
      setBackendResponse(attributions);

      const recordsWithMeta = attributions.map((item) => ({
        record: mapToFileRecord(item),
        updated_at: item.updated_at || item.created_at || '',
      }));

      const latestByStatus: Record<string, { rec: fileRecord; updated_at: string }> = {};
      recordsWithMeta.forEach(({ record, updated_at }) => {
        const key = record.status;
        if (!latestByStatus[key] || new Date(updated_at) > new Date(latestByStatus[key].updated_at)) {
          latestByStatus[key] = { rec: record, updated_at };
        }
      });

      const onePerStateRecords = Object.values(latestByStatus).map((v) => v.rec);
      setOnePerState(onePerStateRecords);
      setAppels(onePerStateRecords);
      setStats(computeStats(onePerStateRecords));
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger les dossiers.');
      setAppels([]);
      setStats(null);
      setBackendResponse(null);
      setOnePerState([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, authLoading]);

  useEffect(() => { fetchDossiers(); }, [fetchDossiers]);

  return { appels, stats, isLoading, error, refresh: fetchDossiers, backendResponse, onePerState };
}

export function useCommissionUserAttributions() {
  return useCommissionAttributions();
}
