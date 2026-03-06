'use client';

import {
  createContext, useContext, useReducer, useEffect,
  useCallback, ReactNode
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  nom: string;
  prenom: string;
  role: string;
  email: string;
  photoUrl: string | null; // base64 data URL or null
}

interface ProfileState {
  profile: UserProfile;
  lastSaved: Date | null;
}

type ProfileAction =
  | { type: 'UPDATE'; payload: Partial<UserProfile> }
  | { type: 'SET_PHOTO'; url: string | null }
  | { type: 'LOAD'; payload: UserProfile };

const DEFAULT_PROFILE: UserProfile = {
  nom: '',
  prenom: '',
  role: 'Chef évaluateur',
  email: '',
  photoUrl: null,
};

const STORAGE_KEY = 'elmizan_user_profile';

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'LOAD':
      return { ...state, profile: action.payload };
    case 'UPDATE':
      return {
        profile: { ...state.profile, ...action.payload },
        lastSaved: new Date(),
      };
    case 'SET_PHOTO':
      return {
        profile: { ...state.profile, photoUrl: action.url },
        lastSaved: new Date(),
      };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface ProfileContextValue {
  profile: UserProfile;
  lastSaved: Date | null;
  updateProfile: (data: Partial<UserProfile>) => void;
  setPhoto: (url: string | null) => void;
  /** Returns initials like "AB" for display in avatar */
  initials: string;
  /** Full display name */
  displayName: string;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    profile: DEFAULT_PROFILE,
    lastSaved: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as UserProfile;
        dispatch({ type: 'LOAD', payload: saved });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage on every update
  useEffect(() => {
    if (state.lastSaved) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profile));
      } catch {
        // ignore storage errors
      }
    }
  }, [state.profile, state.lastSaved]);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE', payload: data });
  }, []);

  const setPhoto = useCallback((url: string | null) => {
    dispatch({ type: 'SET_PHOTO', url });
  }, []);

  const { nom, prenom, role } = state.profile;
  const displayName = [prenom, nom].filter(Boolean).join(' ') || role || 'Utilisateur';
  const initials = [prenom[0], nom[0]].filter(Boolean).join('').toUpperCase() || 'U';

  return (
    <ProfileContext.Provider value={{
      profile: state.profile,
      lastSaved: state.lastSaved,
      updateProfile,
      setPhoto,
      initials,
      displayName,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useUserProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}