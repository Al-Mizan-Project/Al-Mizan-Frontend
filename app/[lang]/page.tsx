import Link from 'next/link';
import { getDictionary } from '@/lib/get-dictionary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faUserTie, faGears, faUserShield, faGavel, faMapLocationDot, faBuildingShield} from '@fortawesome/free-solid-svg-icons';
import Navbar from '@/components/navbar';
import PublicationCard from '@/components/publicationcard';
import Footer from '@/components/footer'
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as 'fr' | 'ar');
  const spaces = [
  {
    title: dict.space_operateur_economique || "Opérateur économique",
    desc: dict.desc_operateur_economique || "Consultation des marchés, dépôt des offres et suivi des contrats.",
    icon: faUserTie,
    color: "border-[#1a4331]",
    url: `/${lang}/register/operateur`
  },
];
  const publications = [
    {
      title: "« Acquisition d'équipements scientifiques destinés à renforcer... »",
      type: "Appel d'offre ouvert",
      category: "Avis d'attribution provisoire",
      entity: "École Supérieure en Génie Électrique et...",
      ministry: "Ministère de l'Enseignement Supérieur",
      reference: "04/ESGEEO/2025"
    },
    {
      title: "Etude Cadastrale pour la réalisation d'un Lycée (type...",
      type: "Consultation",
      category: "Avis de consultation",
      entity: "Direction des équipements publics",
      ministry: "Ministère de l'Habitat, de l'Urbanisme et de la Ville",
      reference: "58/2026"
    },
    {
      title: "Etude Géotechnique pour la réalisation d'un Lycée (type...",
      type: "Consultation",
      category: "Avis de consultation",
      entity: "Direction des équipements publics",
      ministry: "Ministère de l'Habitat, de l'Urbanisme et de la Ville",
      reference: "57/2026"
    }
  ];
  const services = [
    {
      title: dict.service_etat_title,
      desc: dict.service_etat_desc,
      icon: faGavel,
      color: "border-[#00667e]"
    },
    {
      title: dict.service_local_title,
      desc: dict.service_local_desc,
      icon: faMapLocationDot,
      color: "border-[#d4af37]"
    },
    {
      title: dict.service_public_title,
      desc: dict.service_public_desc,
      icon: faBuildingShield,
      color: "border-[#00667e]"
    }
  ];
  const stats = [
    { value: "1918", label: dict.stats_markets },
    { value: "349", label: dict.stats_operators },
    { value: "4748", label: dict.stats_entities },
    { value: "20998", label: dict.stats_users },
  ];
  return (
    <main className="min-h-screen">
      <Navbar dict={dict} lang={lang}/>
      <section className='pt-10 px-4  bg-white'>
        <div 
          className="z-10 h-[550px] rounded-[3rem] overflow-hidden shadow-xl flex flex-col items-center justify-center text-center px-6"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/ministere-des-finances.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
        {/* Contenu - Plus besoin de div absolute ici car le parent est un flex-container */}
        <div className="w-full space-y-8">
          {/* Titre Institutionnel */}
          <h1 className="text-white text-4xl font-bold tracking-tight leading-tight">
            {dict.welcome}
          </h1>
          
          {/* Titre en Tamazight */}
          <h1 className="text-white text-4xl tracking-tight leading-tight">
            ⵉⴼⵍⵓ ⴰⵍⵉⴽⵜⵔⵓⵏⵉ ⵏ ⵜⵏⵉⴳⴰⵡⵉⵏ ⵜⵉⵏⴰⴳⴷⵓⴷⵉⵏ
          </h1>
          
          {/* Description Courte */}
          <p className="text-white/70 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            {dict.description}
          </p>
        </div>
      </div>
      </section>
      <section className="z-10 py-24 bg-[#f8fafb] px-6 md:px-12 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête de section */}
        <div className="flex flex-col items-center mb-20" id="org">
          <h2 className="text-2xl md:text-3xl font-bold text-[#005c6e] tracking-[0.2em] uppercase text-center">
            {dict.space_title || "ESPACES DÉDIÉS"}
          </h2>
          <div className="w-24 h-1 bg-[#d4af37] mt-4"></div>
        </div>

          <div className="flex items-center justify-center gap-6 mb-20" >
            {spaces.map((space, index) => (
              <div 
                key={index}
                className={`bg-white p-8 flex flex-col items-center text-center shadow-sm border-t-4 ${space.color} hover:shadow-xl transition-all duration-300 group rounded-b-sm`}
              >
                <div className="w-16 h-16 bg-gray-50 text-[#005c6e] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#005c6e] group-hover:text-white transition-colors duration-300">
                  <FontAwesomeIcon icon={space.icon} className="text-xl" />
                </div>

                <h3 className="text-[#005c6e] font-bold text-md mb-4 min-h-[48px] flex items-center justify-center leading-tight">
                  {space.title}
                </h3>
                
                <div className="w-10 h-[1px] bg-gray-200 mb-6"></div>
                
                <p className="text-gray-500 text-xs leading-relaxed italic mb-6">
                  {space.desc}
                </p>

                <p
                  className="mt-auto w-full text-center text-xs font-semibold text-white bg-[#005c6e] hover:bg-[#004a59] px-4 py-2 rounded transition-colors duration-200"
                >
                  Déclarer {space.title}
                </p>
              </div>
            ))}
          </div>
        
      </div>
    </section>
   
    <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden pointer-events-none">
        <img 
          src="/footer.png" 
          alt="Décor National" 
          className="w-full h-full object-cover opacity-40" 
        />
        <div className="absolute inset-0 bg-white/60" />
      </div>

      {/* 2. La section de statistiques (transparente) */}
      <section className="relative py-24 bg-transparent z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                
                {/* Valeur numérique - Style Al-Mizan */}
                <span className="text-4xl md:text-6xl font-light text-[#00667e] mb-3 tracking-tighter drop-shadow-sm">
                  {stat.value}
                </span>
                
                {/* Ligne décorative Or (Apparaît au survol) */}
                <div className="w-10 h-0.5 bg-[#d4af37] mb-4 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-x-0 group-hover:scale-x-100"></div>
                
                {/* Libellé - Lisibilité Maximale */}
                <p className="text-gray-700 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-relaxed max-w-[180px]">
                  {stat.label}
                </p>
                
              </div>
            ))}
          </div>
        </div>
      </section>
    <section className="z-10 py-20 bg-white px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête de section classique */}
        <div className="flex flex-col items-center mb-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#005c6e] tracking-wider uppercase">
            {dict.services_title}
          </h2>
          <div className="w-24 h-1 bg-[#d4af37] mt-4"></div>
        </div>

        {/* Grille identique à "VOTRE ESPACE" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className={`bg-white p-10 flex flex-col items-center text-center shadow-sm border-t-4 ${service.color} hover:shadow-xl transition-all duration-300 group`}
            >
              {/* Icône institutionnelle */}
              <div className="w-16 h-16 bg-gray-50 text-[#005c6e] rounded-full flex items-center justify-center mb-8 group-hover:bg-[#005c6e] group-hover:text-white transition-colors duration-300">
                <FontAwesomeIcon icon={service.icon} className="text-2xl" />
              </div>

              {/* Titre du service contractant */}
              <h3 className="text-[#005c6e] font-bold text-lg mb-4 h-[50px] flex items-center justify-center">
                {service.title}
              </h3>
              
              <div className="w-12 h-[1px] bg-gray-200 mb-6"></div>
              
              {/* Description courte et précise */}
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
    <Footer dict={dict} lang={lang}/>
    </main>
  );
}