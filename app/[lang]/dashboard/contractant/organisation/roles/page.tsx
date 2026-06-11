'use client';

import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { ALL_SC_ROLES, ROLE_PERMISSIONS, roleLabel } from '@/lib/sc/permissions';
import { Card, PageHeader, Badge } from '@/lib/sc/ui';

function RolesInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';

  return (
    <div>
      <PageHeader title={isArabic ? 'الأدوار والصلاحيات' : 'Rôles & Permissions'} breadcrumb={isArabic ? 'مؤسستي' : 'Mon organisation'} />
      <p className="text-sm text-gray-400 mb-5">{isArabic ? 'الصلاحيات ثابتة لكل دور ولا يمكن تعديلها. يتم تعيين الأدوار من صفحة الأعضاء.' : "Les permissions sont fixes par rôle et non modifiables. L'affectation des rôles se fait depuis la page Membres."}</p>

      <div className="grid lg:grid-cols-2 gap-4">
        {ALL_SC_ROLES.map((r) => (
          <Card key={r} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: '#1C4532' }}>{roleLabel(r, lang)}</h3>
              <span className="text-xs font-mono text-gray-400">{r}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_PERMISSIONS[r].map((p) => (
                <Badge key={p} tone="info">{p}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function RolesPage() {
  return <Guard anyOf={['role:assign']}><RolesInner /></Guard>;
}
