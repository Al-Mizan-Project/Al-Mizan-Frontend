'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { useSCSession } from '@/lib/sc/session';
import {
  scApi,
  type CommissionEvaluation,
  type CommissionEvaluationMembre,
  type CommissionInterne,
  type CommissionInterneMembre,
  type CommissionInterneType,
  type Membre,
} from '@/lib/sc/api';
import { normaliseRole, type SCRole } from '@/lib/sc/permissions';
import { Badge, Card, EmptyState, GHOST_BTN, Modal, PageHeader, PRIMARY_BTN, PRIMARY_BTN_STYLE, Spinner, useUI } from '@/lib/sc/ui';

// Eligible roles per commission type.
const EVAL_ROLES: SCRole[] = ['EVALUATEUR', 'RESP_SC'];
const CT_ROLES: SCRole[] = ['MEMBRE_COMITE_TECHNIQUE'];
const VALIDATION_ROLES: SCRole[] = ['RESP_VALID_INTERN', 'VALIDATEUR_INTERNE_MARCHE', 'VALIDATEUR_INTERNE_CDC'];

type Label = 'president' | 'secretaire' | 'membre';

interface EvalForm {
  nom_comission: string;
  categorie: string;
  selectedUsers: number[];
  labels: Record<number, Label>;
  ctUsers: number[];
}
interface ValForm {
  nom_comission: string;
  type_comission: CommissionInterneType;
  selectedUsers: number[];
}

interface EvalCard extends CommissionEvaluation {
  membres: CommissionEvaluationMembre[];
  ct: { id_utilisateur: number }[];
}
interface ValCard extends CommissionInterne {
  membres: CommissionInterneMembre[];
}

function userIdOf(membre: Membre): number | null {
  return membre.compte_auth?.id_utilisateur ?? null;
}
function roleKeyOf(membre: Membre): SCRole | null {
  return normaliseRole(membre.compte_auth?.role || membre.role || membre.fonction || '');
}
function fullName(membre: Membre) {
  return [membre.prenom, membre.nom].filter(Boolean).join(' ') || membre.compte_auth?.email || String(membre.id_membre);
}

function CommissionsInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, serviceId, orgId } = useSCSession();
  const { toast, confirm } = useUI();

  const [evalCommissions, setEvalCommissions] = useState<EvalCard[]>([]);
  const [valCommissions, setValCommissions] = useState<ValCard[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);

  const [evalForm, setEvalForm] = useState<EvalForm | null>(null);
  const [valForm, setValForm] = useState<ValForm | null>(null);
  const [evalPanel, setEvalPanel] = useState<EvalCard | null>(null);
  const [valPanel, setValPanel] = useState<ValCard | null>(null);
  const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

  const evalCandidates = useMemo(
    () => membres.filter((m) => { const r = roleKeyOf(m); return userIdOf(m) && !!r && EVAL_ROLES.includes(r); }),
    [membres],
  );
  const ctCandidates = useMemo(
    () => membres.filter((m) => userIdOf(m) && roleKeyOf(m) === 'MEMBRE_COMITE_TECHNIQUE' && CT_ROLES.length > 0),
    [membres],
  );
  const validationCandidates = useMemo(
    () => membres.filter((m) => { const r = roleKeyOf(m); return !!r && VALIDATION_ROLES.includes(r); }),
    [membres],
  );

  async function load() {
    if (!serviceId) { setLoading(false); return; }
    setLoading(true);
    const [evalBase, valBase, orgMembers] = await Promise.all([
      scApi.listCommissionsEvaluation(serviceId),
      scApi.listCommissionsInternes(serviceId),
      orgId ? scApi.listMembres(orgId) : Promise.resolve([]),
    ]);
    const evalCards = await Promise.all(evalBase.map(async (c) => {
      const [linked, ct] = await Promise.all([
        scApi.listCommissionEvaluationMembres(c.id_comission),
        scApi.listCT(c.id_comission),
      ]);
      return { ...c, membres: linked, ct };
    }));
    const valFiltered = valBase.filter((c) => String(c.id_service) === String(serviceId));
    const valCards = await Promise.all(valFiltered.map(async (c) => ({
      ...c,
      membres: await scApi.listCommissionInterneMembres(c.id_comission_interne),
    })));
    setEvalCommissions(evalCards);
    setValCommissions(valCards);
    setMembres(orgMembers);
    setLoading(false);
  }

  useEffect(() => { if (ready) load(); }, [ready, serviceId, orgId]);

  // ----- Commission interne d'évaluation -----
  async function createEval() {
    if (!serviceId || !evalForm?.nom_comission.trim()) { toast('warning', isArabic ? 'اسم اللجنة مطلوب.' : 'Le nom de la commission est requis.'); return; }
    if (evalForm.selectedUsers.length < 3) { toast('warning', isArabic ? 'تتطلب اللجنة 3 أعضاء على الأقل.' : 'La commission nécessite au moins 3 membres.'); return; }
    try {
      const c = await scApi.createCommissionEvaluation({ id_service: serviceId, nom_comission: evalForm.nom_comission.trim(), categorie: evalForm.categorie.trim() || 'Marchés publics' });
      await Promise.all(evalForm.selectedUsers.map((id) => scApi.addCommissionEvaluationMembre(c.id_comission, id, evalForm.labels[id] || 'membre')));
      await Promise.all(evalForm.ctUsers.map((id) => scApi.assignCT(c.id_comission, id)));
      toast('success', isArabic ? 'تم إنشاء اللجنة.' : 'Commission créée.');
      setEvalForm(null); load();
    } catch (err) { toast('error', errorText(err, isArabic ? 'تعذر إنشاء اللجنة.' : 'Création de la commission indisponible.')); }
  }
  async function removeEval(c: EvalCard) {
    const ok = await confirm({ title: isArabic ? 'حذف لجنة التقييم' : "Supprimer la commission d'évaluation", message: c.nom_comission || `#${c.id_comission}`, danger: true });
    if (!ok) return;
    try { await scApi.deleteCommissionEvaluation(c.id_comission); toast('success', isArabic ? 'تم الحذف.' : 'Commission supprimée.'); load(); }
    catch (err) { toast('error', errorText(err, isArabic ? 'تعذر الحذف.' : 'Suppression indisponible.')); }
  }
  async function toggleEvalMember(c: EvalCard, userId: number, checked: boolean, lbl: Label = 'membre') {
    try {
      if (checked) await scApi.addCommissionEvaluationMembre(c.id_comission, userId, lbl);
      else await scApi.removeCommissionEvaluationMembre(c.id_comission, userId);
      toast('success', isArabic ? 'تم تحديث الأعضاء.' : 'Membres mis à jour.'); load();
    } catch (err) { toast('error', errorText(err, isArabic ? 'تعذر تحديث الأعضاء.' : 'Mise à jour indisponible.')); }
  }
  async function toggleCT(c: EvalCard, userId: number, checked: boolean) {
    try {
      if (checked) await scApi.assignCT(c.id_comission, userId);
      else await scApi.removeCT(c.id_comission, userId);
      toast('success', isArabic ? 'تم تحديث اللجنة التقنية.' : 'Comité technique mis à jour.'); load();
    } catch (err) { toast('error', errorText(err, isArabic ? 'تعذر التحديث.' : 'Mise à jour indisponible.')); }
  }

  // ----- Commission interne de validation -----
  async function createVal() {
    if (!serviceId || !valForm?.nom_comission.trim()) { toast('warning', isArabic ? 'اسم اللجنة مطلوب.' : 'Le nom de la commission est requis.'); return; }
    try {
      const c = await scApi.createCommissionInterne({ id_service: serviceId, nom_comission: valForm.nom_comission.trim(), type_comission: valForm.type_comission });
      await Promise.all(valForm.selectedUsers.map((userId) => scApi.addCommissionInterneMembre(c.id_comission_interne, userId)));
      toast('success', isArabic ? 'تم إنشاء اللجنة.' : 'Commission créée.');
      setValForm(null); load();
    } catch (err) { toast('error', errorText(err, isArabic ? 'تعذر إنشاء اللجنة.' : 'Création de la commission indisponible.')); }
  }
  async function removeVal(c: ValCard) {
    const ok = await confirm({ title: isArabic ? 'حذف لجنة التحقق' : 'Supprimer la commission de validation', message: c.nom_comission || `#${c.id_comission_interne}`, danger: true });
    if (!ok) return;
    try { await scApi.deleteCommissionInterne(c.id_comission_interne); toast('success', isArabic ? 'تم الحذف.' : 'Commission supprimée.'); load(); }
    catch (err) { toast('error', errorText(err, isArabic ? 'تعذر الحذف.' : 'Suppression indisponible.')); }
  }
  async function toggleValMember(c: ValCard, userId: number, checked: boolean) {
    try {
      if (checked) await scApi.addCommissionInterneMembre(c.id_comission_interne, userId);
      else await scApi.removeCommissionInterneMembre(c.id_comission_interne, userId);
      toast('success', isArabic ? 'تم تحديث الأعضاء.' : 'Membres mis à jour.'); load();
    } catch (err) { toast('error', errorText(err, isArabic ? 'تعذر تحديث الأعضاء.' : 'Mise à jour indisponible.')); }
  }

  if (loading) return <Spinner />;

  const field = 'w-full mt-1 px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none';
  const label = 'text-xs font-semibold text-gray-500';
  const typeLabel = (t?: string) => t === 'adhoc' ? (isArabic ? 'ظرفية' : 'Ad hoc') : (isArabic ? 'دائمة' : 'Permanente');

  return (
    <div className="space-y-10">
      <PageHeader title={isArabic ? 'اللجان الداخلية' : 'Commissions internes'} breadcrumb={isArabic ? 'مؤسستي' : 'Mon organisation'} />

      {/* ─── Commission interne d'évaluation ─── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold" style={{ color: '#1C4532' }}>{isArabic ? 'لجان التقييم الداخلية' : "Commissions internes d'évaluation"}</h3>
            <p className="text-sm text-gray-400">{isArabic ? 'تتولى التقييم وفتح الأظرفة وسجل الاستلام. 3 أعضاء على الأقل.' : "Évaluation, ouverture des plis et registre de réception. Au moins 3 membres."}</p>
          </div>
          <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => setEvalForm({ nom_comission: '', categorie: 'Travaux publics', selectedUsers: [], labels: {}, ctUsers: [] })}>+ {isArabic ? 'لجنة تقييم' : "Commission d'évaluation"}</button>
        </div>

        {evalCommissions.length === 0 ? (
          <Card><EmptyState title={isArabic ? 'لا توجد لجنة تقييم' : "Aucune commission d'évaluation"} hint={isArabic ? 'أنشئ لجنة تضم 3 أعضاء على الأقل.' : 'Créez une commission avec au moins 3 membres.'} /></Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {evalCommissions.map((c) => (
              <Card key={c.id_comission} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold" style={{ color: '#1C4532' }}>{c.nom_comission || `#${c.id_comission}`}</h4>
                    <p className="text-xs text-gray-400">{c.categorie || 'Marchés publics'}</p>
                  </div>
                  <Badge tone={(c.membres?.length || 0) >= 3 ? 'success' : 'warning'}>{c.membres?.length || 0} {isArabic ? 'أعضاء' : 'membres'}</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-4">{isArabic ? 'اللجنة التقنية' : 'Comité technique'} : {c.ct?.length || 0}</p>
                <div className="flex gap-2 flex-wrap">
                  <button className={GHOST_BTN} onClick={() => setEvalPanel(c)}>{isArabic ? 'الأعضاء واللجنة التقنية' : 'Membres & comité technique'}</button>
                  <button className="text-xs font-semibold text-red-500 hover:underline" onClick={() => removeEval(c)}>{isArabic ? 'حذف' : 'Supprimer'}</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ─── Commission interne de validation ─── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold" style={{ color: '#1C4532' }}>{isArabic ? 'لجان التحقق الداخلية' : 'Commissions internes de validation'}</h3>
            <p className="text-sm text-gray-400">{isArabic ? 'تتولى التحقق الداخلي من المناقصات ودفاتر الشروط.' : "Validation interne des appels d'offres et des cahiers des charges."}</p>
          </div>
          <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => setValForm({ nom_comission: '', type_comission: 'parmanante', selectedUsers: [] })}>+ {isArabic ? 'لجنة تحقق' : 'Commission de validation'}</button>
        </div>

        {valCommissions.length === 0 ? (
          <Card><EmptyState title={isArabic ? 'لا توجد لجنة تحقق' : 'Aucune commission de validation'} hint={isArabic ? 'أنشئ لجنة تحقق داخلية وأضف أعضاءها.' : 'Créez une commission de validation et ajoutez ses membres.'} /></Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {valCommissions.map((c) => (
              <Card key={c.id_comission_interne} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold" style={{ color: '#1C4532' }}>{c.nom_comission || `#${c.id_comission_interne}`}</h4>
                    <p className="text-xs text-gray-400">{typeLabel(c.type_comission)}</p>
                  </div>
                  <Badge tone="info">{c.membres?.length || 0} {isArabic ? 'أعضاء' : 'membres'}</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className={GHOST_BTN} onClick={() => setValPanel(c)}>{isArabic ? 'الأعضاء' : 'Membres'}</button>
                  <button className="text-xs font-semibold text-red-500 hover:underline" onClick={() => removeVal(c)}>{isArabic ? 'حذف' : 'Supprimer'}</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Eval create modal */}
      <Modal open={!!evalForm} title={isArabic ? 'لجنة تقييم جديدة' : "Nouvelle commission d'évaluation"} onClose={() => setEvalForm(null)} wide
        footer={<><button className={GHOST_BTN} onClick={() => setEvalForm(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button><button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={createEval}>{isArabic ? 'إنشاء' : 'Créer'}</button></>}>
        {evalForm && (
          <div className="space-y-5">
            <div><label className={label}>{isArabic ? 'الاسم' : 'Nom'} *</label><input className={field} value={evalForm.nom_comission} onChange={(e) => setEvalForm({ ...evalForm, nom_comission: e.target.value })} /></div>
            <div><label className={label}>{isArabic ? 'الصنف' : 'Catégorie'}</label><input className={field} value={evalForm.categorie} onChange={(e) => setEvalForm({ ...evalForm, categorie: e.target.value })} /></div>
            <Chooser
              title={isArabic ? 'الأعضاء (3 على الأقل)' : 'Membres (minimum 3)'}
              empty={isArabic ? 'لا يوجد أعضاء مؤهلون.' : 'Aucun membre éligible.'}
              membres={evalCandidates} isArabic={isArabic}
              selected={(m) => { const id = userIdOf(m); return !!id && evalForm.selectedUsers.includes(id); }}
              onToggle={(m, checked) => {
                const id = userIdOf(m); if (!id) return;
                setEvalForm({ ...evalForm, selectedUsers: checked ? [...evalForm.selectedUsers, id] : evalForm.selectedUsers.filter((x) => x !== id), labels: checked ? { ...evalForm.labels, [id]: evalForm.labels[id] || 'membre' } : evalForm.labels });
              }}
              extra={(m) => {
                const id = userIdOf(m);
                if (!id || !evalForm.selectedUsers.includes(id)) return null;
                return (
                  <select className="px-2 py-1 rounded-lg text-xs bg-white border border-gray-100" value={evalForm.labels[id] || 'membre'} onChange={(e) => setEvalForm({ ...evalForm, labels: { ...evalForm.labels, [id]: e.target.value as Label } })}>
                    <option value="president">{isArabic ? 'رئيس' : 'Président'}</option>
                    <option value="secretaire">{isArabic ? 'كاتب' : 'Secrétaire'}</option>
                    <option value="membre">{isArabic ? 'عضو' : 'Membre'}</option>
                  </select>
                );
              }}
            />
            <Chooser
              title={isArabic ? 'اللجنة التقنية' : 'Comité technique'}
              empty={isArabic ? 'لا يوجد أعضاء للجنة التقنية.' : 'Aucun membre du comité technique.'}
              membres={ctCandidates} isArabic={isArabic}
              selected={(m) => { const id = userIdOf(m); return !!id && evalForm.ctUsers.includes(id); }}
              onToggle={(m, checked) => { const id = userIdOf(m); if (!id) return; setEvalForm({ ...evalForm, ctUsers: checked ? [...evalForm.ctUsers, id] : evalForm.ctUsers.filter((x) => x !== id) }); }}
            />
          </div>
        )}
      </Modal>

      {/* Eval members panel */}
      <Modal open={!!evalPanel} title={isArabic ? 'الأعضاء واللجنة التقنية' : 'Membres & comité technique'} onClose={() => setEvalPanel(null)} wide>
        {evalPanel && (
          <div className="space-y-5">
            <Chooser
              title={isArabic ? 'الأعضاء' : 'Membres'}
              empty={isArabic ? 'لا يوجد أعضاء مؤهلون.' : 'Aucun membre éligible.'}
              membres={evalCandidates} isArabic={isArabic}
              selected={(m) => { const id = userIdOf(m); return !!id && evalPanel.membres.some((x) => x.id_utilisateur === id); }}
              onToggle={(m, checked) => { const id = userIdOf(m); if (id) toggleEvalMember(evalPanel, id, checked); }}
              extra={(m) => { const id = userIdOf(m); const linked = evalPanel.membres.find((x) => x.id_utilisateur === id); return linked ? <Badge tone="info">{linked.role_label || 'membre'}</Badge> : null; }}
            />
            <Chooser
              title={isArabic ? 'اللجنة التقنية' : 'Comité technique'}
              empty={isArabic ? 'لا يوجد أعضاء للجنة التقنية.' : 'Aucun membre du comité technique.'}
              membres={ctCandidates} isArabic={isArabic}
              selected={(m) => { const id = userIdOf(m); return !!id && evalPanel.ct.some((x) => x.id_utilisateur === id); }}
              onToggle={(m, checked) => { const id = userIdOf(m); if (id) toggleCT(evalPanel, id, checked); }}
            />
          </div>
        )}
      </Modal>

      {/* Validation create modal */}
      <Modal open={!!valForm} title={isArabic ? 'لجنة تحقق جديدة' : 'Nouvelle commission de validation'} onClose={() => setValForm(null)} wide
        footer={<><button className={GHOST_BTN} onClick={() => setValForm(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button><button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={createVal}>{isArabic ? 'إنشاء' : 'Créer'}</button></>}>
        {valForm && (
          <div className="space-y-5">
            <div><label className={label}>{isArabic ? 'الاسم' : 'Nom'} *</label><input className={field} value={valForm.nom_comission} onChange={(e) => setValForm({ ...valForm, nom_comission: e.target.value })} /></div>
            <div>
              <label className={label}>{isArabic ? 'النوع' : 'Type'}</label>
              <select className={field} value={valForm.type_comission} onChange={(e) => setValForm({ ...valForm, type_comission: e.target.value as CommissionInterneType })}>
                <option value="parmanante">{isArabic ? 'دائمة' : 'Permanente'}</option>
                <option value="adhoc">{isArabic ? 'ظرفية' : 'Ad hoc'}</option>
              </select>
            </div>
            <Chooser
              title={isArabic ? 'الأعضاء' : 'Membres'}
              empty={isArabic ? 'لا يوجد أعضاء مؤهلون.' : 'Aucun membre éligible.'}
              membres={validationCandidates} isArabic={isArabic}
              selected={(m) => { const id = userIdOf(m); return !!id && valForm.selectedUsers.includes(id); }}
              onToggle={(m, checked) => {
                const id = userIdOf(m); if (!id) return;
                setValForm({ ...valForm, selectedUsers: checked ? [...valForm.selectedUsers, id] : valForm.selectedUsers.filter((x) => x !== id) });
              }}
            />
          </div>
        )}
      </Modal>

      {/* Validation members panel */}
      <Modal open={!!valPanel} title={isArabic ? 'أعضاء لجنة التحقق' : 'Membres de la commission de validation'} onClose={() => setValPanel(null)} wide>
        {valPanel && (
          <Chooser
            title={isArabic ? 'الأعضاء' : 'Membres'}
            empty={isArabic ? 'لا يوجد أعضاء مؤهلون.' : 'Aucun membre éligible.'}
            membres={validationCandidates} isArabic={isArabic}
            selected={(m) => { const id = userIdOf(m); return !!id && valPanel.membres.some((x) => String(x.id_utilisateur ?? x.id_membre) === String(id)); }}
            onToggle={(m, checked) => { const id = userIdOf(m); if (id) toggleValMember(valPanel, id, checked); }}
          />
        )}
      </Modal>
    </div>
  );
}

function Chooser({ title, empty, membres, isArabic, selected, onToggle, extra }: {
  title: string; empty: string; membres: Membre[]; isArabic: boolean;
  selected: (membre: Membre) => boolean;
  onToggle: (membre: Membre, checked: boolean) => void;
  extra?: (membre: Membre) => ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-bold mb-2" style={{ color: '#1C4532' }}>{title}</p>
      {membres.length === 0 ? (
        <p className="text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {membres.map((m) => (
            <label key={m.id_membre} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F4F7F4] cursor-pointer">
              <span>
                <span className="block text-sm font-medium" style={{ color: '#1C4532' }}>{fullName(m)}</span>
                <span className="block text-xs text-gray-400">{m.compte_auth?.email || m.fonction || (isArabic ? 'بدون حساب' : 'Sans compte')}</span>
              </span>
              <span className="flex items-center gap-3">
                {extra?.(m)}
                <input type="checkbox" checked={selected(m)} onChange={(e) => onToggle(m, e.target.checked)} className="w-4 h-4 accent-[#1C4532]" />
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommissionsPage() {
  return <Guard anyOf={['role:assign']}><CommissionsInner /></Guard>;
}
