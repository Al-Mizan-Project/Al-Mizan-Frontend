import { ReactNode } from 'react';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/dictionaries/types';
import Sidebar from '@/app/[lang]/validation/components/layout/Sidebar';
import FileHeader from '../components/layout/AffectationHeader';
import '../validation.css';

interface DossierLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string; lang: string }>;
}

export default async function DossierLayout({ 
  children, 
  params 
}: DossierLayoutProps) {
  const { lang, id } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div 
      className="flex h-screen overflow-hidden validation-theme" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ backgroundColor: 'var(--color-blue-0)' }}
    >
      { }
      <div className="hidden md:block">
<Sidebar lang={lang} role="commission" />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        { }
        <FileHeader 
          lang={lang} 
          dict={dict}
          role='commission'
          dossierId={`Référence Dossier ${id}`}   
        />
        
        { }
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}