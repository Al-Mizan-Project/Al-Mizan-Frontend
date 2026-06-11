'use client';

import { SCSessionProvider } from '@/lib/sc/session';
import { SCUIProvider } from '@/lib/sc/ui';
import ContractantShell from '@/components/contractant/ContractantShell';

export default function ContractantDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SCSessionProvider>
      <SCUIProvider>
        <ContractantShell>{children}</ContractantShell>
      </SCUIProvider>
    </SCSessionProvider>
  );
}
