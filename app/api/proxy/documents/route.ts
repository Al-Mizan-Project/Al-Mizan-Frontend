import { NextRequest, NextResponse } from 'next/server';

const DOCUMENTS_BASE = process.env.NEXT_PUBLIC_DOCUMENTS_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_TOKEN = process.env.SOUMISSIONS_INTERNAL_TOKEN || 'dev-internal-token';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path'); // ex: documents/1/download-url
    
    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

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

    const upstream = await fetch(`${DOCUMENTS_BASE}/${path}`, {
      method: 'GET',
      headers,
    });
    
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: 'DocumentsProxy error', detail: String(err) }, { status: 502 });
  }
}
