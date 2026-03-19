import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/dictionaries/types';
import EnAttenteView from '../components/AffectationDossiers/EnAttenteView';
import ValidateursView from '../components/AffectationDossiers/ValidateursView';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type AffectationStatus = 'En Attente' | 'Validateurs';

export default async function AffectationPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const { status } = await searchParams;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  const currentStatus: AffectationStatus = ['En Attente', 'Validateurs'].includes(status as string)
    ? (status as AffectationStatus)
    : 'En Attente';

  return (
    <div className="space-y-6">
      {/* Onglets de navigation */}
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          <a
            href={`/${lang}/validation/AffectationDossiers?status=En%20Attente`}
            className={currentStatus === 'En Attente' ? 'val-tab-active' : 'val-tab-inactive'}
          >
            <span className={currentStatus === 'En Attente' ? 'val-tab-active-text' : 'val-tab-inactive-text'}>
              En Attente
            </span>
          </a>

          <a
            href={`/${lang}/validation/AffectationDossiers?status=Validateurs`}
            className={currentStatus === 'Validateurs' ? 'val-tab-active' : 'val-tab-inactive'}
          >
            <span className={currentStatus === 'Validateurs' ? 'val-tab-active-text' : 'val-tab-inactive-text'}>
              Validateurs
            </span>
          </a>
        </div>
      </div>

      {/* Contenu selon l'onglet */}
      <div className="mt-6">
        {currentStatus === 'En Attente' ? (
          <EnAttenteView lang={lang} dict={dict} />
        ) : (
          <ValidateursView lang={lang} dict={dict} />
        )}
      </div>
    </div>
  );
}