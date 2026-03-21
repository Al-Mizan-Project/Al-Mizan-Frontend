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
};

const APPELS_BASE = process.env.NEXT_PUBLIC_APPELS_SERVICE_URL || 'http://localhost:18083';
const DOCUMENTS_BASE = process.env.NEXT_PUBLIC_DOCUMENTS_SERVICE_URL || 'http://localhost:8003';
const SOUMISSIONS_BASE = process.env.NEXT_PUBLIC_SOUMISSIONS_SERVICE_URL || 'http://localhost:8004';
const IA_BASE = process.env.NEXT_PUBLIC_IA_SERVICE_URL || 'http://localhost:18088';

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

function withAuthHeaders(init?: RequestInit): RequestInit | undefined {
  const token = getAuthToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return {
    ...init,
    headers,
  };
}

function shouldAttachAuth(url: string): boolean {
  return url.startsWith(SOUMISSIONS_BASE) || url.startsWith(IA_BASE);
}

function resolveListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown[] }).results)) {
    return (payload as { results: T[] }).results;
  }
  return [];
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const requestUrl = typeof input === 'string' ? input : input.toString();
  const requestInit = shouldAttachAuth(requestUrl) ? withAuthHeaders(init) : init;
  const response = await fetch(input, requestInit);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

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

export async function fetchDocumentsByIds(ids: number[]): Promise<DocumentApi[]> {
  if (!ids.length) return [];
  const query = new URLSearchParams({ ids: ids.join(',') });
  const payload = await fetchJson<unknown>(`${DOCUMENTS_BASE}/api/documents/search/?${query.toString()}`);
  return resolveListPayload<DocumentApi>(payload);
}

export async function fetchOperatorDocuments(operatorId: number): Promise<DocumentApi[]> {
  const query = new URLSearchParams({ related_type: `operator:${operatorId}` });
  const payload = await fetchJson<unknown>(`${DOCUMENTS_BASE}/api/documents/search/?${query.toString()}`);
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

  const payload = await fetchJson<DocumentApi | { documents: DocumentApi }>(`${DOCUMENTS_BASE}/api/documents/`, {
    method: 'POST',
    body: formData,
  });

  if ('id_document' in payload) {
    return payload;
  }

  return payload.documents;
}

export async function deleteDocument(documentId: number): Promise<void> {
  const response = await fetch(
    `${DOCUMENTS_BASE}/api/documents/${documentId}/delete/`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
}

export async function createSoumission(payload: {
  id_appel_offre: number;
  id_soumissionnaire: number;
  offre_financiere_chiffree_url: string;
  cle_dechiffrement_hash: string;
  document_ids?: number[];
}): Promise<{ id: number; message: string }> {
  return fetchJson<{ id: number; message: string }>(`${SOUMISSIONS_BASE}/api/soumissions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchSoumissionsByOperator(operatorId: number): Promise<SoumissionApi[]> {
  const query = new URLSearchParams({ id_soumissionnaire: String(operatorId) });
  const payload = await fetchJson<unknown>(`${SOUMISSIONS_BASE}/api/soumissions/?${query.toString()}`);
  return resolveListPayload<SoumissionApi>(payload);
}

export async function fetchSoumissionById(soumissionId: number): Promise<SoumissionApi> {
  return fetchJson<SoumissionApi>(`${SOUMISSIONS_BASE}/api/soumissions/${soumissionId}/`);
}

export async function runConformiteAuto(payload: {
  soumissionId: number;
  idAppelOffre: number;
  providedDocumentIds: number[];
  performOcr?: boolean;
}): Promise<{
  conformite_statut: string;
  conformite_rapport?: { missing_documents?: string[]; invalid_documents?: string[] };
}> {
  return fetchJson(`${IA_BASE}/ia/conformite/verifier-soumission-auto/${payload.soumissionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_appel_offre: payload.idAppelOffre,
      provided_document_ids: payload.providedDocumentIds,
      perform_ocr: payload.performOcr ?? true,
    }),
  });
}
