import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: PageProps) {
  const { lang } = await params;
  
  redirect(`/${lang}/validation/dashboard`);
  
  return null;
}