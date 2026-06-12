'use client';

import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';

export default function UserManagementLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const { user, isLoading } = useAuth();
  const role = user?.role ?? null;
  const isAr = lang === 'ar';

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }
  const safeRole = role === 'validator' ? 'validator' : 'commission';

  return (
    <div className="val-container flex" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Sidebar - Fixe à gauche */}
      <Sidebar lang={lang} role={safeRole} />

      {/* Contenu principal - Scrollable à droite */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--color-blue-0)]">
        {/* Header avec la variante 'users' */}
        <Header lang={lang} role={safeRole} variant="users" />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
