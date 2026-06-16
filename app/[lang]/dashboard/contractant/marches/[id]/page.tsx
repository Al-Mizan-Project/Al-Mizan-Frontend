'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type AppelOffre, type Attribution, type Clarification, type RegistreEntry, type SoumissionLite } from '@/lib/sc/api';
import { deriveState, actionsForState, STATE_META, aoTypeLabel, type AOAction } from '@/lib/sc/ao-states';
import { Card, PageHeader, Spinner, Badge, EmptyState, Modal, useUI, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

type Tab = 'infos' | 'documents' | 'soumissions' | 'attribution' | 'clarifications' | 'recours';

function DetailInner() {
  const { lang, id } = useParams() as { lang: string; id: string };
  const isArabic = lang === 'ar';
  const router = useRouter();
  const { can } = useSCSession();
  const { toast, confirm } = useUI();
  const base = `/${lang}/dashboard/contractant`;

  const [ao, setAo] = useState<AppelOffre | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('infos');
  const [docs, setDocs] = useState<{ id_document: number; nom?: string }[]>([]);
  const [soumissions, setSoumissions] = useState<SoumissionLite[]>([]);
  const [registre, setRegistre] = useState<RegistreEntry[]>([]);
  const [attribution, setAttribution] = useState<Attribution | null>(null);
  const [clarifs, setClarifs] = useState<Clarification[]>([]);
  const [recours, setRecours] = useState<{ id: number | string; statut?: string; motif?: string }[]>([]);
  const [reason, setReason] = useState<{ open: boolean; action: AOAction['id'] | null; text: string }>({ open: false, action: null, text: '' });

  const load = useCallback(async () => {
    const a = await scApi.getAppel(id);
    setAo(a);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!ao) return;
    if (tab === 'documents') scApi.listAppelDocuments(id).then(setDocs);
    if (tab === 'soumissions') {
      scApi.listSoumissionsForAppel(id).then(setSoumissions);
      if (ao.commission_id) scApi.listRegistre(ao.commission_id).then(setRegistre);
    }
    if (tab === 'attribution' && ao.commission_id) {
      scApi.listAttributionsProvisoires(Number(ao.commission_id)).then((items) => {
        setAttribution(items.find((item) => String(item.appel_id) === String(id)) || null);
      });
    }
    if (tab === 'clarifications') scApi.listClarifications().then((all) => setClarifs(all.filter((c) => String(c.id_appel_offres) === String(id))));
    if (tab === 'recours') scApi.listRecours(id).then(setRecours);
  }, [tab, ao, id]);

  if (loading) return <Spinner />;
  if (!ao) return <Card><EmptyState title={isArabic ? 'المناقصة غير موجودة' : 'Appel d\'offres introuvable'} /></Card>;

  const state = deriveState(ao);
  const actions = actionsForState(state, can);

  async function run(a: AOAction) {
    if (a.id === 'continuer' || a.id === 'modifier') { router.push(`${base}/marches/${id}/modifier`); return; }
    if (a.id === 'consulter_recours') { setTab('recours'); return; }
    if (a.id === 'attribuer') { setTab('attribution'); return; }
    if (a.id === 'annuler') { setReason({ open: true, action: 'annuler', text: '' }); return; }

    const ok = await confirm({
      title: isArabic ? 'تأكيد' : 'Confirmation',
      message: `${isArabic ? a.ar : a.fr} ?`,
      danger: a.tone === 'danger',
    });
    if (!ok) return;
    try {
      if (a.id === 'supprimer') { await scApi.deleteDraft(id); toast('success', isArabic ? 'تم الحذف.' : 'Brouillon supprimé.'); router.push(`${base}/marches`); return; }
      if (a.id === 'soumettre') await scApi.submitForValidation(id);
      if (a.id === 'publier') await scApi.publishAppel(id);
      if (a.id === 'cloturer_depot') await scApi.clotureDepot(id);
      if (a.id === 'ouvrir_plis') await scApi.ouvrirPlis(id);
      toast('success', isArabic ? 'تم تنفيذ الإجراء.' : 'Action effectuée.');
      load();
    } catch {
      toast('error', isArabic ? 'تعذر تنفيذ الإجراء على الخادم.' : "Action indisponible côté serveur.");
    }
  }

  async function submitReason() {
    try {
      if (reason.action === 'annuler') { await scApi.annulerAppel(id, reason.text); toast('success', isArabic ? 'تم الإلغاء.' : 'Appel annulé.'); }
      setReason({ open: false, action: null, text: '' });
      load();
    } catch {
      toast('error', isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.');
      setReason({ open: false, action: null, text: '' });
    }
  }

  async function validerAttribution() {
    if (!attribution?.id) return;
    const ok = await confirm({ title: isArabic ? 'البت في الإسناد' : "Statuer sur l'attribution", message: isArabic ? 'قبول الإسناد المؤقت؟' : "Accepter l'attribution provisoire ?" });
    if (!ok) return;
    try { await scApi.validerAttribution(attribution.id); toast('success', isArabic ? 'تم.' : 'Décision enregistrée.'); load(); }
    catch { toast('error', isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.'); }
  }

  async function validerReception(s: SoumissionLite) {
    const currentAo = ao;
    if (!currentAo?.commission_id) {
      toast('warning', isArabic ? 'لا توجد لجنة مرتبطة بهذه المناقصة.' : "Aucune commission n'est liée à cet appel.");
      return;
    }
    const now = new Date();
    const submittedAt = s.date_soumission || now.toISOString();
    const deadline = currentAo.date_limite_soumission ? new Date(currentAo.date_limite_soumission) : null;
    try {
      await scApi.validerReception(currentAo.commission_id, {
        id_soumission: s.id_soumission,
        numero_ordre: registre.length + 1,
        nom_oe: `OE #${s.id_soumissionnaire || s.id_soumission}`,
        received_at: now.toISOString(),
        submitted_at: submittedAt,
        hors_delai: !!deadline && now > deadline,
      });
      toast('success', isArabic ? 'تم تسجيل الاستلام.' : 'Réception enregistrée.');
      setRegistre(await scApi.listRegistre(currentAo.commission_id));
    } catch {
      toast('error', isArabic ? 'تعذر تسجيل الاستلام.' : 'Enregistrement de réception indisponible.');
    }
  }

  const tabs: { key: Tab; fr: string; ar: string }[] = [
    { key: 'infos', fr: 'Informations', ar: 'المعلومات' },
    { key: 'documents', fr: 'Documents', ar: 'الوثائق' },
    { key: 'soumissions', fr: 'Soumissions', ar: 'العروض' },
    { key: 'attribution', fr: 'Attribution', ar: 'الإسناد' },
    { key: 'clarifications', fr: 'Clarifications', ar: 'التوضيحات' },
    { key: 'recours', fr: 'Recours', ar: 'الطعون' },
  ];

  const infoRow = (k: string, v?: string | null) => (
    <div className="flex justify-between py-2.5 border-b border-gray-50"><span className="text-xs text-gray-400">{k}</span><span className="text-sm font-medium text-right" style={{ color: '#1C4532' }}>{v || '—'}</span></div>
  );

  return (
    <div>
      <Link href={`${base}/marches`} className="text-sm text-gray-400 hover:text-[#1C4532]">← {isArabic ? 'العودة' : 'Retour aux appels'}</Link>
      <PageHeader
        title={ao.titre || ao.reference || `#${id}`}
        breadcrumb={ao.reference}
        action={<Badge tone={STATE_META[state].tone}>{isArabic ? STATE_META[state].ar : STATE_META[state].fr}</Badge>}
      />

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {actions.map((a) => (
            <button key={a.id} onClick={() => run(a)} className={a.tone === 'primary' ? PRIMARY_BTN : GHOST_BTN} style={a.tone === 'primary' ? PRIMARY_BTN_STYLE : a.tone === 'danger' ? { color: '#dc2626' } : {}}>
              {isArabic ? a.ar : a.fr}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b border-gray-100 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${tab === t.key ? 'border-[#1C4532] text-[#1C4532]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {isArabic ? t.ar : t.fr}
          </button>
        ))}
      </div>

      <Card className="p-5">
        {tab === 'infos' && (
          <div>
            {infoRow(isArabic ? 'المرجع' : 'Référence', ao.reference)}
            {infoRow(isArabic ? 'النوع' : 'Type', aoTypeLabel(ao.type_procedure, lang))}
            {infoRow(isArabic ? 'المبلغ التقديري' : 'Montant estimé', ao.montant_estime ? `${Number(ao.montant_estime).toLocaleString('fr-DZ')} DA` : '—')}
            {infoRow(isArabic ? 'تاريخ النشر' : 'Publication', ao.date_publication)}
            {infoRow(isArabic ? 'آخر أجل للإيداع' : 'Limite de dépôt', ao.date_limite_soumission)}
            {infoRow(isArabic ? 'فتح الأظرفة' : 'Ouverture des plis', ao.date_ouverture_plis)}
            {ao.description && <p className="mt-4 text-sm text-gray-600 leading-relaxed">{ao.description}</p>}
          </div>
        )}

        {tab === 'documents' && (
          docs.length === 0 ? <EmptyState title={isArabic ? 'لا توجد وثائق' : 'Aucun document'} /> : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id_document} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F4F7F4]">
                  <span className="text-sm font-medium" style={{ color: '#1C4532' }}>📄 {d.nom || `Document #${d.id_document}`}</span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'soumissions' && (
          soumissions.length === 0 ? <EmptyState title={isArabic ? 'لا توجد عروض' : 'Aucune soumission'} hint={isArabic ? 'ستظهر العروض المودعة هنا.' : 'Les soumissions déposées apparaîtront ici.'} /> : (
            <div className="space-y-3">
              {soumissions.map((s) => {
                const entry = registre.find((r) => r.id_soumission === s.id_soumission);
                return (
                  <div key={s.id_soumission} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#F4F7F4]">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1C4532' }}>Soumission #{s.id_soumission}</p>
                      <p className="text-xs text-gray-400">{isArabic ? 'المتعامل' : 'OE'} #{s.id_soumissionnaire || '—'} · {s.date_soumission || '—'}</p>
                    </div>
                    {entry ? (
                      <Badge tone={entry.hors_delai ? 'warning' : 'success'}>{isArabic ? `استلام #${entry.numero_ordre}` : `Réception #${entry.numero_ordre}`}</Badge>
                    ) : (
                      <button className={GHOST_BTN} onClick={() => validerReception(s)}>{isArabic ? 'تسجيل الاستلام' : 'Valider la réception'}</button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'attribution' && (
          attribution && state === 'ATTRIBUTION_PROVISOIRE' && can('marche:attribuer') ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">{isArabic ? 'البت في رأي لجنة التقييم (إسناد مؤقت).' : "Statuez sur l'avis de la commission d'évaluation (attribution provisoire)."}</p>
              <p className="text-xs text-gray-400 mb-4">Attribution #{attribution.id} · Soumission #{attribution.soumission_id}</p>
              <div className="flex flex-wrap gap-2">
                <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={validerAttribution}>{isArabic ? 'قبول' : 'Accepter'}</button>
              </div>
            </div>
          ) : <EmptyState title={isArabic ? 'لا يوجد إسناد للبت فيه' : 'Aucune attribution à traiter'} hint={isArabic ? 'يظهر هنا الإسناد المؤقت بعد التقييم.' : "L'attribution provisoire apparaît ici après l'évaluation."} />
        )}

        {tab === 'clarifications' && (
          clarifs.length === 0 ? <EmptyState title={isArabic ? 'لا توجد طلبات توضيح' : 'Aucune demande de clarification'} /> : (
            <div className="space-y-3">
              {clarifs.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-[#F4F7F4]">
                  <p className="text-sm font-medium" style={{ color: '#1C4532' }}>{c.question}</p>
                  {c.reponse && <p className="text-xs text-gray-500 mt-2">↳ {c.reponse}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'recours' && (
          recours.length === 0 ? <EmptyState title={isArabic ? 'لا توجد طعون' : 'Aucun recours'} /> : (
            <div className="space-y-2">
              {recours.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F4F7F4]">
                  <span className="text-sm" style={{ color: '#1C4532' }}>{r.motif || `Recours #${r.id}`}</span>
                  <Badge tone="warning">{r.statut || '—'}</Badge>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      <Modal
        open={reason.open}
        title={reason.action === 'annuler' ? (isArabic ? 'سبب الإلغاء' : "Motif d'annulation") : (isArabic ? 'سبب الرفض' : 'Motif de rejet')}
        onClose={() => setReason({ open: false, action: null, text: '' })}
        footer={
          <>
            <button className={GHOST_BTN} onClick={() => setReason({ open: false, action: null, text: '' })}>{isArabic ? 'إلغاء' : 'Annuler'}</button>
            <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={submitReason} disabled={!reason.text.trim()}>{isArabic ? 'تأكيد' : 'Confirmer'}</button>
          </>
        }
      >
        <textarea rows={4} value={reason.text} onChange={(e) => setReason((r) => ({ ...r, text: e.target.value }))} placeholder={isArabic ? 'اكتب التبرير…' : 'Saisissez la justification…'} className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none" />
      </Modal>
    </div>
  );
}

export default function AODetailPage() {
  return (
    <Guard anyOf={['marche:read', 'marche:valider_intern', 'cdc:read']}>
      <DetailInner />
    </Guard>
  );
}
