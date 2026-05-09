import { apiClient } from './client';

export interface Membre {
  id_membre: number;
  nom: string;
  prenom: string;
  fonction: string;
  telephone?: string;
}

export const acteursApi = {
  getMembres: async (): Promise<Membre[]> => {
    const response = await fetch('/api/proxy/acteurs?path=membres');
    if (!response.ok) throw new Error('Failed to fetch members via proxy');
    return response.json();
  },
    
  getMembre: async (id: string | number): Promise<Membre> => {
    const response = await fetch(`/api/proxy/acteurs?path=membres/${id}/`);
    if (!response.ok) throw new Error(`Failed to fetch member ${id} via proxy`);
    return response.json();
  },
};
