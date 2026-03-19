// app/[lang]/validation/layout.tsx
import React, { ReactNode } from 'react';
import '../../validation.css';
import Sidebar from '../../components/layout/Sidebar';
import ToutLesDossiersHeader from '../../components/layout/ToutLesDossiersHeader';

interface ValidationLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string; role: string }>;
}

export default async function ValidationLayout({ children, params }: ValidationLayoutProps) {
  const { lang, role } = await params;

  const userRole = (role as 'commission' | 'validator') || 'validator';

  return (
    <div
      className="flex h-screen overflow-hidden validation-theme"
      style={{ backgroundColor: 'var(--color-blue-0)' }}
    >
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar lang={lang} role={userRole} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <ToutLesDossiersHeader lang={lang} role={userRole} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}