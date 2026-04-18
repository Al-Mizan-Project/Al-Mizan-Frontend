'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type PageProps = {
  params: Promise<{ lang: string }>;
};

export default function OperatorDashboardPage({ params }: PageProps) {
  const [lang, setLang] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    params.then(p => setLang(p.lang));
  }, [params]);

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-[#FCFFFF] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0D2527] font-cairo mb-6">
          {lang === 'ar' ? 'لوحة التحكم' : 'Tableau de Bord'}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Appels d'offres Card */}
          <div 
            onClick={() => router.push(`/${lang}/dashboard/operator/appels-offres`)}
            className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-bold text-[#0D2527] mb-2">
              {lang === 'ar' ? 'نداءات العروض' : 'Appels d\'Offres'}
            </h3>
            <p className="text-[#418387]">
              {lang === 'ar' ? 'إدارة ندعاءات العروض' : 'Gérer les appels d\'offres'}
            </p>
          </div>

          {/* Contrats Card */}
          <div 
            onClick={() => router.push(`/${lang}/dashboard/operator/contrats`)}
            className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-bold text-[#0D2527] mb-2">
              {lang === 'ar' ? 'العقود' : 'Contrats'}
            </h3>
            <p className="text-[#418387]">
              {lang === 'ar' ? 'إدارة العقود' : 'Gérer les contrats'}
            </p>
          </div>

          {/* Documents Card */}
          <div 
            onClick={() => router.push(`/${lang}/dashboard/operator/documents`)}
            className="bg-white border-2 border-[#9BCFCF] rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h3 className="text-xl font-bold text-[#0D2527] mb-2">
              {lang === 'ar' ? 'المستندات' : 'Documents'}
            </h3>
            <p className="text-[#418387]">
              {lang === 'ar' ? 'إدارة المستندات' : 'Gérer les documents'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}