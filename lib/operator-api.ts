export type AppelOffreApi = {
  id_appel_offres: number;
  id_service_contractant: number;
  reference: string;
  titre: string;
  description: string;
  type_procedure: string;
  montant_estime: string | number;
  date_publication: string;
  date_limite_soumission: string;
  date_ouverture_plis: string;
  statut: string;
};

export type AppelDocumentApi = {
  id: number;
  id_document: number;
  id_appel_offres: number;
};

export type DocumentApi = {
  id_document: number;
  nom: string;
  type_document: string;
  storage_url: string;
  taille_fichier: number;
  related_type: string;
  is_encrypted: boolean;
  ia_verif_statut: string | null;
};

export type SoumissionApi = {
  id_soumission: number;
  reference: string;
  id_appel_offre: number;
  id_soumissionnaire: number;
  offre_financiere_chiffree_url: string;
  document_ids: number[];
  statut: string;
  montant_financier: string | number | null;
  date_soumission: string;
  conformite_statut: string | null;
  conformite_rapport: {
    missing_documents?: string[];
    invalid_documents?: string[];
  } | null;
  reference_ao?: string;
  titre_ao?: string;
  progression?: number;
  rapport?: unknown;
};

export type RecoursApi = {
  id_recours: number;
  id_operateur_economique: number;
  id_soumission: number;
  id_validation: number | null;
  statut: string;
  motif: string;
  type_recours: string | null;
  objet: string;
  explications: string;
  document_ids: number[];
  decision: string | null;
  date_depot: string;
  date_limite: string;
  date_fin_instruction: string | null;
  date_decision: string | null;
  traite_par: number | null;
};

export type MembreProfileApi = {
  id_membre: string;
  nom: string;
  prenom: string;
  telephone: string;
  fonction: string;
  created_at: string;
  updated_at: string;
  organisation: {
    id_organisation: string;
    nom_officiel: string;
    type_entite: string;
    type_entite_display: string;
    adresse_siege: string;
    email_contact: string;
  };
};

export type NotificationApi = {
  id: number;
  utilisateur_id: number;
  type_notification: string;
  titre: string;
  message: string;
  priorite: string;
  categorie: string;
  entite_liee_type: string;
  entite_liee_id: number;
  statut: string;
  created_at: string;
  sent_at: string;
  read_at: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const APPELS_BASE = process.env.NEXT_PUBLIC_APPELS_SERVICE_URL || API_BASE;
const DOCUMENTS_BASE = process.env.NEXT_PUBLIC_DOCUMENTS_SERVICE_URL || API_BASE;
const SOUMISSIONS_BASE = process.env.NEXT_PUBLIC_SOUMISSIONS_SERVICE_URL || API_BASE;
const IA_BASE = process.env.NEXT_PUBLIC_IA_SERVICE_URL || API_BASE;
const AUTH_BASE = API_BASE;
const ACTEURS_BASE = API_BASE;

function getAuthToken(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_AUTH_TOKEN || '';
  }
  return (
    window.localStorage.getItem('access_token') ||
    window.localStorage.getItem('authToken') ||
    window.localStorage.getItem('token') ||
    process.env.NEXT_PUBLIC_AUTH_TOKEN ||
    ''
  );
}

export function withAuthHeaders(init?: RequestInit): RequestInit {
  const token = getAuthToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers };
}

function resolveListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { results?: unknown[] }).results)
  ) {
    return (payload as { results: T[] }).results;
  }
  return [];
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, withAuthHeaders(init));
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

// ─────────────────────────────────────────────
// APPELS D'OFFRES
// ─────────────────────────────────────────────

export async function fetchAppelsOffres(): Promise<AppelOffreApi[]> {
  const payload = await fetchJson<unknown>(`${APPELS_BASE}/appels-offres`);
  return resolveListPayload<AppelOffreApi>(payload);
}

export async function fetchAppelOffreById(appelId: number): Promise<AppelOffreApi> {
  return fetchJson<AppelOffreApi>(`${APPELS_BASE}/appels-offres/${appelId}`);
}

export async function fetchAppelDocuments(appelId: number): Promise<AppelDocumentApi[]> {
  const payload = await fetchJson<unknown>(`${APPELS_BASE}/appels-offres/${appelId}/documents`);
  return resolveListPayload<AppelDocumentApi>(payload);
}

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────

export async function fetchDocumentsByIds(ids: number[]): Promise<DocumentApi[]> {
  if (!ids.length) return [];
  const query = new URLSearchParams({ ids: ids.join(',') });
  const payload = await fetchJson<unknown>(
    `${DOCUMENTS_BASE}/api/documents/search/?${query.toString()}`
  );
  return resolveListPayload<DocumentApi>(payload);
}

export async function fetchOperatorDocuments(operatorId: number): Promise<DocumentApi[]> {
  const query = new URLSearchParams({ id_operateur_economique: String(operatorId) });
  const payload = await fetchJson<unknown>(
    `${DOCUMENTS_BASE}/api/documents/search/?${query.toString()}`
  );
  return resolveListPayload<DocumentApi>(payload);
}

export async function uploadDocument(args: {
  file: File;
  relatedType: string;
  isEncrypted?: boolean;
}): Promise<DocumentApi> {
  const formData = new FormData();
  formData.append('file', args.file);
  formData.append('related_type', args.relatedType);
  formData.append('is_encrypted', args.isEncrypted ? 'true' : 'false');

  const payload = await fetchJson<DocumentApi | { documents: DocumentApi }>(
    `${DOCUMENTS_BASE}/api/documents/`,
    { method: 'POST', body: formData }
  );
  if ('id_document' in payload) return payload;
  return payload.documents;
}

export async function deleteDocument(documentId: number): Promise<void> {
  const response = await fetch(
    `${DOCUMENTS_BASE}/api/documents/${documentId}/delete/`,
    withAuthHeaders({ method: 'DELETE' })
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
}

// ─────────────────────────────────────────────
// SOUMISSIONS
// ─────────────────────────────────────────────

export async function createSoumission(payload: {
  id_appel_offre: number;
  id_soumissionnaire: number;
  offre_financiere_chiffree_url: string;
  cle_dechiffrement_hash: string;
  document_ids?: number[];
}): Promise<{ id: number; message: string }> {
  return fetchJson<{ id: number; message: string }>(`${SOUMISSIONS_BASE}/api/soumissions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function fetchSoumissionsByOperator(operatorId: number): Promise<SoumissionApi[]> {
  const payload = await fetchJson<unknown>(
    `${SOUMISSIONS_BASE}/api/operateurs-economiques/${operatorId}/soumissions`
  );
  return resolveListPayload<SoumissionApi>(payload);
}

export async function fetchSoumissionById(soumissionId: number): Promise<SoumissionApi> {
  return fetchJson<SoumissionApi>(`${SOUMISSIONS_BASE}/api/soumissions/${soumissionId}/`);
}

// ─────────────────────────────────────────────
// RECOURS
// ─────────────────────────────────────────────

export async function fetchRecours(filters?: Record<string, string>): Promise<RecoursApi[]> {
  const query = filters ? '?' + new URLSearchParams(filters).toString() : '';
  const payload = await fetchJson<unknown>(`${API_BASE}/api/recours/${query}`);
  return resolveListPayload<RecoursApi>(payload);
}

export async function fetchRecoursById(recoursId: number): Promise<RecoursApi> {
  return fetchJson<RecoursApi>(`${API_BASE}/api/recours/${recoursId}/`);
}

export async function createRecours(payload: {
  id_operateur_economique: number;
  id_soumission: number;
  motif: string;
  type_recours: 'GRACIEUX' | 'HIERARCHIQUE' | 'CONTENTIEUX';
  objet?: string;
  explications?: string;
  document_ids?: number[];
}): Promise<RecoursApi> {
  return fetchJson<RecoursApi>(`${API_BASE}/api/recours/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────
// IA
// ─────────────────────────────────────────────

export async function runConformiteAuto(payload: {
  soumissionId: number;
  idAppelOffre: number;
  providedDocumentIds: number[];
  performOcr?: boolean;
}): Promise<{
  conformite_statut: string;
  conformite_rapport?: { missing_documents?: string[]; invalid_documents?: string[] };
}> {
  return fetchJson(
    `${IA_BASE}/ia/conformite/verifier-soumission-auto/${payload.soumissionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_appel_offre: payload.idAppelOffre,
        provided_document_ids: payload.providedDocumentIds,
        perform_ocr: payload.performOcr ?? true,
      }),
    }
  );
}

// ─────────────────────────────────────────────
// MEMBRES / ACTEURS
// ─────────────────────────────────────────────

export async function fetchMembreProfile(membreId: string): Promise<MembreProfileApi> {
  return fetchJson<MembreProfileApi>(`${ACTEURS_BASE}/membres/${membreId}/`);
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export async function fetchUserNotifications(userId: number): Promise<NotificationApi[]> {
  const payload = await fetchJson<unknown>(`${AUTH_BASE}/users/${userId}/notifications`);
  return resolveListPayload<NotificationApi>(payload);
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  await fetchJson<unknown>(`${AUTH_BASE}/notifications/${notificationId}/marquer-lu`, {
    method: 'POST',
  });
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await fetchJson<unknown>(`${AUTH_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}