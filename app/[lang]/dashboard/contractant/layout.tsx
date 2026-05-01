import ServiceContractantLiveShell from '@/components/contractant/ServiceContractantLiveShell';

export default function ContractantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ServiceContractantLiveShell>{children}</ServiceContractantLiveShell>;
}
