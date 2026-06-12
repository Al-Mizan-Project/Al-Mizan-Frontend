// Service Contractant API adapter.
// All calls go through the Next proxy (`/api/proxy/{service}?path=...`). Each high-level helper
// degrades gracefully: when an endpoint is not yet available the list helpers return [] and the
// single-item helpers return null, so the UI renders clean empty states instead of errors.
// Swapping to a real endpoint = editing one helper here.

import { authedFetch } from './auth-tokens';

export type ProxyService =
  | 'auth' | 'acteurs' | 'contractant' | 'appels'
  | 'documents' | 'soumissions' | 'evaluations' | 'contrats' | 'recours';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ReqOptions {
  method?: Method;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  form?: FormData;
}

/** Low-level proxied request. Attaches auth, auto-refreshes on 401, throws on non-2xx. */
export async function proxy<T>(service: ProxyService, path: string, opts: ReqOptions = {}): Promise<T> {
  const params = new URLSearchParams({ path });
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    }
  }
  const headers: Record<string, string> = { Accept: 'application/json' };

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await authedFetch(`/api/proxy/${service}?${params.toString()}`, {
    method: opts.method || 'GET',
    headers,
    body,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      detail = data?.detail || data?.message || data?.error || detail;
    } catch {
      /* keep default */
    }
    throw new ApiFailure(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiFailure extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiFailure';
  }
}

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const r = payload as { results?: unknown; data?: unknown };
    if (Array.isArray(r.results)) return r.results as T[];
    if (Array.isArray(r.data)) return r.data as T[];
  }
  return [];
}

async function safeList<T>(fn: () => Promise<unknown>): Promise<T[]> {
  try {
    return asList<T>(await fn());
  } catch {
    return [];
  }
}

async function safeOne<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Types (kept minimal — only what the SC frontend reads/writes)
// ---------------------------------------------------------------------------
export interface AppelOffre {
  id_appel_offres: number;
  id_service_contractant?: number;
  reference?: string;
  titre?: string;
  description?: string;
  type_procedure?: string;
  montant_estime?: string | number;
  date_publication?: string | null;
  date_limite_soumission?: string | null;
  date_ouverture_plis?: string | null;
  poids_technique?: number | null;
  poids_financier?: number | null;
  id_doc_cdc?: number | null;
  id_doc_justification?: number | null;
  id_doc_besoin?: number | null;
  id_operateur_choisi?: number | null;
  operateurs_invites?: { id: number; id_operateur_economique: number; statut_invitation?: string }[];
  statut?: string;
  commission_id?: string | number | null;
  validation_level?: string | null;
  attribution_statut?: string | null;
  recours_en_cours?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

type AppelOffreWrite = Partial<Omit<AppelOffre, 'operateurs_invites'>> & {
  operateurs_invites?: number[];
};

export interface Membre {
  id_membre: string | number;
  nom?: string;
  prenom?: string;
  email?: string;
  organisation?: Organisation;
  compte_auth?: {
    id_utilisateur?: number;
    email?: string;
    role?: string;
    role_nom?: string;
    is_active?: boolean;
  } | null;
  telephone?: string;
  fonction?: string;
  role?: string;
  statut?: string;
}

export interface Organisation {
  id_organisation: string | number;
  nom_officiel?: string;
  type_entite?: string;
  adresse_siege?: string;
  email_contact?: string;
  wilaya?: string;
  secteur?: string;
}

export interface CommissionInterne {
  id_comission_interne: number;
  id_service?: number;
  nom_comission?: string;
  type_comission?: string;
  membres?: CommissionInterneMembre[];
}

export interface CommissionEvaluation {
  id_comission: number;
  id_service?: number;
  nom_comission?: string;
  categorie?: string;
  membres?: CommissionEvaluationMembre[];
}

export interface CommissionEvaluationMembre {
  id?: number;
  id_comission?: number;
  id_utilisateur: number;
  role_label?: 'president' | 'secretaire' | 'membre';
}

export interface CommissionInterneMembre {
  id?: number;
  id_membre: number;
  id_commision_interne?: number;
}

export interface RegistreEntry {
  id?: number;
  id_comission?: number;
  id_soumission: number;
  numero_ordre: number;
  nom_oe: string;
  received_at: string;
  submitted_at: string;
  hors_delai: boolean;
}

export interface SoumissionLite {
  id_soumission: number;
  id_appel_offre?: number;
  id_soumissionnaire?: number;
  date_soumission?: string;
  montant_financier?: string | number | null;
  statut?: string;
}

export interface DemandeOE {
  id?: number | string;
  nom_officiel?: string;
  email_contact?: string;
  statut?: string;
  created_at?: string;
  id_service_contractant?: number;
}

export interface Clarification {
  id?: number | string;
  id_appel_offres?: number;
  question?: string;
  reponse?: string | null;
  auteur?: string;
  statut?: string;
  created_at?: string;
}

export interface OperateurRegistre {
  id_organisation: string | number;
  id_operateur_economique?: number;
  nom_officiel?: string;
  secteur?: string;
  wilaya?: string;
  chiffre_affaires?: string | number;
}

export interface Attribution {
  id?: number;
  service_contractant_id?: number;
  soumission_id?: number;
  appel_id?: number;
  commission_id?: number;
  validated_by?: string | number | null;
  validation_level?: string;
  statut?: 'provisoire' | 'definitive';
}

// ---------------------------------------------------------------------------
// Appels d'offres
// ---------------------------------------------------------------------------
export const scApi = {
  listAppels: (query: { service_id?: number; statut?: string; type_procedure?: string; search?: string } = {}) =>
    safeList<AppelOffre>(() => proxy('appels', 'appels-offres', { query })),

  getAppel: (id: number | string) =>
    safeOne<AppelOffre>(() => proxy('appels', `appels-offres/${id}`)),

  // The create serializer requires `type_procedure`, so the AO is persisted once the type is known.
  createAppel: (data: AppelOffreWrite) =>
    proxy<AppelOffre>('appels', 'appels-offres', { method: 'POST', body: data }),

  updateAppel: (id: number | string, data: AppelOffreWrite) =>
    proxy<AppelOffre>('appels', `appels-offres/${id}`, { method: 'PATCH', body: data }),

  linkCommission: (id: number | string, commissionId: number | string) =>
    proxy<AppelOffre>('appels', `appels-offres/${id}`, { method: 'PATCH', body: { commission_id: String(commissionId) } }),

  attachDocument: (appelId: number | string, documentId: number) =>
    proxy('appels', `appels-offres/${appelId}/documents`, { method: 'POST', body: { id_document: documentId } }),

  submitForValidation: (id: number | string) =>
    proxy('appels', `appels-offres/${id}/soumettre-validation`, { method: 'POST', body: {} }),

  publishAppel: (id: number | string) =>
    proxy('appels', `appels-offres/${id}/publier`, { method: 'POST', body: {} }),

  clotureDepot: (id: number | string) =>
    proxy('appels', `appels-offres/${id}/cloturer-depot`, { method: 'POST', body: {} }),

  ouvrirPlis: (id: number | string) =>
    proxy('appels', `appels-offres/${id}/ouvrir-plis`, { method: 'POST', body: {} }),

  annulerAppel: (id: number | string, motif: string) =>
    proxy('appels', `appels-offres/${id}/annuler`, { method: 'POST', body: { motif } }),

  deleteDraft: (id: number | string) =>
    proxy('appels', `appels-offres/${id}`, { method: 'DELETE' }),

  listAppelDocuments: (id: number | string) =>
    safeList<{ id_document: number; nom?: string }>(() => proxy('appels', `appels-offres/${id}/documents`)),

  countSoumissions: async (id: number | string): Promise<number> => {
    const list = await safeList<unknown>(() => proxy('appels', `appels-offres/${id}/soumissions`));
    return list.length;
  },

  listSoumissionsForAppel: (id: number | string) =>
    safeList<SoumissionLite>(() => proxy('appels', `appels-offres/${id}/soumissions`)),

  // ----- Documents -----
  uploadDocument: (file: File, relatedType: string, isEncrypted = false) => {
    const form = new FormData();
    form.append('file', file);
    form.append('related_type', relatedType);
    form.append('is_encrypted', isEncrypted ? 'true' : 'false');
    return proxy<{ id_document: number; nom?: string }>('documents', 'api/documents/', { method: 'POST', form });
  },

  // ----- Internal validation queue -----
  listValidationQueue: (commissionId?: number) =>
    safeList<AppelOffre>(() => proxy('appels', 'appels-offres', { query: { statut: 'non validé', commission_id: commissionId } })),

  assignValidator: (id: number | string, membreId: string | number) =>
    proxy('appels', `appels-offres/${id}/affecter-validateur`, { method: 'POST', body: { validated_by: membreId } }),

  validerMarche: (id: number | string, commentaire = '') =>
    proxy('appels', `appels-offres/${id}/valider`, { method: 'POST', body: { commentaire } }),

  rejeterMarche: (id: number | string, motif: string) =>
    proxy('appels', `appels-offres/${id}/refuser`, { method: 'POST', body: { motif } }),

  // ----- Attribution (contrats_service: attributions-provisoires) -----
  listAttributionsProvisoires: (commissionId?: number) =>
    safeList<Attribution>(() => proxy('contrats', 'attributions-provisoires/', { query: { commission_id: commissionId } })),

  getAttribution: (id: number | string) =>
    safeOne<Attribution>(() => proxy('contrats', `attributions-provisoires/${id}/`)),

  affecterAttribution: (id: number | string, membreId: string | number) =>
    proxy('contrats', `attributions-provisoires/${id}/affecter/`, { method: 'POST', body: { validated_by: membreId } }),

  validerAttribution: (id: number | string) =>
    proxy('contrats', `attributions-provisoires/${id}/valider/`, { method: 'POST', body: {} }),

  // ----- Organisation & membres -----
  getOrganisation: async (membreId: string | number) => {
    const member = await safeOne<Membre>(() => proxy('acteurs', `membres/${membreId}/`));
    return member?.organisation || null;
  },

  listMembres: (orgId: string | number) =>
    safeList<Membre>(() => proxy('acteurs', `organisations/${orgId}/membres/`)),

  createCollaborateur: (data: Partial<Membre> & { id_organisation: string | number; role: string }) =>
    proxy<Membre>('acteurs', 'membres/creer-collaborateur/', { method: 'POST', body: data }),

  updateMembre: (id: string | number, data: Partial<Membre>) =>
    proxy<Membre>('acteurs', `membres/${id}/`, { method: 'PATCH', body: data }),

  deactivateMembre: (id: string | number) =>
    proxy('acteurs', `membres/${id}/`, { method: 'DELETE' }),

  assignRole: (id: string | number, role: string) =>
    proxy<Membre>('acteurs', `membres/${id}/`, { method: 'PATCH', body: { role } }),

  // ----- Commissions -----
  // COPEO commissions live in evaluations_service because registre/CT/state read from that table.
  listCommissionsEvaluation: (serviceId: string | number) =>
    safeList<CommissionEvaluation>(() => proxy('evaluations', 'commissions/', { query: { service_id: serviceId } })),
  createCommissionEvaluation: (data: { id_service: string | number; nom_comission: string; categorie: string }) =>
    proxy<CommissionEvaluation>('evaluations', 'commissions/', { method: 'POST', body: data }),
  deleteCommissionEvaluation: (id: string | number) =>
    proxy('evaluations', `commissions/${id}/`, { method: 'DELETE' }),
  listCommissionEvaluationMembres: (id: string | number) =>
    safeList<CommissionEvaluationMembre>(() => proxy('evaluations', `commissions/${id}/membres/`)),
  addCommissionEvaluationMembre: (
    id: string | number,
    utilisateurId: string | number,
    roleLabel: 'president' | 'secretaire' | 'membre' = 'membre',
  ) =>
    proxy('evaluations', `commissions/${id}/membres/`, { method: 'POST', body: { id_utilisateur: utilisateurId, role_label: roleLabel } }),
  removeCommissionEvaluationMembre: (id: string | number, utilisateurId: string | number) =>
    proxy('evaluations', `commissions/${id}/membres/${utilisateurId}/`, { method: 'DELETE' }),

  // Commission interne: {id_service, nom_comission, type_comission ∈ parmanante|adhoc}
  listCommissionsInternes: (serviceId: string | number) =>
    safeList<CommissionInterne>(() => proxy('contractant', 'commissions-internes', { query: { id_service: serviceId } })),
  createCommissionInterne: (data: { id_service: string | number; nom_comission: string; type_comission: string }) =>
    proxy<CommissionInterne>('contractant', 'commissions-internes', { method: 'POST', body: data }),
  deleteCommissionInterne: (id: string | number) =>
    proxy('contractant', `commissions-internes/${id}`, { method: 'DELETE' }),
  listCommissionInterneMembres: (id: string | number) =>
    safeList<CommissionInterneMembre>(() => proxy('contractant', `commissions-internes/${id}/membres`)),
  addCommissionInterneMembre: (id: string | number, membreId: string | number) =>
    proxy('contractant', `commissions-internes/${id}/membres/${membreId}`, { method: 'POST', body: {} }),
  removeCommissionInterneMembre: (id: string | number, membreId: string | number) =>
    proxy('contractant', `commissions-internes/${id}/membres/${membreId}`, { method: 'DELETE' }),

  // ----- Comité Technique (evaluations_service; create endpoint is a backend gap, degrades gracefully) -----
  listCT: (commissionId: string | number) =>
    safeList<{ id_utilisateur: number }>(() => proxy('evaluations', 'ct/commission/', { query: { id_comission: commissionId } })),
  assignCT: (commissionId: string | number, utilisateurId: string | number) =>
    proxy('evaluations', 'ct/commission/', { method: 'POST', body: { id_comission: commissionId, id_utilisateur: utilisateurId } }),
  removeCT: (commissionId: string | number, utilisateurId: string | number) =>
    proxy('evaluations', 'ct/commission/', { method: 'DELETE', body: { id_comission: commissionId, id_utilisateur: utilisateurId } }),

  // ----- Registre de réception (evaluations_service, keyed by id_comission) -----
  listRegistre: (commissionId: string | number) =>
    safeList<RegistreEntry>(() => proxy('evaluations', `commissions/${commissionId}/registre/`)),
  validerReception: (commissionId: string | number, entry: Omit<RegistreEntry, 'id'>) =>
    proxy<RegistreEntry>('evaluations', `commissions/${commissionId}/registre/`, { method: 'POST', body: entry }),
  listSoumissionsByCommission: (commissionId: string | number) =>
    safeList<SoumissionLite>(() => proxy('soumissions', `by-commission/${commissionId}/`)),

  // ----- Demandes d'inscription OE (acteurs_service, scoped to the SC) -----
  listDemandesOE: (_serviceId?: string | number) =>
    safeList<DemandeOE>(() => proxy('acteurs', 'service-contractant/demandes/')),

  approveDemandeOE: (id: string | number) =>
    proxy('acteurs', `service-contractant/demandes/${id}/approuver/`, { method: 'POST', body: {} }),

  refuseDemandeOE: (id: string | number, motif: string) =>
    proxy('acteurs', `service-contractant/demandes/${id}/rejeter/`, { method: 'POST', body: { motif_rejet: motif } }),

  // ----- Clarifications -----
  listClarifications: (serviceId?: string | number) =>
    safeList<Clarification>(() => proxy('appels', 'clarifications/', { query: { id_service_contractant: serviceId } })),

  repondreClarification: (id: string | number, reponse: string) =>
    proxy('appels', `clarifications/${id}/repondre/`, { method: 'POST', body: { reponse } }),

  // ----- Registre OE (for restreint / gré à gré selection) -----
  listOperateurs: (query: { secteur?: string; wilaya?: string; search?: string } = {}) =>
    safeList<OperateurRegistre>(() => proxy('acteurs', 'admin/organisations/operateurs/', { query })),

  // ----- Recours (read + respond only; lifecycle owned by the recours team) -----
  listRecours: (appelId?: number | string) =>
    safeList<{ id: number | string; statut?: string; motif?: string; created_at?: string }>(
      () => proxy('recours', 'api/recours/', { query: { id_appel_offre: appelId } }),
    ),
};
