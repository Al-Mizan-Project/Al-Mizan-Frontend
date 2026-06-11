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
  type Membre,
} from '@/lib/sc/api';
import { Badge, Card, EmptyState, GHOST_BTN, Modal, PageHeader, PRIMARY_BTN, PRIMARY_BTN_STYLE, Spinner, useUI } from '@/lib/sc/ui';

type FormState =
  | { kind: 'evaluation'; nom_comission: string; categorie: string; selectedUsers: number[]; labels: Record<number, 'president' | 'secretaire' | 'membre'>; ctUsers: number[] }
  | { kind: 'interne'; nom_comission: string; type_comission: string; selectedMembers: number[] };

type MemberPanel =
  | { kind: 'evaluation'; commission: CommissionEvaluation; membres: CommissionEvaluationMembre[]; ct: { id_utilisateur: number }[] }
  | { kind: 'interne'; commission: CommissionInterne; membres: CommissionInterneMembre[] };

function memberIntId(id: string | number): number | null {
  const text = String(id);
  const last = text.includes('-') ? text.split('-').at(-1) || '' : text;
  const parsed = Number.parseInt(last, text.includes('-') ? 16 : 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function userIdOf(membre: Membre): number | null {
  return membre.compte_auth?.id_utilisateur ?? null;
}

function roleOf(membre: Membre): string {
  return membre.compte_auth?.role || membre.role || membre.fonction || '';
}

function fullName(membre: Membre) {
  return [membre.prenom, membre.nom].filter(Boolean).join(' ') || membre.compte_auth?.email || String(membre.id_membre);
}

function CommissionsInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, serviceId, orgId } = useSCSession();
  const { toast, confirm } = useUI();

  const [evaluations, setEvaluations] = useState<CommissionEvaluation[]>([]);
  const [internes, setInternes] = useState<CommissionInterne[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [panel, setPanel] = useState<MemberPanel | null>(null);

  const coPeoCandidates = useMemo(
    () => membres.filter((m) => userIdOf(m) && ['EVALUATEUR', 'RESP_SC', 'RESP_VALID_INTERN'].includes(roleOf(m))),
    [membres],
  );
  const ctCandidates = useMemo(
    () => membres.filter((m) => userIdOf(m) && roleOf(m) === 'MEMBRE_COMITE_TECHNIQUE'),
    [membres],
  );

  async function hydrateEvaluation(commission: CommissionEvaluation) {
    const [linked, ct] = await Promise.all([
      scApi.listCommissionEvaluationMembres(commission.id_comission),
      scApi.listCT(commission.id_comission),
    ]);
    return { ...commission, membres: linked, ct };
  }

  async function hydrateInterne(commission: CommissionInterne) {
    const linked = await scApi.listCommissionInterneMembres(commission.id_comission_interne);
    return { ...commission, membres: linked };
  }

  async function load() {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [evalBase, interneBase, orgMembers] = await Promise.all([
      scApi.listCommissionsEvaluation(serviceId),
      scApi.listCommissionsInternes(serviceId),
      orgId ? scApi.listMembres(orgId) : Promise.resolve([]),
    ]);
    const [evalFull, interneFull] = await Promise.all([
      Promise.all(evalBase.map(hydrateEvaluation)),
      Promise.all(interneBase.map(hydrateInterne)),
    ]);
    setEvaluations(evalFull);
    setInternes(interneFull);
    setMembres(orgMembers);
    setLoading(false);
  }

  useEffect(() => { if (ready) load(); }, [ready, serviceId, orgId]);

  function openEvaluationForm() {
    setForm({
      kind: 'evaluation',
      nom_comission: '',
      categorie: 'Travaux publics',
      selectedUsers: [],
      labels: {},
      ctUsers: [],
    });
  }

  function openInterneForm() {
    setForm({
      kind: 'interne',
      nom_comission: '',
      type_comission: 'permanente',
      selectedMembers: [],
    });
  }

  async function create() {
    if (!serviceId || !form?.nom_comission.trim()) {
      toast('warning', isArabic ? 'اسم اللجنة مطلوب.' : 'Le nom de la commission est requis.');
      return;
    }
    try {
      if (form.kind === 'evaluation') {
        if (form.selectedUsers.length < 3) {
          toast('warning', isArabic ? 'لجنة COPEO تتطلب 3 أعضاء على الأقل.' : 'Une commission COPEO nécessite au moins 3 membres.');
          return;
        }
        const commission = await scApi.createCommissionEvaluation({
          id_service: serviceId,
          nom_comission: form.nom_comission.trim(),
          categorie: form.categorie.trim() || 'Marchés publics',
        });
        await Promise.all(form.selectedUsers.map((id) => scApi.addCommissionEvaluationMembre(commission.id_comission, id, form.labels[id] || 'membre')));
        await Promise.all(form.ctUsers.map((id) => scApi.assignCT(commission.id_comission, id)));
      } else {
        const commission = await scApi.createCommissionInterne({
          id_service: serviceId,
          nom_comission: form.nom_comission.trim(),
          type_comission: form.type_comission,
        });
        await Promise.all(form.selectedMembers.map((id) => scApi.addCommissionInterneMembre(commission.id_comission_interne, id)));
      }
      toast('success', isArabic ? 'تم إنشاء اللجنة.' : 'Commission créée.');
      setForm(null);
      load();
    } catch {
      toast('error', isArabic ? 'تعذر إنشاء اللجنة.' : 'Création de la commission indisponible.');
    }
  }

  async function removeEvaluation(commission: CommissionEvaluation) {
    const ok = await confirm({
      title: isArabic ? 'حذف لجنة COPEO' : 'Supprimer la commission COPEO',
      message: commission.nom_comission || `COPEO #${commission.id_comission}`,
      danger: true,
    });
    if (!ok) return;
    try {
      await scApi.deleteCommissionEvaluation(commission.id_comission);
      toast('success', isArabic ? 'تم الحذف.' : 'Commission supprimée.');
      load();
    } catch {
      toast('error', isArabic ? 'تعذر الحذف.' : 'Suppression indisponible.');
    }
  }

  async function removeInterne(commission: CommissionInterne) {
    const ok = await confirm({
      title: isArabic ? 'حذف اللجنة الداخلية' : 'Supprimer la commission interne',
      message: commission.nom_comission || '',
      danger: true,
    });
    if (!ok) return;
    try {
      await scApi.deleteCommissionInterne(commission.id_comission_interne);
      toast('success', isArabic ? 'تم الحذف.' : 'Commission supprimée.');
      load();
    } catch {
      toast('error', isArabic ? 'تعذر الحذف.' : 'Suppression indisponible.');
    }
  }

  async function toggleEvaluationMember(commission: CommissionEvaluation, utilisateurId: number, checked: boolean, label: 'president' | 'secretaire' | 'membre' = 'membre') {
    try {
      if (checked) await scApi.addCommissionEvaluationMembre(commission.id_comission, utilisateurId, label);
      else await scApi.removeCommissionEvaluationMembre(commission.id_comission, utilisateurId);
      toast('success', isArabic ? 'تم تحديث الأعضاء.' : 'Membres mis à jour.');
      load();
    } catch {
      toast('error', isArabic ? 'تعذر تحديث الأعضاء.' : 'Mise à jour indisponible.');
    }
  }

  async function toggleCT(commission: CommissionEvaluation, utilisateurId: number, checked: boolean) {
    try {
      if (checked) await scApi.assignCT(commission.id_comission, utilisateurId);
      else await scApi.removeCT(commission.id_comission, utilisateurId);
      toast('success', isArabic ? 'تم تحديث اللجنة التقنية.' : 'Comité technique mis à jour.');
      load();
    } catch {
      toast('error', isArabic ? 'تعذر تحديث اللجنة التقنية.' : 'Mise à jour CT indisponible.');
    }
  }

  async function toggleInterneMember(commission: CommissionInterne, membreId: number, checked: boolean) {
    try {
      if (checked) await scApi.addCommissionInterneMembre(commission.id_comission_interne, membreId);
      else await scApi.removeCommissionInterneMembre(commission.id_comission_interne, membreId);
      toast('success', isArabic ? 'تم تحديث الأعضاء.' : 'Membres mis à jour.');
      load();
    } catch {
      toast('error', isArabic ? 'تعذر تحديث الأعضاء.' : 'Mise à jour indisponible.');
    }
  }

  if (loading) return <Spinner />;

  const field = 'w-full mt-1 px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none';
  const label = 'text-xs font-semibold text-gray-500';

  return (
    <div>
      <PageHeader
        title={isArabic ? 'اللجان' : 'Commissions'}
        breadcrumb={isArabic ? 'مؤسستي' : 'Mon organisation'}
        action={(
          <div className="flex gap-2 flex-wrap">
            <button className={GHOST_BTN} onClick={openInterneForm}>+ {isArabic ? 'لجنة تحقق' : 'Commission interne'}</button>
            <button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={openEvaluationForm}>+ {isArabic ? 'لجنة COPEO' : 'Commission COPEO'}</button>
          </div>
        )}
      />

      <section className="mb-8">
        <h3 className="text-lg font-bold mb-3" style={{ color: '#1C4532' }}>{isArabic ? 'لجان COPEO للتقييم' : 'Commissions COPEO d’évaluation'}</h3>
        {evaluations.length === 0 ? (
          <Card><EmptyState title={isArabic ? 'لا توجد لجنة COPEO' : 'Aucune commission COPEO'} hint={isArabic ? 'أنشئ لجنة تضم 3 أعضاء على الأقل ثم اربطها بالمناقصة.' : 'Créez une commission avec au moins 3 membres, puis liez-la à l’appel d’offres.'} /></Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {evaluations.map((c) => (
              <Card key={c.id_comission} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold" style={{ color: '#1C4532' }}>{c.nom_comission || `COPEO #${c.id_comission}`}</h4>
                    <p className="text-xs text-gray-400">{c.categorie || 'Marchés publics'}</p>
                  </div>
                  <Badge tone={(c.membres?.length || 0) >= 3 ? 'success' : 'warning'}>{c.membres?.length || 0} {isArabic ? 'أعضاء' : 'membres'}</Badge>
                </div>
                <p className="text-xs text-gray-400 mb-4">{isArabic ? 'اللجنة المستخدمة في سجل الاستلام وفتح الأظرفة والتقييم.' : 'Utilisée par le registre de réception, l’ouverture des plis et l’évaluation.'}</p>
                <div className="flex gap-2 flex-wrap">
                  <button className={GHOST_BTN} onClick={() => setPanel({ kind: 'evaluation', commission: c, membres: c.membres || [], ct: (c as any).ct || [] })}>{isArabic ? 'الأعضاء و CT' : 'Membres & CT'}</button>
                  <button className="text-xs font-semibold text-red-500 hover:underline" onClick={() => removeEvaluation(c)}>{isArabic ? 'حذف' : 'Supprimer'}</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-lg font-bold mb-3" style={{ color: '#1C4532' }}>{isArabic ? 'لجان التحقق الداخلية' : 'Commissions internes de validation'}</h3>
        {internes.length === 0 ? (
          <Card><EmptyState title={isArabic ? 'لا توجد لجان تحقق' : 'Aucune commission interne'} hint={isArabic ? 'اختيارية حسب طريقة عمل الخدمة المتعاقدة.' : 'Optionnel selon l’organisation interne du service contractant.'} /></Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {internes.map((c) => (
              <Card key={c.id_comission_interne} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold" style={{ color: '#1C4532' }}>{c.nom_comission}</h4>
                    <p className="text-xs text-gray-400">{c.type_comission || 'permanente'}</p>
                  </div>
                  <Badge tone="info">{c.membres?.length || 0} {isArabic ? 'أعضاء' : 'membres'}</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className={GHOST_BTN} onClick={() => setPanel({ kind: 'interne', commission: c, membres: c.membres || [] })}>{isArabic ? 'الأعضاء' : 'Gérer les membres'}</button>
                  <button className="text-xs font-semibold text-red-500 hover:underline" onClick={() => removeInterne(c)}>{isArabic ? 'حذف' : 'Supprimer'}</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={!!form}
        title={form?.kind === 'evaluation' ? (isArabic ? 'لجنة COPEO جديدة' : 'Nouvelle commission COPEO') : (isArabic ? 'لجنة داخلية جديدة' : 'Nouvelle commission interne')}
        onClose={() => setForm(null)}
        wide
        footer={<><button className={GHOST_BTN} onClick={() => setForm(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button><button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={create}>{isArabic ? 'إنشاء' : 'Créer'}</button></>}
      >
        {form && (
          <div className="space-y-5">
            <div>
              <label className={label}>{isArabic ? 'الاسم' : 'Nom'} *</label>
              <input className={field} value={form.nom_comission} onChange={(e) => setForm({ ...form, nom_comission: e.target.value } as FormState)} />
            </div>
            {form.kind === 'evaluation' ? (
              <>
                <div>
                  <label className={label}>{isArabic ? 'الصنف' : 'Catégorie'}</label>
                  <input className={field} value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
                </div>
                <Chooser
                  title={isArabic ? 'أعضاء COPEO (3 على الأقل)' : 'Membres COPEO (minimum 3)'}
                  empty={isArabic ? 'لا يوجد أعضاء مؤهلون.' : 'Aucun membre éligible.'}
                  membres={coPeoCandidates}
                  isArabic={isArabic}
                  selected={(m) => !!userIdOf(m) && form.selectedUsers.includes(userIdOf(m) as number)}
                  onToggle={(m, checked) => {
                    const id = userIdOf(m);
                    if (!id) return;
                    setForm({
                      ...form,
                      selectedUsers: checked ? [...form.selectedUsers, id] : form.selectedUsers.filter((x) => x !== id),
                      labels: checked ? { ...form.labels, [id]: form.labels[id] || 'membre' } : form.labels,
                    });
                  }}
                  extra={(m) => {
                    const id = userIdOf(m);
                    if (!id || !form.selectedUsers.includes(id)) return null;
                    return (
                      <select
                        className="px-2 py-1 rounded-lg text-xs bg-white border border-gray-100"
                        value={form.labels[id] || 'membre'}
                        onChange={(e) => setForm({ ...form, labels: { ...form.labels, [id]: e.target.value as 'president' | 'secretaire' | 'membre' } })}
                      >
                        <option value="president">{isArabic ? 'رئيس' : 'Président'}</option>
                        <option value="secretaire">{isArabic ? 'كاتب' : 'Secrétaire'}</option>
                        <option value="membre">{isArabic ? 'عضو' : 'Membre'}</option>
                      </select>
                    );
                  }}
                />
                <Chooser
                  title={isArabic ? 'تعيين اللجنة التقنية CT' : 'Assigner le Comité Technique'}
                  empty={isArabic ? 'لا يوجد أعضاء CT.' : 'Aucun membre CT.'}
                  membres={ctCandidates}
                  isArabic={isArabic}
                  selected={(m) => !!userIdOf(m) && form.ctUsers.includes(userIdOf(m) as number)}
                  onToggle={(m, checked) => {
                    const id = userIdOf(m);
                    if (!id) return;
                    setForm({ ...form, ctUsers: checked ? [...form.ctUsers, id] : form.ctUsers.filter((x) => x !== id) });
                  }}
                />
              </>
            ) : (
              <>
                <div>
                  <label className={label}>{isArabic ? 'النوع' : 'Type'}</label>
                  <select className={field} value={form.type_comission} onChange={(e) => setForm({ ...form, type_comission: e.target.value })}>
                    <option value="permanente">{isArabic ? 'دائمة' : 'Permanente'}</option>
                    <option value="adhoc">{isArabic ? 'خاصة' : 'Ad hoc'}</option>
                  </select>
                </div>
                <Chooser
                  title={isArabic ? 'الأعضاء' : 'Membres'}
                  empty={isArabic ? 'لا يوجد أعضاء.' : 'Aucun membre.'}
                  membres={membres}
                  isArabic={isArabic}
                  selected={(m) => {
                    const id = memberIntId(m.id_membre);
                    return !!id && form.selectedMembers.includes(id);
                  }}
                  onToggle={(m, checked) => {
                    const id = memberIntId(m.id_membre);
                    if (!id) return;
                    setForm({ ...form, selectedMembers: checked ? [...form.selectedMembers, id] : form.selectedMembers.filter((x) => x !== id) });
                  }}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!panel} title={panel?.kind === 'evaluation' ? (isArabic ? 'أعضاء COPEO و CT' : 'Membres COPEO & CT') : (isArabic ? 'أعضاء اللجنة' : 'Membres de la commission')} onClose={() => setPanel(null)} wide>
        {panel?.kind === 'evaluation' && (
          <div className="space-y-5">
            <Chooser
              title={isArabic ? 'أعضاء COPEO' : 'Membres COPEO'}
              empty={isArabic ? 'لا يوجد أعضاء مؤهلون.' : 'Aucun membre éligible.'}
              membres={coPeoCandidates}
              isArabic={isArabic}
              selected={(m) => !!userIdOf(m) && panel.membres.some((x) => x.id_utilisateur === userIdOf(m))}
              onToggle={(m, checked) => { const id = userIdOf(m); if (id) toggleEvaluationMember(panel.commission, id, checked); }}
              extra={(m) => {
                const id = userIdOf(m);
                const linked = panel.membres.find((x) => x.id_utilisateur === id);
                return linked ? <Badge tone="info">{linked.role_label || 'membre'}</Badge> : null;
              }}
            />
            <Chooser
              title={isArabic ? 'اللجنة التقنية CT' : 'Comité Technique'}
              empty={isArabic ? 'لا يوجد أعضاء CT.' : 'Aucun membre CT.'}
              membres={ctCandidates}
              isArabic={isArabic}
              selected={(m) => !!userIdOf(m) && panel.ct.some((x) => x.id_utilisateur === userIdOf(m))}
              onToggle={(m, checked) => { const id = userIdOf(m); if (id) toggleCT(panel.commission, id, checked); }}
            />
          </div>
        )}
        {panel?.kind === 'interne' && (
          <Chooser
            title={isArabic ? 'الأعضاء' : 'Membres'}
            empty={isArabic ? 'لا يوجد أعضاء.' : 'Aucun membre.'}
            membres={membres}
            isArabic={isArabic}
            selected={(m) => {
              const id = memberIntId(m.id_membre);
              return !!id && panel.membres.some((x) => x.id_membre === id);
            }}
            onToggle={(m, checked) => {
              const id = memberIntId(m.id_membre);
              if (id) toggleInterneMember(panel.commission, id, checked);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function Chooser({
  title,
  empty,
  membres,
  isArabic,
  selected,
  onToggle,
  extra,
}: {
  title: string;
  empty: string;
  membres: Membre[];
  isArabic: boolean;
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
          {membres.map((m) => {
            const checked = selected(m);
            return (
              <label key={m.id_membre} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#F4F7F4] cursor-pointer">
                <span>
                  <span className="block text-sm font-medium" style={{ color: '#1C4532' }}>{fullName(m)}</span>
                  <span className="block text-xs text-gray-400">{m.compte_auth?.email || roleOf(m) || (isArabic ? 'بدون حساب' : 'Sans compte')}</span>
                </span>
                <span className="flex items-center gap-3">
                  {extra?.(m)}
                  <input type="checkbox" checked={checked} onChange={(e) => onToggle(m, e.target.checked)} className="w-4 h-4 accent-[#1C4532]" />
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CommissionsPage() {
  return <Guard anyOf={['membre_civ:manage', 'role:assign', 'marche:create']}><CommissionsInner /></Guard>;
}
