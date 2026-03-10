
import DossierPageClient from './DossierPageClient';

interface PageProps {
  params: Promise<{ 
    lang: string; 
    id: string; 
    role: string;  // ← 'commission' ou 'validator' depuis l'URL
  }>;
}

export default async function DossierPageWrapper({ params }: PageProps) {
  // === MÊME LOGIQUE QUE DossierLayout.tsx ===
  const { role } = await params;
  
  // Forcer le rôle au type valide avec fallback
  const userRole = (role as 'commission' | 'validator') || 'commission';
  // === FIN LOGIQUE ===

  return <DossierPageClient role={userRole} />;
}