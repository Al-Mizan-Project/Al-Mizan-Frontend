'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import styles from './service-contractant.module.css';
import {
  accessItems,
  affectationRows,
  appelsRows,
  commissionMembers,
  connectedMemberFields,
  connectedMemberPermissions,
  createPermission,
  dashboardActivity,
  dashboardKpis,
  dashboardRecentOffers,
  documentsRows,
  editPermission,
  managedFields,
  marchesTabs,
  members,
  newMemberPermissionChoices,
  ORGANISATION_FEATURE_OPTIONS,
  ORGANISATION_PAGE_OPTIONS,
  organisationInfoFields,
  permissions,
  recoursItems,
  serviceContractantFields,
  soumissionsRows,
  tutelleFields,
  type BadgeData,
  type BadgeTone,
  type MarchesTab,
} from './service-contractant-data';
import { fetchSoumissionById, runConformiteAuto } from '@/lib/operator-api';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function getBadgeClass(tone: BadgeTone) {
  const toneClass: Record<BadgeTone, string> = {
    info: styles.badgeInfo,
    success: styles.badgeSuccess,
    warn: styles.badgeWarn,
    danger: styles.badgeDanger,
    gray: styles.badgeGray,
  };

  return toneClass[tone];
}

function Badge({
  badge,
  small = false,
  compact = false,
}: {
  badge: BadgeData;
  small?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        styles.badge,
        getBadgeClass(badge.tone),
        small && styles.badgeSmall,
        compact && styles.dashboardBadge
      )}
    >
      {badge.label}
    </span>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn(styles.field, full && styles.fieldFull)}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function ReadonlyField({ label, value, full = false }: { label: string; value: string; full?: boolean }) {
  return (
    <Field label={label} full={full}>
      <div className={styles.readonly}>{value}</div>
    </Field>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function OrganisationTabs({ active }: { active: 'info' | 'membres' | 'permissions' }) {
  const params = useParams<{ lang: string }>();
  const lang = String(params.lang ?? 'fr');

  return (
    <div className={styles.subtabs}>
      <Link
        href={`/${lang}/dashboard/contractant/organisation`}
        className={cn(styles.subtab, active === 'info' && styles.subtabActive)}
      >
        Info
      </Link>
      <Link
        href={`/${lang}/dashboard/contractant/organisation/membres`}
        className={cn(styles.subtab, active === 'membres' && styles.subtabActive)}
      >
        Gestion membres
      </Link>
      <Link
        href={`/${lang}/dashboard/contractant/organisation/permissions`}
        className={cn(styles.subtab, active === 'permissions' && styles.subtabActive)}
      >
        Permissions
      </Link>
    </div>
  );
}

function TokenBuilder({
  initialTokens,
  options,
  emptyLabel,
  addLabel,
  selectLabel,
}: {
  initialTokens: string[];
  options: string[];
  emptyLabel: string;
  addLabel: string;
  selectLabel: string;
}) {
  const [tokens, setTokens] = useState(initialTokens);
  const [selectedToken, setSelectedToken] = useState('');

  const handleAdd = () => {
    if (!selectedToken || tokens.includes(selectedToken)) {
      return;
    }

    setTokens((current) => [...current, selectedToken]);
    setSelectedToken('');
  };

  const handleRemove = (token: string) => {
    setTokens((current) => current.filter((item) => item !== token));
  };

  return (
    <div className={styles.tokenBuilder}>
      <div className={styles.tokenList}>
        {tokens.length === 0 ? (
          <span className={styles.tokenEmpty}>{emptyLabel}</span>
        ) : (
          tokens.map((token) => (
            <span key={token} className={styles.tokenPill}>
              {token}
              <button type="button" aria-label="Retirer" onClick={() => handleRemove(token)}>
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <div className={styles.tokenActions}>
        <button type="button" className={cn(styles.btn, styles.btnGhost, styles.btnSm)} onClick={handleAdd}>
          {addLabel}
        </button>
        <select
          className={styles.tokenSelect}
          value={selectedToken}
          onChange={(event) => setSelectedToken(event.target.value)}
        >
          <option value="">{selectLabel}</option>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function DashboardSection() {
  const params = useParams<{ lang: string }>();
  const lang = String(params.lang ?? 'fr');

  return (
    <>
      <div className={cn(styles.grid, styles.grid4)}>
        {dashboardKpis.map((item) => (
          <div key={item.label} className={styles.kpi}>
            <div className={styles.kpiLabel}>{item.label}</div>
            <div className={styles.kpiValue}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className={cn(styles.grid, styles.split55)} style={{ marginTop: 18 }}>
        <div className={styles.card}>
          <div className={cn(styles.cardHeader, styles.dashboardHeader)}>
            <div>
              <h4>Appels d’offre récents</h4>
            </div>
            <Link href={`/${lang}/dashboard/contractant/marches`} className={cn(styles.btn, styles.btnGhost)}>
              Voir tout
            </Link>
          </div>
          <div className={styles.cardBodyCompact}>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Titre</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Dates clés</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardRecentOffers.map((offer) => (
                    <tr key={offer.reference}>
                      <td>
                        <strong>{offer.reference}</strong>
                      </td>
                      <td>{offer.title}</td>
                      <td>{offer.type}</td>
                      <td>
                        <Badge badge={offer.status} compact />
                      </td>
                      <td>{offer.dates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Journal d’activité</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.list}>
              {dashboardActivity.map((item) => (
                <div key={item.title} className={styles.listItem}>
                  <Badge badge={item.badge} compact />
                  <div className={styles.grow}>
                    <strong>{item.title}</strong>
                  </div>
                  <Badge badge={{ label: item.time, tone: 'gray' }} compact />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function MarchesSection() {
  const [activeTab, setActiveTab] = useState<MarchesTab>('marches-appels');
  const [showAiMock, setShowAiMock] = useState(false);
  const [iaSoumissionId, setIaSoumissionId] = useState('');
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState('');
  const [iaResult, setIaResult] = useState<{
    conformite_statut: string;
    conformite_rapport?: { missing_documents?: string[]; invalid_documents?: string[] };
  } | null>(null);

  const handleContractantConformiteCheck = async () => {
    const soumissionId = Number(iaSoumissionId);
    if (!Number.isFinite(soumissionId) || soumissionId <= 0) {
      setIaError('Veuillez saisir un id_soumission valide.');
      return;
    }

    setIaError('');
    setIaResult(null);
    setIaLoading(true);
    try {
      const soumission = await fetchSoumissionById(soumissionId);
      if (!soumission.document_ids?.length) {
        throw new Error('La soumission ne contient aucun document à analyser.');
      }

      const data = await runConformiteAuto({
        soumissionId,
        idAppelOffre: soumission.id_appel_offre,
        providedDocumentIds: soumission.document_ids,
        performOcr: true,
      });

      setIaResult({
        conformite_statut: data?.conformite_statut || '',
        conformite_rapport: data?.conformite_rapport || {},
      });
    } catch (error) {
      setIaError(error instanceof Error ? error.message : 'Erreur lors de la vérification IA.');
    } finally {
      setIaLoading(false);
    }
  };

  return (
    <>
      <SectionHeader
        title="Marchés"
        description="Gérez les appels d’offres, les documents, les soumissions et les contrats."
      />

      <div className={styles.subtabs}>
        {marchesTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(styles.subtab, activeTab === tab.id && styles.subtabActive)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'marches-appels' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.field} style={{ minWidth: 240 }}>
                <label>Recherche</label>
                <input type="search" placeholder="Référence, titre, procédure…" />
              </div>
              <div className={styles.field} style={{ minWidth: 220 }}>
                <label>Statut</label>
                <select defaultValue="Tous">
                  <option>Tous</option>
                  <option>brouillon</option>
                  <option>publie</option>
                  <option>depot_cloture</option>
                  <option>plis_ouverts</option>
                  <option>annule</option>
                </select>
              </div>
            </div>
            <div className={styles.toolbarRight}>
              <button
                type="button"
                className={cn(styles.btn, styles.btnPrimary)}
                onClick={() => setActiveTab('marches-edition')}
              >
                Nouvel appel d’offres
              </button>
              <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                Exporter la liste
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Liste des appels d’offres</h4>
              </div>
            </div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Référence / titre</th>
                      <th>Type de procédure</th>
                      <th>Montant estimé</th>
                      <th>Date publication</th>
                      <th>Date limite</th>
                      <th>Ouverture des plis</th>
                      <th>Statut</th>
                      <th>Poids</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appelsRows.map((row) => (
                      <tr key={row.reference}>
                        <td>
                          <strong>{row.reference}</strong>
                          <br />
                          <span style={{ color: 'var(--muted)' }}>{row.title}</span>
                        </td>
                        <td>{row.procedureType}</td>
                        <td>{row.amount}</td>
                        <td>{row.publication}</td>
                        <td>{row.deadline}</td>
                        <td>{row.opening}</td>
                        <td>
                          <Badge badge={row.status} />
                        </td>
                        <td>{row.weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'marches-edition' && (
        <div className={cn(styles.grid, styles.split65)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Fiche appel d’offres</h4>
              </div>
              <Badge badge={{ label: 'service contractant', tone: 'info' }} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <ReadonlyField label="Id service contractant" value="SC-001" />
                <Field label="Référence">
                  <input defaultValue="AO-2026-014" />
                </Field>
                <Field label="Titre">
                  <input defaultValue="Acquisition de serveurs et baies de stockage" />
                </Field>
                <Field label="Type de procédure">
                  <input defaultValue="Appel d’offres ouvert" />
                </Field>
                <Field label="Description" full>
                  <textarea defaultValue="Fourniture, installation et mise en service d’une infrastructure de calcul et de stockage pour le centre de données du service contractant." />
                </Field>
                <Field label="Montant estimé">
                  <input defaultValue="12500000" />
                </Field>
                <ReadonlyField label="Statut" value="brouillon" />
                <Field label="Date de publication">
                  <input type="datetime-local" defaultValue="2026-04-22T10:00" />
                </Field>
                <Field label="Date limite de soumission">
                  <input type="datetime-local" defaultValue="2026-04-24T14:00" />
                </Field>
                <Field label="Date d’ouverture des plis">
                  <input type="datetime-local" defaultValue="2026-04-25T09:30" />
                </Field>
                <Field label="Poids technique">
                  <input type="number" defaultValue="70" />
                </Field>
                <Field label="Poids financier">
                  <input type="number" defaultValue="30" />
                </Field>
              </div>

              <div className={styles.btnRow} style={{ marginTop: 18 }}>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                  Enregistrer
                </button>
                <button type="button" className={cn(styles.btn, styles.btnSoft)}>
                  Publier
                </button>
                <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                  Clôturer le dépôt
                </button>
                <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                  Ouvrir les plis
                </button>
                <button
                  type="button"
                  className={cn(styles.btn, styles.btnGhost)}
                  onClick={() => setShowAiMock(true)}
                >
                  Suggestions IA
                </button>
                <button type="button" className={cn(styles.btn, styles.btnDanger)}>
                  Annuler
                </button>
              </div>

              {showAiMock && (
                <div className={cn(styles.hintBox, styles.aiMockPanel)}>
                  <div className={styles.inlineRow}>
                    <h5 style={{ margin: 0 }}>Conversation IA — aide à la rédaction du CDC</h5>
                    <button
                      type="button"
                      className={cn(styles.btn, styles.btnGhost)}
                      onClick={() => setShowAiMock(false)}
                    >
                      Fermer
                    </button>
                  </div>
                  <div className={styles.chatThread}>
                    <div className={cn(styles.chatBubble, styles.chatBubbleUser)}>
                      Je veux rédiger un appel d’offres pour l’acquisition de serveurs et baies de stockage. Donne-moi
                      une base claire et non discriminante.
                    </div>
                    <div className={cn(styles.chatBubble, styles.chatBubbleAi)}>
                      Je peux proposer une trame de CDC avec objet, périmètre, exigences techniques, critères
                      d’évaluation et calendrier. Je peux aussi reformuler les exigences trop restrictives.
                    </div>
                    <div className={cn(styles.chatBubble, styles.chatBubbleUser)}>
                      Commence par l’objet, le périmètre et les exigences minimales.
                    </div>
                    <div className={cn(styles.chatBubble, styles.chatBubbleAi)}>
                      Brouillon proposé : Objet du marché, fourniture, installation et mise en service d’une
                      infrastructure de calcul et de stockage. Périmètre : livraison, intégration, tests, documentation
                      et garantie. Exigences minimales : capacité, redondance, support, délais de mise en service et
                      conformité documentaire.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Aide IA disponible</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.list}>
                  <div className={styles.listItem}>
                    <Badge badge={{ label: 'CDC', tone: 'info' }} />
                    <div className={styles.grow}>
                      <strong>Rédiger un CDC</strong>
                      <p>Lancer l’assistant de rédaction pour produire un cahier des charges initial.</p>
                    </div>
                  </div>
                  <div className={styles.listItem}>
                    <Badge badge={{ label: 'CDC', tone: 'info' }} />
                    <div className={styles.grow}>
                      <strong>Réviser un CDC</strong>
                      <p>Réviser un texte existant pour améliorer sa qualité et limiter les biais.</p>
                    </div>
                  </div>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                    Rédiger
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                    Réviser
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Lecture rapide</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.hintBox}>
                  <h5>Ce qui est volontairement absent</h5>
                  <p>
                    Pas de rapport autonome, pas de bloc sécurité dédié, pas de changement d’organisation, pas de
                    sous-menu chargé. Le formulaire reste concentré sur référence, titre, description, procédure, dates,
                    montant, poids et statut.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marches-documents' && (
        <>
          <div className={cn(styles.grid, styles.split55)}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Téléversement GED</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <Field label="Fichier unique">
                    <input type="file" />
                  </Field>
                  <Field label="Fichiers multiples">
                    <input type="file" multiple />
                  </Field>
                  <Field label="related_type">
                    <input defaultValue="appel_offres" />
                  </Field>
                  <Field label="is_encrypted">
                    <select defaultValue="false">
                      <option>false</option>
                      <option>true</option>
                    </select>
                  </Field>
                  <Field label="visible_after">
                    <input type="datetime-local" defaultValue="2026-04-22T10:00" />
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 18 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                    Téléverser
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                    Associer à l’appel d’offres
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Métadonnées document</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statsStrip}>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>hash</div>
                    <strong>SHA-256</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>ia_verif_statut</div>
                    <strong>PENDING</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>visibilité</div>
                    <strong>visible_after</strong>
                  </div>
                </div>
                <div className={styles.footerNote}>
                  Les documents listés ci-dessous conservent les métadonnées utiles : nom, type_document,
                  related_type, taille_fichier, hash_sha256, uploaded_at, visible_after et statut de vérification IA.
                </div>
              </div>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: 18 }}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Documents rattachés à AO-2026-014</h4>
              </div>
            </div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>type_document</th>
                      <th>related_type</th>
                      <th>Taille</th>
                      <th>Chiffré</th>
                      <th>Statut IA</th>
                      <th>visible_after</th>
                      <th>uploaded_at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentsRows.map((document) => (
                      <tr key={document.name}>
                        <td>
                          <strong>{document.name}</strong>
                        </td>
                        <td>{document.type}</td>
                        <td>{document.relatedType}</td>
                        <td>{document.size}</td>
                        <td>{document.encrypted}</td>
                        <td>
                          <Badge badge={document.iaStatus} />
                        </td>
                        <td>{document.visibleAfter}</td>
                        <td>{document.uploadedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'marches-soumissions' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Soumissions reçues</h4>
              </div>
            </div>
            <div className={styles.cardBodyCompact}>
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Soumission</th>
                      <th>Opérateur</th>
                      <th>Conformité</th>
                      <th>Évaluation</th>
                      <th>Contrat</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soumissionsRows.map((row) => (
                      <tr key={row.submission}>
                        <td>
                          <strong>{row.submission}</strong>
                        </td>
                        <td>{row.operator}</td>
                        <td>
                          <Badge badge={row.conformity} />
                        </td>
                        <td>{row.evaluation}</td>
                        <td>{row.contract}</td>
                        <td>
                          <div className={styles.btnRow}>
                            {row.actions.map((action, index) => (
                              <button
                                key={`${row.submission}-${action}`}
                                type="button"
                                className={cn(
                                  styles.btn,
                                  index === 1 ? styles.btnSoft : styles.btnGhost
                                )}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Contrôle de conformité</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <ReadonlyField label="Soumission" value="S-2026-032" />
                  <Field label="Statut de validation">
                    <select defaultValue="true">
                      <option>true</option>
                      <option>false</option>
                    </select>
                  </Field>
                  <Field label="Type de validation">
                    <select defaultValue="interne">
                      <option>interne</option>
                      <option>externe</option>
                      <option>tutelle</option>
                    </select>
                  </Field>
                  <ReadonlyField label="Utilisateur" value="USR-004" />
                  <Field label="Commentaire" full>
                    <textarea defaultValue="Dossier reçu avec pièces administratives complètes, réserve sur la dernière attestation fiscale à revérifier." />
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                    Mettre à jour
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                    Approuver
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnDanger)}>
                    Rejeter
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Actions globales</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.btnRow}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                    Ouvrir les plis
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnSoft)}>
                    Calculer le classement
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                    Valider les notes
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                    Détecter les anomalies
                  </button>
                  <button
                    type="button"
                    className={cn(styles.btn, styles.btnGhost)}
                    onClick={handleContractantConformiteCheck}
                    disabled={iaLoading}
                  >
                    {iaLoading ? 'Vérification IA…' : 'Vérifier conformité IA'}
                  </button>
                </div>
                <div className={styles.formGrid} style={{ marginTop: 14 }}>
                  <Field label="id_soumission (réel)">
                    <input
                      type="number"
                      min={1}
                      placeholder="Ex: 1"
                      value={iaSoumissionId}
                      onChange={(event) => setIaSoumissionId(event.target.value)}
                    />
                  </Field>
                </div>
                {iaError && (
                  <div className={styles.footerNote} style={{ color: '#b91c1c' }}>
                    {iaError}
                  </div>
                )}
                {iaResult && (
                  <div className={styles.footerNote} style={{ color: '#14532d' }}>
                    Statut IA: {iaResult.conformite_statut}
                    {iaResult.conformite_rapport?.missing_documents?.length
                      ? ` | Pièces manquantes: ${iaResult.conformite_rapport.missing_documents.join(', ')}`
                      : ''}
                  </div>
                )}
                <div className={styles.footerNote}>
                  La saisie de dépôt d’offre n’apparaît plus ici, car elle concerne l’opérateur économique et non le
                  service contractant.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marches-evaluations' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Commission d’évaluation</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <Field label="Id commission">
                  <input defaultValue="COM-2026-02" />
                </Field>
                <ReadonlyField label="Id service" value="SC-001" />
                <Field label="Nom commission">
                  <input defaultValue="Commission technique réseau" />
                </Field>
                <Field label="Catégorie / type">
                  <input defaultValue="Evaluation technique" />
                </Field>
              </div>

              <div className={styles.btnRow} style={{ marginTop: 16 }}>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                  Enregistrer la commission
                </button>
                <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                  Ajouter un membre
                </button>
              </div>

              <div className={styles.tableWrap} style={{ marginTop: 18 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Membre</th>
                      <th>Fonction</th>
                      <th>Téléphone</th>
                      <th>Rôle dans la commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionMembers.map((member) => (
                      <tr key={member.member}>
                        <td>
                          <strong>{member.member}</strong>
                        </td>
                        <td>{member.job}</td>
                        <td>{member.phone}</td>
                        <td>{member.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Affectation des AO</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <Field label="AO">
                    <select defaultValue="AO-2026-009 — Campus Network Equipment">
                      <option>AO-2026-014 — Server Infrastructure Upgrade</option>
                      <option>AO-2026-009 — Campus Network Equipment</option>
                      <option>AO-2026-005 — IT Helpdesk Outsourcing</option>
                    </select>
                  </Field>
                  <Field label="Type de commission">
                    <select defaultValue="Commission interne">
                      <option>Commission interne</option>
                      <option>Commission externe</option>
                    </select>
                  </Field>
                  <Field label="Commission cible">
                    <select defaultValue="COM-2026-02 — Commission technique réseau">
                      <option>COM-2026-02 — Commission technique réseau</option>
                      <option>COM-2026-03 — Commission administrative</option>
                      <option>CEX-2026-01 — Commission externe infrastructure</option>
                    </select>
                  </Field>
                  <Field label="Étape suivie">
                    <select defaultValue="Technique">
                      <option>Administrative</option>
                      <option>Technique</option>
                      <option>Financière</option>
                    </select>
                  </Field>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                    Affecter la commission
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                    Voir les affectations
                  </button>
                </div>

                <div className={styles.tableWrap} style={{ marginTop: 18 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>AO</th>
                        <th>Commission</th>
                        <th>Type</th>
                        <th>État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affectationRows.map((row) => (
                        <tr key={row.tender}>
                          <td>
                            <strong>{row.tender}</strong>
                          </td>
                          <td>{row.commission}</td>
                          <td>{row.type}</td>
                          <td>
                            <Badge badge={row.state} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h4>Vue d’avancement</h4>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statsStrip}>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>administrative</div>
                    <strong>12/14</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>technique</div>
                    <strong>10/14</strong>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statBoxSmall}>financière</div>
                    <strong>0/14</strong>
                  </div>
                </div>
                <div className={styles.btnRow} style={{ marginTop: 16 }}>
                  <button type="button" className={cn(styles.btn, styles.btnSoft)}>
                    Voir l’état détaillé
                  </button>
                  <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                    Voir les affectations
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marches-contrats' && (
        <div className={cn(styles.grid, styles.split55)}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Contrat</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                <ReadonlyField label="id_soumission" value="S-2026-033" />
                <ReadonlyField label="id_service_contractants" value="SC-001" />
                <Field label="Numéro contrat">
                  <input defaultValue="C-2026-004" />
                </Field>
                <Field label="Date signature">
                  <input type="date" defaultValue="2026-04-26" />
                </Field>
                <Field label="Statut">
                  <input defaultValue="en_preparation" />
                </Field>
              </div>
              <div className={styles.btnRow} style={{ marginTop: 16 }}>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                  Enregistrer le contrat
                </button>
                <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                  Voir depuis la soumission
                </button>
                <button type="button" className={cn(styles.btn, styles.btnSoft)}>
                  Signer
                </button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Recours</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.list}>
                {recoursItems.map((item) => (
                  <div key={item.title} className={styles.listItem}>
                    <Badge badge={item.badge} />
                    <div className={styles.grow}>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.btnRow} style={{ marginTop: 16 }}>
                <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                  Instruire
                </button>
                <button type="button" className={cn(styles.btn, styles.btnSoft)}>
                  Décision
                </button>
                <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                  Accepter
                </button>
                <button type="button" className={cn(styles.btn, styles.btnDanger)}>
                  Rejeter
                </button>
                <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                  Clôturer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OrganizationInfoSection() {
  return (
    <>
      <SectionHeader title="Organisation" description="Vue de l’organisation et des profils." />
      <OrganisationTabs active="info" />

      <div className={cn(styles.grid, styles.split55)}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Organisation</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              {organisationInfoFields.map((field) => (
                <ReadonlyField key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.stack}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Service contractant</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                {serviceContractantFields.map((field) => (
                  <ReadonlyField key={field.label} label={field.label} value={field.value} />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h4>Tutelle</h4>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.formGrid}>
                {tutelleFields.map((field) => (
                  <ReadonlyField key={field.label} label={field.label} value={field.value} full={field.full} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn(styles.grid, styles.split55)} style={{ marginTop: 18 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Membre connecté</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              {connectedMemberFields.map((field) => (
                <ReadonlyField key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <label className={styles.freeLabel} style={{ display: 'block', marginBottom: 8 }}>
                permissions
              </label>
              <div className={styles.badgesInline}>
                {connectedMemberPermissions.map((permission) => (
                  <Badge key={permission} badge={{ label: permission, tone: 'info' }} small />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Accès</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.list}>
              {accessItems.map((item) => (
                <div key={item.title} className={styles.listItem}>
                  <Badge badge={item.badge} />
                  <div className={styles.grow}>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function OrganizationMembersSection() {
  return (
    <>
      <SectionHeader title="Organisation" description="Vue de l’organisation et des profils." />
      <OrganisationTabs active="membres" />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h4>Gestion membres</h4>
          </div>
          <div className={styles.btnRow} style={{ marginTop: 0 }}>
            <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
              Créer un membre
            </button>
          </div>
        </div>
        <div className={styles.cardBodyCompact}>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Membre / utilisateur</th>
                  <th>Actif</th>
                  <th>Rôle</th>
                  <th>Permissions</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.fullName}</strong>
                      <div className={styles.tableSub}>
                        {member.id} · {member.userId} · {member.email}
                      </div>
                    </td>
                    <td>
                      <Badge badge={member.activeLabel} />
                    </td>
                    <td>{member.role}</td>
                    <td>{member.permissions.join(' · ')}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <details className={styles.actionMenu}>
                          <summary className={cn(styles.btn, styles.btnGhost, styles.btnSm)}>Éditer</summary>
                          <div className={styles.actionCard}>
                            <Field label="prenom">
                              <input defaultValue={member.firstName} />
                            </Field>
                            <Field label="nom">
                              <input defaultValue={member.lastName} />
                            </Field>
                            <Field label="fonction">
                              <input defaultValue={member.function} />
                            </Field>
                            <Field label="id_role">
                              <select defaultValue={member.role}>
                                {member.roleOptions.map((option) => (
                                  <option key={option}>{option}</option>
                                ))}
                              </select>
                            </Field>
                            <div className={styles.field}>
                              <label>permissions</label>
                              <div className={styles.badgesInline}>
                                {member.permissions.map((permission) => (
                                  <Badge key={permission} badge={{ label: permission, tone: 'info' }} small />
                                ))}
                              </div>
                            </div>
                            <div className={cn(styles.btnRow, styles.smallGap)}>
                              <button type="button" className={cn(styles.btn, styles.btnPrimary, styles.btnSm)}>
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        </details>
                        <button type="button" className={cn(styles.btn, styles.btnSoft, styles.btnSm)}>
                          {member.actionLabel}
                        </button>
                        <button type="button" className={cn(styles.btn, styles.btnDanger, styles.btnSm)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={cn(styles.grid, styles.split55)} style={{ marginTop: 18 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Nouveau membre</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <Field label="prenom">
                <input defaultValue="Amine" />
              </Field>
              <Field label="nom">
                <input defaultValue="Meftah" />
              </Field>
              <Field label="telephone">
                <input defaultValue="0555 00 12 99" />
              </Field>
              <Field label="fonction">
                <input defaultValue="Chargé du suivi des dossiers" />
              </Field>
              <Field label="email">
                <input defaultValue="amine.meftah@wilaya.dz" />
              </Field>
              <Field label="password">
                <input type="password" defaultValue="password123456" />
              </Field>
              <Field label="id_role">
                <select defaultValue="membre_service_contractant">
                  <option>membre_service_contractant</option>
                  <option>responsable_service_contractant</option>
                </select>
              </Field>
              <Field label="is_active">
                <select defaultValue="true">
                  <option>true</option>
                  <option>false</option>
                </select>
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className={styles.freeLabel} style={{ display: 'block', marginBottom: 8 }}>
                permissions
              </label>
              <div className={styles.badgesInline}>
                {newMemberPermissionChoices.map((permission) => (
                  <Badge key={permission.label} badge={permission} small />
                ))}
              </div>
            </div>
            <div className={styles.btnRow} style={{ marginTop: 16 }}>
              <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                Créer le membre
              </button>
              <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Champs gérés</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.list}>
              {managedFields.map((item) => (
                <div key={item.title} className={styles.listItem}>
                  <Badge badge={item.badge} />
                  <div className={styles.grow}>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function OrganizationPermissionsSection() {
  return (
    <>
      <SectionHeader title="Organisation" description="Vue de l’organisation et des profils." />
      <OrganisationTabs active="permissions" />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h4>Permissions</h4>
          </div>
          <div className={styles.btnRow} style={{ marginTop: 0 }}>
            <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
              Créer une permission
            </button>
          </div>
        </div>
        <div className={styles.cardBodyCompact}>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Pages</th>
                  <th>Fonctionnalités</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td>
                      <strong>{permission.name}</strong>
                    </td>
                    <td>{permission.pages.join(' · ')}</td>
                    <td>{permission.features.join(' · ')}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <button type="button" className={cn(styles.btn, styles.btnGhost, styles.btnSm)}>
                          Éditer
                        </button>
                        <button type="button" className={cn(styles.btn, styles.btnDanger, styles.btnSm)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={cn(styles.grid, styles.split55)} style={{ marginTop: 18 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Éditer une permission</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <ReadonlyField label="id_permission" value={editPermission.id} />
              <Field label="nom_permission">
                <input defaultValue={editPermission.name} />
              </Field>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>pages accessibles</label>
                <TokenBuilder
                  initialTokens={editPermission.pages}
                  options={ORGANISATION_PAGE_OPTIONS}
                  emptyLabel="Aucune page sélectionnée"
                  addLabel="+ Ajouter une page"
                  selectLabel="Choisir une page…"
                />
              </div>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>fonctionnalités</label>
                <TokenBuilder
                  initialTokens={editPermission.features}
                  options={ORGANISATION_FEATURE_OPTIONS}
                  emptyLabel="Aucune fonctionnalité sélectionnée"
                  addLabel="+ Ajouter une fonctionnalité"
                  selectLabel="Choisir une fonctionnalité…"
                />
              </div>
            </div>
            <div className={styles.btnRow} style={{ marginTop: 16 }}>
              <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                Enregistrer
              </button>
              <button type="button" className={cn(styles.btn, styles.btnDanger)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h4>Créer une permission</h4>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <Field label="nom_permission">
                <input defaultValue={createPermission.name} />
              </Field>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>pages accessibles</label>
                <TokenBuilder
                  initialTokens={createPermission.pages}
                  options={ORGANISATION_PAGE_OPTIONS}
                  emptyLabel="Aucune page sélectionnée"
                  addLabel="+ Ajouter une page"
                  selectLabel="Choisir une page…"
                />
              </div>
              <div className={cn(styles.field, styles.fieldFull)}>
                <label>fonctionnalités</label>
                <TokenBuilder
                  initialTokens={createPermission.features}
                  options={ORGANISATION_FEATURE_OPTIONS}
                  emptyLabel="Aucune fonctionnalité sélectionnée"
                  addLabel="+ Ajouter une fonctionnalité"
                  selectLabel="Choisir une fonctionnalité…"
                />
              </div>
            </div>
            <div className={styles.btnRow} style={{ marginTop: 16 }}>
              <button type="button" className={cn(styles.btn, styles.btnPrimary)}>
                Créer
              </button>
              <button type="button" className={cn(styles.btn, styles.btnGhost)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
