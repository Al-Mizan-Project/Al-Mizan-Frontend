import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';

export default function Footer({ dict, lang }: { dict: any, lang: string }) {
  return (
    <footer className="relative text-white py-12 overflow-hidden mt-auto">
      {/* Image de fond avec overlay sombre */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/footer.png" 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          
          {/* Section Logo et Identité */}
          <div className="flex flex-col gap-4 max-w-md">
            <img src="/logo_white.png" alt="Logo Ministère" className="h-20 w-auto object-contain self-start" />
            <div className="space-y-1">
              <p className="text-lg font-bold uppercase leading-tight tracking-wide">
                {dict.footer_portal_name}
              </p>
              <p className="text-xs font-medium opacity-80 italic">
                {lang === 'fr' ? 'Ministère des Finances' : 'وزارة المالية'}
              </p>
            </div>
          </div>

          {/* Section Contact */}
          <div className="space-y-6">
            <h3 className="text-[#00667e] font-bold uppercase tracking-widest text-sm border-b border-[#d4af37]/30 pb-2 inline-block">
              {dict.footer_contact}
            </h3>
            
            <div className="space-y-4 text-sm font-light">
              <div className="flex items-start gap-4 group">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#00667e] mt-1" />
                <span className="max-w-[300px] leading-relaxed group-hover:text-[#00667e] transition-colors">
                  {dict.footer_address_value}
                </span>
              </div>
              
              <div className="flex items-center gap-4 group">
                <FontAwesomeIcon icon={faPhone} className="text-[#00667e]" />
                <span className="group-hover:text-[#00667e] transition-colors" dir="ltr">
                  021 59 51 51 / 52 52
                </span>
              </div>
              
              <div className="flex items-center gap-4 group">
                <FontAwesomeIcon icon={faEnvelope} className="text-[#00667e]" />
                <a href="mailto:contact@marches-publics.gov.dz" className="hover:text-[#00667e] transition-colors">
                  contact@marches-publics.gov.dz
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne de séparation et Copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center">
          <p className="text-[10px] md:text-xs opacity-60 font-medium tracking-wider">
            {dict.footer_copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}