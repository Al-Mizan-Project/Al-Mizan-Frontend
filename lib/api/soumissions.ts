import { apiClient } from './client';

export interface SoumissionResponse {
  id_soumission: number;
  id_appel_offre: number;
  date_soumission: string;
  montant_financier: number;
  offre_financiere_chiffree_url?: string;
  statut: string;
  conformite_statut: string;
  created_at: string;
  updated_at: string;
}

export const soumissionsApi = {
  async getSoumissions(): Promise<SoumissionResponse[]> {
    return apiClient.get('soumissions', 'api/soumissions/');
  },

  async getSoumission(id: number): Promise<SoumissionResponse & { document_ids: number[], offre_financiere_chiffree_url: string }> {
    const response = await fetch(`/api/proxy/soumissions?path=soumissions/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch soumission ${id}`);
    return response.json();
  },

  async getSoumissionDocuments(id: number): Promise<any[]> {
    const response = await fetch(`/api/proxy/soumissions?path=soumissions/${id}/documents`);
    if (!response.ok) throw new Error(`Failed to fetch documents for soumission ${id}`);
    return response.json();
  },
};
