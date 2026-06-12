import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';

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

const DEBUG_RESPONSE_FILE = path.resolve(process.cwd(), 'app', '[lang]', 'debug_backend_response_2.json');
const CONTRACTANT_MEMBRES_DEBUG_FILE = path.resolve(process.cwd(), 'app', '[lang]', 'debug_contractant_membres_pour_utilisateur.json');

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

async function _writeDebugResponseIfNeeded(req: NextRequest, payload: string) {
  const requestUrl = new URL(req.url);
  const debugPath = requestUrl.searchParams.get('path');
  if (!debugPath) {
    return;
  }

  const debugWriteMap: Record<string, string> = {
    'appels-offres/commission-interne/dossiers': DEBUG_RESPONSE_FILE,
    'appels-offres/commission-externe/dossiers': DEBUG_RESPONSE_FILE,
    'services-contractants/1/commissions/membres-pour-utilisateur': CONTRACTANT_MEMBRES_DEBUG_FILE,
  };

  const debugFile = debugWriteMap[debugPath || ''];
  if (!debugFile) {
    return;
  }

  try {
    await mkdir(path.dirname(debugFile), { recursive: true });
    await writeFile(debugFile, payload, 'utf8');
    console.log(`[PROXY DEBUG] wrote response to ${debugFile}`);
  } catch (error) {
    console.error(`[PROXY DEBUG ERROR] unable to write debug file: ${error}`);
  }
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

async function _tryReadDebugResponseFile(debugPath: string | null): Promise<string | null> {
  if (!debugPath) {
    return null;
  }

  // Map paths to debug files
  const debugFileMapping: Record<string, string> = {
    'appels-offres/commission/dossiers': 'debug_backend_response_3.json',
    'appels-offres/commission-interne/dossiers': 'debug_backend_response_2.json',
    'appels-offres/commission-externe/dossiers': 'debug_backend_response_2.json',
  };

  const debugFileName = debugFileMapping[debugPath];
  if (!debugFileName) {
    return null;
  }

  // Only serve debug responses for legacy commission-interne/externe endpoints.
  // The unified commission endpoint must call the real backend.
  if (debugPath === 'appels-offres/commission/dossiers') {
    return null;
  }

  try {
    const debugFile = path.resolve(process.cwd(), 'app', '[lang]', debugFileName);
    const payload = await readFile(debugFile, 'utf8');
    console.log(`[PROXY DEBUG] serving response from ${debugFileName}`);
    return payload;
  } catch (error) {
    // File doesn't exist, proceed with normal proxy
    return null;
  }
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

    const requestUrl = new URL(req.url);
    const debugPath = requestUrl.searchParams.get('path');

    // Try to serve from debug file first
    if (method === 'GET') {
      const debugPayload = await _tryReadDebugResponseFile(debugPath);
      if (debugPayload) {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        return new NextResponse(debugPayload, {
          status: 200,
          headers,
        });
      }
    }

    const requestInit = await buildRequestInit(req, method, options.includeInternalToken !== false, options.internalTokenEnvVar);
    
    // Debug logging
    const requestInitHeaders = requestInit.headers as Record<string, string>;
    console.log(`[PROXY] ${method} ${upstreamUrl}`);
    console.log(`[PROXY] Headers:`, {
      Authorization: requestInitHeaders['Authorization'] ? `${String(requestInitHeaders['Authorization']).substring(0, 20)}...` : 'MISSING',
      'Content-Type': requestInitHeaders['Content-Type'],
    });

    const upstream = await fetch(
      upstreamUrl,
      requestInit
    );
    clearTimeout(timeout);

    if (upstream.status === 204) {
      return new NextResponse(null, { status: upstream.status });
    }

    // Handle binary file downloads (StreamingHttpResponse from Django)
    if (isBinaryResponse(upstream)) {
      console.log(`[PROXY] Binary response detected, streaming as binary`);
      const body = await upstream.arrayBuffer();
      return buildBinaryProxyResponse(upstream, body);
    }

    const payload = await upstream.text();
    await _writeDebugResponseIfNeeded(req, payload);
    return buildProxyResponse(upstream, payload);
  } catch (error) {
    // improved error logging for debugging upstream failures
    const urlForLogging = upstreamUrl || 'unknown URL';
    console.error(`[PROXY ERROR] ${options.errorLabel} ${method} ${urlForLogging}`, error);
    return NextResponse.json(
      {
        error: `${options.errorLabel} error`,
        detail: String(error),
      },
      { status: 502 }
    );
  }
}
