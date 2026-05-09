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
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch('/api/proxy/soumissions?path=api/soumissions/', {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error(`Failed to fetch soumissions via proxy: ${response.status}`);
    return response.json();
  },

  async getSoumission(id: number): Promise<SoumissionResponse & { document_ids: number[], offre_financiere_chiffree_url: string }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`/api/proxy/soumissions?path=soumissions/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error(`Failed to fetch soumission ${id}`);
    return response.json();
  },

  async getSoumissionDocuments(id: number): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`/api/proxy/soumissions?path=soumissions/${id}/documents/`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error(`Failed to fetch documents for soumission ${id}`);
    return response.json();
  },
};
