export interface AppelOffre {
  id_appel_offres: number;
  id_service_contractant: number;
  reference: string;
  titre: string;
  description: string;
  type_procedure: string;
  montant_estime: string;
  statut: string;
}

export interface DocumentAppel {
  id_document: number;
  id_appel_offres: number;
}

export const appelsApi = {
  getAppelOffre: async (id: number): Promise<AppelOffre> => {
    const response = await fetch(`/api/proxy/appels?path=appels-offres/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch appel d'offre ${id}`);
    return response.json();
  },

  getAppelOffreDocuments: async (id: number): Promise<DocumentAppel[]> => {
    const response = await fetch(`/api/proxy/appels?path=appels-offres/${id}/documents`);
    if (!response.ok) throw new Error(`Failed to fetch documents for AO ${id}`);
    return response.json();
  },
};
