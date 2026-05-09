// app/providers.tsx
'use client';

import { AuthProvider } from '@/lib/auth';
import { UserProfileProvider } from '@/lib/user-profile';
import { NotificationProvider } from '@/lib/notifications';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}