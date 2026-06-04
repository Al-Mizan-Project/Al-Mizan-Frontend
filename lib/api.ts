import axios from 'axios';


const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:18080';
const ACTEURS_API_URL = process.env.NEXT_PUBLIC_ACTEURS_API_URL || 'http://localhost:18081';


export const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const acteursApi = axios.create({
  baseURL: ACTEURS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const setupAuthInterceptor = (token: string | null) => {
  if (token) {
    authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    acteursApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete authApi.defaults.headers.common['Authorization'];
    delete acteursApi.defaults.headers.common['Authorization'];
  }
};


export const authAPI = {
  login: async (email: string, password: string) => {
    // Use the Next.js proxy to reach the auth service (avoids CORS and env mismatches)
    const res = await fetch('/api/proxy/auth?path=auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = err.message || err.detail || JSON.stringify(err) || `HTTP ${res.status}`;
      const error = new Error(message);
      // attach response-like structure to mimic axios error shape used elsewhere
      (error as any).response = { status: res.status, data: err };
      throw error;
    }
    return await res.json();
  },
  
  getCurrentUser: async () => {
    const response = await authApi.get('/users/me');
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await authApi.post('/auth/refresh', { refresh: refreshToken });
    return response.data;
  },
};


export const membresAPI = {
  create: async (data: any) => {
    const response = await acteursApi.post('/membres', data);
    return response.data;
  },
  
  getAll: async () => {
    const response = await acteursApi.get('/membres');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await acteursApi.get(`/membres/${id}`);
    return response.data;
  },
};


export const organisationsAPI = {
  create: async (data: any) => {
    const response = await acteursApi.post('/organisations', data);
    return response.data;
  },
};


export type LoginResponse = {
  access: string;
  refresh: string;
  user: {
    id?: number;
    email: string;
    id_membre?: string;
    role?: string;
  };
};