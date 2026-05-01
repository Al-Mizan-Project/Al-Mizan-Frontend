export default function SearchBar({ dict, lang }: { dict: any, lang: string }) {
  const isAr = lang === 'ar';

  return (
    <div className="bg-white border-b border-gray-200 py-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Titre de la page */}
        <h1 className={`text-2xl font-bold text-[#005c6e] ${isAr ? 'text-right' : 'text-left'}`}>
          {dict.tenders_title}
        </h1>

        {/* Barre de Recherche et Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <input 
              type="text" 
              placeholder={dict.search_placeholder}
              className={`w-full p-3 bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#005c6e] ${isAr ? 'text-right' : 'text-left'}`}
            />
          </div>
          
          <div className="flex gap-2 shrink-0">
            <select className="p-3 bg-white border border-gray-300 text-sm font-medium focus:outline-none min-w-[150px]">
              <option>{dict.filter_type}</option>
            </select>
            
            <button className="bg-[#005c6e] text-white px-8 py-3 font-bold text-sm uppercase tracking-wider hover:bg-[#004a58] transition-colors">
              {dict.filter_button}
            </button>
          </div>
        </div>

        {/* Compteur de résultats */}
        <p className={`text-xs text-gray-400 font-semibold uppercase ${isAr ? 'text-right' : 'text-left'}`}>
          1271 {dict.results_count.replace('{count}', '')}
        </p>
      </div>
    </div>
  );
}