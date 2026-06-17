import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONTRATS_BASE = process.env.NEXT_PUBLIC_CONTRATS_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const SOUMISSIONS_BASE = process.env.NEXT_PUBLIC_SOUMISSIONS_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const APPELS_BASE = process.env.NEXT_PUBLIC_APPELS_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const EXTERNAL_VALIDATION_LEVELS = [
  'externe_wilaya',
  'externe_secteur',
  'externe_nationale',
] as const;

type ExternalValidationLevel = (typeof EXTERNAL_VALIDATION_LEVELS)[number];

type AttributionApiItem = {
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
  [key: string]: unknown;
};

function normalizeRole(role?: string): string | null {
  if (!role) return null;
  return role.toString().trim().toLowerCase().replace(/\s+/g, '_');
}

function getUserRoleFromAuthDebug(authData: any): string | null {
  if (!authData || typeof authData !== 'object') return null;
  if (typeof authData.user_email === 'string' && authData.user_email.includes('@')) {
    // Not enough role information here.
  }
  const userAttributes = authData.user_attributes ?? {};
  if (typeof userAttributes === 'object') {
    if (typeof userAttributes.nom_role === 'string') {
      return normalizeRole(userAttributes.nom_role);
    }
    if (typeof userAttributes.id_role === 'string') {
      return normalizeRole(userAttributes.id_role);
    }
    if (typeof userAttributes.role === 'string') {
      return normalizeRole(userAttributes.role);
    }
  }
  return null;
}

function parseIsoDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeAttributionStatus(attribution: AttributionApiItem): 'En Attente' | 'En Cours' | 'En Retard' | 'Prêt' {
  const statut = String(attribution.statut || '').toLowerCase();
  const hasValidator = attribution.validated_by !== null && attribution.validated_by !== undefined;

  if (statut === 'definitive' && hasValidator) {
    return 'Prêt';
  }

  // Prioritize deadline: even if no validator, a passed deadline means "En Retard"
  const deadline = parseIsoDate(attribution.deadline_validation ?? null);
  if (deadline && deadline.getTime() < Date.now()) {
    return 'En Retard';
  }

  if (!hasValidator) {
    return 'En Attente';
  }

  // Use creation date age to decide "En Retard" so older submissions are considered late
  const createdAt = parseIsoDate(attribution.created_at);
  if (createdAt) {
    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return ageDays > 7 ? 'En Retard' : 'En Cours';
  }

  return 'En Cours';
}

function buildInternalServiceHeaders(authHeader: string | null): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authHeader) {
    headers.Authorization = authHeader;
  }
  const internalToken = process.env.SOUMISSIONS_INTERNAL_TOKEN;
  if (internalToken) {
    headers['X-Internal-Service-Token'] = internalToken;
  }
  return headers;
}

async function writeDebugBackendResponse(data: unknown) {
  try {
    const debugFile = path.join(process.cwd(), 'app', '[lang]', 'debug_backend_response.json');
    const json = JSON.stringify(data, null, 2) + '\n';
    await fs.writeFile(debugFile, json, 'utf-8');
  } catch (error) {
    console.warn('Unable to write debug backend response file:', error);
  }
}

async function fetchJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();
  try {
    return { ok: response.ok, status: response.status, data: JSON.parse(text), text };
  } catch {
    return { ok: response.ok, status: response.status, data: null, text };
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const roleQuery = requestUrl.searchParams.get('role') ?? undefined;
  const memberQuery = requestUrl.searchParams.get('membre_id') ?? undefined;
  const userIdQuery = requestUrl.searchParams.get('user_id') ?? undefined;

  const authDebug = await fetchJson(`${APPELS_BASE}/debug/auth`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: authHeader },
  });

  const actualUserId = userIdQuery || authDebug.data?.user_id || authDebug.data?.id_utilisateur || null;
  const actualMemberId = memberQuery || authDebug.data?.id_membre || null;
  const actualRole = normalizeRole(roleQuery ?? getUserRoleFromAuthDebug(authDebug.data) ?? undefined);

  const upstreamParams = new URLSearchParams();
  if (actualRole?.includes('resp_valid_intern')) {
    upstreamParams.set('validation_level', 'interne');
  }
  if (actualMemberId) {
    upstreamParams.set('user_id', String(actualMemberId));
  } else if (actualUserId) {
    upstreamParams.set('user_id', String(actualUserId));
  }

  const queryString = upstreamParams.toString() ? `?${upstreamParams.toString()}` : '';
  const upstreamUrl = `${CONTRATS_BASE}/attributions-provisoires/${queryString}`;

  const contratResponse = await fetchJson(upstreamUrl, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: authHeader },
  });

  if (!contratResponse.ok) {
    return NextResponse.json(
      {
        error: 'Unable to retrieve attributions from contrats service',
        status: contratResponse.status,
        detail: contratResponse.text,
      },
      { status: contratResponse.status || 502 },
    );
  }

  const provisionalAttributions = Array.isArray(contratResponse.data)
    ? (contratResponse.data as AttributionApiItem[])
    : [];

  const definitiveUrl = `${CONTRATS_BASE}/attributions-definitives/${queryString}`;
  let definitiveAttributions: AttributionApiItem[] = [];
  try {
    const defResp = await fetchJson(definitiveUrl, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: authHeader },
    });
    if (defResp.ok && Array.isArray(defResp.data)) {
      definitiveAttributions = defResp.data as AttributionApiItem[];
    }
  } catch (err) {
    console.warn('Failed to fetch definitive attributions', err);
  }

  const byId: Record<number, AttributionApiItem> = {};
  [...provisionalAttributions, ...definitiveAttributions].forEach((a) => {
    if (a && typeof a.id === 'number') byId[a.id] = a;
  });
  const rawAttributions = Object.values(byId);
  const filteredAttributions = rawAttributions.filter((attr) => {
    if (!actualRole) return true;
    if (actualRole.includes('resp_valid_intern')) {
      return String(attr.validation_level).toLowerCase() === 'interne';
    }
    return EXTERNAL_VALIDATION_LEVELS.includes(attr.validation_level as ExternalValidationLevel);
  });

  const soumissionIds = Array.from(
    new Set(filteredAttributions.map((attr) => attr.soumission_id).filter((id): id is number => Number.isInteger(id))),
  );

  const soumissionMap: Record<number, unknown> = {};
  await Promise.all(
    soumissionIds.map(async (soumissionId) => {
      const soumissionUrl = `${SOUMISSIONS_BASE}/api/soumissions/${soumissionId}/`;
      try {
        const soumissionResponse = await fetchJson(soumissionUrl, {
          method: 'GET',
          headers: buildInternalServiceHeaders(authHeader),
        });
        if (soumissionResponse.ok && soumissionResponse.data) {
          soumissionMap[soumissionId] = soumissionResponse.data;
        }
      } catch (error) {
        console.warn('Failed to fetch soumission details', error);
      }
    }),
  );

  const enrichedAttributions = filteredAttributions.map((attribution) => ({
    ...attribution,
    status: computeAttributionStatus(attribution),
    soumission: attribution.soumission_id ? soumissionMap[attribution.soumission_id] ?? null : null,
  }));

  const responsePayload = {
    user_id: actualUserId,
    role: actualRole,
    membre_id: actualMemberId,
    attributions: enrichedAttributions,
  };

  void writeDebugBackendResponse(responsePayload);

  return NextResponse.json(responsePayload);
}
