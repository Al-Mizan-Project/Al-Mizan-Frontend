// app/[lang]/validation/dossiers/[id]/[role]/layout.tsx
import { ReactNode } from 'react';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/dictionaries/types';
import Sidebar from '@/app/[lang]/validation/components/layout/Sidebar';
import FileHeader from '../../../components/layout/FileHeader';
import '../../../validation.css';

interface DossierLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string; lang: string; role: string }>;
}

export default async function DossierLayout({ 
  children, 
  params 
}: DossierLayoutProps) {
  const { lang, id, role } = await params;
  const locale = lang as Locale;

  // Forcer le rôle au type valide
  const userRole = (role as 'commission' | 'validator') || 'validator';

  return (
    <div 
      className="flex h-screen overflow-hidden validation-theme" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ backgroundColor: 'var(--color-blue-0)' }}
    >
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar lang={lang} role={userRole} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* FileHeader avec l'ID correct */}
        <FileHeader 
          lang={lang} 
          dossierId={`Référence Dossier ${id}`}  
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}