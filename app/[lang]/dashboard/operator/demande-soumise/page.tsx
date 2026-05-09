'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHourglassHalf,
  faEnvelope,
  faCheckCircle,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

type PageProps = {
  params: Promise<{ lang: string }>;
};

const steps = {
  fr: [
    { label: 'Demande soumise', done: true },
    { label: 'Vérification des documents', done: false },
    { label: 'Approbation admin', done: false },
    { label: 'Création du compte', done: false },
  ],
  ar: [
    { label: 'تم إرسال الطلب', done: true },
    { label: 'مراجعة الوثائق', done: false },
    { label: 'موافقة الإدارة', done: false },
    { label: 'إنشاء الحساب', done: false },
  ],
};

export default function DemandeSubmittedPage({ params }: PageProps) {
  const router = useRouter();
  const [lang, setLang] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const loadLang = async () => {
      const resolvedParams = await params;
      if (isMounted) setLang(resolvedParams.lang);
    };
    loadLang();
    return () => { isMounted = false; };
  }, [params]);

  const isArabic = lang === 'ar';
  const currentSteps = isArabic ? steps.ar : steps.fr;

  if (!lang) return null;

  return (
    <div className="min-h-screen bg-[#FCFFFF]">
      <Header currentLang={lang} showLogo={true} showBackButton={false} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center text-center">

        {/* Icon */}
        <div className="w-24 h-24 bg-[#EEF8F8] border-2 border-[#9BCFCF] rounded-full flex items-center justify-center mb-6">
          <FontAwesomeIcon icon={faHourglassHalf} className="text-[#418387] text-4xl" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#0D2527] font-cairo mb-3">
          {isArabic ? 'طلبك قيد المراجعة' : 'Votre demande est en cours d\'examen'}
        </h1>

        <p className="text-[#418387] font-cairo text-base leading-relaxed mb-10">
          {isArabic
            ? 'تم استلام طلب تسجيلك بنجاح. سيقوم فريق الإدارة بمراجعة ملفك في أقرب وقت ممكن.'
            : 'Votre demande d\'inscription a bien été reçue. L\'équipe administrative va examiner votre dossier dans les meilleurs délais.'}
        </p>

        {/* Progress Steps */}
        <div className="w-full bg-white border-2 border-[#9BCFCF] rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-[#173C3F] uppercase tracking-widest mb-6 font-cairo">
            {isArabic ? 'مراحل المعالجة' : 'Étapes de traitement'}
          </h2>

          <div className="flex flex-col gap-4">
            {currentSteps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse text-right' : 'text-left'}`}
              >
                {/* Step indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all ${
                    step.done
                      ? 'bg-[#418387] text-white'
                      : 'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  {step.done
                    ? <FontAwesomeIcon icon={faCheckCircle} className="text-white text-base" />
                    : <span>{i + 1}</span>
                  }
                </div>

                {/* Connector line (not on last) */}
                <div className="flex-1">
                  <p
                    className={`text-sm font-semibold font-cairo ${
                      step.done ? 'text-[#0D2527]' : 'text-[#94A3B8]'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>

                {step.done && (
                  <span className="text-xs font-cairo text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    {isArabic ? 'مكتمل' : 'Fait'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Email notice */}
        <div className="w-full flex items-start gap-3 p-4 bg-[#EEF8F8] border border-[#9BCFCF] rounded-xl mb-10 text-left">
          <FontAwesomeIcon icon={faEnvelope} className="text-[#418387] text-lg mt-0.5 flex-shrink-0" />
          <p className={`text-sm text-[#306B6F] font-cairo ${isArabic ? 'text-right' : 'text-left'}`}>
            {isArabic
              ? 'عند الموافقة على طلبك، ستصلك رسالة إلكترونية تحتوي على بيانات الدخول إلى حسابك.'
              : 'Une fois votre demande approuvée, vous recevrez un email contenant vos identifiants de connexion.'}
          </p>
        </div>

        {/* Back to home */}
        <button
          onClick={() => router.push(`/${lang}`)}
          className="flex items-center gap-2 px-8 py-3.5 border-2 border-[#9BCFCF] text-[#418387] rounded-xl font-bold hover:bg-[#EEF8F8] transition-colors font-cairo"
        >
          {isArabic && <FontAwesomeIcon icon={faArrowRight} className="rotate-180" />}
          <span>{isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Retour à l\'accueil'}</span>
          {!isArabic && <FontAwesomeIcon icon={faArrowRight} />}
        </button>

      </main>
    </div>
  );
}