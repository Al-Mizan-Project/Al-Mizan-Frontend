'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faLock, 
  faEye, 
  faEyeSlash, 
  faBuildingColumns,
  faArrowRight 
} from '@fortawesome/free-solid-svg-icons';
import '../validation.css';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default function ValidationLoginPage({ params }: PageProps) {
  const { lang } = use(params);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAr = lang === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Correct path for login is auth/login according to backend docs
      const response = await fetch('/api/proxy/auth?path=auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || errorData.error || 'Identifiants incorrects');
      }

      const data = await response.json();
      
      // Le backend Django renvoie "access" et "refresh"
      const accessToken = data.access || data.access_token;
      const refreshToken = data.refresh || data.refresh_token;

      if (!accessToken) {
        throw new Error('Token non reçu dans la réponse du serveur');
      }

      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);

      // Simple JWT decode to decide where to redirect
      const base64Url = accessToken.split('.')[1];
      const decoded = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
      
      // On vérifie le nom du rôle ou l'ID
      const roleName = (decoded.role || '').toLowerCase();
      const idRole = decoded.id_role || 0;
      
      if (roleName.includes('commission') || idRole === 2 || idRole === 3) {
        window.location.href = `/${lang}/validation/dashboard/commission`;
      } else {
        window.location.href = `/${lang}/validation/dashboard/validator`;
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="validation-theme min-h-screen bg-[#FCFFFF] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#DDE1E6] p-10 shadow-sm">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0D2527] rounded-xl flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faBuildingColumns} className="text-white text-2xl" />
          </div>
          <h1 className="val-title text-2xl mb-2">
            {isAr ? 'صفحة دخول التحقق' : 'Validation Login'}
          </h1>
          <p className="val-body">
            {isAr ? 'الوصول إلى لوحة تحكم التحقق' : 'Accès au module de validation'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="val-body-medium block mb-2">
              {isAr ? 'البريد الإلكتروني' : 'Adresse e-mail'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#589C9F]">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-[#DDE1E6] rounded-xl outline-none focus:ring-2 focus:ring-[#306B6F]"
                placeholder="exemple@domain.dz"
                required
              />
            </div>
          </div>

          <div>
            <label className="val-body-medium block mb-2">
              {isAr ? 'كلمة المرور' : 'Mot de passe'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#589C9F]">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 border border-[#DDE1E6] rounded-xl outline-none focus:ring-2 focus:ring-[#306B6F]"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#589C9F]"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-[#DA1E28] text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-3 transition-all ${
              loading ? 'bg-[#4D5358] cursor-not-allowed' : 'bg-[#306B6F] hover:bg-[#0D2527]'
            }`}
          >
            {loading ? (
              <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5" />
            ) : (
              <>
                <span>{isAr ? 'دخول' : 'Se connecter'}</span>
                {!isAr && <FontAwesomeIcon icon={faArrowRight} />}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#DDE1E6] pt-6">
          <p className="val-small">
            {isAr ? 'هذه صفحة دخول محلية لوحدة التحقق' : 'Page de connexion locale au module de validation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
