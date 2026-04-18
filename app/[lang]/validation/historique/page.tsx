import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/dictionaries/types';
import HistoriqueValidationsView from '../components/historique/HistoriqueValidationsView';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HistoriqueValidationsPage({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="space-y-6">

      { }
      <HistoriqueValidationsView lang={lang} dict={dict} />
    </div>
  );
}