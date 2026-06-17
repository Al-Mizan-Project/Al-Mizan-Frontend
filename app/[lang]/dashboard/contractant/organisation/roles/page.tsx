'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Guard from '@/components/contractant/Guard';
import { ALL_SC_ROLES, ROLE_PERMISSIONS, roleLabel, type SCRole } from '@/lib/sc/permissions';
import { Card, PageHeader, Badge, Modal, PRIMARY_BTN, PRIMARY_BTN_STYLE, GHOST_BTN } from '@/lib/sc/ui';

const ROLE_DESCRIPTIONS: Record<SCRole, { fr: string; ar: string; featured: string[] }> = {
  RESP_SC: {
    fr: "Pilote le service contractant, publie les appels d'offres, gère les membres et statue sur les décisions clés.",
    ar: 'يشرف على المصلحة المتعاقدة وينشر المناقصات ويدير الأعضاء والقرارات الأساسية.',
    featured: ['marche:create', 'marche:publish', 'membre:create', 'marche:attribuer'],
  },
  REDACTEUR_CDC: {
    fr: 'Prépare les dossiers et cahiers des charges, répond aux questions et transmet les documents à valider.',
    ar: 'يحضّر الملفات ودفاتر الشروط ويرد على الأسئلة ويرسل الوثائق للمصادقة.',
    featured: ['marche:create', 'cdc:create', 'cdc:submit_validation', 'question:repondre'],
  },
  EVALUATEUR: {
    fr: "Membre COPEO chargé de l'ouverture, de la conformité, de l'évaluation et du rapport final.",
    ar: 'عضو في لجنة COPEO مكلف بالفتح والمطابقة والتقييم والتقرير النهائي.',
    featured: ['registre_reception:read', 'pli:open', 'offre_technique:evaluer', 'rapport_copeo:submit_to_sc'],
  },
  MEMBRE_COMITE_TECHNIQUE: {
    fr: 'Produit les analyses et rapports techniques transmis à la COPEO.',
    ar: 'ينجز التحاليل والتقارير التقنية المرسلة إلى لجنة COPEO.',
    featured: ['analyse_technique:create', 'note_technique:create', 'rapport_technique:submit_to_copeo', 'offre_technique:read'],
  },
  RESP_VALID_INTERN: {
    fr: 'Organise la validation interne, affecte les dossiers et consulte les rapports de commission.',
    ar: 'ينظم المصادقة الداخلية ويسند الملفات ويطلع على تقارير اللجنة.',
    featured: ['dossier:read', 'membre_civ:manage', 'dossier:assigner', 'rapport_cm:read'],
  },
  VALIDATEUR_INTERNE_MARCHE: {
    fr: "Valide ou rejette les marchés avant leur publication par le service contractant.",
    ar: 'يصادق على الصفقات أو يرفضها قبل نشرها من طرف المصلحة المتعاقدة.',
    featured: ['marche:read', 'marche:valider_intern', 'marche:rejeter_intern'],
  },
  VALIDATEUR_INTERNE_CDC: {
    fr: 'Valide ou rejette les cahiers des charges transmis par les rédacteurs.',
    ar: 'يصادق على دفاتر الشروط المرسلة من المحررين أو يرفضها.',
    featured: ['cdc:read', 'cdc:valider_intern', 'cdc:rejeter_intern'],
  },
};

function RolesInner() {
  const { lang } = useParams() as { lang: string };
  const isArabic = lang === 'ar';
  const [selected, setSelected] = useState<SCRole | null>(null);

  return (
    <div>
      <PageHeader title={isArabic ? 'الأدوار والصلاحيات' : 'Rôles & Permissions'} breadcrumb={isArabic ? 'مؤسستي' : 'Mon organisation'} />
      <p className="text-sm text-gray-400 mb-5">{isArabic ? 'ملخص عملي للأدوار. التفاصيل الكاملة متاحة عند الحاجة فقط.' : "Vue synthétique des rôles. Les permissions complètes restent accessibles au besoin."}</p>

      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-4">
        {ALL_SC_ROLES.map((r) => (
          <Card key={r} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold" style={{ color: '#1C4532' }}>{roleLabel(r, lang)}</h3>
                <p className="mt-1 text-xs text-gray-400 font-mono">{r}</p>
              </div>
              <Badge tone="info">{ROLE_PERMISSIONS[r].length}</Badge>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed min-h-[4.5rem]">{isArabic ? ROLE_DESCRIPTIONS[r].ar : ROLE_DESCRIPTIONS[r].fr}</p>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {ROLE_DESCRIPTIONS[r].featured.map((p) => (
                <Badge key={p} tone="neutral">{p}</Badge>
              ))}
            </div>
            <button className={`${GHOST_BTN} mt-4`} onClick={() => setSelected(r)}>{isArabic ? 'عرض كل الصلاحيات' : 'Voir toutes les permissions'}</button>
          </Card>
        ))}
      </div>

      <Modal
        open={!!selected}
        title={selected ? roleLabel(selected, lang) : ''}
        onClose={() => setSelected(null)}
        wide
        footer={<button className={PRIMARY_BTN} style={PRIMARY_BTN_STYLE} onClick={() => setSelected(null)}>{isArabic ? 'إغلاق' : 'Fermer'}</button>}
      >
        {selected && (
          <div>
            <p className="text-sm text-gray-500 mb-4">{isArabic ? ROLE_DESCRIPTIONS[selected].ar : ROLE_DESCRIPTIONS[selected].fr}</p>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold" style={{ color: '#1C4532' }}>{isArabic ? 'كل الصلاحيات' : 'Toutes les permissions'}</h4>
              <span className="text-xs font-mono text-gray-400">{selected}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_PERMISSIONS[selected].map((p) => (
                <Badge key={p} tone="info">{p}</Badge>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function RolesPage() {
  return <Guard anyOf={['role:assign']}><RolesInner /></Guard>;
}
