import { getApiUrl, createTimeoutController } from '../../apiConfig';
import type { ServiceName } from '../../apiConfig';

function getAuthToken(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_AUTH_TOKEN || '';
  }
  return (
    window.localStorage.getItem('access_token') ||
    window.localStorage.getItem('authToken') ||
    window.localStorage.getItem('token') ||
    process.env.NEXT_PUBLIC_AUTH_TOKEN ||
    ''
  );
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const apiClient = {
  async post<T>(service: ServiceName, endpoint: string, data: unknown): Promise<T> {
    const url = getApiUrl(service, endpoint);
    const { controller, timeoutId } = createTimeoutController(service);

    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = JSON.parse(text);
        } catch (e) {
          // ignore
        }
        throw new ApiError(
          response.status,
          errorData.message || errorData.detail || `Erreur ${response.status} sur l'URL: ${url}`,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Délai de réponse dépassé');
      }
      
      throw new ApiError(500, 'Erreur réseau inattendue', error);
    }
  },

  async get<T>(service: ServiceName, endpoint: string): Promise<T> {
    const url = getApiUrl(service, endpoint);
    const { controller, timeoutId } = createTimeoutController(service);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Erreur ${response.status} sur l'URL: ${url}`;
        try {
          const text = await response.text();
          const errorData = JSON.parse(text);
          if (errorData.message || errorData.detail) {
            errorMsg += ` - ${errorData.message || errorData.detail}`;
          }
        } catch (e) {
          // parse error
        }
        throw new ApiError(response.status, errorMsg);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
};