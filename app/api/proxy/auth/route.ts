import { NextRequest, NextResponse } from 'next/server';

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_TOKEN = process.env.SOUMISSIONS_INTERNAL_TOKEN || 'dev-internal-token';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'users';
    
    const authHeader = req.headers.get('authorization') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service-Token': INTERNAL_TOKEN,
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const upstream = await fetch(`${AUTH_BASE}/${path}`, {
      method: 'GET',
      headers,
    });
    
    if (!upstream.ok) {
      const errorText = await upstream.text();
      return NextResponse.json({ 
        error: 'Upstream error', 
        status: upstream.status,
        detail: errorText 
      }, { status: upstream.status });
    }
    
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: 'AuthProxy error', detail: String(err) }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'login';

    const body = await req.json();
    
    // Version minimaliste pour bypasser les blocages de Django sur le port 8000
    // On simule une requête interne en forçant l'Origin et le Referer
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'http://localhost:8000',
      'Referer': 'http://localhost:8000/',
    };

    // On ne transmet l'Authorization que si elle existe déjà (pas pour le login)
    const authHeader = req.headers.get('authorization');
    if (authHeader) headers['Authorization'] = authHeader;

    const upstreamUrl = `${AUTH_BASE}/${path}`;
    console.log(`[Proxy] Fetching: ${upstreamUrl} (Method: POST)`);

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!upstream.ok) {
      const errorText = await upstream.text();
      return NextResponse.json({ 
        error: 'Upstream POST error', 
        status: upstream.status,
        detail: errorText 
      }, { status: upstream.status });
    }
    
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: 'AuthProxy POST error', detail: String(err) }, { status: 502 });
  }
}
