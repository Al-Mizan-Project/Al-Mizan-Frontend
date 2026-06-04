export interface AppelOffreSuivi {
  id: number;
  id_appel_offres: number;
  id_utilisateur: number;
  created_at: string;
}

export interface AppelOffre {
  id_appel_offres: number;
  id_service_contractant: number;
  reference: string;
  titre: string;
  description: string;
  type_procedure: string;
  montant_estime: string;
  statut: string;
  wilaya?: string;
  validated_by?: string | number;
  id_doc_cdc?: number | string;
  created_at?: string;
  validationDeadline?: string;
  suivis?: AppelOffreSuivi[];
  date_publication?: string;
}

export interface DocumentAppel {
  id_document: number;
  id_appel_offres: number;
}

export interface Expert {
  id: string | number;
  id_membre?: string | number;
  user_id?: string | number;
  nom: string;
  prenom?: string;
  firstName?: string;
  lastName?: string;
  lastname?: string;
  matricule?: string;
  charge_actuelle?: number;
  disponibilite?: string;
}

import { getAuthToken } from './client';

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const appelsApi = {
  getAppelOffre: async (id: number): Promise<AppelOffre> => {
    const response = await fetch(`/api/proxy/appels?path=appels-offres/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to fetch appel d'offre ${id}: ${response.status} ${text}`);
    }
    return response.json();
  },

  getAppelsByValidatedBy: async (validatorId: string | number): Promise<AppelOffre[]> => {
    const response = await fetch(
      `/api/proxy/appels?path=appels-offres&validated_by=${encodeURIComponent(String(validatorId))}&statut=non_valide,provisoire`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to fetch appels d'offres for validator ${validatorId}: ${response.status} ${text}`);
    }
    return response.json();
  },

  getAppelOffreDocuments: async (id: number): Promise<DocumentAppel[]> => {
    const response = await fetch(`/api/proxy/appels?path=appels-offres/${id}/documents`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to fetch documents for AO ${id}: ${response.status} ${text}`);
    }
    return response.json();
  },

  // Get experts/validators for a specific appel offres
  getAppelOffreExperts: async (appelId: number): Promise<Expert[]> => {
    try {
      // Try new endpoint first: appels-offres/{id}/experts
      const response = await fetch(`/api/proxy/appels?path=appels-offres/${appelId}/experts`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.experts || data || [];
      }
    } catch (err) {
      console.warn('Could not fetch appel-specific experts:', err);
    }

    // Fallback to commission-members-cdc for general validators
    try {
      const response = await fetch(`/api/proxy/contrats?path=commission-members-cdc`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.members || [];
      }
    } catch (err) {
      console.warn('Could not fetch commission members:', err);
    }

    return [];
  },

  // Get all experts/validators without filters (for AffectationDossiers)
  getAllExperts: async (): Promise<Expert[]> => {
    try {
      // Try new endpoint first: appels-offres/experts (all experts without filter)
      const response = await fetch(`/api/proxy/appels?path=appels-offres/experts`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.experts || data || [];
      }
    } catch (err) {
      console.warn('Could not fetch all experts from /appels-offres/experts:', err);
    }

    // Fallback 1: Try to get CDC members
    try {
      const response = await fetch(`/api/proxy/contrats?path=commission-members-cdc`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.members && data.members.length > 0) {
          return data.members;
        }
      }
    } catch (err) {
      console.warn('Could not fetch CDC members:', err);
    }

    // Fallback 2: Try to get general commission members
    try {
      const response = await fetch(`/api/proxy/contrats?path=commission-members`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.members || [];
      }
    } catch (err) {
      console.warn('Could not fetch commission members:', err);
    }

    return [];
  },

  // Get all members without CDC/marche filters (unfiltered)
  getAllMembers: async (): Promise<Expert[]> => {
    try {
      // Try new endpoint for all members without filters
      const response = await fetch(`/api/proxy/contrats?path=commission-members-all`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.members || data || [];
      }
    } catch (err) {
      console.warn('Could not fetch all members from commission-members-all:', err);
    }

    // Fallback to general commission members endpoint
    try {
      const response = await fetch(`/api/proxy/contrats?path=commission-members`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.members || [];
      }
    } catch (err) {
      console.warn('Could not fetch general commission members:', err);
    }

    return [];
  },

  // Get filtered experts based on user context from JWT token
  // The backend will determine role and apply appropriate filters
  // For RESP_CM: returns members with same id_commission_externe
  // For RESP_VALID_INTERN: returns members with same id_service
  getExpertsForUserContext: async (): Promise<Expert[]> => {
    try {
      // Call endpoint that uses JWT context to filter experts
      const response = await fetch(`/api/proxy/appels?path=appels-offres/experts/me`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        return data.experts || data || [];
      }
    } catch (err) {
      console.warn('Could not fetch experts with user context:', err);
    }

    return [];
  },

  /**
   * Marquer un appel comme "valide" via POST /appels-offres/{id}/valider
   */
  validerAppel: async (appelId: number, validatedBy?: string | number): Promise<AppelOffre> => {
    const response = await fetch(`/api/proxy/appels?path=appels-offres/${appelId}/valider`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ validated_by: validatedBy }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to validate appel ${appelId}: ${response.status} ${text}`);
    }
    return response.json();
  },

  /**
   * Marquer un appel comme "refuse" via POST /appels-offres/{id}/refuser
   */
  refuserAppel: async (appelId: number, validatedBy?: string | number): Promise<AppelOffre> => {
    const response = await fetch(`/api/proxy/appels?path=appels-offres/${appelId}/refuser`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ validated_by: validatedBy }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to refuse appel ${appelId}: ${response.status} ${text}`);
    }
    return response.json();
  },

  /**
   * Marquer un appel comme "ferme" via PATCH /appels-offres/{id} (statut = ferme)
   */
  fermerAppel: async (appelId: number): Promise<AppelOffre> => {
    const response = await fetch(`/api/proxy/appels?path=appels-offres/${appelId}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: 'ferme' }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to close appel ${appelId}: ${response.status} ${text}`);
    }
    return response.json();
  },
};
