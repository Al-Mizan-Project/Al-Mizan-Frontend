import { getDictionary } from '@/lib/get-dictionary';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Breadcrumb from '@/components/breadcrumb';
import { notFound } from 'next/navigation';
import SoumettreButton from './SoumettreButton';

async function fetchAppel(id: string) {
  const res = await fetch(
    `http://localhost:8080/appels-offres/${id}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-semibold text-gray-500 sm:w-48 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block bg-[#e6f4f7] text-[#005c6e] text-xs font-semibold px-3 py-1 rounded-full">
      {label}
    </span>
  );
}

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as 'fr' | 'ar');
  const appel = await fetchAppel(id);

  if (!appel) notFound();

  const typeLabel: Record<string, string> = {
    publique: "Appel d'offre ouvert",
    restreint: "Appel d'offre restreint",
    gre_a_gre: "Gré à gré",
    consultation: "Consultation",
  };

  const prestationLabel: Record<string, string> = {
    travaux: 'Travaux',
    fournitures: 'Fournitures',
    services: 'Services',
    etudes: 'Études',
  };

  const formatDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;

  const breadcrumbItems = [
    { label: dict.tenders_title, href: `/${lang}/tenders` },
    { label: appel.reference },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar dict={dict} lang={lang} />
      <Breadcrumb items={breadcrumbItems} lang={lang} />

      <section className="py-12 px-6 md:px-12 max-w-4xl mx-auto w-full">

        {/* Header card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge label={typeLabel[appel.type_procedure] ?? appel.type_procedure} />
            <Badge label={prestationLabel[appel.type_prestation] ?? appel.type_prestation} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{appel.titre}</h1>
          <p className="text-sm text-gray-500">Référence : {appel.reference}</p>
          {appel.description && (
            <p className="mt-4 text-gray-700 leading-relaxed">{appel.description}</p>
          )}
          <SoumettreButton
            appelId={appel.id_appel_offres}
            idServiceContractant={appel.id_service_contractant}
            lang={lang}
          />
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-lg font-bold text-[#005c6e] mb-4">Informations générales</h2>
          <InfoRow label="Wilaya" value={appel.wilaya} />
          <InfoRow label="Secteur" value={appel.secteur} />
          <InfoRow label="Localisation" value={appel.localisation} />
          <InfoRow
            label="Montant estimé"
            value={
              appel.montant_estime
                ? `${Number(appel.montant_estime).toLocaleString('fr-DZ')} DA`
                : null
            }
          />
        </div>

        {/* Dates clés */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-lg font-bold text-[#005c6e] mb-4">Dates clés</h2>
          <InfoRow label="Date de publication" value={formatDate(appel.date_publication)} />
          <InfoRow
            label="Date limite de soumission"
            value={formatDate(appel.date_limite_soumission)}
          />
          <InfoRow
            label="Date d'ouverture des plis"
            value={formatDate(appel.date_ouverture_plis)}
          />
        </div>

        {/* Conditions de participation */}
        {(appel.minimum_revenue_da > 0 ||
          appel.minimum_experience_years > 0 ||
          appel.qualification_category) && (
          <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
            <h2 className="text-lg font-bold text-[#005c6e] mb-4">Conditions de participation</h2>
            <InfoRow
              label="Chiffre d'affaires minimum"
              value={
                appel.minimum_revenue_da > 0
                  ? `${Number(appel.minimum_revenue_da).toLocaleString('fr-DZ')} DA`
                  : null
              }
            />
            <InfoRow
              label="Expérience minimum"
              value={
                appel.minimum_experience_years > 0
                  ? `${appel.minimum_experience_years} an(s)`
                  : null
              }
            />
            <InfoRow
              label="Catégorie de qualification"
              value={appel.qualification_category}
            />
          </div>
        )}

        {/* Évaluation des offres */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-bold text-[#005c6e] mb-4">Évaluation des offres</h2>
          <InfoRow
            label="Méthodologie"
            value={
              appel.methodology === 'price_only'
                ? 'Offre la moins disante'
                : 'Pondération technique + financière'
            }
          />
          {appel.methodology === 'weighted' && (
            <>
              <InfoRow
                label="Poids technique"
                value={appel.poids_technique != null ? `${appel.poids_technique}%` : null}
              />
              <InfoRow
                label="Poids financier"
                value={appel.poids_financier != null ? `${appel.poids_financier}%` : null}
              />
              <InfoRow label="Seuil technique" value={`${appel.seuil_technique}%`} />
            </>
          )}
        </div>

      </section>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}