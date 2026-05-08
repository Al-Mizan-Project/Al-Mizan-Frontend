// src/lib/api/validations.ts

export interface CreateValidationData {
  id_utilisateur: number;
  id_soumission: number;
  type: 'interne' | 'externe' | 'tutelle';
  commentaire?: string;
  is_validated?: boolean;
}

export interface ValidationResponse {
  id_validation: number;
  id_utilisateur: number;
  id_soumission: number;
  type: string;
  is_validated: boolean;
  commentaire: string;
  created_at: string;
  updated_at: string;
}

export const validationsApi = {
  async createValidation(data: CreateValidationData): Promise<ValidationResponse> {
    const response = await fetch('/api/proxy/validations?path=validations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = typeof errorData === 'object' ? JSON.stringify(errorData) : (errorData.detail || errorData.error || 'Failed to create validation');
      throw new Error(msg);
    }
    return response.json();
  },

  async getValidations(): Promise<ValidationResponse[]> {
    const response = await fetch('/api/proxy/validations?path=validations');
    if (!response.ok) throw new Error('Failed to fetch validations');
    return response.json();
  },

  async getSoumissionValidations(id: number): Promise<ValidationResponse[]> {
    const response = await fetch(`/api/proxy/validations?path=validations?id_soumission=${id}`);
    if (!response.ok) throw new Error(`Failed to fetch validations for soumission ${id}`);
    return response.json();
  },

  async approveValidation(id: number, comment?: string): Promise<ValidationResponse> {
    const response = await fetch(`/api/proxy/validations?path=validations/${id}/approuver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentaire: comment }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = typeof errorData === 'object' ? JSON.stringify(errorData) : (errorData.detail || errorData.error || 'Failed to approve');
      throw new Error(msg);
    }
    return response.json();
  },

  async rejectValidation(id: number, comment?: string): Promise<ValidationResponse> {
    const response = await fetch(`/api/proxy/validations?path=validations/${id}/rejeter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentaire: comment }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = typeof errorData === 'object' ? JSON.stringify(errorData) : (errorData.detail || errorData.error || 'Failed to reject');
      throw new Error(msg);
    }
    return response.json();
  },
};