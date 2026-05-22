import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth Interceptor (called from AuthContext) ───────────────────────────────

export function setupAuthInterceptor(token: string | null) {
  api.interceptors.request.clear();

  api.interceptors.request.use((config) => {
    const t = token ?? localStorage.getItem('access_token');
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });
}

// ─── Response interceptor – refresh token on 401 ─────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/fr/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access:  string;
  refresh: string;
  user: {
    id:              number;
    id_utilisateur?: number;
    email:           string;
    nom?:            string;
    prenom?:         string;
    id_membre?:      string | number;
    id_role?:        number;
    role?:           string;
  };
}

export const authAPI = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
};

// ─── Demandes (Opérateur Économique) ─────────────────────────────────────────

export interface DemandeOE {
  id_demande:              number;
  nom_officiel:            string;
  adresse_siege:           string;
  email_contact:           string;
  type_entite:             string;
  nif:                     string;
  registre_commerce_num:   string;
  casnos_vrt:              string;
  cnas_vrt:                string;
  rib_bancaire:            string;
  statut:                  'en_attente' | 'approuvee' | 'refusee';
  documents:               { nom: string; url: string }[];
}

export const fetchDemandes = async (): Promise<DemandeOE[]> => {
  const { data } = await api.get('/admin/demandes/');
  return data;
};

export const fetchDemandeById = async (id: number): Promise<DemandeOE> => {
  const { data } = await api.get(`/admin/demandes/${id}/`);
  return data;
};

export const approveDemande = async (id: number): Promise<{ organisation_id: number }> => {
  const { data } = await api.post(`/admin/demandes/${id}/approuver/`);
  return data;
};

// ─── Organisations ────────────────────────────────────────────────────────────

export interface Organisation {
  id_organisation: number;
  nom_officiel:    string;
  adresse_siege:   string;
  email_contact:   string;
  type_entite:     string;
}

export const fetchOrganisationsByType = async (
  type: 'operateur_economique' | 'tutelle' | 'service_contractant' | 'commission_externe'
): Promise<Organisation[]> => {
  const endpointMap: Record<typeof type, string> = {
    operateur_economique: '/admin/organisations/operateurs/',
    tutelle:              '/admin/organisations/tutelle/',
    service_contractant:  '/admin/organisations/service-contractant/',
    commission_externe:   '/admin/organisations/commission-externe/',
  };
  const { data } = await api.get(endpointMap[type]);
  return data;
};

// ─── Membres ──────────────────────────────────────────────────────────────────

export interface Membre {
  id_membre:       number;
  id_organisation: number;
  prenom:          string;
  nom:             string;
  telephone:       string;
  fonction:        string;
}

export const createResponsable = async (
  organisationId: number,
  payload: { prenom: string; nom: string; telephone: string; fonction: string }
): Promise<Membre> => {
  const { data } = await api.post(`/organisations/${organisationId}/responsable/`, payload);
  return data;
};

export const createCollaborateur = async (
  organisationId: number,
  payload: { prenom: string; nom: string; telephone: string; fonction: string }
): Promise<Membre> => {
  const { data } = await api.post('/membres/creer-collaborateur/', {
    ...payload,
    id_organisation: organisationId,
  });
  return data;
};

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export interface UserCreate {
  id_role:   number;
  id_membre: number;
  email:     string;
  password:  string;
}

export const createUser = async (payload: UserCreate): Promise<{ id_utilisateur: number }> => {
  const { data } = await api.post('/users', payload);
  return data;
};

// ─── Rôles ────────────────────────────────────────────────────────────────────

export interface Role {
  id_role:  number;
  nom_role: string;
}

export const fetchRoles = async (): Promise<Role[]> => {
  const { data } = await api.get('/roles');
  return data;
};

// ─── Appels d'offres & Soumissions ───────────────────────────────────────────

export interface AppelOffres {
  id_appel_offres:          string;
  reference:                string;
  titre:                    string;
  statut:                   string;
  date_publication:         string;
  date_limite_soumission:   string;
}

export const fetchAppelsOffres = async (): Promise<AppelOffres[]> => {
  const { data } = await api.get('/appels-offres');
  return data;
};

export const fetchSoumissions = async () => {
  const { data } = await api.get('/soumissions');
  return data;
};