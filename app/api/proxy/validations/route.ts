import { NextRequest, NextResponse } from 'next/server';

const CONTRATS_BASE = process.env.NEXT_PUBLIC_CONTRATS_SERVICE_URL || 'http://localhost:8000';
// Token inter-services — doit correspondre à INTERNAL_SERVICE_TOKEN dans deploy/.env
const INTERNAL_TOKEN = process.env.SOUMISSIONS_INTERNAL_TOKEN || 'dev-internal-token';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'validations';

    const authHeader = req.headers.get('authorization') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service-Token': INTERNAL_TOKEN,
      'Origin': 'http://localhost:8000',
      'Referer': 'http://localhost:8000/',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const upstream = await fetch(`${CONTRATS_BASE}/${path}`, {
      method: 'GET',
      headers
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: 'ValidationsProxy error', detail: String(err) }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'validations';

    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service-Token': INTERNAL_TOKEN,
      'Origin': 'http://localhost:8000',
      'Referer': 'http://localhost:8000/',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const upstream = await fetch(`${CONTRATS_BASE}/${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: 'ValidationsProxy POST error', detail: String(err) }, { status: 502 });
  }
}
