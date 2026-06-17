'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { scApi, type CommissionEvaluation, type OperateurRegistre } from '@/lib/sc/api';
import { useSCSession } from '@/lib/sc/session';
import { AO_TYPE_META, aoTypeLabel, montantFitsType, typesForMontant, TYPES_SANS_PLANNING, TYPES_SANS_VALIDATION, type AOType } from '@/lib/sc/ao-states';
import { Card, PageHeader, Spinner, EmptyState, useUI, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

interface DocItem { id_document?: number; nom: string; kind: 'cdc' | 'justification' | 'besoin' | 'annexe'; uploading?: boolean }
interface Details {
  reference: string; titre: string; description: string; montant_estime: string;
  type_procedure: AOType | '';
  date_publication: string; date_limite_soumission: string; date_ouverture_plis: string;
  poids_technique: string; poids_financier: string;
}

const EMPTY: Details = {
  reference: '', titre: '', description: '', montant_estime: '', type_procedure: '',
  date_publication: '', date_limite_soumission: '', date_ouverture_plis: '',
  poids_technique: '', poids_financier: '',
};

function stepsFor(type: AOType | ''): { key: string; fr: string; ar: string }[] {
  const docs = { key: 'docs', fr: 'Documents', ar: 'الوثائق' };
  const details = { key: 'details', fr: 'Détails & type', ar: 'التفاصيل والنوع' };
  const review = { key: 'review', fr: 'Révision', ar: 'المراجعة' };
  const oe = { key: 'oe', fr: 'Sélection des opérateurs', ar: 'اختيار المتعاملين' };
  if (type === 'restreint' || type === 'gre_a_gre' || type === 'consultation') return [docs, details, oe, review];
  return [docs, details, review];
}

export default function AOWizard({ appelId }: { appelId?: string }) {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const router = useRouter();
  const { toast } = useUI();
  const { serviceId } = useSCSession();
  const base = `/${lang}/dashboard/contractant`;

  const [draftId, setDraftId] = useState<string | number | undefined>(appelId);
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [commissions, setCommissions] = useState<CommissionEvaluation[]>([]);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>('');
  const [selectedOEs, setSelectedOEs] = useState<(string | number)[]>([]);
  const [operateurs, setOperateurs] = useState<OperateurRegistre[]>([]);
  const [oeSearch, setOeSearch] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(!!appelId);
  const [saving, setSaving] = useState(false);
  const [showMontantTypeError, setShowMontantTypeError] = useState(false);
  const cdcInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  const type = details.type_procedure;
  const steps = useMemo(() => stepsFor(type), [type]);
  const noPlanning = type && TYPES_SANS_PLANNING.includes(type);

  const hasMontantTypeMismatch = () => {
    const montant = Number(details.montant_estime);
    return !!details.type_procedure && Number.isFinite(montant) && montant > 0 && !montantFitsType(details.type_procedure as AOType, montant);
  };

  useEffect(() => {
    setShowMontantTypeError(false);
  }, [details.montant_estime, details.type_procedure]);

  // Load an existing draft (edit mode)
  useEffect(() => {
    if (!appelId) return;
    (async () => {
      const a = await scApi.getAppel(appelId);
      if (a) {
        setDetails({
          reference: a.reference || '', titre: a.titre || '', description: a.description || '',
          montant_estime: a.montant_estime != null ? String(a.montant_estime) : '',
          type_procedure: (a.type_procedure as AOType) || '',
          date_publication: a.date_publication || '', date_limite_soumission: a.date_limite_soumission || '',
          date_ouverture_plis: a.date_ouverture_plis || '',
          poids_technique: a.poids_technique != null ? String(a.poids_technique) : '',
          poids_financier: a.poids_financier != null ? String(a.poids_financier) : '',
        });
        setSelectedCommissionId(a.commission_id ? String(a.commission_id) : '');
        if (Array.isArray(a.operateurs_invites)) {
          setSelectedOEs(a.operateurs_invites.map((item) => item.id_operateur_economique));
        } else if (a.id_operateur_choisi) {
          setSelectedOEs([a.id_operateur_choisi]);
        }
      }
      setLoadingExisting(false);
    })();
  }, [appelId]);

  useEffect(() => {
    if (!serviceId) return;
    scApi.listCommissionsEvaluation(serviceId).then(setCommissions);
  }, [serviceId]);

  // Load operators when the OE step is relevant
  useEffect(() => {
    if (type === 'restreint' || type === 'gre_a_gre' || type === 'consultation') {
      scApi.listOperateurs({ search: oeSearch }).then(setOperateurs);
    }
  }, [type, oeSearch]);

  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

  async function uploadOne(file: File, kind: DocItem['kind'], name: string) {
    setDocs((d) => [...d, { nom: name, kind, uploading: true }]);
    try {
      const relatedType = kind === 'cdc' ? 'appel_offre_cdc' : kind === 'besoin' ? 'appel_offre_besoin' : kind === 'justification' ? 'appel_offre_justification' : 'appel_offre_doc';
      const res = await scApi.uploadDocument(file, relatedType);
      setDocs((d) => d.map((x) => (x.nom === name && x.uploading ? { ...x, id_document: res.id_document, uploading: false } : x)));
    } catch (err) {
      setDocs((d) => d.map((x) => (x.nom === name && x.uploading ? { ...x, uploading: false } : x)));
      toast('error', errorText(err, isArabic ? 'تعذر رفع الوثيقة على الخادم.' : 'Téléversement serveur indisponible.'));
    }
  }

  const hasCDC = docs.some((d) => d.kind === 'cdc' && d.id_document && !d.uploading);
  const hasJustification = docs.some((d) => d.kind === 'justification' && d.id_document && !d.uploading);
  const hasBesoin = docs.some((d) => d.kind === 'besoin' && d.id_document && !d.uploading);
  const hasUploading = docs.some((d) => d.uploading);

  function validateStep(stepKey: string): string | null {
    if (stepKey === 'docs' && !hasCDC) return isArabic ? 'دفتر الشروط (CDC) إلزامي.' : 'Le Cahier des Charges (CDC) est obligatoire.';
    if (stepKey === 'details') {
      if (!details.reference || !details.titre || !details.montant_estime || !details.type_procedure)
        return isArabic ? 'يرجى ملء الحقول الإلزامية.' : 'Veuillez remplir les champs obligatoires.';
      const montant = Number(details.montant_estime);
      if (Number.isFinite(montant) && montant > 0 && !montantFitsType(details.type_procedure as AOType, montant))
        return isArabic ? 'المبلغ غير مناسب لهذا النوع.' : 'Montant incompatible.';
      if (!noPlanning) {
        if (!details.date_publication || !details.date_limite_soumission || !details.date_ouverture_plis)
          return isArabic ? 'التواريخ إلزامية لهذا النوع.' : 'Les dates sont obligatoires pour ce type.';
        const pt = Number(details.poids_technique), pf = Number(details.poids_financier);
        if (pt + pf !== 100) return isArabic ? 'مجموع الأوزان يجب أن يساوي 100.' : 'La somme des poids doit être égale à 100.';
      }
      if (!TYPES_SANS_VALIDATION.includes(details.type_procedure as AOType) && !selectedCommissionId)
        return isArabic ? 'يرجى اختيار لجنة COPEO.' : 'Veuillez choisir une commission COPEO.';
    }
    if (stepKey === 'oe') {
      if (type === 'restreint' && selectedOEs.length < 3) return isArabic ? 'يجب اختيار 3 متعاملين على الأقل.' : 'Sélectionnez au moins 3 opérateurs.';
      if (type === 'gre_a_gre' && selectedOEs.length !== 1) return isArabic ? 'اختر متعاملا واحدا فقط.' : 'Sélectionnez exactement un opérateur.';
      if (type === 'consultation' && selectedOEs.length < 1) return isArabic ? 'اختر متعاملا واحدا على الأقل.' : 'Sélectionnez au moins un opérateur.';
      if ((type === 'restreint' || type === 'gre_a_gre') && !hasJustification)
        return isArabic ? 'وثيقة تبرير الاختيار إلزامية.' : 'Le document de justification est obligatoire.';
      if (type === 'consultation' && !hasBesoin)
        return isArabic ? 'وثيقة التعبير عن الحاجة إلزامية.' : 'Le document du besoin est obligatoire.';
    }
    if (hasUploading) return isArabic ? 'انتظر انتهاء رفع الوثائق.' : 'Attendez la fin du téléversement des documents.';
    return null;
  }

  async function next() {
    const currentKey = steps[step].key;
    const err = validateStep(currentKey);
    if (err) {
      if (currentKey === 'details' && hasMontantTypeMismatch()) setShowMontantTypeError(true);
      toast('warning', err);
      return;
    }
    setShowMontantTypeError(false);
    if (currentKey === 'details' && draftId) await persist();
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function buildPayload() {
    const cdc = docs.find((d) => d.kind === 'cdc' && d.id_document);
    const justification = docs.find((d) => d.kind === 'justification' && d.id_document);
    const besoin = docs.find((d) => d.kind === 'besoin' && d.id_document);
    const inviteIds = selectedOEs.map(Number).filter((id) => Number.isFinite(id) && id > 0);
    return {
      id_service_contractant: serviceId ? Number(serviceId) : undefined,
      reference: details.reference,
      titre: details.titre,
      description: details.description,
      montant_estime: details.montant_estime ? Number(details.montant_estime) : undefined,
      type_procedure: details.type_procedure || undefined,
      commission_id: selectedCommissionId || undefined,
      date_publication: noPlanning ? null : details.date_publication || null,
      date_limite_soumission: noPlanning ? null : details.date_limite_soumission || null,
      date_ouverture_plis: noPlanning ? null : details.date_ouverture_plis || null,
      poids_technique: noPlanning ? null : Number(details.poids_technique) || null,
      poids_financier: noPlanning ? null : Number(details.poids_financier) || null,
      id_doc_cdc: cdc?.id_document,
      id_doc_justification: justification?.id_document,
      id_doc_besoin: besoin?.id_document,
      operateurs_invites: type === 'restreint' || type === 'consultation' ? inviteIds : undefined,
      id_operateur_choisi: type === 'gre_a_gre' ? inviteIds[0] : undefined,
    };
  }

  async function persist() {
    if (!draftId) return;
    setSaving(true);
    try {
      await scApi.updateAppel(draftId, buildPayload());
    } catch (err) {
      toast('error', errorText(err, isArabic ? 'تعذر حفظ التعديلات.' : 'Enregistrement serveur indisponible.'));
    } finally {
      setSaving(false);
    }
  }

  async function submitFinal() {
    const err = validateStep(steps[step].key);
    if (err) { toast('warning', err); return; }
    setSaving(true);
    let saved;
    try {
      saved = draftId
        ? await scApi.updateAppel(draftId, buildPayload())
        : await scApi.createAppel(buildPayload());
    } catch (err) {
      toast('error', errorText(err, isArabic ? 'تعذر حفظ المناقصة على الخادم. تحقق من الوثائق واللجنة والمتعاملين.' : "Impossible d'enregistrer l'appel d'offres. Vérifiez les documents, la commission et les opérateurs."));
      setSaving(false);
      return;
    }

    try {
      const id = saved.id_appel_offres;
      setDraftId(id);
      const extraDocIds = docs
        .filter((d) => d.kind === 'annexe' && d.id_document)
        .map((d) => d.id_document as number);
      try {
        await Promise.all(extraDocIds.map((docId) => scApi.attachDocument(id, docId)));
      } catch (err) {
        throw new Error(errorText(err, isArabic ? 'تعذر ربط الوثائق.' : "Impossible d'associer les documents."));
      }
      if (type && !TYPES_SANS_VALIDATION.includes(type)) {
        try {
          await scApi.submitForValidation(id);
        } catch (err) {
          throw new Error(errorText(err, isArabic ? 'تعذر إرسال المناقصة للمصادقة.' : "Impossible d'envoyer l'appel d'offres en validation."));
        }
      }
      toast('success', isArabic ? 'تم إرسال المناقصة بنجاح.' : "Appel d'offres soumis avec succès.");
      router.push(`${base}/marches/${id}`);
    } catch (err) {
      toast('error', errorText(err, isArabic ? 'تم حفظ المناقصة لكن تعذرت خطوة الإنهاء.' : "L'appel d'offres est enregistré, mais une étape de finalisation a échoué."));
      setSaving(false);
    }
  }

  if (loadingExisting) return <Spinner />;

  const current = steps[step].key;

  return (
    <div>
      <PageHeader
        title={appelId ? (isArabic ? 'تعديل مناقصة' : "Modifier l'appel d'offres") : (isArabic ? 'مناقصة جديدة' : "Nouvel appel d'offres")}
        breadcrumb={isArabic ? 'إنشاء خطوة بخطوة' : 'Création pas à pas'}
      />

      {/* Progress dots */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                idx < step ? 'text-white' : idx === step ? 'text-white ring-4 ring-[#D6EAD4]' : 'bg-gray-100 text-gray-400'
              }`} style={idx <= step ? { background: 'linear-gradient(135deg,#1C4532,#00738C)' } : {}}>
                {idx < step ? '✓' : idx + 1}
              </div>
              <span className={`mt-1.5 text-xs font-medium hidden sm:block ${idx === step ? 'text-[#1C4532]' : 'text-gray-400'}`}>{isArabic ? s.ar : s.fr}</span>
            </div>
            {idx < steps.length - 1 && <div className={`w-10 sm:w-16 h-0.5 mx-1 ${idx < step ? 'bg-[#1C4532]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <Card className="p-6 max-w-3xl mx-auto">
        {current === 'docs' && (
          <DocumentsStep
            isArabic={isArabic} docs={docs} setDocs={setDocs} hasCDC={hasCDC}
            onPickCDC={() => cdcInput.current?.click()} onPickDoc={() => docInput.current?.click()}
            cdcRef={cdcInput} docRef={docInput} uploadOne={uploadOne} toast={toast}
          />
        )}

        {current === 'details' && (
          <DetailsStep
            isArabic={isArabic}
            details={details}
            setDetails={setDetails}
            noPlanning={!!noPlanning}
            commissions={commissions}
            selectedCommissionId={selectedCommissionId}
            setSelectedCommissionId={setSelectedCommissionId}
            showMontantTypeError={showMontantTypeError}
          />
        )}

        {current === 'oe' && (
          <OEStep
            isArabic={isArabic} type={type as AOType} operateurs={operateurs} selected={selectedOEs}
            setSelected={setSelectedOEs} search={oeSearch} setSearch={setOeSearch} docRef={docInput} uploadOne={uploadOne}
            docs={docs}
          />
        )}

        {current === 'review' && <ReviewStep isArabic={isArabic} details={details} docs={docs} selectedOEs={selectedOEs} commissions={commissions} selectedCommissionId={selectedCommissionId} />}

        <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
          <button className={GHOST_BTN} onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            {isArabic ? 'السابق' : 'Précédent'}
          </button>
          {step < steps.length - 1 ? (
            <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={next} disabled={saving}>
              {isArabic ? 'التالي' : 'Suivant'}
            </button>
          ) : (
            <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={submitFinal} disabled={saving}>
              {saving ? (isArabic ? 'جارٍ الإرسال…' : 'Envoi…') : (isArabic ? 'إرسال' : 'Soumettre')}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---- Step 1: Documents ----
function DocumentsStep({ isArabic, docs, setDocs, hasCDC, cdcRef, docRef, uploadOne, toast }: any) {
  const [pendingName, setPendingName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ color: '#1C4532' }}>{isArabic ? 'الوثائق' : 'Documents'}</h3>
      <p className="text-sm text-gray-400 mb-5">{isArabic ? 'ابدأ بدفتر الشروط (CDC) الإلزامي ثم أضف وثائق إضافية.' : 'Commencez par le Cahier des Charges (CDC), obligatoire, puis ajoutez des documents complémentaires.'}</p>

      {/* CDC block — emphasized */}
      <div className={`rounded-2xl border-2 border-dashed p-5 mb-5 ${hasCDC ? 'border-[#1C4532] bg-[#F4F7F4]' : 'border-[#97A675]'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold" style={{ color: '#1C4532' }}>{isArabic ? 'دفتر الشروط (CDC)' : 'Cahier des Charges (CDC)'} <span className="text-red-500">*</span></p>
            <p className="text-xs text-gray-400 mt-0.5">{isArabic ? 'الوثيقة الأساسية للمناقصة.' : "Document fondateur de l'appel d'offres."}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#D6EAD4] text-[#1C4532] cursor-not-allowed opacity-70" title={isArabic ? 'قريبا' : 'Bientôt disponible'} disabled>
              ✨ {isArabic ? 'مساعدة الذكاء الاصطناعي' : 'Aide IA (CDC)'}
            </button>
            <button type="button" onClick={() => cdcRef.current?.click()} className="px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#1C4532,#00738C)' }}>
              {hasCDC ? (isArabic ? 'استبدال' : 'Remplacer') : (isArabic ? 'رفع CDC' : 'Téléverser le CDC')}
            </button>
          </div>
        </div>
        <input ref={cdcRef} type="file" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          setDocs((d: DocItem[]) => d.filter((x) => x.kind !== 'cdc'));
          uploadOne(f, 'cdc', f.name);
          e.target.value = '';
        }} />
      </div>

      {/* Additional documents */}
      <div className="space-y-2 mb-4">
        {docs.filter((d: DocItem) => d.kind !== 'cdc').map((d: DocItem, idx: number) => (
          <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F4F7F4]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[#97A675]">📄</span>
              <span className="text-sm font-medium truncate" style={{ color: '#1C4532' }}>{d.nom}{d.uploading ? '…' : ''}</span>
            </div>
            <button onClick={() => setDocs((arr: DocItem[]) => arr.filter((x) => x !== d))} className="text-gray-400 hover:text-red-500 text-sm">{isArabic ? 'حذف' : 'Retirer'}</button>
          </div>
        ))}
        {docs.filter((d: DocItem) => d.kind === 'cdc').map((d: DocItem, idx: number) => (
          <div key={`cdc${idx}`} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#D6EAD4]">
            <span className="text-sm font-semibold truncate" style={{ color: '#1C4532' }}>CDC — {d.nom}{d.uploading ? '…' : ''}</span>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500">{isArabic ? 'اسم الوثيقة الإضافية' : 'Nom du document complémentaire'}</label>
          <input value={pendingName} onChange={(e) => setPendingName(e.target.value)} placeholder={isArabic ? 'مثال: الشروط التقنية' : 'Ex : Spécifications techniques'} className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none" />
        </div>
        <button type="button" onClick={() => docRef.current?.click()} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F4F7F4] text-[#1C4532] hover:bg-[#D6EAD4]">{isArabic ? 'اختيار ملف' : 'Choisir un fichier'}</button>
        <input ref={docRef} type="file" className="hidden" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const name = pendingName.trim() || f.name;
          uploadOne(f, 'annexe', name);
          setPendingName(''); e.target.value = '';
        }} />
      </div>
    </div>
  );
}

// ---- Step 2: Details & type ----
function DetailsStep({
  isArabic,
  details,
  setDetails,
  noPlanning,
  commissions,
  selectedCommissionId,
  setSelectedCommissionId,
  showMontantTypeError,
}: any) {
  const set = (k: keyof Details, v: string) => setDetails((d: Details) => ({ ...d, [k]: v }));
  const field = 'w-full mt-1 px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none';
  const lbl = 'text-xs font-semibold text-gray-500';

  const montant = details.montant_estime ? Number(details.montant_estime) : null;
  const hasMontant = montant != null && Number.isFinite(montant) && montant > 0;
  const selectedType = details.type_procedure as AOType | '';
  const available = typesForMontant(hasMontant ? montant : null);
  const typeOptions = selectedType && !available.includes(selectedType) ? [...available, selectedType] : available;
  const montantInvalid = showMontantTypeError && !!selectedType && hasMontant && !montantFitsType(selectedType, montant as number);

  useEffect(() => {
    if (!hasMontant || selectedType) return;
    if (available.length === 1) set('type_procedure', available[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montant]);

  return (
    <div>
      <h3 className="text-lg font-bold mb-5" style={{ color: '#1C4532' }}>{isArabic ? 'التفاصيل والنوع' : 'Détails & type'}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className={lbl}>{isArabic ? 'المرجع' : 'Référence'} *</label><input className={field} value={details.reference} onChange={(e) => set('reference', e.target.value)} /></div>
        <div>
          <label className={lbl}>{isArabic ? 'المبلغ التقديري (DA)' : 'Montant estimé (DA)'} *</label>
          <input type="number" value={details.montant_estime} onChange={(e) => set('montant_estime', e.target.value)}
            className={`w-full mt-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none ${montantInvalid ? 'bg-red-50 border-red-400 text-red-600 focus:border-red-500' : 'bg-[#F4F7F4] border-transparent focus:border-[#97A675]'}`} />
          {montantInvalid && selectedType && (
            <p className="text-xs text-red-500 mt-1">
              {isArabic ? 'المبلغ غير مناسب لهذا النوع.' : 'Montant incompatible.'}
            </p>
          )}
        </div>
        <div className="sm:col-span-2"><label className={lbl}>{isArabic ? 'العنوان' : 'Titre'} *</label><input className={field} value={details.titre} onChange={(e) => set('titre', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={lbl}>{isArabic ? 'الوصف' : 'Description'}</label><textarea rows={3} className={field} value={details.description} onChange={(e) => set('description', e.target.value)} /></div>
        <div className="sm:col-span-2">
          <label className={lbl}>{isArabic ? 'نوع الإجراء' : 'Type de procédure'} *</label>
          <select className={field} value={details.type_procedure} onChange={(e) => set('type_procedure', e.target.value)} disabled={!hasMontant}>
            <option value="">{hasMontant ? (isArabic ? '— اختر —' : '— Choisir —') : (isArabic ? 'المبلغ أولا' : "Montant d'abord")}</option>
            {typeOptions.map((t) => <option key={t} value={t}>{isArabic ? AO_TYPE_META[t].ar : AO_TYPE_META[t].fr}</option>)}
          </select>
        </div>
      </div>

      {details.type_procedure && !TYPES_SANS_VALIDATION.includes(details.type_procedure as AOType) && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <label className={lbl}>{isArabic ? 'لجنة COPEO' : 'Commission COPEO'} *</label>
          <select className={field} value={selectedCommissionId} onChange={(e) => setSelectedCommissionId(e.target.value)}>
            <option value="">{isArabic ? '— اختر اللجنة —' : '— Choisir la commission —'}</option>
            {commissions.map((c: CommissionEvaluation) => (
              <option key={c.id_comission} value={c.id_comission}>
                {c.nom_comission || `COPEO #${c.id_comission}`} {c.categorie ? `— ${c.categorie}` : ''}
              </option>
            ))}
          </select>
          {commissions.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              {isArabic ? 'أنشئ لجنة COPEO في صفحة اللجان قبل إرسال المناقصة.' : 'Créez une commission COPEO dans la page Commissions avant de soumettre.'}
            </p>
          )}
        </div>
      )}

      {!noPlanning && details.type_procedure && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-sm font-semibold mb-3" style={{ color: '#1C4532' }}>{isArabic ? 'الآجال والأوزان' : 'Calendrier & pondérations'}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className={lbl}>{isArabic ? 'تاريخ النشر' : 'Publication'} *</label><input type="date" className={field} value={details.date_publication} onChange={(e) => set('date_publication', e.target.value)} /></div>
            <div><label className={lbl}>{isArabic ? 'آخر أجل للإيداع' : 'Limite de dépôt'} *</label><input type="date" className={field} value={details.date_limite_soumission} onChange={(e) => set('date_limite_soumission', e.target.value)} /></div>
            <div><label className={lbl}>{isArabic ? 'فتح الأظرفة' : 'Ouverture des plis'} *</label><input type="date" className={field} value={details.date_ouverture_plis} onChange={(e) => set('date_ouverture_plis', e.target.value)} /></div>
            <div><label className={lbl}>{isArabic ? 'الوزن التقني (%)' : 'Poids technique (%)'}</label><input type="number" className={field} value={details.poids_technique} onChange={(e) => set('poids_technique', e.target.value)} /></div>
            <div><label className={lbl}>{isArabic ? 'الوزن المالي (%)' : 'Poids financier (%)'}</label><input type="number" className={field} value={details.poids_financier} onChange={(e) => set('poids_financier', e.target.value)} /></div>
            <div className="flex items-end"><span className="text-xs text-gray-400">{isArabic ? 'المجموع يجب أن يساوي 100.' : 'La somme doit faire 100.'}</span></div>
          </div>
        </div>
      )}
      {noPlanning && details.type_procedure && (
        <p className="mt-4 text-xs text-gray-400">{isArabic ? 'لا تنطبق الآجال والأوزان على هذا النوع.' : 'Les dates et pondérations ne s\'appliquent pas à ce type.'}</p>
      )}
    </div>
  );
}

// ---- Step 3: OE selection ----
function OEStep({ isArabic, type, operateurs, selected, setSelected, search, setSearch, docRef, uploadOne, docs }: any) {
  const single = type === 'gre_a_gre';
  const toggle = (id: string | number) => {
    if (single) { setSelected([id]); return; }
    setSelected((cur: (string | number)[]) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };
  const justifType = type === 'consultation' ? 'appel_offre_besoin' : 'appel_offre_justification';
  const justifLabel = type === 'consultation'
    ? (isArabic ? 'وثيقة التعبير عن الحاجة' : 'Document du besoin')
    : (isArabic ? 'وثيقة تبرير الاختيار' : 'Document de justification du choix');
  const hint = type === 'restreint' ? (isArabic ? '٣ متعاملين على الأقل.' : 'Au moins 3 opérateurs.')
    : single ? (isArabic ? 'متعامل واحد فقط.' : 'Un seul opérateur.')
    : (isArabic ? 'متعامل واحد على الأقل.' : 'Au moins un opérateur.');

  return (
    <div>
      <h3 className="text-lg font-bold mb-1" style={{ color: '#1C4532' }}>{isArabic ? 'اختيار المتعاملين' : 'Sélection des opérateurs'}</h3>
      <p className="text-sm text-gray-400 mb-4">{hint} · {selected.length} {isArabic ? 'محدد' : 'sélectionné(s)'}</p>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isArabic ? 'بحث في السجل…' : 'Rechercher dans le registre…'} className="w-full mb-3 px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none" />

      {operateurs.length === 0 ? (
        <EmptyState title={isArabic ? 'لا توجد نتائج' : 'Aucun opérateur trouvé'} hint={isArabic ? 'سيُحمّل سجل المتعاملين من الخادم.' : 'Le registre des opérateurs proviendra du backend.'} />
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto mb-5">
          {operateurs.map((o: OperateurRegistre) => {
            const operatorId = o.id_operateur_economique || Number(o.id_organisation);
            const selectable = Number.isFinite(operatorId) && operatorId > 0;
            const on = selected.includes(operatorId);
            return (
              <button key={o.id_organisation} type="button" disabled={!selectable} onClick={() => toggle(operatorId)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left border disabled:opacity-50 disabled:cursor-not-allowed ${on ? 'border-[#1C4532] bg-[#F4F7F4]' : 'border-gray-100 hover:bg-[#F4F7F4]'}`}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1C4532' }}>{o.nom_officiel || `#${o.id_organisation}`}</p>
                  <p className="text-xs text-gray-400">{[o.secteur, o.wilaya].filter(Boolean).join(' · ')}</p>
                </div>
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs ${on ? '' : 'bg-gray-200'}`} style={on ? { background: '#1C4532' } : {}}>{on ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-[#97A675] p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold" style={{ color: '#1C4532' }}>{justifLabel}</p>
          {docs.some((d: DocItem) => d.kind === (type === 'consultation' ? 'besoin' : 'justification') && d.id_document) && <span className="text-xs text-emerald-600">{isArabic ? 'تم الرفع' : 'Ajouté'}</span>}
        </div>
        <button type="button" onClick={() => docRef.current?.click()} className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F4F7F4] text-[#1C4532] hover:bg-[#D6EAD4]">{isArabic ? 'رفع' : 'Téléverser'}</button>
        <input ref={docRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadOne(f, type === 'consultation' ? 'besoin' : 'justification', justifLabel); e.target.value = ''; }} />
      </div>
    </div>
  );
}

// ---- Step 4: Review ----
function ReviewStep({ isArabic, details, docs, selectedOEs, commissions, selectedCommissionId }: any) {
  const row = (k: string, v: string) => (
    <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-xs text-gray-400">{k}</span><span className="text-sm font-medium" style={{ color: '#1C4532' }}>{v || '—'}</span></div>
  );
  const t = aoTypeLabel(details.type_procedure, isArabic ? 'ar' : 'fr');
  const commission = commissions.find((c: CommissionEvaluation) => String(c.id_comission) === String(selectedCommissionId));
  return (
    <div>
      <h3 className="text-lg font-bold mb-5" style={{ color: '#1C4532' }}>{isArabic ? 'مراجعة وإرسال' : 'Révision & soumission'}</h3>
      {row(isArabic ? 'المرجع' : 'Référence', details.reference)}
      {row(isArabic ? 'العنوان' : 'Titre', details.titre)}
      {row(isArabic ? 'النوع' : 'Type', t)}
      {row(isArabic ? 'المبلغ' : 'Montant', details.montant_estime ? `${Number(details.montant_estime).toLocaleString('fr-DZ')} DA` : '')}
      {commission && row(isArabic ? 'اللجنة' : 'Commission', commission.nom_comission || `COPEO #${commission.id_comission}`)}
      {row(isArabic ? 'الوثائق' : 'Documents', `${docs.length}`)}
      {selectedOEs.length > 0 && row(isArabic ? 'المتعاملون المحددون' : 'Opérateurs sélectionnés', `${selectedOEs.length}`)}
      <p className="text-xs text-gray-400 mt-4">
        {details.type_procedure && TYPES_SANS_VALIDATION.includes(details.type_procedure as AOType)
          ? (isArabic ? 'هذا النوع لا يتطلب تحققا من اللجنة.' : 'Ce type ne nécessite pas de validation par une commission.')
          : (isArabic ? 'سيتم توجيه المناقصة تلقائيا إلى اللجنة المختصة حسب العتبة.' : "L'appel sera orienté automatiquement vers la commission compétente selon le seuil.")}
      </p>
    </div>
  );
}
