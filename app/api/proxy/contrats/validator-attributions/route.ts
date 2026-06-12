import { NextRequest, NextResponse } from 'next/server';

const CONTRATS_BASE = process.env.NEXT_PUBLIC_CONTRATS_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const APPELS_BASE = process.env.NEXT_PUBLIC_APPELS_SERVICE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

function normalizeRole(role?: string): string | null {
  if (!role) return null;
  return role.toString().trim().toLowerCase().replace(/\s+/g, '_');
}

function getUserRoleFromAuthDebug(authData: any): string | null {
  if (!authData || typeof authData !== 'object') return null;
  const userAttributes = authData.user_attributes ?? {};
  if (typeof userAttributes === 'object') {
    if (typeof userAttributes.nom_role === 'string') return normalizeRole(userAttributes.nom_role);
    if (typeof userAttributes.id_role === 'string') return normalizeRole(userAttributes.id_role);
    if (typeof userAttributes.role === 'string') return normalizeRole(userAttributes.role);
  }
  return null;
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

  // Prefer explicitly passed queries from the frontend over the authDebug fallbacks
  const actualUserId = userIdQuery || memberQuery || authDebug.data?.user_id || authDebug.data?.id_utilisateur || authDebug.data?.id_membre || null;
  const actualRole = normalizeRole(roleQuery ?? getUserRoleFromAuthDebug(authDebug.data) ?? null);

  const upstreamParams = new URLSearchParams();
  if (actualUserId) {
    upstreamParams.set('user_id', String(actualUserId));
  } else {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const queryString = `?${upstreamParams.toString()}`;
  const upstreamUrl = `${CONTRATS_BASE}/validator-attributions/${queryString}`;

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

  const responsePayload = {
    user_id: actualUserId,
    role: actualRole,
    attributions: contratResponse.data?.attributions || [],
  };

  return NextResponse.json(responsePayload);
}
