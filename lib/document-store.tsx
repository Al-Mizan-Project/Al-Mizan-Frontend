'use client';

import {
  createContext, useContext, useReducer,
  useEffect, useCallback, ReactNode
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type DocKey = 'loi-23-12' | 'loi-17-18';

export interface StoredDoc {
  key: DocKey;
  filename: string;
  dataUrl: string;       // base64 PDF data URL
  uploadedAt: string;    // ISO string
  sizeKb: number;
}

type DocState = Record<DocKey, StoredDoc | null>;

type DocAction =
  | { type: 'SET'; payload: StoredDoc }
  | { type: 'REMOVE'; key: DocKey }
  | { type: 'LOAD'; payload: Partial<DocState> };

const STORAGE_KEY = 'elmizan_ref_docs';

const INITIAL: DocState = { 'loi-23-12': null, 'loi-17-18': null };

function reducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.payload.key]: action.payload };
    case 'REMOVE':
      return { ...state, [action.key]: null };
    case 'LOAD':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface DocContextValue {
  docs: DocState;
  uploadDoc: (key: DocKey, file: File) => Promise<void>;
  removeDoc: (key: DocKey) => void;
}

const DocContext = createContext<DocContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function DocumentStoreProvider({ children }: { children: ReactNode }) {
  const [docs, dispatch] = useReducer(reducer, INITIAL);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DocState>;
        dispatch({ type: 'LOAD', payload: parsed });
      }
    } catch { /* ignore */ }
  }, []);

  // Persist on every change
  useEffect(() => {
    try {
      // Only persist keys that have data (avoid storing nulls taking up space)
      const toSave: Partial<DocState> = {};
      (Object.keys(docs) as DocKey[]).forEach(k => {
        if (docs[k]) toSave[k] = docs[k];
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e: any) {
      // localStorage can throw QuotaExceededError for large PDFs
      if (e?.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded — PDF too large to cache locally.');
      }
    }
  }, [docs]);

  const uploadDoc = useCallback(async (key: DocKey, file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        dispatch({
          type: 'SET',
          payload: {
            key,
            filename: file.name,
            dataUrl,
            uploadedAt: new Date().toISOString(),
            sizeKb: Math.round(file.size / 1024),
          },
        });
        resolve();
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const removeDoc = useCallback((key: DocKey) => {
    dispatch({ type: 'REMOVE', key });
  }, []);

  return (
    <DocContext.Provider value={{ docs, uploadDoc, removeDoc }}>
      {children}
    </DocContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useDocumentStore() {
  const ctx = useContext(DocContext);
  if (!ctx) throw new Error('useDocumentStore must be used within DocumentStoreProvider');
  return ctx;
}