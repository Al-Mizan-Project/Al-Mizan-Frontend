import { getAuthToken } from './client';

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type NiveauSeverite = 'CRITIQUE' | 'ELEVEE' | 'MOYEN' | 'FAIBLE';
export type NiveauRisque   = 'CRITIQUE' | 'ELEVE'  | 'MOYEN' | 'FAIBLE' | 'AUCUN';
export type StatutExamen   = 'EN_ATTENTE' | 'CONFIRME' | 'REJETE';

export type TypeAnomalieSaucissonnage =
  | 'SAUCISSONNAGE_PROXIMITE_SEUIL'
  | 'SAUCISSONNAGE_TEMPOREL'
  | 'SAUCISSONNAGE_CUMUL_SEUIL'
  | 'SAUCISSONNAGE_MEME_FOURNISSEUR';

export interface AnomalieIA {
  id_detection_anomalie_ia: number;
  id_appel_offre: number;
  id_soumission: number | null;
  type_anomalie: string;
  niveau_severite: NiveauSeverite;
  score_confiance: string;
  details: string;
  statut_examen: StatutExamen;
  date_detection: string | null;
  appels_impliques?: number[];
}

export interface SaucissonnageSummary {
  total_anomalies: number;
  appels_analyses: number;
  appels_affectes: number;
  repartition_par_type: Record<string, number>;
  repartition_par_severite: Record<string, number>;
  score_risque_saucissonnage: number;
  niveau_risque: NiveauRisque;
  recommandation: string;
}

export interface DetecterSaucissonnageAutoResponse {
  id_service_contractant: number;
  appels_analyses: number;
  anomalies_detectees: number;
  summary: SaucissonnageSummary;
  items: AnomalieIA[];
}

// ─── API functions ─────────────────────────────────────────────────────────────

export const iaApi = {
  /**
   * POST /ia/saucissonnage/detecter-auto
   * Fetch appels from the appels service automatically, then run detection.
   */
  detecterSaucissonnageAuto: async (
    idServiceContractant: number,
    opts?: { dateDebut?: string; dateFin?: string }
  ): Promise<DetecterSaucissonnageAutoResponse> => {
    const body: Record<string, unknown> = { id_service_contractant: idServiceContractant };
    if (opts?.dateDebut) body.date_debut = opts.dateDebut;
    if (opts?.dateFin)   body.date_fin   = opts.dateFin;

    const res = await fetch('/api/proxy/ia?path=ia/saucissonnage/detecter-auto', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Détection saucissonnage échouée (${res.status}): ${err}`);
    }
    return res.json();
  },

  /**
   * GET /ia/anomalies — list all anomalies, optionally filtered
   */
  listAnomalies: async (params?: {
    type_anomalie?: string;
    niveau_severite?: string;
  }): Promise<AnomalieIA[]> => {
    const qs = new URLSearchParams({ path: 'ia/anomalies' });
    if (params?.type_anomalie)    qs.set('type_anomalie', params.type_anomalie);
    if (params?.niveau_severite)  qs.set('niveau_severite', params.niveau_severite);

    const res = await fetch(`/api/proxy/ia?${qs.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Chargement des anomalies échoué (${res.status}): ${err}`);
    }
    return res.json();
  },

  /**
   * PATCH /ia/anomalies/{id}/statut-examen
   */
  patchStatutExamen: async (
    idAnomalie: number,
    statut: StatutExamen
  ): Promise<AnomalieIA> => {
    const res = await fetch(
      `/api/proxy/ia?path=ia/anomalies/${idAnomalie}/statut-examen`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ statut_examen: statut }),
      }
    );

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Mise à jour statut échouée (${res.status}): ${err}`);
    }
    return res.json();
  },
};
