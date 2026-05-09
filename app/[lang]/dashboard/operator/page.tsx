'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faClipboardCheck,
  faHourglassHalf,
  faCheckDouble,
  faTimes,
  faArrowRight,
  faBell,
  faCalendarAlt,
  faMapMarkerAlt,
  faTag,
  faUsers,
  faUserPlus,
  faXmark,
  faEye,
  faEyeSlash,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';

const BASE = 'http://localhost:8080';

function getToken() { return localStorage.getItem('access_token') || ''; }
function getMembreId() { return localStorage.getItem('id_membre') || ''; }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

// Permissions available to operator collaborators (not the responsable role itself)
const AVAILABLE_PERMISSIONS = [
  { value: 'soumitter_offre', labelFr: 'Soumettre des offres', labelAr: 'تقديم العروض' },
  { value: 'faire_recours',   labelFr: 'Faire des recours',    labelAr: 'تقديم الطعون' },
];

type SoumissionRaw = {
  id_soumission: number;
  id_appel_offre: number;
  statut: string;
  date_soumission: string;
  montant_financier: number | null;
  conformite_statut: string | null;
};

type AppelOffreRaw = {
  id_appel_offres: number;
  reference: string;
  titre: string;
  type_prestation: string;
  wilaya: string;
  date_limite_soumission: string;
  montant_estime: string;
  statut: string;
  visibilite: string;
  operateurs_invites: { id: number; id_operateur_economique: number; statut_invitation: string }[];
};

type MembreRaw = {
  id_membre: string;
  nom: string;
  prenom: string;
  telephone: string;
  fonction: string;
  created_at: string;
  compte_auth?: { email: string; permissions: string[] } | null;
};

type NewMembreForm = {
  nom: string;
  prenom: string;
  telephone: string;
  fonction: string;
  email: string;
  password: string;
  permissions: string[];
};

type PageProps = { params: Promise<{ lang: string }> };

export default function OperatorDashboardPage({ params }: PageProps) {
  const [lang, setLang] = useState('');
  const router = useRouter();

  // Core data
  const [orgId, setOrgId] = useState<string | null>(null);
  const [soumissions, setSoumissions] = useState<SoumissionRaw[]>([]);
  const [invitedAppels, setInvitedAppels] = useState<AppelOffreRaw[]>([]);
  const [publicAppels, setPublicAppels] = useState<AppelOffreRaw[]>([]);
  const [membres, setMembres] = useState<MembreRaw[]>([]);
  const [loading, setLoading] = useState(true);

  // Member modal state
  const [showMembresPanel, setShowMembresPanel] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [newMembre, setNewMembre] = useState<NewMembreForm>({
    nom: '', prenom: '', telephone: '', fonction: '',
    email: '', password: '', permissions: [],
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewMembreForm, string>>>({});

  useEffect(() => {
    params.then(p => setLang(p.lang));
  }, [params]);

  // Step 1: resolve org_id from membre profile, then load everything
  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const membreId = getMembreId();
        const h = { ...authHeaders(), 'Content-Type': 'application/json' };

        // Fetch membre profile to get org_id
        const profileRes = await fetch(`${BASE}/membres/${membreId}/`, { headers: h });
        if (!profileRes.ok) throw new Error('Profile fetch failed');
        const profile = await profileRes.json();
        const resolvedOrgId = profile?.organisation?.id_organisation;
        if (resolvedOrgId) {
          setOrgId(resolvedOrgId);
          localStorage.setItem('organisation_id', String(resolvedOrgId));
        }

        // Fetch operator id from profile for soumissions
        const operatorId = profile?.organisation?.id_operateur_economique
          ?? Number(localStorage.getItem('operateur_id') ?? 1);

        const [resSoum, resAppels, resMembres] = await Promise.all([
          fetch(`${BASE}/api/operateurs-economiques/${operatorId}/soumissions`, { headers: h }),
          fetch(`${BASE}/appels-offres`, { headers: h }),
          resolvedOrgId
            ? fetch(`${BASE}/organisations/${resolvedOrgId}/membres/`, { headers: h })
            : Promise.resolve(null),
        ]);

        if (resSoum.ok) setSoumissions(await resSoum.json());

        if (resAppels.ok) {
          const allAppels: AppelOffreRaw[] = await resAppels.json();
          setInvitedAppels(allAppels.filter(a =>
            a.operateurs_invites?.some(inv => inv.id_operateur_economique === operatorId)
          ));
          setPublicAppels(
            allAppels.filter(a => a.visibilite === 'public' && a.statut === 'publie').slice(0, 5)
          );
        }

        if (resMembres?.ok) setMembres(await resMembres.json());

      } catch { /* silent — UI handles empty states */ }
      finally { setLoading(false); }
    };
    bootstrap();
  }, []);

  const isArabic = lang === 'ar';
  if (!lang) return null;

  // ── Stats ──
  const total     = soumissions.length;
  const enCours   = soumissions.filter(s => ['SOUMIS','EN_OUVERTURE','EN_EVALUATION'].includes(s.statut)).length;
  const terminees = soumissions.filter(s => ['EVALU_TERMINEE','ATTRIBUEE'].includes(s.statut)).length;
  const retirees  = soumissions.filter(s => s.statut === 'RETRAITE').length;

  const recent = [...soumissions]
    .sort((a, b) => new Date(b.date_soumission).getTime() - new Date(a.date_soumission).getTime())
    .slice(0, 4);

  const stats = [
    { label: isArabic ? 'إجمالي الطلبات'     : 'Total soumissions',         value: total,     icon: faFileAlt,    color: 'text-[#306B6F]',  bg: 'bg-[#EEF7F7]' },
    { label: isArabic ? 'قيد المعالجة'        : 'En cours',                  value: enCours,   icon: faHourglassHalf, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: isArabic ? 'منتهية / مسنودة'     : 'Terminées / Attribuées',    value: terminees, icon: faCheckDouble, color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: isArabic ? 'مسحوبة'              : 'Retirées',                  value: retirees,  icon: faTimes,       color: 'text-red-500',    bg: 'bg-red-50'    },
  ];

  function statutLabel(s: string) {
    const n = s.toUpperCase();
    if (n === 'SOUMIS')                                    return { label: isArabic ? 'مقدمة'        : 'Soumise',       color: 'text-blue-600',    bg: 'bg-blue-50'    };
    if (n === 'EN_EVALUATION' || n === 'EN_OUVERTURE')    return { label: isArabic ? 'قيد التقييم' : 'En évaluation', color: 'text-yellow-600',  bg: 'bg-yellow-50'  };
    if (n === 'EVALU_TERMINEE')                            return { label: isArabic ? 'منتهية'       : 'Terminée',      color: 'text-green-600',   bg: 'bg-green-50'   };
    if (n === 'ATTRIBUEE')                                 return { label: isArabic ? 'مسنودة'       : 'Attribuée',     color: 'text-emerald-700', bg: 'bg-emerald-50' };
    if (n === 'RETRAITE')                                  return { label: isArabic ? 'مسحوبة'       : 'Retirée',       color: 'text-red-500',     bg: 'bg-red-50'     };
    return { label: s, color: 'text-gray-600', bg: 'bg-gray-50' };
  }

  const daysUntil = (date: string) =>
    Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // ── Add membre ──
  const validateNewMembre = (): boolean => {
    const e: typeof formErrors = {};
    if (!newMembre.nom.trim())    e.nom    = isArabic ? 'اللقب مطلوب'            : 'Nom requis';
    if (!newMembre.prenom.trim()) e.prenom = isArabic ? 'الاسم مطلوب'            : 'Prénom requis';
    if (!newMembre.email.trim() || !/\S+@\S+\.\S+/.test(newMembre.email))
                                  e.email  = isArabic ? 'بريد إلكتروني غير صالح' : 'Email invalide';
    if (!newMembre.password || newMembre.password.length < 8)
                                  e.password = isArabic ? 'كلمة المرور 8 أحرف على الأقل' : 'Mot de passe: 8 caractères min.';
    if (newMembre.permissions.length === 0)
                                  e.permissions = isArabic ? 'اختر صلاحية واحدة على الأقل' : 'Choisissez au moins une permission';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddMembre = async () => {
    if (!validateNewMembre()) return;
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch(`${BASE}/membres/creer-collaborateur/`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newMembre),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }
      const created: MembreRaw = await res.json();
      setMembres(prev => [...prev, created]);
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddForm(false);
        setNewMembre({ nom: '', prenom: '', telephone: '', fonction: '', email: '', password: '', permissions: [] });
      }, 1800);
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const togglePermission = (perm: string) => {
    setNewMembre(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
    if (formErrors.permissions) setFormErrors(p => ({ ...p, permissions: undefined }));
  };

  // ── AppelOffre Card ──
  const AppelCard = ({ ao, badge }: { ao: AppelOffreRaw; badge: 'invited' | 'public' }) => {
    const days   = daysUntil(ao.date_limite_soumission);
    const urgent = days <= 7 && days >= 0;
    return (
      <div
        onClick={() => router.push(`/${lang}/dashboard/operator/appels-offres/${ao.id_appel_offres}`)}
        className={`bg-white rounded-2xl p-5 border-2 cursor-pointer hover:shadow-md transition-all group ${
          urgent
            ? 'border-amber-300'
            : badge === 'invited'
            ? 'border-[#9BCFCF] hover:border-[#306B6F]'
            : 'border-gray-200 hover:border-[#306B6F]'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${badge === 'invited' ? 'bg-[#EEF7F7] text-[#306B6F]' : 'bg-gray-100 text-gray-600'}`}>
            {badge === 'invited' ? (isArabic ? 'مدعو' : 'Invité') : (isArabic ? 'عام' : 'Public')}
          </span>
          {urgent && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">{days === 0 ? "Aujourd'hui" : `J-${days}`}</span>}
        </div>
        <p className="text-xs text-[#418387] font-medium mb-1">{ao.reference}</p>
        <h3 className="text-sm font-bold text-[#0D2527] line-clamp-2 mb-3">{ao.titre}</h3>
        <div className="space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#418387]" />{ao.wilaya || '—'}</div>
          <div className="flex items-center gap-1.5"><FontAwesomeIcon icon={faTag} className="text-[#418387]" /><span className="capitalize">{ao.type_prestation}</span></div>
          <div className="flex items-center gap-1.5"><FontAwesomeIcon icon={faCalendarAlt} className="text-[#418387]" />{new Date(ao.date_limite_soumission).toLocaleDateString('fr-DZ')}</div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-bold text-[#173C3F]">
            {Number(ao.montant_estime) > 0 ? `${new Intl.NumberFormat('fr-DZ').format(Number(ao.montant_estime))} DA` : '—'}
          </span>
          <FontAwesomeIcon icon={faArrowRight} className="text-[#9BCFCF] group-hover:text-[#306B6F] transition-colors" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7FAFA] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0D2527] font-cairo">
              {isArabic ? 'لوحة التحكم' : 'Tableau de Bord'}
            </h1>
            <p className="text-[#418387] mt-1 text-sm font-cairo">
              {isArabic ? 'مرحباً بك — هنا ملخص نشاطك' : 'Bienvenue — voici un résumé de votre activité'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Members button */}
            <button
              onClick={() => setShowMembresPanel(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#9BCFCF] hover:border-[#306B6F] hover:bg-[#EEF7F7] text-[#306B6F] rounded-xl font-semibold text-sm transition-all"
            >
              <FontAwesomeIcon icon={faUsers} />
              {isArabic ? 'الأعضاء' : 'Membres'}
              {membres.length > 0 && (
                <span className="w-5 h-5 bg-[#306B6F] text-white text-xs rounded-full flex items-center justify-center">
                  {membres.length}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push(`/${lang}/dashboard/operator/soumissions`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-xl font-semibold text-sm transition-colors shadow"
            >
              {isArabic ? 'كل الطلبات' : 'Mes soumissions'}
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                  <FontAwesomeIcon icon={s.icon} className={s.color} />
                </div>
                <div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-cairo">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent soumissions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClipboardCheck} className="text-[#306B6F]" />
                <h2 className="font-bold text-[#0D2527] font-cairo">{isArabic ? 'آخر الطلبات' : 'Soumissions récentes'}</h2>
              </div>
              <button
                onClick={() => router.push(`/${lang}/dashboard/operator/soumissions`)}
                className="text-sm text-[#306B6F] hover:text-[#173C3F] font-medium flex items-center gap-1"
              >
                {isArabic ? 'عرض الكل' : 'Voir tout'} <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : recent.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm font-cairo">
                {isArabic ? 'لا توجد طلبات بعد' : 'Aucune soumission pour le moment'}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent.map(s => {
                  const st = statutLabel(s.statut);
                  return (
                    <div
                      key={s.id_soumission}
                      onClick={() => router.push(`/${lang}/dashboard/operator/soumissions/${s.id_soumission}`)}
                      className="flex items-center justify-between px-6 py-4 hover:bg-[#F7FAFA] cursor-pointer transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0D2527] truncate">
                          Soumission #{s.id_soumission} — AO #{s.id_appel_offre}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(s.date_soumission).toLocaleDateString('fr-DZ')}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${st.bg} ${st.color}`}>{st.label}</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-gray-300 group-hover:text-[#306B6F] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <h2 className="font-bold text-[#0D2527] mb-4 font-cairo">{isArabic ? 'الوصول السريع' : 'Accès rapide'}</h2>
              {[
                { label: isArabic ? 'نداءات العروض' : "Appels d'offres", path: 'appels-offres' },
                { label: isArabic ? 'العقود'         : 'Contrats',         path: 'contrats'       },
                { label: isArabic ? 'المستندات'      : 'Documents',         path: 'documents'      },
                { label: isArabic ? 'الطعون'         : 'Recours',           path: 'recours'        },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => router.push(`/${lang}/dashboard/operator/${item.path}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#9BCFCF] hover:bg-[#EEF7F7] hover:border-[#306B6F] transition-all text-sm font-medium text-[#0D2527] group font-cairo"
                >
                  {item.label}
                  <FontAwesomeIcon icon={faArrowRight} className="text-[#9BCFCF] group-hover:text-[#306B6F] transition-colors" />
                </button>
              ))}
            </div>

            {/* Members mini-widget */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} className="text-[#306B6F]" />
                  <h2 className="font-bold text-[#0D2527] font-cairo">{isArabic ? 'الفريق' : 'Mon équipe'}</h2>
                </div>
                <button
                  onClick={() => { setShowMembresPanel(true); setShowAddForm(true); }}
                  className="w-7 h-7 bg-[#EEF7F7] hover:bg-[#9BCFCF] rounded-lg flex items-center justify-center transition-colors"
                  title={isArabic ? 'إضافة عضو' : 'Ajouter un membre'}
                >
                  <FontAwesomeIcon icon={faUserPlus} className="text-[#306B6F] text-xs" />
                </button>
              </div>
              {loading ? (
                <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />)}</div>
              ) : membres.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 font-cairo mb-3">
                    {isArabic ? 'لم تتم إضافة أعضاء بعد' : 'Aucun membre ajouté'}
                  </p>
                  <button
                    onClick={() => { setShowMembresPanel(true); setShowAddForm(true); }}
                    className="text-xs text-[#306B6F] font-semibold hover:underline font-cairo"
                  >
                    {isArabic ? '+ إضافة أول عضو' : '+ Ajouter le premier membre'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {membres.slice(0, 3).map(m => (
                    <div key={m.id_membre} className="flex items-center gap-3 py-1.5">
                      <div className="w-8 h-8 bg-[#EEF7F7] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#306B6F]">
                          {m.prenom[0]}{m.nom[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#0D2527] truncate">{m.prenom} {m.nom}</p>
                        <p className="text-xs text-gray-400 truncate">{m.fonction || '—'}</p>
                      </div>
                    </div>
                  ))}
                  {membres.length > 3 && (
                    <button
                      onClick={() => setShowMembresPanel(true)}
                      className="text-xs text-[#306B6F] font-semibold hover:underline mt-1 font-cairo"
                    >
                      {isArabic ? `+ ${membres.length - 3} آخرون` : `+ ${membres.length - 3} autres`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Appels d'offres ── */}
        {!loading && (invitedAppels.length > 0 || publicAppels.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faBell} className="text-[#306B6F]" />
              <h2 className="font-bold text-[#0D2527] font-cairo">{isArabic ? 'نداءات العروض المتاحة' : "Appels d'offres disponibles"}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {invitedAppels.slice(0, 3).map(ao => <AppelCard key={ao.id_appel_offres} ao={ao} badge="invited" />)}
              {publicAppels.slice(0, 3 - Math.min(invitedAppels.length, 3)).map(ao => <AppelCard key={ao.id_appel_offres} ao={ao} badge="public" />)}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════
          MEMBRES SIDE PANEL
      ════════════════════════════════ */}
      {showMembresPanel && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => { setShowMembresPanel(false); setShowAddForm(false); setAddError(null); }}
          />

          {/* Panel */}
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#EEF7F7] rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUsers} className="text-[#306B6F]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#0D2527] font-cairo">{isArabic ? 'إدارة الأعضاء' : 'Gestion des membres'}</h2>
                  <p className="text-xs text-gray-400">{membres.length} {isArabic ? 'عضو' : 'membre(s)'}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowMembresPanel(false); setShowAddForm(false); setAddError(null); }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6">

              {/* Add member form */}
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#9BCFCF] rounded-xl text-[#306B6F] font-semibold text-sm hover:bg-[#EEF7F7] transition-colors font-cairo"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  {isArabic ? 'إضافة عضو جديد' : 'Ajouter un nouveau membre'}
                </button>
              ) : (
                <div className="border-2 border-[#9BCFCF] rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-[#173C3F] font-cairo text-sm">
                    {isArabic ? 'بيانات العضو الجديد' : 'Nouveau collaborateur'}
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Nom */}
                    <div>
                      <label className="block text-xs font-medium text-[#173C3F] mb-1 font-cairo">
                        {isArabic ? 'اللقب' : 'Nom'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={newMembre.nom}
                        onChange={e => { setNewMembre(p => ({ ...p, nom: e.target.value })); setFormErrors(p => ({ ...p, nom: undefined })); }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#306B6F] font-cairo ${formErrors.nom ? 'border-red-400' : 'border-[#9BCFCF]'}`}
                        placeholder={isArabic ? 'بن علي' : 'Ben Ali'}
                      />
                      {formErrors.nom && <p className="text-xs text-red-500 mt-1">{formErrors.nom}</p>}
                    </div>

                    {/* Prénom */}
                    <div>
                      <label className="block text-xs font-medium text-[#173C3F] mb-1 font-cairo">
                        {isArabic ? 'الاسم' : 'Prénom'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={newMembre.prenom}
                        onChange={e => { setNewMembre(p => ({ ...p, prenom: e.target.value })); setFormErrors(p => ({ ...p, prenom: undefined })); }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#306B6F] font-cairo ${formErrors.prenom ? 'border-red-400' : 'border-[#9BCFCF]'}`}
                        placeholder={isArabic ? 'كريم' : 'Karim'}
                      />
                      {formErrors.prenom && <p className="text-xs text-red-500 mt-1">{formErrors.prenom}</p>}
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-xs font-medium text-[#173C3F] mb-1 font-cairo">
                        {isArabic ? 'الهاتف' : 'Téléphone'}
                      </label>
                      <input
                        value={newMembre.telephone}
                        onChange={e => setNewMembre(p => ({ ...p, telephone: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-[#9BCFCF] rounded-lg outline-none focus:ring-2 focus:ring-[#306B6F]"
                        placeholder="+213 5XX XXX XXX"
                        dir="ltr"
                      />
                    </div>

                    {/* Fonction */}
                    <div>
                      <label className="block text-xs font-medium text-[#173C3F] mb-1 font-cairo">
                        {isArabic ? 'المنصب' : 'Fonction'}
                      </label>
                      <input
                        value={newMembre.fonction}
                        onChange={e => setNewMembre(p => ({ ...p, fonction: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-[#9BCFCF] rounded-lg outline-none focus:ring-2 focus:ring-[#306B6F] font-cairo"
                        placeholder={isArabic ? 'مندوب' : 'Commercial'}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-[#173C3F] mb-1 font-cairo">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newMembre.email}
                      onChange={e => { setNewMembre(p => ({ ...p, email: e.target.value })); setFormErrors(p => ({ ...p, email: undefined })); }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#306B6F] ${formErrors.email ? 'border-red-400' : 'border-[#9BCFCF]'}`}
                      placeholder="collaborateur@entreprise.dz"
                      dir="ltr"
                    />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-medium text-[#173C3F] mb-1 font-cairo">
                      {isArabic ? 'كلمة المرور' : 'Mot de passe'} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newMembre.password}
                        onChange={e => { setNewMembre(p => ({ ...p, password: e.target.value })); setFormErrors(p => ({ ...p, password: undefined })); }}
                        className={`w-full px-3 py-2 pr-9 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[#306B6F] ${formErrors.password ? 'border-red-400' : 'border-[#9BCFCF]'}`}
                        placeholder="••••••••"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#306B6F]"
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-xs" />
                      </button>
                    </div>
                    {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-xs font-medium text-[#173C3F] mb-2 font-cairo">
                      {isArabic ? 'الصلاحيات' : 'Permissions'} <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {AVAILABLE_PERMISSIONS.map(p => (
                        <label key={p.value} className="flex items-center gap-3 cursor-pointer group">
                          <div
                            onClick={() => togglePermission(p.value)}
                            className={`w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors cursor-pointer ${
                              newMembre.permissions.includes(p.value)
                                ? 'bg-[#306B6F] border-[#306B6F]'
                                : 'border-[#9BCFCF] group-hover:border-[#306B6F]'
                            }`}
                          >
                            {newMembre.permissions.includes(p.value) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-[#0D2527] font-cairo">
                            {isArabic ? p.labelAr : p.labelFr}
                          </span>
                        </label>
                      ))}
                    </div>
                    {formErrors.permissions && <p className="text-xs text-red-500 mt-1">{formErrors.permissions}</p>}
                  </div>

                  {/* Error / Success */}
                  {addError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-cairo">
                      {addError}
                    </div>
                  )}
                  {addSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs font-cairo flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheckDouble} />
                      {isArabic ? 'تمت إضافة العضو بنجاح!' : 'Membre ajouté avec succès !'}
                    </div>
                  )}

                  {/* Form actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => { setShowAddForm(false); setAddError(null); setFormErrors({}); }}
                      className="flex-1 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors font-cairo"
                    >
                      {isArabic ? 'إلغاء' : 'Annuler'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMembre}
                      disabled={addLoading || addSuccess}
                      className="flex-1 py-2.5 bg-[#306B6F] hover:bg-[#173C3F] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 font-cairo"
                    >
                      {addLoading
                        ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> {isArabic ? 'جاري...' : 'Envoi...'}</>
                        : isArabic ? 'إضافة' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              )}

              {/* Members list */}
              <div className="space-y-3">
                {membres.length === 0 && !showAddForm && (
                  <p className="text-center text-gray-400 text-sm py-8 font-cairo">
                    {isArabic ? 'لا يوجد أعضاء بعد' : 'Aucun membre pour le moment'}
                  </p>
                )}
                {membres.map(m => (
                  <div key={m.id_membre} className="flex items-center gap-4 p-4 bg-[#F7FAFA] rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-[#EEF7F7] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#306B6F]">
                        {m.prenom?.[0]?.toUpperCase()}{m.nom?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0D2527] font-cairo">{m.prenom} {m.nom}</p>
                      <p className="text-xs text-gray-400 truncate">{m.compte_auth?.email || '—'}</p>
                      {m.compte_auth?.permissions && m.compte_auth.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {m.compte_auth.permissions.map(perm => (
                            <span key={perm} className="px-1.5 py-0.5 bg-[#EEF7F7] text-[#306B6F] text-xs rounded font-mono">
                              {perm}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400 font-cairo">{m.fonction || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}