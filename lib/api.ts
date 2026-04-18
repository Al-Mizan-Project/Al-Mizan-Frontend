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
    const response = await authApi.post('/auth/login', { email, password });
    return response.data;
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
    id: number;
    email: string;
    
  };
};