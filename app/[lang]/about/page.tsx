import { getDictionary } from '@/lib/get-dictionary';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Breadcrumb from '@/components/breadcrumb';

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as 'fr' | 'ar');
  const isAr = lang === 'ar';

  const objectives = [
    dict.about_obj_1,
    dict.about_obj_2,
    dict.about_obj_3,
    dict.about_obj_4
  ];
const breadcrumbItems = [
  { label: dict.about_title } // Pas de href car c'est la page actuelle
];
  return (
    <main className={`min-h-screen flex flex-col bg-white ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      <Navbar dict={dict} lang={lang} />
      <Breadcrumb items={breadcrumbItems} lang={lang} />

      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
          
          {/* Contenu Principal */}
          <div className="lg:col-span-2 space-y-8">
            <header className={`${isAr ? 'pr-6 border-r-4' : 'pl-6 border-l-4'} border-[#005c6e]`}>
              <h1 className="text-3xl md:text-4xl font-bold text-[#005c6e] uppercase tracking-tight">
                {dict.about_title}
              </h1>
              <p className="text-gray-500 mt-2 font-medium italic">
                {dict.about_subtitle}
              </p>
            </header>

            <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-justify space-y-6">
              <p>{dict.about_p1}</p>
              <p>{dict.about_p2}</p>

              <h3 className="text-[#005c6e] font-bold text-xl pt-4">
                {dict.about_objectives_title}
              </h3>
              
              <ul className={`space-y-3 ${isAr ? 'pr-5' : 'pl-5'}`}>
                {objectives.map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-center">
                    <span className="w-2 h-2 bg-[#d4af37] rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <p className="pt-6 border-t border-gray-100">
                {dict.about_p3}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 sticky top-8 space-y-8">
            <div className="bg-white border border-gray-100 shadow-xl p-8 rounded-[2rem] flex flex-col items-center">
              <img src="/logo_blue.png" alt="Logo" className="w-48 h-auto mb-6" />
              <div className="text-center">
                <p className="text-[#00667e] font-bold uppercase text-sm tracking-widest">{dict.country_name}</p>
                <p className="text-gray-400 text-[10px] uppercase font-bold mt-1">{dict.country_sub}</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-50 text-[#005c6e]">
              <h4 className="font-bold mb-3 border-b border-[#005c6e]/10 pb-2 text-sm uppercase">
                {dict.about_help_title}
              </h4>
              <p className="text-xs opacity-80 leading-relaxed mb-4">
                {dict.about_help_desc}
              </p>
              <button className="w-full py-3 bg-[#005c6e] text-white font-bold text-xs rounded-lg cursor-pointer hover:bg-[#004a58] transition-colors">
                {dict.about_help_btn}
              </button>
            </div>
          </div>

        </div>
      </section>

      <Footer dict={dict} lang={lang} />
    </main>
  );
}