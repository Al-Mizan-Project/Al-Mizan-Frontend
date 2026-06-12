import { NextRequest, NextResponse } from 'next/server';

interface ProxyOptions {
  baseUrl: string;
  defaultPath?: string;
  requirePath?: boolean;
  errorLabel: string;
  includeInternalToken?: boolean;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

function buildUpstreamUrl(req: NextRequest, baseUrl: string, defaultPath?: string, requirePath?: boolean) {
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get('path') || defaultPath;

  if (!path && requirePath) {
    return null;
  }

  const upstreamUrl = new URL(path || '', `${normalizeBaseUrl(baseUrl)}/`);

  for (const [key, value] of requestUrl.searchParams.entries()) {
    if (key === 'path') {
      continue;
    }
    upstreamUrl.searchParams.append(key, value);
  }

  return upstreamUrl.toString();
}

async function buildRequestInit(req: NextRequest, method: string, includeInternalToken: boolean) {
  const authHeader = req.headers.get('authorization');
  const contentType = req.headers.get('content-type');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Origin: 'http://localhost:8080',
    Referer: 'http://localhost:8080/',
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  if (includeInternalToken) {
    headers['X-Internal-Service-Token'] =
      process.env.SOUMISSIONS_INTERNAL_TOKEN || 'dev-internal-token';
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(method)) {
    const body = await req.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  return init;
}

function buildProxyResponse(upstream: Response, payload: string) {
  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  return new NextResponse(payload, {
    status: upstream.status,
    headers,
  });
}

export async function proxyRequest(req: NextRequest, method: string, options: ProxyOptions) {
  try {
    const upstreamUrl = buildUpstreamUrl(
      req,
      options.baseUrl,
      options.defaultPath,
      options.requirePath
    );

    if (!upstreamUrl) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000); // 3 min for OCR

    const upstream = await fetch(
      upstreamUrl,
      {
        ...await buildRequestInit(req, method, options.includeInternalToken !== false),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (upstream.status === 204) {
      return new NextResponse(null, { status: upstream.status });
    }

    const payload = await upstream.text();
    return buildProxyResponse(upstream, payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: `${options.errorLabel} error`,
        detail: String(error),
      },
      { status: 502 }
    );
  }
}
