'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SoumettreButton({
  appelId,
  idServiceContractant,
  lang,
}: {
  appelId: number;
  idServiceContractant: number;
  lang: string;
}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('user_id'));
  }, []);

  if (isLoggedIn === null || isLoggedIn) return null;

  return (
    <button
      onClick={() => {
        localStorage.setItem('redirect_appel_id', String(appelId));
        localStorage.setItem('redirect_service_contractant_id', String(idServiceContractant));
        router.push(`/${lang}/register/operateur`);
      }}
      className="mt-6 w-full bg-[#005c6e] hover:bg-[#004a59] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    >
      Soumettre une offre
    </button>
  );
}