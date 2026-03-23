import { getDictionary } from '@/lib/get-dictionary';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faUserTie, faCheckDouble, faGavel } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default async function RegisterOrgPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as 'fr' | 'ar');
  const isAr = lang === 'ar';

  // Configuration des types basée sur votre structure de dossiers
  const orgTypes = [
    {
      id: 'service_contractant',
      title: isAr ? 'مصلحة متعاقدة' : 'Service contractant',
      desc: isAr ? 'سجل كجهة حكومية لإطلاق المناقصات' : 'Enregistrez votre entité pour lancer des appels d\'offres.',
      icon: faBuilding,
    },
    {
      id: 'operateur_economique',
      title: isAr ? 'متعامل اقتصادي' : 'Opérateur économique',
      desc: isAr ? 'سجل كشركة للمشاركة في المناقصات' : 'Enregistrez votre entreprise pour soumissionner aux marchés.',
      icon: faUserTie,
    },
    {
      id: 'commission_validation',
      title: isAr ? 'لجنة الرقابة الخارجية' : 'Commission de validation',
      desc: isAr ? 'هيئات الرقابة والتحقق من الميزانية' : 'Entités chargées du contrôle et de la validation externe.',
      icon: faCheckDouble,
    },
    {
      id: 'tutelle',
      title: isAr ? 'وصاية' : 'Tutelle',
      desc: isAr ? 'الوزارات والهيئات المشرفة' : 'Ministères et organismes de tutelle administrative.',
      icon: faGavel,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <Navbar dict={dict} lang={lang} />

      <section className="flex-grow py-16 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {isAr ? 'تصريح منظمة جديدة' : 'Déclarer une nouvelle organisation'}
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            {isAr 
              ? 'قم بتسجيل كيانك لإدارة إجراءاتك على منصة الميزان.' 
              : 'Enregistrez votre entité afin de gérer vos procédures sur la plateforme Al-Mizan.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {orgTypes.map((type) => (
            /* Utilisation de Link avec l'ID correspondant au nom du dossier */
            <Link 
              key={type.id} 
              href={`/${lang}/register/organisation/${type.id}`}
              className="group bg-white border border-gray-200 p-8 text-center transition-all hover:border-[#005c6e] hover:shadow-xl hover:-translate-y-1 flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-gray-50 text-[#005c6e] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#005c6e] group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={type.icon} className="text-2xl" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-tight">
                {type.title}
              </h3>
              
              <p className="text-sm text-gray-500 leading-relaxed">
                {type.desc}
              </p>

              <div className="mt-8 text-[#005c6e] font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {isAr ? 'اختيار' : 'Sélectionner'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}