
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8081';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor – refresh token on 401
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
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
// ===================== DEMANDES (Opérateur Économique) =====================

export interface DemandeOE {
  id_demande: number;
  nom_officiel: string;
  adresse_siege: string;
  email_contact: string;
  type_entite: string;
  nif: string;
  registre_commerce_num: string;
  casnos_vrt: string;
  cnas_vrt: string;
  rib_bancaire: string;
  statut: 'en_attente' | 'approuvee' | 'refusee';
  documents: { nom: string; url: string }[];
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
  return data; // expected to return { organisation_id: ... }
};

// ===================== ORGANISATIONS =====================

export interface Organisation {
  id_organisation: number;
  nom_officiel: string;
  adresse_siege: string;
  email_contact: string;
  type_entite: string;
}

export const fetchOrganisationsByType = async (type: 'operateur_economique' | 'tutelle' | 'service_contractant' | 'commission_externe'): Promise<Organisation[]> => {
  let endpoint = '';
  switch (type) {
    case 'operateur_economique':
      endpoint = '/admin/organisations/operateurs/';
      break;
    case 'tutelle':
      endpoint = '/admin/organisations/tutelle/';
      break;
    case 'service_contractant':
      endpoint = '/admin/organisations/service-contractant/';
      break;
    case 'commission_externe':
      endpoint = '/admin/organisations/commission-externe/';
      break;
  }
  const { data } = await api.get(endpoint);
  return data;
};

// ===================== MEMBRES =====================

export interface Membre {
  id_membre: number;
  id_organisation: number;
  prenom: string;
  nom: string;
  telephone: string;
  fonction: string;
}

export const createResponsable = async (organisationId: number, payload: {
  prenom: string;
  nom: string;
  telephone: string;
  fonction: string;
}): Promise<Membre> => {
  const { data } = await api.post(`/organisations/${organisationId}/responsable/`, payload);
  return data;
};

export const createCollaborateur = async (organisationId: number, payload: {
  prenom: string;
  nom: string;
  telephone: string;
  fonction: string;
}): Promise<Membre> => {
  const { data } = await api.post('/membres/creer-collaborateur/', { ...payload, id_organisation: organisationId });
  return data;
};

// ===================== UTILISATEURS =====================

export interface UserCreate {
  id_role: number;
  id_membre: number;
  email: string;
  password: string;
}

export const createUser = async (payload: UserCreate): Promise<{ id_utilisateur: number }> => {
  const { data } = await api.post('/users', payload);
  return data;
};

// ===================== RÔLES (pour obtenir l’id_role) =====================

export interface Role {
  id_role: number;
  nom_role: string;
}

export const fetchRoles = async (): Promise<Role[]> => {
  const { data } = await api.get('/roles');
  return data;
};
// ... existing code remains unchanged ...

// ===================== APPELS D'OFFRES & SOUMISSIONS =====================

export interface AppelOffres {
  id_appel_offres: string;
  reference: string;
  titre: string;
  statut: string;
  date_publication: string;
  date_limite_soumission: string;
}

export const fetchAppelsOffres = async (): Promise<AppelOffres[]> => {
  const { data } = await api.get('/appels-offres');
  return data;
};

export const fetchSoumissions = async () => {
  const { data } = await api.get('/soumissions');
  return data;
};