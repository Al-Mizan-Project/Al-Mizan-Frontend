'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type Organisation } from '@/lib/sc/api';
import { Card, PageHeader, Spinner, EmptyState } from '@/lib/sc/ui';

export default function OrganisationPage() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, membreId } = useSCSession();
  const [org, setOrg] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      if (membreId) setOrg(await scApi.getOrganisation(membreId));
      setLoading(false);
    })();
  }, [ready, membreId]);

  if (loading) return <Spinner />;

  const rows: [string, string | undefined][] = [
    [isArabic ? 'التسمية الرسمية' : 'Nom officiel', org?.nom_officiel],
    [isArabic ? 'نوع الكيان' : "Type d'entité", org?.type_entite],
    [isArabic ? 'الولاية' : 'Wilaya', org?.wilaya],
    [isArabic ? 'القطاع' : 'Secteur', org?.secteur],
    [isArabic ? 'العنوان' : 'Adresse', org?.adresse_siege],
    [isArabic ? 'البريد الإلكتروني' : 'Email', org?.email_contact],
  ];

  return (
    <div>
      <PageHeader title={isArabic ? 'مؤسستي' : 'Mon organisation'} breadcrumb={isArabic ? 'المصلحة المتعاقدة' : 'Service Contractant'} />
      <Card className="p-5 max-w-2xl">
        {!org ? (
          <EmptyState title={isArabic ? 'تعذر تحميل بيانات المؤسسة' : "Informations indisponibles"} hint={isArabic ? 'ستُحمّل من الخادم.' : 'Proviendront du backend.'} />
        ) : (
          <div>
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-xs text-gray-400">{k}</span>
                <span className="text-sm font-medium" style={{ color: '#1C4532' }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
