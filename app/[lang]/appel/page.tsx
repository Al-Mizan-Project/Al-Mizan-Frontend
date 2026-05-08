import { getDictionary } from '@/lib/get-dictionary';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Breadcrumb from '@/components/breadcrumb';
import PublicationCard from '@/components/publicationcard'; // Votre composant card
import SearchBar from '@/components/searchbar';

export default async function page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as 'fr' | 'ar');

  const breadcrumbItems = [
    { label: dict.tenders_title }
  ];

  // Simulation de données
  const tenders = [
    {
      title: "Acquisition d'équipements scientifiques destinés à renforcer l'ESGEEO",
      type: "Appel d'offre ouvert",
      category: "Fournitures",
      entity: "ÉCOLE SUPÉRIEURE EN GÉNIE ÉLECTRIQUE ET ÉNERGÉTIQUE D'ORAN",
      ministry: "Ministère de l'Enseignement Supérieur",
      reference: "04/ESGEEO/2025",
    },
    // ... autres données
  ];

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Navbar dict={dict} lang={lang} />
      <Breadcrumb items={breadcrumbItems} lang={lang} />
      
      {/* Zone de Recherche */}
      <SearchBar dict={dict} lang={lang} />

      {/* Grille des publications */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tenders.map((item, index) => (
            <PublicationCard 
              key={index}
              {...item}
              lang={lang}
            />
          ))}
        </div>

        {/* Pagination Classique */}
        <div className="mt-16 flex justify-center gap-2">
          {[1, 2, 3, "...", 12].map((page, i) => (
            <button key={i} className={`px-4 py-2 border ${page === 1 ? 'bg-[#005c6e] text-white border-[#005c6e]' : 'bg-white text-gray-600 border-gray-200'} font-bold text-sm`}>
              {page}
            </button>
          ))}
        </div>
      </section>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}