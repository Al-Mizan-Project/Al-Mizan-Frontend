'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type Clarification } from '@/lib/sc/api';
import { Card, PageHeader, Spinner, EmptyState, Badge, Modal, useUI, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

function ClarificationsInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, serviceId, can } = useSCSession();
  const { toast } = useUI();

  const [items, setItems] = useState<Clarification[]>([]);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState<{ c: Clarification; text: string } | null>(null);
  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

  async function load() {
    setItems(await scApi.listClarifications(serviceId || undefined));
    setLoading(false);
  }
  useEffect(() => { if (ready) load(); }, [ready, serviceId]);

  async function reply() {
    if (!answer || answer.c.id == null) return;
    try { await scApi.repondreClarification(answer.c.id, answer.text); toast('success', isArabic ? 'تم إرسال الرد.' : 'Réponse envoyée.'); setAnswer(null); load(); }
    catch (err) {
      toast('error', errorText(err, isArabic ? 'تعذر الإرسال.' : 'Envoi indisponible.'));
      setAnswer(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title={isArabic ? 'طلبات التوضيح' : 'Demandes de clarification'} breadcrumb={isArabic ? 'المناقصات' : "Appels d'offres"} />
      {items.length === 0 ? (
        <Card><EmptyState title={isArabic ? 'لا توجد طلبات' : 'Aucune demande'} hint={isArabic ? 'تظهر هنا أسئلة المتعاملين حول المناقصات.' : 'Les questions des opérateurs sur vos AO apparaissent ici.'} /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 mb-1">AO #{c.id_appel_offres} · {c.auteur || (isArabic ? 'متعامل' : 'Opérateur')}</p>
                  <p className="text-sm font-medium" style={{ color: '#1C4532' }}>{c.question}</p>
                  {c.reponse && <p className="text-xs text-gray-500 mt-2 pl-3 border-l-2 border-[#D6EAD4]">↳ {c.reponse}</p>}
                </div>
                {c.reponse ? <Badge tone="success">{isArabic ? 'تمت الإجابة' : 'Répondu'}</Badge>
                  : can('question:repondre') ? <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => setAnswer({ c, text: '' })}>{isArabic ? 'الرد' : 'Répondre'}</button>
                  : <Badge tone="warning">{isArabic ? 'بانتظار الرد' : 'En attente'}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!answer} title={isArabic ? 'الرد على الطلب' : 'Répondre à la demande'} onClose={() => setAnswer(null)} wide
        footer={<><button className={GHOST_BTN} onClick={() => setAnswer(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button><button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={reply} disabled={!answer?.text.trim()}>{isArabic ? 'إرسال' : 'Envoyer'}</button></>}>
        {answer && (
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: '#1C4532' }}>{answer.c.question}</p>
            <textarea rows={4} value={answer.text} onChange={(e) => setAnswer({ ...answer, text: e.target.value })} placeholder={isArabic ? 'اكتب ردك…' : 'Saisissez votre réponse…'} className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none" />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function ClarificationsPage() {
  return <Guard anyOf={['question:read']}><ClarificationsInner /></Guard>;
}
