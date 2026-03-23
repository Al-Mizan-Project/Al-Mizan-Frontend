import { getDictionary } from '@/lib/get-dictionary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileContract,
  faBuilding,
  faClipboardCheck,
  faLandmark,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Header from '@/components/Header';

export default async function SelectOrganizationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as 'fr' | 'ar');
  const isArabic = lang === 'ar';

  const organizationTypes = [
    {
      id: 'contractant',
      icon: faFileContract,
      color: 'bg-[#306B6F]',
      lightColor: 'bg-[#FCFFFF]',
      borderColor: 'border-[#9BCFCF]',
      hoverColor: 'hover:border-[#589C9F]',
      iconColor: 'text-[#306B6F]',
      title: dict.selectOrg.types.contractant.title,
      description: dict.selectOrg.types.contractant.description,
      href:`/${lang}/register/contractant`
    },
    {
      id: 'operateur',
      icon: faBuilding,
      color: 'bg-[#418387]',
      lightColor: 'bg-[#FCFFFF]',
      borderColor: 'border-[#9BCFCF]',
      hoverColor: 'hover:border-[#589C9F]',
      iconColor: 'text-[#418387]',
      title: dict.selectOrg.types.operateur.title,
      description: dict.selectOrg.types.operateur.description,
      href: `/${lang}/register/operateur`
    },
    {
      id: 'commission',
      icon: faClipboardCheck,
      color: 'bg-[#589C9F]',
      lightColor: 'bg-[#FCFFFF]',
      borderColor: 'border-[#9BCFCF]',
      hoverColor: 'hover:border-[#589C9F]',
      iconColor: 'text-[#589C9F]',
      title: dict.selectOrg.types.commission.title,
      description: dict.selectOrg.types.commission.description,
      href: `/${lang}/register/commission`
    },
    {
      id: 'tutelle',
      icon: faLandmark,
      color: 'bg-[#173C3F]',
      lightColor: 'bg-[#FCFFFF]',
      borderColor: 'border-[#9BCFCF]',
      hoverColor: 'hover:border-[#173C3F]',
      iconColor: 'text-[#173C3F]',
      title: dict.selectOrg.types.tutelle.title,
      description: dict.selectOrg.types.tutelle.description,
      href: `/${lang}/register/tutelle`
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCFFFF]">
      {/* Header */}
      <Header currentLang={lang} showLogo={true} showBackButton={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0D2527] mb-4 font-cairo">
            {dict.selectOrg.title}
          </h1>
          <p className="text-lg text-[#418387] max-w-3xl mx-auto leading-relaxed font-cairo">
            {dict.selectOrg.subtitle}
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-10 p-4 bg-[#FCFFFF] border border-[#9BCFCF] rounded-xl flex items-center gap-3 max-w-3xl mx-auto">
          <div className="flex-shrink-0 w-10 h-10 bg-[#9BCFCF] rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-[#173C3F]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#306B6F] font-medium font-cairo">
            {dict.selectOrg.info}
          </p>
        </div>

        {/* Organization Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {organizationTypes.map((org) => (
            <Link
              key={org.id}
              href={`/${lang}/register/${org.id}`}
              className={`group relative bg-white border-2 ${org.borderColor} ${org.hoverColor} rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center`}
            >
              {/* Icon Container */}
              <div className={`w-20 h-20 ${org.lightColor} ${org.borderColor} border-2 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                <FontAwesomeIcon icon={org.icon} className={`text-4xl ${org.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-[#0D2527] mb-3 font-cairo group-hover:text-[#306B6F] transition-colors">
                {org.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#418387] mb-6 leading-relaxed font-cairo flex-grow">
                {org.description}
              </p>

              {/* Action Button */}
              <div className={`w-full py-2.5 ${org.color} text-white rounded-xl font-bold flex items-center justify-center gap-2 group-hover:opacity-90 transition-opacity shadow-md`}>
                <span className="font-cairo">{dict.selectOrg.select}</span>
                <FontAwesomeIcon 
                  icon={faArrowRight} 
                  className={`text-sm ${isArabic ? 'rotate-180' : ''}`} 
                />
              </div>

              {/* Decorative Corner */}
              <div className={`absolute top-0 ${isArabic ? 'left-0' : 'right-0'} w-16 h-16 ${org.color} opacity-10 rounded-${isArabic ? 'bl' : 'br'}-2xl`}></div>
            </Link>
          ))}
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#6B8E8F] font-cairo">
            {isArabic ? (
              <>
                بالفعل لديك حساب؟{' '}
                <Link href={`/${lang}/login`} className="text-[#306B6F] hover:text-[#173C3F] font-bold underline">
                  تسجيل الدخول
                </Link>
              </>
            ) : (
              <>
                Vous avez déjà un compte ?{' '}
                <Link href={`/${lang}/login`} className="text-[#306B6F] hover:text-[#173C3F] font-bold underline">
                  Se connecter
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Compliance Badge */}
        <div className="mt-16 flex justify-center">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#418387]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#9BCFCF] rounded-lg">
              <div className="w-2 h-2 bg-[#589C9F] rounded-full"></div>
              <span className="font-cairo">
                {isArabic ? 'قانون 23-12' : 'Loi 23-12'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#9BCFCF] rounded-lg">
              <div className="w-2 h-2 bg-[#589C9F] rounded-full"></div>
              <span className="font-cairo">
                {isArabic ? 'قانون 18-07' : 'Loi 18-07'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#9BCFCF] rounded-lg">
              <div className="w-2 h-2 bg-[#589C9F] rounded-full"></div>
              <span className="font-cairo">
                {isArabic ? 'استضافة سيادية' : 'Hébergement souverain'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#9BCFCF] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#6B8E8F] font-cairo">
          <p>© 2026 Al-Mizan - {isArabic ? 'منصة إدارة الصفقات العمومية' : 'Plateforme de Gestion des Marchés Publics'}</p>
        </div>
      </footer>
    </div>
  );
}