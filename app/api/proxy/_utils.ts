import { NextRequest, NextResponse } from 'next/server';

interface ProxyOptions {
  baseUrl: string;
  defaultPath?: string;
  requirePath?: boolean;
  errorLabel: string;
  includeInternalToken?: boolean;
  internalTokenEnvVar?: string;
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

async function buildRequestInit(req: NextRequest, method: string, includeInternalToken: boolean, internalTokenEnvVar?: string) {
  const authHeader = req.headers.get('authorization');
  const contentType = req.headers.get('content-type');
  const headers: Record<string, string> = {
    Accept: req.headers.get('accept') || 'application/json',
    // propagate origin if provided by the browser (avoid hardcoded host)
    ...(req.headers.get('origin') ? { Origin: req.headers.get('origin')! } : {}),
    ...(req.headers.get('referer') ? { Referer: req.headers.get('referer')! } : {}),
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (includeInternalToken) {
    const token = internalTokenEnvVar ? process.env[internalTokenEnvVar] : process.env.SOUMISSIONS_INTERNAL_TOKEN;
    headers['X-Internal-Service-Token'] = token || 'dev-internal-token';
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
  const setCookie = upstream.headers.get('set-cookie');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  if (setCookie) {
    headers.set('Set-Cookie', setCookie);
  }

  return new NextResponse(payload, {
    status: upstream.status,
    headers,
  });
}

function buildBinaryProxyResponse(upstream: Response, body: ArrayBuffer) {
  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  const contentDisposition = upstream.headers.get('content-disposition');
  const contentLength = upstream.headers.get('content-length');
  const setCookie = upstream.headers.get('set-cookie');

  if (contentType) headers.set('Content-Type', contentType);
  if (contentDisposition) headers.set('Content-Disposition', contentDisposition);
  if (contentLength) headers.set('Content-Length', contentLength);
  if (setCookie) headers.set('Set-Cookie', setCookie);

  return new NextResponse(body, {
    status: upstream.status,
    headers,
  });
}

function isBinaryResponse(upstream: Response): boolean {
  const contentType = upstream.headers.get('content-type') || '';
  const contentDisposition = upstream.headers.get('content-disposition') || '';
  // If there's an attachment disposition or a non-text/json content type, treat as binary
  if (contentDisposition.includes('attachment')) return true;
  if (contentType.includes('application/json') || contentType.includes('text/')) return false;
  if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf') || contentType.includes('application/zip')) return true;
  return false;
}

export async function proxyRequest(req: NextRequest, method: string, options: ProxyOptions) {
  let upstreamUrl: string | null = null;
  try {
    upstreamUrl = buildUpstreamUrl(
      req,
      options.baseUrl,
      options.defaultPath,
      options.requirePath
    );

    if (!upstreamUrl) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

    const requestInit = await buildRequestInit(req, method, options.includeInternalToken !== false, options.internalTokenEnvVar);

    const upstream = await fetch(
      upstreamUrl,
      requestInit
    );

    if (upstream.status === 204) {
      return new NextResponse(null, { status: upstream.status });
    }

    // Handle binary file downloads (StreamingHttpResponse from Django)
    if (isBinaryResponse(upstream)) {
      const body = await upstream.arrayBuffer();
      return buildBinaryProxyResponse(upstream, body);
    }

    const payload = await upstream.text();
    return buildProxyResponse(upstream, payload);
  } catch (error) {
    const urlForLogging = upstreamUrl || 'unknown URL';
    return NextResponse.json(
      {
        error: `${options.errorLabel} error`,
        detail: `${method} ${urlForLogging}: ${String(error)}`,
      },
      { status: 502 }
    );
  }
}
