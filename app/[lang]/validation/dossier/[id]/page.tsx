import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    lang: string;
    id: string;
  }>;
}

export default async function DossierPage({ params }: PageProps) {
  const { lang, id } = await params;
  
  // Rediriger vers la route [role] avec 'commission' par défaut
  redirect(`/${lang}/validation/dossier/${id}/commission`);
}
