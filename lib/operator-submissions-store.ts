export type StoredSubmissionDocument = {
  idDocument: number;
  name: string;
  type: 'technique' | 'financiere' | 'administratif';
  size: string;
  encrypted?: boolean;
};

export type StoredSubmission = {
  id: number;
  appelOffre: {
    id: number;
    reference: string;
    titre: string;
    serviceContractant: string;
    montantEstime: number;
  };
  dateSoumission: string;
  montantSoumis: number;
  statut: 'soumise' | 'en_evaluation' | 'conforme' | 'refusee' | 'attribuee';
  conformiteAdmin: 'conforme' | 'non_conforme' | 'en_attente';
  conformiteTechnique: 'conforme' | 'non_conforme' | 'en_attente';
  conformiteFinanciere: 'conforme' | 'non_conforme' | 'en_attente';
  conformiteRapport?: { missing_documents?: string[]; invalid_documents?: string[] } | null;
  motifRefus?: string;
  dateEvaluation?: string;
  documents: StoredSubmissionDocument[];
};

const STORAGE_KEY = 'operator-submissions-v1';

export function loadStoredSubmissions(): StoredSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredSubmissions(submissions: StoredSubmission[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

export function upsertStoredSubmission(submission: StoredSubmission): void {
  const existing = loadStoredSubmissions();
  const next = [
    submission,
    ...existing.filter((item) => item.id !== submission.id),
  ];
  saveStoredSubmissions(next);
}

export function findStoredSubmissionById(id: number): StoredSubmission | null {
  const existing = loadStoredSubmissions();
  return existing.find((item) => item.id === id) || null;
}
