'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import { scApi, type AppelOffre, type Attribution, type RecoursLite, type RegistreEntry, type SoumissionLite } from '@/lib/sc/api';
import { deriveState, actionsForState, STATE_META, aoTypeLabel, type AOAction } from '@/lib/sc/ao-states';
import { Card, PageHeader, Spinner, Badge, EmptyState, Modal, useUI, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

type Tab = 'infos' | 'documents' | 'soumissions' | 'attribution' | 'recours';
type DocKind = 'cdc' | 'justification' | 'besoin' | 'annexe';
interface AppelDoc { id_document: number; nom?: string; kind: DocKind; storage_url?: string; }
const DOC_KIND_META: Record<DocKind, { fr: string; ar: string }> = {
  cdc: { fr: 'CDC', ar: 'دفتر الشروط' },
  justification: { fr: 'Justification', ar: 'تبرير' },
  besoin: { fr: 'Besoin', ar: 'الحاجة' },
  annexe: { fr: 'Annexe', ar: 'مرفق' },
};

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
  const [docs, setDocs] = useState<AppelDoc[]>([]);
  const [preview, setPreview] = useState<{ url?: string; nom: string; fallback?: string } | null>(null);
  const [soumissions, setSoumissions] = useState<SoumissionLite[]>([]);
  const [registre, setRegistre] = useState<RegistreEntry[]>([]);
  const [attribution, setAttribution] = useState<Attribution | null>(null);
  const [recours, setRecours] = useState<RecoursLite[]>([]);
  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

  const load = useCallback(async () => {
    const a = await scApi.getAppel(id);
    setAo(a);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!ao) return;
    if (tab === 'documents') {
      (async () => {
        const refs: { id: number; kind: DocKind }[] = [];
        if (ao.id_doc_cdc) refs.push({ id: ao.id_doc_cdc, kind: 'cdc' });
        if (ao.id_doc_justification) refs.push({ id: ao.id_doc_justification, kind: 'justification' });
        if (ao.id_doc_besoin) refs.push({ id: ao.id_doc_besoin, kind: 'besoin' });
        const links = await scApi.listAppelDocuments(id);
        const seen = new Set(refs.map((r) => r.id));
        for (const link of links) if (!seen.has(link.id_document)) refs.push({ id: link.id_document, kind: 'annexe' });
        const metas = await Promise.all(refs.map(async (r) => {
          const meta = await scApi.getDocumentMeta(r.id);
          return { id_document: r.id, nom: meta?.nom, kind: r.kind, storage_url: meta?.storage_url };
        }));
        setDocs(metas);
      })();
    }
    if (tab === 'soumissions') {
      scApi.listSoumissionsForAppel(id).then(setSoumissions);
      if (ao.commission_id) scApi.listRegistre(ao.commission_id).then(setRegistre);
    }
    if (tab === 'attribution' && ao.commission_id) {
      scApi.listAttributionsProvisoires(Number(ao.commission_id)).then((items) => {
        setAttribution(items.find((item) => String(item.appel_id) === String(id)) || null);
      });
    }
    if (tab === 'recours') scApi.listRecoursForAppel(id).then(setRecours);
  }, [tab, ao, id]);

  if (loading) return <Spinner />;
  if (!ao) return <Card><EmptyState title={isArabic ? 'المناقصة غير موجودة' : 'Appel d\'offres introuvable'} /></Card>;

  const state = deriveState(ao);
  const actions = actionsForState(state, can);

  async function run(a: AOAction) {
    if (a.id === 'continuer' || a.id === 'modifier') { router.push(`${base}/marches/${id}/modifier`); return; }
    if (a.id === 'consulter_recours') { setTab('recours'); return; }
    if (a.id === 'attribuer') { setTab('attribution'); return; }
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
    } catch (err) {
      toast('error', errorText(err, isArabic ? 'تعذر تنفيذ الإجراء على الخادم.' : "Action indisponible côté serveur."));
    }
  }

  async function validerAttribution() {
    if (!attribution?.id) return;
    const ok = await confirm({ title: isArabic ? 'البت في الإسناد' : "Statuer sur l'attribution", message: isArabic ? 'قبول الإسناد المؤقت؟' : "Accepter l'attribution provisoire ?" });
    if (!ok) return;
    try { await scApi.validerAttribution(attribution.id); toast('success', isArabic ? 'تم.' : 'Décision enregistrée.'); load(); }
    catch (err) { toast('error', errorText(err, isArabic ? 'تعذر التنفيذ.' : 'Action indisponible.')); }
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
    } catch (err) { toast('error', errorText(err, isArabic ? 'تعذر تسجيل الاستلام.' : 'Enregistrement de réception indisponible.')); }
  }

  async function openPreview(d: AppelDoc) {
    const fallback = isArabic
      ? 'ملف الوثيقة غير متاح للعرض المباشر. تم عرض معلومات الوثيقة المتوفرة.'
      : 'Le fichier de ce document n’est pas disponible en aperçu direct. Les informations disponibles sont affichées.';
    try {
      const url = await scApi.documentBlobUrl(d.id_document);
      setPreview({ url, nom: d.nom || `Document #${d.id_document}` });
    } catch (err) {
      if (err instanceof Error && /^HTTP (404|406)$/.test(err.message)) {
        setPreview({ nom: d.nom || `Document #${d.id_document}`, fallback });
        return;
      }
      toast('error', errorText(err, isArabic ? 'تعذر عرض الوثيقة.' : "Aperçu du document indisponible."));
    }
  }
  function closePreview() {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  const tabs: { key: Tab; fr: string; ar: string }[] = [
    { key: 'infos', fr: 'Informations', ar: 'المعلومات' },
    { key: 'documents', fr: 'Documents', ar: 'الوثائق' },
    { key: 'soumissions', fr: 'Soumissions', ar: 'العروض' },
    { key: 'attribution', fr: 'Attribution', ar: 'الإسناد' },
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
            {infoRow(isArabic ? 'الولاية' : 'Wilaya', ao.wilaya)}
            {infoRow(isArabic ? 'القطاع' : 'Secteur', ao.secteur)}
            {infoRow(isArabic ? 'الموقع' : 'Localisation', ao.localisation)}
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
                <div key={`${d.kind}-${d.id_document}`} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F4F7F4]">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[#97A675]">📄</span>
                    <span className="text-sm font-medium truncate" style={{ color: '#1C4532' }}>{d.nom || `Document #${d.id_document}`}</span>
                    <Badge tone="info">{isArabic ? DOC_KIND_META[d.kind].ar : DOC_KIND_META[d.kind].fr}</Badge>
                  </span>
                  <button className={GHOST_BTN} onClick={() => openPreview(d)}>{isArabic ? 'معاينة' : 'Aperçu'}</button>
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

        {tab === 'recours' && (
          recours.length === 0 ? <EmptyState title={isArabic ? 'لا توجد طعون' : 'Aucun recours'} /> : (
            <div className="space-y-2">
              {recours.map((r, idx) => {
                const recoursId = r.id ?? r.id_recours ?? idx;
                return (
                  <div key={`${recoursId}-${r.date_depot || r.created_at || 'row'}-${idx}`} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F4F7F4]">
                    <span className="text-sm" style={{ color: '#1C4532' }}>{r.motif || `Recours #${recoursId}`}</span>
                    <Badge tone="warning">{r.statut || '—'}</Badge>
                  </div>
                );
              })}
            </div>
          )
        )}
      </Card>

      <Modal open={!!preview} title={preview?.nom || ''} onClose={closePreview} wide>
        {preview?.url && (
          <iframe src={preview.url} title={preview.nom} className="w-full rounded-xl border border-gray-100" style={{ height: '70vh' }} />
        )}
        {preview?.fallback && (
          <div className="rounded-xl bg-[#F4F7F4] p-5 text-sm text-gray-600">
            <p className="font-semibold mb-2" style={{ color: '#1C4532' }}>{preview.nom}</p>
            <p>{preview.fallback}</p>
          </div>
        )}
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
