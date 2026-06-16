import { getDictionary } from '@/lib/get-dictionary';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Breadcrumb from '@/components/breadcrumb';
import PublicationCard from '@/components/publicationcard';
import SearchBar from '@/components/searchbar';
import Link from 'next/link';

const PAGE_SIZE = 9;

async function fetchAppels(page: number, search?: string) {
  const params = new URLSearchParams({
    visibilite: 'public',
    statut: 'valide',
    ...(search ? { search } : {}),
  });

  const res = await fetch(
    `http://localhost:8080/appels-offres?${params}`,
    { cache: 'no-store' }
  );

  if (!res.ok) return { results: [], count: 0 };
  const data = await res.json();

  // Handle both paginated ({ count, results }) and plain array responses
  const list = Array.isArray(data) ? data : (data.results ?? []);
  const count = Array.isArray(data) ? data.length : (data.count ?? list.length);

  return { results: list, count };
}

function mapAppelToCard(appel: any) {
  const typeLabel: Record<string, string> = {
    publique: "Appel d'offre ouvert",
    restreint: "Appel d'offre restreint",
    gre_a_gre: "Gré à gré",
    consultation: "Consultation",
  };
  const categorieLabel: Record<string, string> = {
    travaux: "Travaux",
    fournitures: "Fournitures",
    services: "Services",
    etudes: "Études",
  };

  return {
    title: appel.titre,
    type: typeLabel[appel.type_procedure] ?? appel.type_procedure,
    category: categorieLabel[appel.type_prestation] ?? appel.type_prestation,
    entity: appel.secteur || appel.wilaya || '',
    ministry: appel.wilaya || '',
    reference: appel.reference,
    id: appel.id_appel_offres,
  };
}

export default async function TendersPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ page?: string; search?: string }>;
}) {
  const { lang } = await params;
  const { page: pageParam, search } = (await searchParams) ?? {};
  const dict = await getDictionary(lang as 'fr' | 'ar');

  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10));
  const { results, count } = await fetchAppels(currentPage, search);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const breadcrumbItems = [{ label: dict.tenders_title }];

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar dict={dict} lang={lang} />
      <Breadcrumb items={breadcrumbItems} lang={lang} />
      <SearchBar dict={dict} lang={lang} />

      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {results.length === 0 ? (
          <p className="text-center text-gray-500 py-20">Aucun appel d'offres disponible.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((appel: any) => {
              const cardProps = mapAppelToCard(appel);
              return (
                <Link key={appel.id_appel_offres} href={`/${lang}/appel/${appel.id_appel_offres}`}>
                  <PublicationCard {...cardProps} lang={lang} />
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center gap-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/${lang}/appel?page=${p}${search ? `&search=${search}` : ''}`}
              >
                <button
                  className={`px-4 py-2 border font-bold text-sm ${
                    p === currentPage
                      ? 'bg-[#005c6e] text-white border-[#005c6e]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#005c6e]'
                  }`}
                >
                  {p}
                </button>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}