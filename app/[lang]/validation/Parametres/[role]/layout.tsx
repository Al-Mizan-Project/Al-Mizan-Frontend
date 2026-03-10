import { ReactNode } from 'react';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/dictionaries/types';
import '../../validation.css';
import Sidebar from '../../components/layout/Sidebar';
import ParametresHeader from '../../components/layout/ParametresHeader';

interface ParametresLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string; role: string }>;
}

export default async function ParametresLayout({
  children,
  params
}: ParametresLayoutProps) {

  const { lang, role } = await params;

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const userRole = (role as 'commission' | 'validator') || 'validator';

  return (
    <div
      className="flex h-screen overflow-hidden validation-theme"
      style={{ backgroundColor: 'var(--color-blue-0)' }}
    >
      
      { }
      <div className="hidden md:block">
        <Sidebar lang={lang} role={userRole} />
      </div>

      { }
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <ParametresHeader lang={lang} role={userRole} dict={dict} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}