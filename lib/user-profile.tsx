'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth';
import { api } from './api';

interface UserProfile {
  email: string;
  role: string;
  photoUrl: string | null;
}

interface ProfileContextValue {
  profile: UserProfile;
  lastSaved: Date | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setPhoto: (url: string | null) => void;
  initials: string;
  displayName: string;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    email: '',
    role: '',
    photoUrl: null,
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (authUser) {
      setProfile({
        email: authUser.email || '',
        role: authUser.id_role ? `Rôle #${authUser.id_role}` : 'Sans rôle',
        photoUrl: null,
      });
    }
  }, [authUser]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!authUser) return;
    const payload: any = {};
    if (data.email !== undefined) payload.email = data.email;
    await api.patch(`/users/${authUser.id_utilisateur}`, payload);
    setProfile((prev) => ({ ...prev, ...data }));
    setLastSaved(new Date());
  };

  const setPhoto = (url: string | null) => {
    setProfile((prev) => ({ ...prev, photoUrl: url }));
    setLastSaved(new Date());
  };

  const displayName = profile.email || 'Utilisateur';
  const initials = profile.email?.[0]?.toUpperCase() || 'U';

  return (
    <ProfileContext.Provider value={{ profile, lastSaved, updateProfile, setPhoto, initials, displayName }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider');
  return ctx;
}