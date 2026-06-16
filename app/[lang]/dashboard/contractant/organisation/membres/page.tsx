'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type Membre } from '@/lib/sc/api';
import { ALL_SC_ROLES, roleLabel, type SCRole } from '@/lib/sc/permissions';
import { Card, PageHeader, Spinner, EmptyState, Badge, Modal, useUI, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

const EMPTY = { nom: '', prenom: '', email: '', telephone: '', fonction: '', role: 'REDACTEUR_CDC' as SCRole };

function MembresInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, orgId, can } = useSCSession();
  const { toast, confirm } = useUI();

  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (orgId) setMembres(await scApi.listMembres(orgId));
    setLoading(false);
  }
  useEffect(() => { if (ready) load(); }, [ready, orgId]);

  async function create() {
    if (!form?.nom || !form.prenom || !form.email) { toast('warning', isArabic ? 'الحقول الإلزامية ناقصة.' : 'Champs obligatoires manquants.'); return; }
    setSaving(true);
    try {
      await scApi.createCollaborateur({ ...form, id_organisation: orgId });
      toast('success', isArabic ? 'تم إنشاء العضو. أُرسل رابط التفعيل بالبريد.' : "Membre créé — un lien d'activation a été envoyé par email.");
      setForm(null); load();
    } catch {
      toast('error', isArabic ? 'تعذر إنشاء العضو.' : 'Création indisponible côté serveur.');
    } finally { setSaving(false); }
  }

  async function deactivate(m: Membre) {
    const ok = await confirm({ title: isArabic ? 'تعطيل العضو' : 'Désactiver le membre', message: `${m.prenom} ${m.nom}`, danger: true });
    if (!ok) return;
    try { await scApi.deactivateMembre(m.id_membre); toast('success', isArabic ? 'تم التعطيل.' : 'Membre désactivé.'); load(); }
    catch { toast('error', isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.'); }
  }

  async function changeRole(m: Membre, role: string) {
    try { await scApi.assignRole(m.id_membre, role); toast('success', isArabic ? 'تم تحديث الدور.' : 'Rôle mis à jour.'); load(); }
    catch { toast('error', isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.'); }
  }

  if (loading) return <Spinner />;
  const fcls = 'w-full mt-1 px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none';
  const memberEmail = (m: Membre) => m.compte_auth?.email || m.email || '—';
  const memberRole = (m: Membre) => m.compte_auth?.role || m.role || '';

  return (
    <div>
      <PageHeader
        title={isArabic ? 'الأعضاء' : 'Membres'} breadcrumb={isArabic ? 'مؤسستي' : 'Mon organisation'}
        action={can('membre:create') ? <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => setForm(EMPTY)}>+ {isArabic ? 'إضافة عضو' : 'Ajouter un membre'}</button> : undefined}
      />

      {membres.length === 0 ? (
        <Card><EmptyState title={isArabic ? 'لا يوجد أعضاء' : 'Aucun membre'} hint={isArabic ? 'أضف أعضاء فريقك.' : "Ajoutez les membres de votre équipe."} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <th className="px-5 py-3 font-semibold">{isArabic ? 'الاسم' : 'Nom'}</th>
              <th className="px-5 py-3 font-semibold">{isArabic ? 'البريد' : 'Email'}</th>
              <th className="px-5 py-3 font-semibold">{isArabic ? 'الدور' : 'Rôle'}</th>
              <th className="px-5 py-3 font-semibold text-right">{isArabic ? 'إجراءات' : 'Actions'}</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {membres.map((m) => (
                <tr key={m.id_membre} className="hover:bg-[#F4F7F4]">
                  <td className="px-5 py-3 font-semibold" style={{ color: '#1C4532' }}>{m.prenom} {m.nom}</td>
                  <td className="px-5 py-3 text-gray-500">{memberEmail(m)}</td>
                  <td className="px-5 py-3">
                    {can('role:assign') ? (
                      <select defaultValue={memberRole(m)} onChange={(e) => changeRole(m, e.target.value)} className="px-3 py-1.5 rounded-lg text-xs bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none">
                        <option value="">—</option>
                        {ALL_SC_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r, lang)}</option>)}
                      </select>
                    ) : <Badge tone="info">{memberRole(m) || '—'}</Badge>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {can('membre:deactivate') && <button onClick={() => deactivate(m)} className="text-xs font-semibold text-red-500 hover:underline">{isArabic ? 'تعطيل' : 'Désactiver'}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={!!form} title={isArabic ? 'عضو جديد' : 'Nouveau membre'} onClose={() => setForm(null)} wide
        footer={<>
          <button className={GHOST_BTN} onClick={() => setForm(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button>
          <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={create} disabled={saving}>{saving ? '…' : (isArabic ? 'إنشاء' : 'Créer')}</button>
        </>}>
        {form && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-gray-500">{isArabic ? 'الاسم' : 'Prénom'} *</label><input className={fcls} value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-gray-500">{isArabic ? 'اللقب' : 'Nom'} *</label><input className={fcls} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-gray-500">Email *</label><input type="email" className={fcls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-gray-500">{isArabic ? 'الهاتف' : 'Téléphone'}</label><input className={fcls} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-gray-500">{isArabic ? 'الوظيفة' : 'Fonction'}</label><input className={fcls} value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-gray-500">{isArabic ? 'الدور' : 'Rôle'} *</label>
              <select className={fcls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as SCRole })}>
                {ALL_SC_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r, lang)}</option>)}
              </select>
            </div>
            <p className="sm:col-span-2 text-xs text-gray-400">{isArabic ? 'سيتلقى العضو رابط تفعيل بالبريد لتعيين كلمة المرور.' : "Le membre recevra un lien d'activation par email pour définir son mot de passe."}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function MembresPage() {
  return <Guard anyOf={['membre:create', 'membre:update', 'role:assign']}><MembresInner /></Guard>;
}
