import { NextRequest, NextResponse } from 'next/server';

// URL du backend unifié (Nginx Gateway)
const SOUMISSIONS_BASE = process.env.NEXT_PUBLIC_SOUMISSIONS_SERVICE_URL || 'http://localhost:8000';
// Token inter-services — doit correspondre à INTERNAL_SERVICE_TOKEN dans deploy/.env
const INTERNAL_TOKEN = process.env.SOUMISSIONS_INTERNAL_TOKEN || 'dev-internal-token';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'soumissions';

    const authHeader = req.headers.get('authorization') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service-Token': INTERNAL_TOKEN,
      'Origin': 'http://localhost:8000',
      'Referer': 'http://localhost:8000/',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const upstream = await fetch(`${SOUMISSIONS_BASE}/${path}`, {
      method: 'GET',
      headers,
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: 'SoumissionsProxy error', detail: String(err) }, { status: 502 });
  }
}
