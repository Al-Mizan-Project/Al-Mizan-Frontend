import { apiClient } from './client';

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
    const response = await fetch(`/api/proxy/contractant?path=commissions-evaluation/${id}/membres`);
    if (!response.ok) throw new Error('Failed to fetch commission evaluation members');
    return response.json();
  },
    
  getCommissionInterneMembres: async (id: number): Promise<MembreLink[]> => {
    const response = await fetch(`/api/proxy/contractant?path=commissions-internes/${id}/membres`);
    if (!response.ok) throw new Error('Failed to fetch commission interne members');
    return response.json();
  },
    
  getServiceCommissions: async (serviceId: number): Promise<any> => {
    const response = await fetch(`/api/proxy/contractant?path=services-contractants/${serviceId}/commissions`);
    if (!response.ok) throw new Error('Failed to fetch service commissions');
    return response.json();
  },
};
