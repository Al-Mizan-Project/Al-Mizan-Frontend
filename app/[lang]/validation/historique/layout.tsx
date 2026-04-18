import { ReactNode } from 'react';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/dictionaries/types';  
import '../validation.css';  
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

interface HistoriqueLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function HistoriqueLayout({ 
  children, 
  params 
}: HistoriqueLayoutProps) {
  const { lang } = await params;
   const locale = lang as Locale;
  const dict = await getDictionary(locale);


  return (
    <div className="flex h-screen overflow-hidden validation-theme" style={{ backgroundColor: 'var(--color-blue-0)' }}>
      {}
      <div className="hidden md:block">
      <Sidebar lang={lang} role="commission" />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
<Header variant="historique" lang={lang} role='commission' dict={dict} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}