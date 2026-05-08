import { apiClient } from './client';

export interface EvaluationResponse {
  id_evalution: number;
  id_comission: number;
  id_soumission: number;
  type: 'administrative' | 'technique' | 'financiere';
  note: number;
  commentaire: string;
  created_at: string;
  updated_at: string;
}

export const evaluationsApi = {
  async getEvaluations(): Promise<EvaluationResponse[]> {
    const response = await fetch('/api/proxy/evaluations');
    if (!response.ok) throw new Error('Failed to fetch evaluations via proxy');
    return response.json();
  },

  async getSoumissionEvaluations(id: number): Promise<EvaluationResponse[]> {
    const response = await fetch(`/api/proxy/evaluations?path=soumissions/${id}/evaluations`);
    if (!response.ok) throw new Error(`Failed to fetch evaluations for soumission ${id}`);
    return response.json();
  },
};
