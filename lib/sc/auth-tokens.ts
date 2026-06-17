// Centralised access-token handling for the Service Contractant area.
// Access tokens live ~15 min; this module transparently refreshes an expired access token using
// the stored refresh token (POST /auth/refresh) and retries the original request once, so every
// SC read/write keeps working without the user noticing. If refresh fails, the session is cleared
// and the user is sent to login.

const ACCESS_KEYS = ['access_token', 'authToken', 'token'];

export function getAccessToken(): string {
  if (typeof window === 'undefined') return '';
  for (const k of ACCESS_KEYS) {
    const v = window.localStorage.getItem(k);
    if (v) return v;
  }
  return '';
}

function getRefreshToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('refresh_token') || '';
}

function setAccessToken(token: string) {
  window.localStorage.setItem('access_token', token);
}

let redirecting = false;

function redirectToLogin() {
  if (typeof window === 'undefined' || redirecting) return;
  redirecting = true;
  ['access_token', 'refresh_token', 'token', 'authToken'].forEach((k) => window.localStorage.removeItem(k));
  const lang = window.location.pathname.split('/').filter(Boolean)[0] || 'fr';
  if (!window.location.pathname.includes('/login')) {
    window.location.href = `/${lang}/login`;
  }
}

// A single refresh is shared across concurrent 401s.
let inFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      redirectToLogin();
      return null;
    }
    try {
      const res = await fetch('/api/proxy/auth?path=auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        redirectToLogin();
        return null;
      }
      const data = await res.json();
      if (data?.access) {
        setAccessToken(data.access);
        if (data.refresh) window.localStorage.setItem('refresh_token', data.refresh);
        return data.access as string;
      }
      redirectToLogin();
      return null;
    } catch {
      redirectToLogin();
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * fetch() that attaches the current access token and, on a 401, refreshes once and retries.
 * Use for every authenticated SC request. The auth-refresh call itself must not go through here.
 */
export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const build = (token: string): RequestInit => {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return { ...init, headers };
  };

  let res = await fetch(input, build(getAccessToken()));
  if (res.status === 401 && typeof window !== 'undefined') {
    const fresh = await refreshAccessToken();
    if (fresh) {
      res = await fetch(input, build(fresh));
    }
  }
  return res;
}
