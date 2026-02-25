import { getDictionary } from '@/lib/get-dictionary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faGlobe } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as 'fr' | 'ar');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {/* Language Switcher */}
      <div className="fixed top-5 flex gap-4 bg-white p-2 rounded-full shadow-sm border">
        <Link href="/fr" className={`px-4 py-1 rounded-full ${lang === 'fr' ? 'bg-blue-600 text-white' : ''}`}>
          Français
        </Link>
        <Link href="/ar" className={`px-4 py-1 rounded-full ${lang === 'ar' ? 'bg-green-600 text-white' : ''}`}>
          العربية
        </Link>
      </div>

      <div className="max-w-2xl bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-blue-500 mb-6 text-4xl">
          <FontAwesomeIcon icon={faGlobe} />
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          {dict.title || "Welcome"} 
        </h1>
        
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          {dict.subtitle || "Testing our bilingual Next.js app with Tailwind and FontAwesome."}
        </p>

        {/* Logical Property: border-s-4 (start) works for both sides */}
        <div className="border-s-4 border-blue-500 ps-4 mb-8 text-start italic text-gray-500">
          This text has a border on the left in FR and on the right in AR.
        </div>

        <button className="group bg-gray-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 mx-auto hover:bg-gray-800 transition-all">
          {dict.button || "Read More"}
          <FontAwesomeIcon 
            icon={faArrowRight} 
            className="rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" 
          />
        </button>
      </div>
    </main>
  );
}