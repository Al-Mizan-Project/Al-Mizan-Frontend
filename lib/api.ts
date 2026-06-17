import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('access_token');
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});
// ─── Auth Interceptor (called from AuthContext) ───────────────────────────────

export function setupAuthInterceptor(_token: string | null){
  api.interceptors.request.clear();

  // Replace the existing request interceptor setup with this permanent one
api.interceptors.request.use((config) => {
  const t = localStorage.getItem('access_token');
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
          const { data } = await axios.post('/api/proxy/auth?path=auth/refresh', {
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
  // Use a clean axios call (not the shared `api` instance) so a stale/expired access token in
  // localStorage is never attached to the login request — DRF rejects a bad bearer with 401 even
  // on an AllowAny endpoint.
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await axios.post('/api/proxy/auth?path=auth/login', { email, password }, {
      headers: { 'Content-Type': 'application/json' },
    });
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

// ─── Evaluation Session ────────────────────────────────────────────────────────

export const evaluationAPI = {
  getState: async (commissionId: string) => {
    const { data } = await api.get(`/commissions/${commissionId}/state/`);
    return data;
  },
  creerPV: async (commissionId: string, type_pv: 'ouverture' | 'evaluation') => {
  const { data } = await api.post(`/commissions/${commissionId}/pv/${type_pv}/`);
  return data;
},

  confirmerIntegrite: async (commissionId: string, confirmed_by: number) => {
    const { data } = await api.post(`/commissions/${commissionId}/registre/confirmer-integrite/`, { confirmed_by });
    return data;
  },

  demarrerSeance: async (commissionId: string, date_ouverture_plis?: string) => {
    const { data } = await api.post(`/commissions/${commissionId}/seance/demarrer/`, { date_ouverture_plis });
    return data;
  },

  cloturerSeance: async (commissionId: string) => {
    const { data } = await api.post(`/commissions/${commissionId}/seance/cloturer/`);
    return data;
  },

  ouvrirPli: async (commissionId: string, id_soumission: number, montant_declare?: number) => {
    const { data } = await api.post(`/commissions/${commissionId}/seance/ouvrir-pli/`, { id_soumission, montant_declare });
    return data;
  },

  parapherPli: async (commissionId: string, id_soumission: number, id_utilisateur: number) => {
    const { data } = await api.post(`/commissions/${commissionId}/seance/plis/${id_soumission}/parapher/`, { id_utilisateur });
    return data;
  },

 updateConformite: async (commissionId: string, id_soumission: number, payload: Record<string, boolean | null | string>) => {
  const { data } = await api.post(`/commissions/${commissionId}/conformite/`, { id_soumission, ...payload });
  return data;
},

updateCapacites: async (commissionId: string, id_soumission: number, payload: Record<string, unknown>) => {
  const { data } = await api.post(`/commissions/${commissionId}/capacites/`, { id_soumission, ...payload });
  return data;
},

updateEvalTechnique: async (commissionId: string, id_soumission: number, payload: Record<string, unknown>) => {
  const { data } = await api.post(`/commissions/${commissionId}/eval-technique/`, { id_soumission, ...payload });
  return data;
},

lockTechniqueOffer: async (commissionId: string, id_soumission: number, score_total?: number, threshold?: number) => {
  const { data } = await api.post(`/commissions/${commissionId}/eval-technique/lock/`, { id_soumission, score_total, threshold: threshold ?? 70 });
  return data;
},
updateEvalFinanciere: async (commissionId: string, id_soumission: number, payload: Record<string, unknown>) => {
  const { data } = await api.post(`/commissions/${commissionId}/eval-financiere/`, { id_soumission, ...payload });
  return data;
},

lockFinanciereOffer: async (commissionId: string, id_soumission: number) => {
  console.log('lockFinanciere', commissionId, id_soumission);
  const { data } = await api.post(`/commissions/${commissionId}/eval-financiere/lock/`, { id_soumission });
  return data;
},

calculerClassement: async (commissionId: string) => {
  const { data } = await api.post(`/commissions/${commissionId}/classement/calculer/`, {
    methodology: 'weighted',
    poids_technique: 60,
    poids_financier: 40,
  });
  return data;
},

  ecarterProvisional: async (commissionId: string, id_soumission: number, motif: string) => {
  const { data } = await api.post(`/commissions/${commissionId}/classement/ecarter-provisional/`, {
    id_soumission,
    motif,
  });
  return data;
},

  signerPV: async (commissionId: string, type_pv: 'ouverture' | 'evaluation', id_utilisateur: number, reserve?: string) => {
    const { data } = await api.post(`/commissions/${commissionId}/pv/${type_pv}/signer/`, { id_utilisateur, reserve: reserve ?? '' });
    return data;
  },

  verrouillerPV: async (commissionId: string, type_pv: 'ouverture' | 'evaluation') => {
    const { data } = await api.post(`/commissions/${commissionId}/pv/${type_pv}/verrouiller/`);
    return data;
  },

  soumettreAuSC: async (commissionId: string) => {
    const { data } = await api.post(`/commissions/${commissionId}/soumettre-sc/`);
    return data;
  },

  submitCTReport: async (commissionId: string, payload: {
    methodologie: string;
    equipe: string;
    materiels: string;
    anomalies: string;
    avis_global: 'favorable' | 'reserve' | 'defavorable';
  }) => {
    const { data } = await api.post(`/commissions/${commissionId}/rapport-technique/`, payload);
    return data;
  },
};

export const soumissionsAPI = {
  getByCommission: async (commissionId: number) => {
    const { data } = await api.get(`/api/soumissions/by-commission/${commissionId}/`);
    return data;
  },
};
export const commissionAPI = {
  getByMembre: async (id_utilisateur: number) => {
    const { data } = await api.get(`/commissions/`, {
      params: { membre: id_utilisateur }
    });
    return data as {
      id_comission: number;
      nom_comission: string;
      categorie: string;
      role_label: string;
    };
  },
};
// CT API
export const ctAPI = {
  getCommission: async (id_utilisateur: number) => {
    const { data } = await api.get(`/ct/commission/?utilisateur=${id_utilisateur}`);
    return data;
  },
  getRapport: async (commissionId: number) => {
    const { data } = await api.get(`/commissions/${commissionId}/rapport-ct/`);
    return data;
  },
  saveRapport: async (commissionId: number, payload: Record<string, unknown>) => {
    const { data } = await api.post(`/commissions/${commissionId}/rapport-ct/`, payload);
    return data;
  },
};
