// app/[lang]/validation/[role]/layout.tsx
'use client';

import React, { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import '../../validation.css';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

interface ValidationLayoutProps {
  children: ReactNode;
}

export default function ValidationLayout({ children }: ValidationLayoutProps) {
  const params = useParams(); // hook pour récupérer les params dynamiques
  const lang = Array.isArray(params.lang) ? params.lang[0] : params.lang || 'fr';
  const role = (Array.isArray(params.role) ? params.role[0] : params.role) as 'commission' | 'validator' || 'validator';

  return (
    <div className="flex h-screen overflow-hidden validation-theme" style={{ backgroundColor: 'var(--color-blue-0)' }}>
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar lang={lang} role={role} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header lang={lang} role={role} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}