'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type AppelOffre } from '@/lib/sc/api';
import { deriveState, STATE_META, AO_TYPE_META, aoTypeLabel, type AOType } from '@/lib/sc/ao-states';
import { Card, PageHeader, Spinner, Badge, EmptyState } from '@/lib/sc/ui';

function MarchesInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, serviceId, can } = useSCSession();
  const base = `/${lang}/dashboard/contractant`;

  const [appels, setAppels] = useState<AppelOffre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  useEffect(() => {
    if (!ready) return;
    (async () => {
      setAppels(await scApi.listAppels({ service_id: serviceId ? Number(serviceId) : undefined }));
      setLoading(false);
    })();
  }, [ready, serviceId]);

  const filtered = useMemo(
    () =>
      appels.filter((a) => {
        const st = deriveState(a);
        const text = `${a.titre || ''} ${a.reference || ''}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (!typeFilter || a.type_procedure === typeFilter) &&
          (!stateFilter || st === stateFilter)
        );
      }),
    [appels, search, typeFilter, stateFilter],
  );

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={isArabic ? 'المناقصات' : "Appels d'offres"}
        breadcrumb={isArabic ? 'إدارة الصفقات' : 'Gestion des marchés'}
        action={
          can('marche:create') ? (
            <Link href={`${base}/marches/nouveau`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {isArabic ? 'إنشاء' : 'Créer un AO'}
            </Link>
          ) : undefined
        }
      />

      <Card className="p-4 mb-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isArabic ? 'بحث بالعنوان أو المرجع…' : 'Rechercher (titre, référence)…'}
            className="px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none"
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none">
            <option value="">{isArabic ? 'كل الأنواع' : 'Tous les types'}</option>
            {(Object.keys(AO_TYPE_META) as AOType[]).map((t) => (
              <option key={t} value={t}>{isArabic ? AO_TYPE_META[t].ar : AO_TYPE_META[t].fr}</option>
            ))}
          </select>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none">
            <option value="">{isArabic ? 'كل الحالات' : 'Tous les états'}</option>
            {Object.entries(STATE_META).map(([k, v]) => (
              <option key={k} value={k}>{isArabic ? v.ar : v.fr}</option>
            ))}
          </select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState title={isArabic ? 'لا توجد مناقصات' : 'Aucun appel d\'offres'} hint={isArabic ? 'أنشئ مناقصة جديدة للبدء.' : 'Créez un nouvel appel d\'offres pour commencer.'} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold">{isArabic ? 'المرجع' : 'Référence'}</th>
                  <th className="px-5 py-3 font-semibold">{isArabic ? 'العنوان' : 'Titre'}</th>
                  <th className="px-5 py-3 font-semibold">{isArabic ? 'النوع' : 'Type'}</th>
                  <th className="px-5 py-3 font-semibold">{isArabic ? 'المبلغ' : 'Montant'}</th>
                  <th className="px-5 py-3 font-semibold">{isArabic ? 'الحالة' : 'État'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a) => {
                  const st = deriveState(a);
                  return (
                    <tr key={a.id_appel_offres} className="hover:bg-[#F4F7F4]">
                      <td className="px-5 py-3">
                        <Link href={`${base}/marches/${a.id_appel_offres}`} className="font-semibold text-[#00738C] hover:underline">{a.reference || `#${a.id_appel_offres}`}</Link>
                      </td>
                      <td className="px-5 py-3 max-w-xs truncate" style={{ color: '#1C4532' }}>{a.titre || '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{aoTypeLabel(a.type_procedure, lang)}</td>
                      <td className="px-5 py-3 text-gray-500">{a.montant_estime ? `${Number(a.montant_estime).toLocaleString('fr-DZ')} DA` : '—'}</td>
                      <td className="px-5 py-3"><Badge tone={STATE_META[st].tone}>{isArabic ? STATE_META[st].ar : STATE_META[st].fr}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function MarchesPage() {
  return (
    <Guard anyOf={['marche:read']}>
      <MarchesInner />
    </Guard>
  );
}
