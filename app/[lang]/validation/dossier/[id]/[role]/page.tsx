
import DossierPageClient from './DossierPageClient';

interface PageProps {
  params: Promise<{ 
    lang: string; 
    id: string; 
    role: string;   
  }>;
}

export default async function DossierPageWrapper({ params }: PageProps) {
   
  const { role } = await params;
  
   
  const userRole = (role as 'commission' | 'validator') || 'commission';
   

  return <DossierPageClient role={userRole} />;
}