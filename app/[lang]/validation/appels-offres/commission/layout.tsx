'use client';

import React, { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import '../../validation.css';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

interface LayoutProps {
  children: ReactNode;
}

export default function AppelsOffresLayout({ children }: LayoutProps) {
  const params = useParams();
  const lang = Array.isArray(params.lang) ? params.lang[0] : params.lang || 'fr';

  return (
    <div className="flex h-screen overflow-hidden validation-theme" style={{ backgroundColor: 'var(--color-blue-0)' }}>
      <div className="hidden md:block">
        <Sidebar lang={lang} role="commission" />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header 
          variant="dashboard" 
          lang={lang} 
          role="commission" 
          dict={{
            dashboard: {
              title: lang === 'ar' ? 'طلبات العروض' : "Appels d'offres"
            }
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
