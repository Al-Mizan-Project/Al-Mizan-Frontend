'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type AppelOffre } from '@/lib/sc/api';
import { deriveState, STATE_META } from '@/lib/sc/ao-states';
import { Card, PageHeader, Spinner, Badge } from '@/lib/sc/ui';

export default function ContractantDashboardPage() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, serviceId, can, displayName } = useSCSession();
  const [appels, setAppels] = useState<AppelOffre[]>([]);
  const [demandes, setDemandes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [list, d] = await Promise.all([
        scApi.listAppels({ service_id: serviceId ? Number(serviceId) : undefined }),
        can('oe:approuve') && serviceId ? scApi.listDemandesOE(serviceId) : Promise.resolve([]),
      ]);
      setAppels(list);
      setDemandes(d.length);
      setLoading(false);
    })();
  }, [ready, serviceId, can]);

  const counts = appels.reduce<Record<string, number>>((acc, a) => {
    const s = deriveState(a);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const enValidation = appels.filter((a) => deriveState(a) === 'EN_VALIDATION').length;
  const ouverts = appels.filter((a) => deriveState(a) === 'OUVERT').length;

  const base = `/${lang}/dashboard/contractant`;

  const stats = [
    { label: isArabic ? 'إجمالي المناقصات' : "Total appels d'offres", value: appels.length, href: `${base}/marches` },
    { label: isArabic ? 'قيد التحقق' : 'En validation', value: enValidation, href: `${base}/marches` },
    { label: isArabic ? 'مفتوحة للإيداع' : 'Ouverts au dépôt', value: ouverts, href: `${base}/marches` },
    { label: isArabic ? 'طلبات المتعاملين' : 'Demandes OE', value: demandes, href: `${base}/demandes-oe` },
  ];

  if (loading) return <Spinner />;

  const recent = [...appels].sort((a, b) => (b.id_appel_offres || 0) - (a.id_appel_offres || 0)).slice(0, 6);

  return (
    <div>
      <PageHeader
        title={isArabic ? `مرحبا، ${displayName}` : `Bonjour, ${displayName}`}
        breadcrumb={isArabic ? 'لوحة التحكم' : "Vue d'ensemble"}
        action={
          can('marche:create') ? (
            <Link href={`${base}/marches/nouveau`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {isArabic ? 'إنشاء مناقصة' : 'Créer un appel d\'offres'}
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 hover:shadow-md transition-shadow">
              <p className="text-3xl font-black" style={{ color: '#1C4532' }}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ color: '#1C4532' }}>{isArabic ? 'آخر المناقصات' : 'Appels d\'offres récents'}</h3>
          <Link href={`${base}/marches`} className="text-sm font-semibold text-[#00738C] hover:underline">
            {isArabic ? 'عرض الكل' : 'Voir tout'}
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">{isArabic ? 'لا توجد مناقصات بعد.' : 'Aucun appel d\'offres pour le moment.'}</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((a) => {
              const st = deriveState(a);
              return (
                <Link key={a.id_appel_offres} href={`${base}/marches/${a.id_appel_offres}`} className="flex items-center justify-between py-3 hover:bg-[#F4F7F4] rounded-lg px-2 -mx-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1C4532' }}>{a.titre || a.reference || `#${a.id_appel_offres}`}</p>
                    <p className="text-xs text-gray-400">{a.reference}</p>
                  </div>
                  <Badge tone={STATE_META[st].tone}>{isArabic ? STATE_META[st].ar : STATE_META[st].fr}</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
