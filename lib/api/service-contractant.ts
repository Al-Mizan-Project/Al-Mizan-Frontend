'use client';

type ProxyService =
  | 'auth'
  | 'acteurs'
  | 'contractant'
  | 'appels'
  | 'documents'
  | 'soumissions'
  | 'evaluations'
  | 'validations'
  | 'contrats'
  | 'recours';

type RequestOptions = {
  path?: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
};

type JwtClaims = {
  user_id?: number;
  email?: string;
  role?: string;
  permissions?: string[];
  exp?: number;
};

export type EntityId = string;

export interface AuthUser {
  id_utilisateur: number;
  id_role: number | null;
  id_membre: EntityId | null;
  email: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthRole {
  id_role: number;
  nom_role: string;
}

export interface AuthPermission {
  id_permission: number;
  nom_permission: string;
}

export interface MembreAuthAccount {
  id_utilisateur: number;
  id_role: number | null;
  email: string;
  is_active: boolean;
  role: string | null;
  permissions: string[];
}

export interface Organisation {
  id_organisation: EntityId;
  nom_officiel: string;
  adresse_siege: string;
  email_contact: string;
  type_entite: string;
  type_entite_display?: string;
  code_service?: string | null;
  secteur_activite?: string | null;
}

export interface Membre {
  id_membre: EntityId;
  id_organisation?: EntityId | null;
  organisation?: Organisation | null;
  compte_auth?: MembreAuthAccount | null;
  prenom: string;
  nom: string;
  telephone: string;
  fonction: string;
  created_at?: string;
  updated_at?: string;
}

export interface Tutelle {
  id_tutelle: number;
  nom_tutelle: string;
  identite_autorite: string;
}

export interface ServiceContractant {
  id_service: number;
  id_tutelle: number | null;
  categorie: string;
  code_ordonnateur: string;
}

export interface CommissionEvaluation {
  id_comission: number;
  id_service: number;
  nom_comission: string;
  categorie: string;
}

export interface CommissionInterne {
  id_comission_interne: number;
  id_service: number;
  nom_comission: string;
  type_comission: string;
}

export interface CommissionExterne {
  id_comission_externe: number;
  nom_comission: string;
  niveau_competance: string;
  seuils_competence_financiere: string;
}

export interface CommissionMemberLink {
  id: number;
  id_membre: number;
  id_comission?: number;
  id_commision_interne?: number;
}

export interface AppelOffreInvite {
  id: number;
  id_operateur_economique: number;
  statut_invitation: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppelOffre {
  id_appel_offres: number;
  id_service_contractant: number;
  reference: string;
  titre: string;
  description: string;
  type_procedure: string;
  type_prestation: string;
  visibilite: string;
  wilaya: string;
  localisation: string;
  location?: string;
  montant_estime: string | number | null;
  date_publication: string | null;
  date_limite_soumission: string | null;
  date_ouverture_plis: string | null;
  poids_technique: number;
  poids_financier: number;
  required_docs_admin: string[];
  required_docs_tech: string[];
  required_docs_fin: string[];
  minimum_revenue_da: number;
  qualification_category: string;
  minimum_experience_years: number;
  participation_conditions: string[];
  operateurs_invites: AppelOffreInvite[];
  statut: string;
  created_at?: string;
  updated_at?: string;
}

export interface AppelDocumentLink {
  id: number;
  id_document: number;
  id_appel_offres: number;
}

export interface DocumentMetadata {
  id_document: number;
  related_type: string;
  nom: string;
  type_document: string;
  storage_url: string;
  hash_sha256?: string;
  taille_fichier?: number;
  is_encrypted: boolean;
  ia_verif_statut?: string;
  ia_verif_details?: unknown;
  uploaded_at: string;
  visible_after: string | null;
}

export interface Soumission {
  id_soumission: number;
  id_appel_offre: number;
  id_soumissionnaire: number;
  offre_financiere_chiffree_url?: string;
  document_ids: number[];
  statut: string;
  montant_financier: number | null;
  date_soumission: string;
  conformite_statut: string | null;
  conformite_rapport: unknown;
}

export interface Evaluation {
  id_evalution: number;
  id_comission: number;
  id_soumission: number;
  id_utilisateur: number;
  type: string;
  note: number;
  commentaire: string;
}

export interface Validation {
  id_validation: number;
  id_utilisateur: number;
  id_soumission: number;
  type: string;
  is_validated: boolean | null;
  commentaire: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contrat {
  id_contrat: number;
  id_soumission: number;
  id_service_contractants: number;
  numero_contrat: string;
  date_signature: string | null;
  statut: string;
  created_at?: string;
  updated_at?: string;
}

export interface Recours {
  id_recours: number;
  id_operateur_economique: number;
  id_validation: number;
  id_soumission: number;
  statut: string;
  motif: string;
  decision: string | null;
  date_depot: string;
  date_limite: string;
  date_decision: string | null;
  traite_par: number | null;
}

function getAccessToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem('access_token') || '';
}

function decodeJwtPart(part: string) {
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  if (typeof window === 'undefined' || typeof window.atob !== 'function') {
    throw new Error('JWT decoding is only available in the browser.');
  }
  return window.atob(padded);
}

export function getJwtClaims(): JwtClaims | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeJwtPart(payload)) as JwtClaims;
  } catch {
    return null;
  }
}

function buildQueryString(query?: RequestOptions['query']) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params.append(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `&${queryString}` : '';
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

async function request<T>(service: ProxyService, options: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const params = new URLSearchParams();

  if (options.path) {
    params.set('path', options.path);
  }

  const queryString = `${params.toString()}${buildQueryString(options.query)}`;
  const url = `/api/proxy/${service}${queryString ? `?${queryString}` : ''}`;
  const headers = new Headers();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const init: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      init.body = options.body;
    } else {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, init);
  const data = await parseResponse<any>(response);

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(String(detail));
  }

  return data as T;
}

async function resolveServiceMembership(serviceId: number) {
  return request<Array<{ id_membre: number }>>('contractant', {
    path: `services-contractants/${serviceId}/membres`,
  });
}

export const serviceContractantApi = {
  getJwtClaims,

  getCurrentUserId() {
    return getJwtClaims()?.user_id || null;
  },

  getUsers() {
    return request<AuthUser[]>('auth', { path: 'users' });
  },

  getUser(userId: number) {
    return request<AuthUser>('auth', { path: `users/${userId}` });
  },

  createUser(payload: {
    id_role: number;
    id_membre: EntityId;
    email: string;
    password: string;
  }) {
    return request<AuthUser>('auth', {
      path: 'users',
      method: 'POST',
      body: payload,
    });
  },

  updateUser(
    userId: number,
    payload: Partial<{
      id_role: number;
      id_membre: EntityId | null;
      email: string;
      is_active: boolean;
    }>
  ) {
    return request<AuthUser>('auth', {
      path: `users/${userId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  updateUserRole(userId: number, id_role: number) {
    return request<AuthUser>('auth', {
      path: `users/${userId}/role`,
      method: 'PATCH',
      body: { id_role },
    });
  },

  deleteUser(userId: number) {
    return request<null>('auth', {
      path: `users/${userId}`,
      method: 'DELETE',
    });
  },

  getUserPermissions(userId: number) {
    return request<AuthPermission[]>('auth', { path: `users/${userId}/permissions` });
  },

  setUserPermissions(userId: number, permissionNames: string[]) {
    return request<AuthPermission[]>('auth', {
      path: `users/${userId}/permissions`,
      method: 'PUT',
      body: { permission_names: permissionNames },
    });
  },

  getRoles() {
    return request<AuthRole[]>('auth', { path: 'roles' });
  },

  getRolePermissions(roleId: number) {
    return request<AuthPermission[]>('auth', { path: `roles/${roleId}/permissions` });
  },

  setRolePermissions(roleId: number, permissionIds: number[]) {
    return request<AuthPermission[]>('auth', {
      path: `roles/${roleId}/permissions`,
      method: 'PUT',
      body: { permission_ids: permissionIds },
    });
  },

  getPermissions() {
    return request<AuthPermission[]>('auth', { path: 'permissions' });
  },

  createPermission(payload: { nom_permission: string }) {
    return request<AuthPermission>('auth', {
      path: 'permissions',
      method: 'POST',
      body: payload,
    });
  },

  updatePermission(permissionId: number, payload: { nom_permission: string }) {
    return request<AuthPermission>('auth', {
      path: `permissions/${permissionId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  deletePermission(permissionId: number) {
    return request<null>('auth', {
      path: `permissions/${permissionId}`,
      method: 'DELETE',
    });
  },

  getMembres() {
    return request<Membre[]>('acteurs', { path: 'membres' });
  },

  getMembre(membreId: EntityId | number) {
    return request<Membre>('acteurs', { path: `membres/${membreId}/` });
  },

  createMembre(payload: {
    id_organisation: EntityId;
    prenom: string;
    nom: string;
    telephone: string;
    fonction: string;
  }) {
    return request<Membre>('acteurs', {
      path: 'membres',
      method: 'POST',
      body: payload,
    });
  },

  updateMembre(
    membreId: EntityId | number,
    payload: Partial<{
      id_organisation: EntityId;
      prenom: string;
      nom: string;
      telephone: string;
      fonction: string;
    }>
  ) {
    return request<Membre>('acteurs', {
      path: `membres/${membreId}/gerer/`,
      method: 'PATCH',
      body: payload,
    });
  },

  deleteMembre(membreId: EntityId | number) {
    return request<null>('acteurs', {
      path: `membres/${membreId}/gerer/`,
      method: 'DELETE',
    });
  },

  getOrganisation(organisationId: EntityId) {
    return request<Organisation>('acteurs', { path: `organisations/${organisationId}` });
  },

  getOrganisationMembres(organisationId: EntityId) {
    return request<Membre[]>('acteurs', { path: `organisations/${organisationId}/membres/` });
  },

  createCollaborateur(payload: {
    prenom: string;
    nom: string;
    telephone: string;
    fonction: string;
    email: string;
    password: string;
    permissions: string[];
  }) {
    return request<{ message: string; id_membre: EntityId }>('acteurs', {
      path: 'membres/creer-collaborateur/',
      method: 'POST',
      body: payload,
    });
  },

  getTutelle(tutelleId: number) {
    return request<Tutelle>('acteurs', { path: `tutelles/${tutelleId}` });
  },

  getServicesContractants() {
    return request<ServiceContractant[]>('contractant', { path: 'services-contractants' });
  },

  getServiceContractant(serviceId: number) {
    return request<ServiceContractant>('contractant', {
      path: `services-contractants/${serviceId}`,
    });
  },

  updateServiceContractant(
    serviceId: number,
    payload: Partial<{
      id_tutelle: number;
      categorie: string;
      code_ordonnateur: string;
    }>
  ) {
    return request<ServiceContractant>('contractant', {
      path: `services-contractants/${serviceId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  getServiceContractantMembers(serviceId: number) {
    return resolveServiceMembership(serviceId);
  },

  getServiceCommissions(serviceId: number) {
    return request<{
      commissions_evaluation: CommissionEvaluation[];
      commissions_internes: CommissionInterne[];
    }>('contractant', {
      path: `services-contractants/${serviceId}/commissions`,
    });
  },

  createCommissionEvaluation(payload: {
    id_service: number;
    nom_comission: string;
    categorie: string;
  }) {
    return request<CommissionEvaluation>('contractant', {
      path: 'commissions-evaluation',
      method: 'POST',
      body: payload,
    });
  },

  updateCommissionEvaluation(
    commissionId: number,
    payload: Partial<{
      id_service: number;
      nom_comission: string;
      categorie: string;
    }>
  ) {
    return request<CommissionEvaluation>('contractant', {
      path: `commissions-evaluation/${commissionId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  getCommissionEvaluationMembers(commissionId: number) {
    return request<CommissionMemberLink[]>('contractant', {
      path: `commissions-evaluation/${commissionId}/membres`,
    });
  },

  addCommissionEvaluationMember(commissionId: number, membreId: number) {
    return request<null>('contractant', {
      path: `commissions-evaluation/${commissionId}/membres/${membreId}`,
      method: 'POST',
    });
  },

  deleteCommissionEvaluationMember(commissionId: number, membreId: number) {
    return request<null>('contractant', {
      path: `commissions-evaluation/${commissionId}/membres/${membreId}`,
      method: 'DELETE',
    });
  },

  getCommissionInterneMembers(commissionId: number) {
    return request<CommissionMemberLink[]>('contractant', {
      path: `commissions-internes/${commissionId}/membres`,
    });
  },

  getCommissionsExternes() {
    return request<CommissionExterne[]>('contractant', {
      path: 'commissions-externes',
    });
  },

  listAppels(params: { service_id?: number; statut?: string; search?: string }) {
    return request<AppelOffre[]>('appels', {
      path: 'appels-offres',
      query: params,
    });
  },

  getAppel(appelId: number) {
    return request<AppelOffre>('appels', { path: `appels-offres/${appelId}` });
  },

  createAppel(payload: Record<string, unknown>) {
    return request<AppelOffre>('appels', {
      path: 'appels-offres',
      method: 'POST',
      body: payload,
    });
  },

  updateAppel(appelId: number, payload: Record<string, unknown>) {
    return request<AppelOffre>('appels', {
      path: `appels-offres/${appelId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  publishAppel(appelId: number) {
    return request<AppelOffre>('appels', {
      path: `appels-offres/${appelId}/publier`,
      method: 'POST',
    });
  },

  closeDepot(appelId: number) {
    return request<AppelOffre>('appels', {
      path: `appels-offres/${appelId}/cloturer-depot`,
      method: 'POST',
    });
  },

  openPlisWorkflow(appelId: number) {
    return request<AppelOffre>('appels', {
      path: `appels-offres/${appelId}/ouvrir-plis`,
      method: 'POST',
    });
  },

  cancelAppel(appelId: number) {
    return request<AppelOffre>('appels', {
      path: `appels-offres/${appelId}/annuler`,
      method: 'POST',
    });
  },

  getAppelDocuments(appelId: number) {
    return request<AppelDocumentLink[]>('appels', {
      path: `appels-offres/${appelId}/documents`,
    });
  },

  addAppelDocument(appelId: number, documentId: number) {
    return request<null>('appels', {
      path: `appels-offres/${appelId}/documents/${documentId}`,
      method: 'POST',
    });
  },

  uploadDocuments(payload: FormData) {
    return request<DocumentMetadata | DocumentMetadata[]>('documents', {
      path: 'api/documents/',
      method: 'POST',
      body: payload,
    });
  },

  getDocument(documentId: number) {
    return request<DocumentMetadata>('documents', { path: `documents/${documentId}` });
  },

  listDocumentsByIds(ids: number[]) {
    return request<DocumentMetadata[]>('documents', {
      path: 'documents',
      query: {
        ids: ids.join(','),
      },
    });
  },

  getDocumentDownloadUrl(documentId: number) {
    return request<{ id_document: number; download_url: string; storage_url: string }>('documents', {
      path: `documents/${documentId}/download-url`,
    });
  },

  listAppelSoumissions(appelId: number) {
    return request<Soumission[]>('soumissions', {
      path: `appels-offres/${appelId}/soumissions`,
    });
  },

  getSoumission(soumissionId: number) {
    return request<Soumission>('soumissions', { path: `soumissions/${soumissionId}` });
  },

  updateSoumission(soumissionId: number, payload: Partial<Soumission>) {
    return request<Soumission>('soumissions', {
      path: `soumissions/${soumissionId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  openBids(appelId: number) {
    return request<{ message: string }>('soumissions', {
      path: `soumissions/${appelId}/open-bids`,
      method: 'POST',
    });
  },

  listSoumissionEvaluations(soumissionId: number) {
    return request<Evaluation[]>('soumissions', {
      path: `soumissions/${soumissionId}/evaluate`,
    });
  },

  createSoumissionEvaluation(
    soumissionId: number,
    payload: {
      id_comission: number;
      id_utilisateur: number;
      type: string;
      note: number;
      commentaire: string;
    }
  ) {
    return request<Evaluation>('soumissions', {
      path: `soumissions/${soumissionId}/evaluate`,
      method: 'POST',
      body: payload,
    });
  },

  finishSoumissionEvaluation(soumissionId: number) {
    return request<{ message: string; id_soumission: number; statut: string }>('soumissions', {
      path: `soumissions/${soumissionId}/terminer-evaluation`,
      method: 'POST',
    });
  },

  listAppelEvaluations(appelId: number, commissionId: number) {
    return request<Evaluation[]>('evaluations', {
      path: `appels-offres/${appelId}/evaluations`,
      query: {
        id_comission: commissionId,
      },
    });
  },

  calculateClassement(appelId: number, commissionId: number) {
    return request<{ classement: Array<{ id_soumission: number; moyenne: number }> }>('evaluations', {
      path: `appels-offres/${appelId}/calculer-classement`,
      method: 'POST',
      body: {
        id_comission: commissionId,
      },
    });
  },

  getClassement(appelId: number, commissionId: number) {
    return request<{ classement: Array<{ id_soumission: number; moyenne: number }> }>('evaluations', {
      path: `appels-offres/${appelId}/classement`,
      query: {
        id_comission: commissionId,
      },
    });
  },

  validateNotes(appelId: number, commissionId: number) {
    return request<{ message: string; id_comission: number }>('evaluations', {
      path: `appels-offres/${appelId}/valider-notes`,
      method: 'POST',
      body: {
        id_comission: commissionId,
      },
    });
  },

  listValidations() {
    return request<Validation[]>('validations', { path: 'validations' });
  },

  createValidation(payload: {
    id_utilisateur: number;
    id_soumission: number;
    type: string;
    is_validated: boolean | null;
    commentaire: string;
  }) {
    return request<Validation>('validations', {
      path: 'validations',
      method: 'POST',
      body: payload,
    });
  },

  updateValidation(
    validationId: number,
    payload: Partial<{
      id_utilisateur: number;
      id_soumission: number;
      type: string;
      is_validated: boolean | null;
      commentaire: string;
    }>
  ) {
    return request<Validation>('validations', {
      path: `validations/${validationId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  approveValidation(validationId: number) {
    return request<Validation>('validations', {
      path: `validations/${validationId}/approuver`,
      method: 'POST',
    });
  },

  rejectValidation(validationId: number, commentaire: string) {
    return request<Validation>('validations', {
      path: `validations/${validationId}/rejeter`,
      method: 'POST',
      body: { commentaire },
    });
  },

  listContrats() {
    return request<Contrat[]>('contrats', { path: 'contrats' });
  },

  getContratBySoumission(soumissionId: number) {
    return request<Contrat>('contrats', {
      path: `soumissions/${soumissionId}/contrat`,
    });
  },

  createContrat(payload: {
    id_soumission: number;
    id_service_contractants: number;
    numero_contrat: string;
    date_signature: string | null;
    statut: string;
  }) {
    return request<Contrat>('contrats', {
      path: 'contrats',
      method: 'POST',
      body: payload,
    });
  },

  updateContrat(
    contratId: number,
    payload: Partial<{
      id_soumission: number;
      id_service_contractants: number;
      numero_contrat: string;
      date_signature: string | null;
      statut: string;
    }>
  ) {
    return request<Contrat>('contrats', {
      path: `contrats/${contratId}`,
      method: 'PATCH',
      body: payload,
    });
  },

  signContrat(contratId: number) {
    return request<Contrat>('contrats', {
      path: `contrats/${contratId}/signer`,
      method: 'POST',
    });
  },

  listRecours(filters?: {
    statut?: string;
    id_operateur_economique?: number;
    date_from?: string;
    date_to?: string;
  }) {
    return request<Recours[]>('recours', {
      path: 'api/recours/',
      query: filters,
    });
  },

  instruireRecours(recoursId: number) {
    return request<Recours>('recours', {
      path: `api/recours/${recoursId}/instruire/`,
      method: 'POST',
    });
  },

  decideRecours(recoursId: number, payload: { decision: string; traite_par: number }) {
    return request<Recours>('recours', {
      path: `api/recours/${recoursId}/decision/`,
      method: 'POST',
      body: payload,
    });
  },

  acceptRecours(recoursId: number) {
    return request<Recours>('recours', {
      path: `api/recours/${recoursId}/accepter/`,
      method: 'POST',
    });
  },

  rejectRecours(recoursId: number) {
    return request<Recours>('recours', {
      path: `api/recours/${recoursId}/rejeter/`,
      method: 'POST',
    });
  },

  closeRecours(recoursId: number) {
    return request<Recours>('recours', {
      path: `api/recours/${recoursId}/cloturer/`,
      method: 'POST',
    });
  },
};
