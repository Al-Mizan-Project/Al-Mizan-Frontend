'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type AppelOffre, type Membre } from '@/lib/sc/api';
import { aoTypeLabel } from '@/lib/sc/ao-states';
import { Card, PageHeader, Spinner, EmptyState, Modal, useUI, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

function ValidationsInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, orgId, membreId, can } = useSCSession();
  const { toast, confirm } = useUI();

  const [queue, setQueue] = useState<AppelOffre[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [reject, setReject] = useState<{ ao: AppelOffre; text: string } | null>(null);
  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

  const canDecide = can('marche:valider_intern') || can('cdc:valider_intern');
  const canAssign = can('dossier:assigner');

  async function load() {
    const [q, m] = await Promise.all([scApi.listValidationQueue(), orgId ? scApi.listMembres(orgId) : Promise.resolve([])]);
    setQueue(q); setMembres(m); setLoading(false);
  }
  useEffect(() => { if (ready) load(); }, [ready, orgId]);

  async function assign(ao: AppelOffre, membreId: string) {
    if (!membreId) return;
    try { await scApi.assignValidator(ao.id_appel_offres, membreId); toast('success', isArabic ? 'تم الإسناد.' : 'Validateur affecté.'); load(); }
    catch (err) { toast('error', errorText(err, isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.')); }
  }
  async function valider(ao: AppelOffre) {
    const ok = await confirm({ title: isArabic ? 'المصادقة' : 'Valider', message: ao.titre || ao.reference || '' });
    if (!ok) return;
    try { await scApi.validerMarche(ao.id_appel_offres, '', membreId); toast('success', isArabic ? 'تمت المصادقة.' : 'Validé.'); load(); }
    catch (err) { toast('error', errorText(err, isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.')); }
  }
  async function rejeter() {
    if (!reject) return;
    try { await scApi.rejeterMarche(reject.ao.id_appel_offres, reject.text, membreId); toast('success', isArabic ? 'تم الرفض.' : 'Refusé.'); setReject(null); load(); }
    catch (err) {
      toast('error', errorText(err, isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.'));
      setReject(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title={isArabic ? 'التحقق الداخلي' : 'Validation interne'} breadcrumb={isArabic ? 'لجنة التحقق الداخلية' : 'Commission interne de validation'} />
      {queue.length === 0 ? (
        <Card><EmptyState title={isArabic ? 'لا توجد ملفات للتحقق' : 'Aucun dossier à valider'} hint={isArabic ? 'تظهر هنا المناقصات غير المصادق عليها.' : "Les appels d'offres non validés apparaissent ici."} /></Card>
      ) : (
        <div className="space-y-3">
          {queue.map((ao) => {
            return (
              <Card key={ao.id_appel_offres} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold" style={{ color: '#1C4532' }}>{ao.titre || ao.reference}</p>
                  <p className="text-xs text-gray-400">{ao.reference} · {aoTypeLabel(ao.type_procedure, lang, '')}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {canAssign && (
                    <select defaultValue="" onChange={(e) => assign(ao, e.target.value)} className="px-3 py-2 rounded-xl text-xs bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none">
                      <option value="">{isArabic ? 'إسناد إلى…' : 'Affecter à…'}</option>
                      {membres.map((m) => <option key={m.id_membre} value={String(m.id_membre)}>{m.prenom} {m.nom}</option>)}
                    </select>
                  )}
                  {canDecide && <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => valider(ao)}>{isArabic ? 'مصادقة' : 'Valider'}</button>}
                  {canDecide && <button className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50" onClick={() => setReject({ ao, text: '' })}>{isArabic ? 'رفض' : 'Refuser'}</button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!reject} title={isArabic ? 'سبب الرفض' : 'Motif de refus'} onClose={() => setReject(null)}
        footer={<><button className={GHOST_BTN} onClick={() => setReject(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button><button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={rejeter} disabled={!reject?.text.trim()}>{isArabic ? 'تأكيد' : 'Confirmer'}</button></>}>
        <textarea rows={4} value={reject?.text || ''} onChange={(e) => setReject((r) => r && { ...r, text: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none" />
      </Modal>
    </div>
  );
}

export default function ValidationsPage() {
  return <Guard anyOf={['marche:valider_intern', 'cdc:valider_intern', 'dossier:read']}><ValidationsInner /></Guard>;
}
