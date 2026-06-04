'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fileRecord } from '@/app/[lang]/validation/types';

type CommissionAppelBackendItem = {
  id: number;
  reference: string;
  economicOperator: string;
  status: 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt';
  statut: string;
  commission_id: number | null;
  created_at: string | null;
  validated_by: number | null;
  validation_deadline: string | null;
  delayDays?: number;
  etape?: string;
  validator?: { id: number; name: string };
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

interface UseCommissionAppelsReturn {
  appels: fileRecord[];
  stats: CommissionDashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  backendResponse: CommissionAppelBackendItem[] | null;
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

function mapToFileRecord(appel: CommissionAppelBackendItem): fileRecord {
  return {
    id: `ID-${appel.id}`,
    rawId: appel.id,
    reference: appel.reference || `Appel ${appel.id}`,
    economicOperator: appel.economicOperator || 'Opérateur non renseigné',
    submissionDate: formatIsoDate(appel.created_at),
    assignmentDate: appel.validated_by ? formatIsoDate(appel.created_at) : undefined,
    validationDeadline: formatIsoDate(appel.validation_deadline),
    status: appel.status ? appel.status : computeStatus(appel),
    etape: appel.etape || 'Évaluation Administrative',
    delayDays: appel.delayDays || 0,
    validator: appel.validator
      ? { name: appel.validator.name, id: String(appel.validator.id) }
      : (appel.validated_by ? { name: `Validateur ${appel.validated_by}`, id: String(appel.validated_by) } : undefined),
  };
}

function computeStatus(appel: CommissionAppelBackendItem): fileRecord['status'] {
  const raw = String(appel.status || appel.statut || '').trim();
  const statut = raw.toLowerCase().replace(/\s+/g, '_');
  const hasValidator = appel.validated_by !== null && appel.validated_by !== undefined;
  const deadline = parseIsoDate(appel.validation_deadline ?? null);
  const now = new Date();

  // Detect presence of a suivi entry using explicit fields only
  const hasSuivi = Boolean(
    (appel as any).has_suivi === true ||
    (appel as any).is_suivi === true ||
    Array.isArray((appel as any).suivis) && (appel as any).suivis.length > 0 ||
    // explicit count field
    ((appel as any).suivi_count && Number((appel as any).suivi_count) > 0) ||
    false
  );

  // Normalized status checks (exact matches)
  const isNonValide = statut === 'non_valide' || statut === 'non-valide' || statut === 'nonvalide';
  const isValide = statut === 'valide' || statut === 'validated' || statut === 'validated_by';
  const isRefuse = statut === 'refuse' || statut === 'refusé' || statut === 'refusee';
  const isFerme = statut === 'ferme' || statut === 'closed';

  // 1) En attente d’affectation: pas de suivi, validated_by NULL et statut = NON_VALIDE
  if (isNonValide && !hasSuivi && !hasValidator) return 'En Attente';


  // 2) En cours de validation: suivi existe, NOW <= deadline, statut = NON_VALIDE
  if (isNonValide && hasSuivi && deadline && now.getTime() <= deadline.getTime()) return 'En Cours';

  // 3) En retard: suivi existe, NOW > deadline, statut = NON_VALIDE
  if (isNonValide && hasSuivi && deadline && now.getTime() > deadline.getTime()) return 'En Retard';

  // 4) Prêt à publier: maintenant > deadline AND statut in (VALIDE, REFUSE, FERME)
  if (deadline && now.getTime() > deadline.getTime() && (isValide || isRefuse || isFerme)) return 'Prêt';

  // Fallbacks: if statut explicitly one of validated/refused/closed, consider Prêt
  if (isValide || isRefuse || isFerme) return 'Prêt';

  // If there's a validator assigned but none of the above rules matched, mark En Cours
  if (hasValidator || hasSuivi) return 'En Cours';

  // Default
  return 'En Attente';
}

function getMemberIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const rawUser = window.localStorage.getItem('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed?.id_membre) return String(parsed.id_membre);
    } catch {
      // ignore invalid JSON
    }
  }
  return window.localStorage.getItem('id_membre');
}

function getUserIdFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const rawUser = window.localStorage.getItem('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed?.id_utilisateur) return String(parsed.id_utilisateur);
      if (parsed?.user_id) return String(parsed.user_id);
    } catch {
      // ignore invalid JSON
    }
  }
  return window.localStorage.getItem('user_id');
}

function getUserRoleFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  const rawUser = window.localStorage.getItem('user');
  if (!rawUser) return null;
  try {
    const parsed = JSON.parse(rawUser);
    return parsed?.role ? String(parsed.role).toUpperCase() : null;
  } catch {
    return null;
  }
}

function buildRequestPath(userRole: string | null, userId: string | null, memberId: string | null): string {
  const params = new URLSearchParams();
  params.append('path', 'appels-offres/commission/dossiers');
  if (userRole) params.append('role', userRole.toUpperCase());
  if (memberId) params.append('membre_id', memberId);
  if (userId) params.append('user_id', userId);
  return `/api/proxy/appels?${params.toString()}`;
}

export function useCommissionAppels(): UseCommissionAppelsReturn {
  const { token, user, isLoading: authLoading } = useAuth();
  const [appels, setAppels] = useState<fileRecord[]>([]);
  const [stats, setStats] = useState<CommissionDashboardStats | null>(null);
  const [backendResponse, setBackendResponse] = useState<CommissionAppelBackendItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppels = useCallback(async () => {
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
      const memberId = user?.id_membre ? String(user.id_membre) : getMemberIdFromStorage();
      const userId = user?.id_utilisateur ? String(user.id_utilisateur) : (user?.id ? String(user.id) : getUserIdFromStorage());
      const userRole = user?.role ? String(user.role) : getUserRoleFromStorage();
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

      const data: any = await response.json();

      // Handle both direct appels array or nested structure
      const appelsArray = Array.isArray(data?.appels)
        ? data.appels
        : (Array.isArray(data?.data?.appels) ? data.data.appels : []);

      if (!Array.isArray(appelsArray)) {
        throw new Error('Le format de réponse de l’API est invalide.');
      }

      setBackendResponse(appelsArray);
      const records = appelsArray.map((item) => mapToFileRecord(item));
      setAppels(records);

      if (data?.stats && typeof data.stats === 'object') {
        setStats(data.stats);
      } else {
        setStats(computeStats(records));
      }
    } catch (err: any) {
      setError(err?.message || 'Impossible de charger les appels d\'offres.');
      setAppels([]);
      setStats(null);
      setBackendResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, authLoading]);

  useEffect(() => {
    fetchAppels();
  }, [fetchAppels]);

  return { appels, stats, isLoading, error, refresh: fetchAppels, backendResponse };
}
