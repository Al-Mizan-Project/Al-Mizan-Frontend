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
  type Membre,
} from '@/lib/sc/api';
import { normaliseRole, type SCRole } from '@/lib/sc/permissions';
import { Badge, Card, EmptyState, GHOST_BTN, Modal, PageHeader, PRIMARY_BTN, PRIMARY_BTN_STYLE, Spinner, useUI } from '@/lib/sc/ui';

// Eligible roles for COPEO membership — all designed Service Contractant roles.
// The COPEO commission handles both evaluation AND internal validation.
const COPEO_ROLES: SCRole[] = ['EVALUATEUR', 'RESP_SC', 'RESP_VALID_INTERN', 'VALIDATEUR_INTERNE_MARCHE', 'VALIDATEUR_INTERNE_CDC'];

type Label = 'president' | 'secretaire' | 'membre';

interface FormState {
  nom_comission: string;
  categorie: string;
  selectedUsers: number[];
  labels: Record<number, Label>;
  ctUsers: number[];
}

interface MemberPanel {
  commission: CommissionEvaluation;
  membres: CommissionEvaluationMembre[];
  ct: { id_utilisateur: number }[];
}

function userIdOf(membre: Membre): number | null {
  return membre.compte_auth?.id_utilisateur ?? null;
}

function roleOf(membre: Membre): string {
  return membre.compte_auth?.role || membre.role || membre.fonction || '';
}

function roleKeyOf(membre: Membre): SCRole | null {
  return normaliseRole(roleOf(membre));
}

function fullName(membre: Membre) {
  return [membre.prenom, membre.nom].filter(Boolean).join(' ') || membre.compte_auth?.email || String(membre.id_membre);
}

function CommissionsInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const { ready, serviceId, orgId } = useSCSession();
  const { toast, confirm } = useUI();

  const [commissions, setCommissions] = useState<CommissionEvaluation[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [panel, setPanel] = useState<MemberPanel | null>(null);

  const coPeoCandidates = useMemo(
    () => membres.filter((m) => {
      const role = roleKeyOf(m);
      return userIdOf(m) && !!role && COPEO_ROLES.includes(role);
    }),
    [membres],
  );
  const ctCandidates = useMemo(
    () => membres.filter((m) => userIdOf(m) && roleKeyOf(m) === 'MEMBRE_COMITE_TECHNIQUE'),
    [membres],
  );

  async function hydrate(commission: CommissionEvaluation) {
    const [linked, ct] = await Promise.all([
      scApi.listCommissionEvaluationMembres(commission.id_comission),
      scApi.listCT(commission.id_comission),
    ]);
    return { ...commission, membres: linked, ct };
  }

  async function load() {
    if (!serviceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [base, orgMembers] = await Promise.all([
      scApi.listCommissionsEvaluation(serviceId),
      orgId ? scApi.listMembres(orgId) : Promise.resolve([]),
    ]);
    setCommissions(await Promise.all(base.map(hydrate)));
    setMembres(orgMembers);
    setLoading(false);
  }

  useEffect(() => { if (ready) load(); }, [ready, serviceId, orgId]);

  function openForm() {
    setForm({ nom_comission: '', categorie: 'Travaux publics', selectedUsers: [], labels: {}, ctUsers: [] });
  }

  async function create() {
    if (!serviceId || !form?.nom_comission.trim()) {
      toast('warning', isArabic ? 'اسم اللجنة مطلوب.' : 'Le nom de la commission est requis.');
      return;
    }
    if (form.selectedUsers.length < 3) {
      toast('warning', isArabic ? 'لجنة COPEO تتطلب 3 أعضاء على الأقل.' : 'Une commission COPEO nécessite au moins 3 membres.');
      return;
    }
    try {
      const commission = await scApi.createCommissionEvaluation({
        id_service: serviceId,
        nom_comission: form.nom_comission.trim(),
        categorie: form.categorie.trim() || 'Marchés publics',
      });
      await Promise.all(form.selectedUsers.map((id) => scApi.addCommissionEvaluationMembre(commission.id_comission, id, form.labels[id] || 'membre')));
      await Promise.all(form.ctUsers.map((id) => scApi.assignCT(commission.id_comission, id)));
      toast('success', isArabic ? 'تم إنشاء اللجنة.' : 'Commission créée.');
      setForm(null);
      load();
    } catch {
      toast('error', isArabic ? 'تعذر إنشاء اللجنة.' : 'Création de la commission indisponible.');
    }
  }

  async function remove(commission: CommissionEvaluation) {
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

  async function toggleMember(commission: CommissionEvaluation, utilisateurId: number, checked: boolean, lbl: Label = 'membre') {
    try {
      if (checked) await scApi.addCommissionEvaluationMembre(commission.id_comission, utilisateurId, lbl);
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

  if (loading) return <Spinner />;

  const field = 'w-full mt-1 px-4 py-2.5 rounded-xl text-sm bg-[#F4F7F4] border border-transparent focus:border-[#97A675] focus:outline-none';
  const label = 'text-xs font-semibold text-gray-500';

  return (
    <div>
      <PageHeader
        title={isArabic ? 'لجان COPEO' : 'Commissions COPEO'}
        breadcrumb={isArabic ? 'مؤسستي' : 'Mon organisation'}
        action={<button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={openForm}>+ {isArabic ? 'لجنة COPEO' : 'Commission COPEO'}</button>}
      />

      <p className="text-sm text-gray-400 mb-5 max-w-2xl">
        {isArabic
          ? 'لجنة COPEO هي اللجنة الوحيدة: تتولى التحقق والتقييم وفتح الأظرفة وسجل الاستلام. أضف 3 أعضاء على الأقل من الأدوار المؤهلة.'
          : "La commission COPEO est l’unique commission : elle assure la validation, l’évaluation, l’ouverture des plis et le registre de réception. Ajoutez au moins 3 membres parmi les rôles éligibles."}
      </p>

      {commissions.length === 0 ? (
        <Card><EmptyState title={isArabic ? 'لا توجد لجنة COPEO' : 'Aucune commission COPEO'} hint={isArabic ? 'أنشئ لجنة تضم 3 أعضاء على الأقل ثم اربطها بالمناقصة.' : 'Créez une commission avec au moins 3 membres, puis liez-la à l’appel d’offres.'} /></Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {commissions.map((c) => (
            <Card key={c.id_comission} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-bold" style={{ color: '#1C4532' }}>{c.nom_comission || `COPEO #${c.id_comission}`}</h4>
                  <p className="text-xs text-gray-400">{c.categorie || 'Marchés publics'}</p>
                </div>
                <Badge tone={(c.membres?.length || 0) >= 3 ? 'success' : 'warning'}>{c.membres?.length || 0} {isArabic ? 'أعضاء' : 'membres'}</Badge>
              </div>
              <p className="text-xs text-gray-400 mb-4">{isArabic ? 'اللجنة المستخدمة في التحقق والتقييم وسجل الاستلام وفتح الأظرفة.' : 'Validation, évaluation, registre de réception et ouverture des plis.'}</p>
              <div className="flex gap-2 flex-wrap">
                <button className={GHOST_BTN} onClick={() => setPanel({ commission: c, membres: c.membres || [], ct: (c as unknown as { ct?: { id_utilisateur: number }[] }).ct || [] })}>{isArabic ? 'الأعضاء و CT' : 'Membres & CT'}</button>
                <button className="text-xs font-semibold text-red-500 hover:underline" onClick={() => remove(c)}>{isArabic ? 'حذف' : 'Supprimer'}</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!form}
        title={isArabic ? 'لجنة COPEO جديدة' : 'Nouvelle commission COPEO'}
        onClose={() => setForm(null)}
        wide
        footer={<><button className={GHOST_BTN} onClick={() => setForm(null)}>{isArabic ? 'إلغاء' : 'Annuler'}</button><button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={create}>{isArabic ? 'إنشاء' : 'Créer'}</button></>}
      >
        {form && (
          <div className="space-y-5">
            <div>
              <label className={label}>{isArabic ? 'الاسم' : 'Nom'} *</label>
              <input className={field} value={form.nom_comission} onChange={(e) => setForm({ ...form, nom_comission: e.target.value })} />
            </div>
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
                    onChange={(e) => setForm({ ...form, labels: { ...form.labels, [id]: e.target.value as Label } })}
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
          </div>
        )}
      </Modal>

      <Modal open={!!panel} title={isArabic ? 'أعضاء COPEO و CT' : 'Membres COPEO & CT'} onClose={() => setPanel(null)} wide>
        {panel && (
          <div className="space-y-5">
            <Chooser
              title={isArabic ? 'أعضاء COPEO' : 'Membres COPEO'}
              empty={isArabic ? 'لا يوجد أعضاء مؤهلون.' : 'Aucun membre éligible.'}
              membres={coPeoCandidates}
              isArabic={isArabic}
              selected={(m) => !!userIdOf(m) && panel.membres.some((x) => x.id_utilisateur === userIdOf(m))}
              onToggle={(m, checked) => { const id = userIdOf(m); if (id) toggleMember(panel.commission, id, checked); }}
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
