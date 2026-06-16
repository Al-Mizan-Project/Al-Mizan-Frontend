import { getAuthToken } from './client';

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Commission {
  id_comission?: number;
  id_comission_interne?: number;
  nom_comission: string;
  categorie?: string;
  type_comission?: string;
}

export interface MembreLink {
  id: number;
  id_membre: number;
  id_comission?: number;
  id_commision_interne?: number;
}

export const contractantApi = {
  getCommissionEvaluationMembres: async (id: number): Promise<MembreLink[]> => {
    const response = await fetch(`/api/proxy/contractant?path=commissions-evaluation/${id}/membres`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch commission evaluation members');
    return response.json();
  },
    
  getCommissionInterneMembres: async (id: number): Promise<MembreLink[]> => {
    const response = await fetch(`/api/proxy/contractant?path=commissions-internes/${id}/membres`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch commission interne members');
    return response.json();
  },
    
  getServiceCommissions: async (serviceId: number): Promise<any> => {
    const response = await fetch(`/api/proxy/contractant?path=services-contractants/${serviceId}/commissions`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch service commissions');
    return response.json();
  },
  
  // Retourne les membres de la commission à laquelle appartient l'utilisateur courant
  // Le backend doit implémenter la logique qui, selon le rôle de l'utilisateur,
  // renvoie soit les membres de la commission interne, soit ceux de la commission externe.
  getMyCommissionMembers: async (serviceId: number): Promise<MembreLink[]> => {
    const response = await fetch(`/api/proxy/contractant?path=services-contractants/${serviceId}/commissions/membres-pour-utilisateur`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch my commission members: ${response.status} ${response.statusText} ${body}`);
    }
    return response.json();
  },

  // Get external commission member by id
  getMembresCommissionExterne: async (membreId: number): Promise<any> => {
    const response = await fetch(`/api/proxy/contractant?path=membres-commission-externe/${membreId}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch external commission member');
    return response.json();
  },

  // Get all members of an external commission
  getMembresByCommissionExterne: async (commissionExterneId: number): Promise<any[]> => {
    const response = await fetch(`/api/proxy/contractant?path=membres-commission-externe?id_commission_externe=${commissionExterneId}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch external commission members');
    return response.json();
  },

  // Get internal commission member by id
  getMembresCommissionInterne: async (membreId: number): Promise<any> => {
    const response = await fetch(`/api/proxy/contractant?path=membres-commission-interne/${membreId}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch internal commission member');
    return response.json();
  },

  // Get all members of an internal commission by service
  getMembresByService: async (serviceId: number): Promise<any[]> => {
    const response = await fetch(`/api/proxy/contractant?path=membres-commission-interne?id_service=${serviceId}`, {
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch internal commission members');
    return response.json();
  },
};
