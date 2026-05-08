import { getDictionary } from '@/lib/get-dictionary';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Breadcrumb from '@/components/breadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { notFound } from 'next/navigation';

async function getTenderData(id: string) {
  // Simuler l'appel API
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    id: id,
    title: "اقتناء معدات تقنية وبرمجيات متخصصة لفائدة مركز البيانات", 
    entity: "Direction des Systèmes d'Information",
    ministry: "Ministère des Finances",
    type: "Fournitures",
    status: "En cours",
    deadline: "2025/12/30",
    location: "Alger",
    content: "يتضمن هذا الإعلان الشروط العامة والخاصة لاقتناء خوادم جديدة وتثبيت نظام الحماية المتكامل. \n\nالتقديم يكون عبر البوابة حصرياً قبل التاريخ المحدد."
  };
}

export default async function AppelDetailsPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const isAr = lang === 'ar'; // Défini ici pour être utilisé dans le return
  const dict = await getDictionary(lang as 'fr' | 'ar');
  const tender = await getTenderData(id);

  if (!tender) notFound();

  const breadcrumbItems = [
    { label: dict.nav_tenders, href: `/${lang}/appel` },
    { label: id }
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfc] flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <Navbar dict={dict} lang={lang} />
      <Breadcrumb items={breadcrumbItems} lang={lang} />

      <section className="py-10 px-6 md:px-12 max-w-5xl mx-auto w-full flex-grow">
        
        {/* 1. Titre de l'avis */}
        <div className="bg-white border border-gray-200 p-8 mb-6">
          <div className="flex mb-4">
            <span className="bg-[#005c6e]/5 text-[#005c6e] text-[10px] font-bold px-3 py-1 border border-[#005c6e]/20 uppercase">
               {tender.type}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed" style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}>
            {tender.title}
          </h1>
        </div>

        {/* 2. Tableau des caractéristiques techniques */}
        <div className="bg-white border border-gray-200 overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-gray-100">
            <div>
              <DetailRow label={dict.tender_id} value={tender.id} lang={lang} />
              <DetailRow label={dict.tender_entity} value={tender.entity} lang={lang} />
            </div>
            <div>
              <DetailRow label={dict.tender_deadline} value={tender.deadline} lang={lang} highlight />
              <DetailRow label={dict.tender_status} value={tender.status} lang={lang} />
            </div>
          </div>
        </div>

        {/* 3. Contenu textuel de l'avis */}
        <div className="bg-white border border-gray-200 p-8 md:p-12">
          <h2 className={`text-lg font-bold text-[#005c6e] mb-6 border-b border-gray-100 pb-4 flex items-center gap-3`}>
            <FontAwesomeIcon icon={faInfoCircle} className="text-sm opacity-30" />
            {dict.tender_content_title}
          </h2>
          
          <div 
            className="text-gray-700 leading-loose whitespace-pre-line text-base"
            style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
          >
            {tender.content}
          </div>

          <div className={`mt-12 flex ${isAr ? 'justify-start' : 'justify-end'}`}>
            <button className="flex items-center gap-4 bg-[#005c6e] text-white px-8 py-4 font-bold text-sm uppercase transition-colors hover:bg-gray-900 shadow-lg shadow-gray-200 cursor-pointer">
              <FontAwesomeIcon icon={faFilePdf} />
              {dict.tender_download_pdf}
            </button>
          </div>
        </div>
      </section>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}

function DetailRow({ label, value, lang, highlight = false }: { label: string, value: string, lang: string, highlight?: boolean }) {
  const isAr = lang === 'ar';
  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-0 ${isAr ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}