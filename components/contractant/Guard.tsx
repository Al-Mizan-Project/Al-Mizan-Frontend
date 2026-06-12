'use client';

import { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useSCSession } from '@/lib/sc/session';
import type { Permission } from '@/lib/sc/permissions';
import { Spinner, EmptyState } from '@/lib/sc/ui';

/** Renders children only when the user holds at least one of `anyOf` permissions. */
export default function Guard({ anyOf, children }: { anyOf: Permission[]; children: ReactNode }) {
  const { ready, can } = useSCSession();
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';

  if (!ready) return <Spinner />;
  if (!anyOf.some((p) => can(p))) {
    return (
      <EmptyState
        title={isArabic ? 'غير مصرح لك بالوصول إلى هذه الصفحة' : "Vous n'avez pas accès à cette page"}
        hint={isArabic ? 'لا تملك الصلاحية اللازمة.' : "Votre rôle ne dispose pas de la permission requise."}
      />
    );
  }
  return <>{children}</>;
}
