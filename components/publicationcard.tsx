import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faFileContract, faTag } from '@fortawesome/free-solid-svg-icons';

interface PublicationProps {
  title: string;
  type: string;
  category: string;
  entity: string;
  ministry: string;
  reference: string;
  lang: string;
}

export default function PublicationCard({ title, type, category, entity, ministry, reference, lang }: PublicationProps) {
  const isAr = lang === 'ar';

  return (
    <div className="bg-white border border-gray-200 p-6 flex flex-col h-full">
      
      {/* Type de publication - Badge sobre */}
      <div className="mb-4">
        <span className="text-[10px] font-bold text-[#005c6e] border border-[#005c6e] px-2 py-0.5 uppercase">
          {type}
        </span>
      </div>

      {/* Titre - Noir pur, police standard, lisibilité maximale */}
      <h3 className="text-gray-900 font-bold text-base leading-snug mb-6 min-h-[3rem] line-clamp-3">
        {title}
      </h3>

      {/* Informations techniques - Structure liste classique */}
      <div className="flex-grow space-y-4 pt-4 border-t border-gray-100">
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400">
            <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {isAr ? 'الهيئة' : 'Organisme'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-800 leading-tight">
            {entity}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400">
            <FontAwesomeIcon icon={faFileContract} className="text-[10px]" />
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {isAr ? 'الوزارة الوصية' : 'Ministère de tutelle'}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-tight">
            {ministry}
          </p>
        </div>

      </div>

      {/* Footer - Référence et Action */}
      <div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-500">
          <FontAwesomeIcon icon={faTag} className="text-[10px]" />
          <span className="text-xs font-mono font-semibold">{reference}</span>
        </div>
        
        <button className="text-[#005c6e] text-xs font-bold underline decoration-1 underline-offset-4 cursor-pointer">
          {isAr ? 'عرض التفاصيل' : 'voir plus'}
        </button>
      </div>

    </div>
  );
}