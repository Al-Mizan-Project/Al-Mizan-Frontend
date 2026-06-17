'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type DemandeOE } from '@/lib/sc/api';
import { Card, PageHeader, Spinner, EmptyState, Modal, useUI, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

type Credentials = { organisation: string; email: string; password: string | null };

function DemandesOEInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, serviceId } = useSCSession();
  const { toast, confirm } = useUI();

  const [demandes, setDemandes] = useState<DemandeOE[]>([]);
  const [loading, setLoading] = useState(true);
  const [refuse, setRefuse] = useState<{ d: DemandeOE; text: string } | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

  async function load() {
    if (serviceId) setDemandes(await scApi.listDemandesOE(serviceId));
    setLoading(false);
  }
  useEffect(() => { if (ready) load(); }, [ready, serviceId]);

  async function approve(d: DemandeOE) {
    const ok = await confirm({
      title: isArabic ? 'قبول الطلب' : 'Approuver la demande',
      message: isArabic ? 'سيتم إنشاء مؤسسة المتعامل وحساب المسؤول تلقائيا.' : "L'organisation de l'opérateur et le compte de son responsable seront créés automatiquement.",
      confirmLabel: isArabic ? 'قبول' : 'Approuver',
    });
    if (!ok || d.id == null) return;
    try {
      const result = await scApi.approveDemandeOE(d.id);
      setCredentials({
        organisation: d.nom_officiel || `Demande #${d.id}`,
        email: result.email || d.email_contact || '',
        password: result.temporary_password || null,
      });
      toast('success', isArabic ? 'تم القبول وإنشاء الحساب.' : 'Demande approuvée — compte créé.');
      load();
    }
    catch (err) {
      toast('error', errorText(err, isArabic ? 'تعذر التنفيذ.' : 'Action indisponible côté serveur.'));
    }
  }
  async function doRefuse() {
    if (!refuse || refuse.d.id == null) return;
    try { await scApi.refuseDemandeOE(refuse.d.id, refuse.text); toast('success', isArabic ? 'تم رفض الطلب.' : 'Demande refusée.'); setRefuse(null); load(); }
    catch (err) {
      toast('error', errorText(err, isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.'));
      setRefuse(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title={isArabic ? 'طلبات تسجيل المتعاملين' : "Demandes d'inscription — Opérateurs"} breadcrumb={isArabic ? 'إدارة المتعاملين' : 'Gestion des opérateurs'} />
      {demandes.length === 0 ? (
        <Card><EmptyState title={isArabic ? 'لا توجد طلبات معلقة' : 'Aucune demande en attente'} hint={isArabic ? 'تظهر هنا طلبات المتعاملين الموجهة إلى مصلحتك.' : "Les demandes adressées à votre service apparaissent ici."} /></Card>
      ) : (
        <div className="space-y-3">
          {demandes.map((d) => (
            <Card key={d.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: '#1C4532' }}>{d.nom_officiel || `Demande #${d.id}`}</p>
                <p className="text-xs text-gray-400">{d.email_contact} {d.created_at ? `· ${new Date(d.created_at).toLocaleDateString('fr-DZ')}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => approve(d)}>{isArabic ? 'قبول' : 'Approuver'}</button>
                <button className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50" onClick={() => setRefuse({ d, text: '' })}>{isArabic ? 'رفض' : 'Refuser'}</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!refuse} title={isArabic ? 'سبب الرفض' : 'Motif de refus'} onClose={() => setRefuse(null)}
        footer={<><button className={GHOST_BTN} onClick={() => setRefuse(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button><button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={doRefuse} disabled={!refuse?.text.trim()}>{isArabic ? 'تأكيد' : 'Confirmer'}</button></>}>
        <textarea rows={4} value={refuse?.text || ''} onChange={(e) => setRefuse((r) => r && { ...r, text: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none" />
      </Modal>

      <Modal
        open={!!credentials}
        title={isArabic ? 'حساب المتعامل — يظهر مرة واحدة' : 'Compte opérateur — affichage unique'}
        onClose={() => setCredentials(null)}
        footer={<button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => setCredentials(null)}>{isArabic ? 'فهمت' : 'J’ai noté'}</button>}
      >
        {credentials && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {isArabic
                ? 'انسخ هذه البيانات الآن وأرسلها إلى المتعامل. لن تظهر كلمة المرور مرة أخرى.'
                : "Copiez ces identifiants maintenant et envoyez-les à l'opérateur. Le mot de passe ne sera plus affiché."}
            </p>
            <div className="rounded-2xl bg-[#F4F7F4] p-4 space-y-2 text-sm">
              <p><span className="font-semibold text-gray-500">{isArabic ? 'المؤسسة' : 'Organisation'}</span><br /><span style={{ color: '#1C4532' }}>{credentials.organisation}</span></p>
              <p><span className="font-semibold text-gray-500">Email</span><br /><span style={{ color: '#1C4532' }}>{credentials.email || '—'}</span></p>
              <p><span className="font-semibold text-gray-500">{isArabic ? 'كلمة المرور' : 'Mot de passe'}</span><br /><span className="font-mono" style={{ color: '#1C4532' }}>{credentials.password || '—'}</span></p>
            </div>
            {credentials.email && credentials.password && (
              <a
                className={GHOST_BTN}
                href={`mailto:${encodeURIComponent(credentials.email)}?subject=${encodeURIComponent("Identifiants Al-Mizan")}&body=${encodeURIComponent(`Bonjour,\n\nVotre compte Al-Mizan a été créé.\nEmail: ${credentials.email}\nMot de passe: ${credentials.password}\n\nVeuillez changer ce mot de passe après votre première connexion.`)}`}
              >
                {isArabic ? 'إرسال بالبريد' : 'Préparer l’email'}
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function DemandesOEPage() {
  return <Guard anyOf={['oe:approuve']}><DemandesOEInner /></Guard>;
}
