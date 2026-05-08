"use client";
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faHome } from '@fortawesome/free-solid-svg-icons';

// On définit une interface pour les éléments du chemin
interface BreadcrumbItem {
  label: string;
  href?: string; // Optionnel car le dernier élément n'est pas forcément un lien
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  lang: string;
}

export default function Breadcrumb({ items, lang }: BreadcrumbProps) {
  const isAr = lang === 'ar';

  return (
    <div className="bg-[#f8fafc] border-b border-gray-200 py-3 px-6 md:px-12" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm font-medium">
        
        {/* Toujours l'Accueil en premier */}
        <Link href={`/${lang}`} className="text-[#00667e] hover:underline flex items-center gap-2">
          <FontAwesomeIcon icon={faHome} className="text-xs" />
          <span>{isAr ? 'الرئيسية' : 'Accueil'}</span>
        </Link>

        {/* Boucle sur les paramètres passés */}
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <FontAwesomeIcon 
              icon={faChevronRight} 
              className={`text-[10px] text-gray-400 ${isAr ? 'rotate-180' : ''}`} 
            />
            
            {item.href ? (
              <Link href={item.href} className="text-[#00667e] hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-500 italic">{item.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}