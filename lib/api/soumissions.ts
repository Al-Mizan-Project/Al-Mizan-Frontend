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
  reference_ao?: string;
  titre_ao?: string;
}

export const soumissionsApi = {
  async getSoumissions(): Promise<SoumissionResponse[]> {
    // On ne passe pas le token manuellement pour laisser le proxy utiliser le X-Internal-Service-Token.
    // Cela évite les erreurs 401 si le token JWT est expiré ou restreint, car les proxies 
    // sont configurés pour autoriser les requêtes internes.
    const response = await fetch('/api/proxy/soumissions?path=api/soumissions/', {
      method: 'GET'
    });
    if (!response.ok) throw new Error(`Failed to fetch soumissions via proxy: ${response.status}`);
    return response.json();
  },

  async getSoumission(id: number): Promise<SoumissionResponse & { document_ids: number[], offre_financiere_chiffree_url: string }> {
    const response = await fetch(`/api/proxy/soumissions?path=api/soumissions/${id}/`);
    if (!response.ok) throw new Error(`Failed to fetch soumission ${id}`);
    return response.json();
  },

  async getSoumissionDocuments(id: number): Promise<any[]> {
    const response = await fetch(`/api/proxy/soumissions?path=api/soumissions/${id}/documents/`);
    if (!response.ok) throw new Error(`Failed to fetch documents for soumission ${id}`);
    return response.json();
  },
};
