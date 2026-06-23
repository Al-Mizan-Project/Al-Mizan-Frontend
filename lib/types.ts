export type OrgType = 'operateur_economique' | 'tutelle' | 'service_contractant' | 'commission_externe';

export interface Organisation {
  id_organisation: string;       // UUID
  nom_officiel: string;
  email_contact: string | null;
  responsable_nom?: string;
  type_entite?: string;          // added
}

export interface Membre {
  id_membre: string;
  id_organisation: string;
  prenom: string;
  nom: string;
  telephone: string;
  fonction: string;
  created_at?: string;
  updated_at?: string;
}

export interface DemandeOE {
  id: string;                    // UUID
  nom_organisation: string;
  email_contact: string;
  telephone: string;
  nif: string;
  num_registre_commerce: string;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  cree_le: string;
  documents: {
    id: string;
    document_id: number;
    type_document: string;
  }[];
}