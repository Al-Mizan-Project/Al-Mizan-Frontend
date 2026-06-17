'use client';

import { useState, useEffect } from 'react';
import TabNavigation from '../../../components/dossier/TabNavigation';
import FileDetails from '../../../components/dossier/FileDetails';
import DocumentViewer from '../../../components/dossier/DocumentViewer';
import { soumissionsApi } from '@/lib/api/soumissions';
import { appelsApi } from '@/lib/api/appels';
import { documentsApi } from '@/lib/api/documents';
import { getAuthToken } from '@/lib/api/client';

type TabType = 'financial' | 'technical' | 'call' | 'reports' | 'decision';
type UserRole = 'commission' | 'validator';

interface DossierPageProps {
  id: number;
  role: UserRole;
}

export default function DossierPage({ id, role }: DossierPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('financial');
  const [isLoaded, setIsLoaded] = useState(false);
  const [dossierData, setDossierData] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDocumentWithDownloadUrl = async (docId: number) => {
      try {
        const meta = await documentsApi.getDocument(docId);
        try {
          const download = await documentsApi.getDownloadUrl(docId);
          return { ...meta, download_url: download?.download_url };
        } catch {
          return meta;
        }
      } catch (error) {
        console.warn(`Document ${docId} introuvable ou inaccessible`, error);
        return undefined;
      }
    };

    const normalizeType = (value: string | undefined) => (value || '').toString().trim().toLowerCase();
    const documentMatchesType = (doc: any, expected: string) => {
      const typeValue = normalizeType(doc?.type_document);
      const nameValue = normalizeType(doc?.nom);
      if (!typeValue && !nameValue) return false;

      switch (expected) {
        case 'financiere':
          return typeValue.includes('financ') || nameValue.includes('financ') || nameValue.includes('offre financ');
        case 'technique':
          return typeValue.includes('tech') || nameValue.includes('tech') || nameValue.includes('offre tech');
        case 'cdc':
          return typeValue.includes('cdc') || typeValue.includes('cahier') || nameValue.includes('cdc') || nameValue.includes('cahier');
        case 'evaluation_administrative':
          return typeValue.includes('administrative') || nameValue.includes('administrative');
        case 'evaluation_offre':
          return typeValue.includes('offre') || nameValue.includes('offre');
        case 'decision_validation':
          return typeValue.includes('decision') || nameValue.includes('decision');
        default:
          return false;
      }
    };

    const load = async () => {
      setIsLoaded(false);
      setLoadError(null);

      try {
        const soum = await soumissionsApi.getSoumission(id);
        const soumDocs = await soumissionsApi.getSoumissionDocuments(id);

        let appel = null;
        let cdcDoc: any = null;
        if (soum.id_appel_offre) {
          try {
            appel = await appelsApi.getAppelOffre(soum.id_appel_offre);
            if (appel?.id_doc_cdc) {
              cdcDoc = await loadDocumentWithDownloadUrl(Number(appel.id_doc_cdc));
            }
          } catch (appelError: any) {
            console.warn(`Appel d'offre ${soum.id_appel_offre} introuvable`, appelError);
            appel = null;
            cdcDoc = null;
          }
        }

        const documents: any[] = [];
        const documentPromises = (soumDocs || [])
          .filter((d: any) => d?.id_document)
          .map(async (d: any) => loadDocumentWithDownloadUrl(Number(d.id_document)));

        const loadedDocs = await Promise.all(documentPromises);
        documents.push(...loadedDocs.filter(Boolean));

        if (cdcDoc) {
          const existingIndex = documents.findIndex((doc) => doc.id_document === cdcDoc.id_document);
          if (existingIndex === -1) {
            documents.push(cdcDoc);
          }
        }

        // Rechercher les documents de décision de validation uploadés par le validateur
        // Ces documents ne sont pas liés via document_ids mais via related_type + id_operateur
        if (soum?.id_soumissionnaire) {
          try {
            const token = getAuthToken();
            const authHeaders: Record<string, string> = {};
            if (token) authHeaders['Authorization'] = `Bearer ${token}`;
            const decisionDocsRes = await fetch(
              `/api/proxy/documents?path=api/documents/by-operateur/${soum.id_soumissionnaire}/&related_type=decision_validation`,
              { headers: authHeaders }
            );
            if (decisionDocsRes.ok) {
              const decisionDocs = await decisionDocsRes.json();
              // Filtrer ceux qui correspondent à cette soumission (par nom de fichier)
              const matchingDocs = (Array.isArray(decisionDocs) ? decisionDocs : []).filter(
                (d: any) => d?.nom?.includes(`soumission_${id}`)
              );
              for (const dd of matchingDocs) {
                const existing = documents.find((doc) => doc.id_document === dd.id_document);
                if (!existing) {
                  // Charger le download_url pour ce document
                  const fullDoc = await loadDocumentWithDownloadUrl(dd.id_document);
                  if (fullDoc) documents.push(fullDoc);
                }
              }
            }
          } catch (e) {
            console.warn('Recherche documents décision échouée', e);
          }
        }

        const sortedDocuments = [...documents].sort((a, b) => {
          const dateA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
          const dateB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
          return dateB - dateA; // Sort descending by date so we get the newest first
        });

        const documentsByType: Record<string, any> = {
          financiere: sortedDocuments.find((doc) => documentMatchesType(doc, 'financiere')),
          technique: sortedDocuments.find((doc) => documentMatchesType(doc, 'technique')),
          cdc: sortedDocuments.find((doc) => documentMatchesType(doc, 'cdc')),
          evaluation_administrative: sortedDocuments.find((doc) => documentMatchesType(doc, 'evaluation_administrative')),
          evaluation_offre: sortedDocuments.find((doc) => documentMatchesType(doc, 'evaluation_offre')),
          decision_validation: sortedDocuments.find((doc) => documentMatchesType(doc, 'decision_validation')),
        };

        let evaluations: any[] = [];
        try {
          const { evaluationsApi } = await import('@/lib/api/evaluations');
          evaluations = await evaluationsApi.getSoumissionEvaluations(id);
        } catch (evalError) {
          console.warn(`Evaluations introuvables pour la soumission ${id}`, evalError);
        }

        let attribution = null;
        let operateurNom = null;
        let serviceNom = null;
        let attributionIdFromAppel = null;

        try {
          // Fetch from provisoires first
          const token = getAuthToken();
          const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
          const attrRes = await fetch(`/api/proxy/contrats?path=attributions-provisoires/?soumission_id=${id}`, {
            headers: authHeaders
          });
          if (attrRes.ok) {
            const attributions = await attrRes.json();
            attribution = attributions.find((a: any) => a.soumission_id === Number(id)) || attributions[0] || null;
          }

          // Fallback to definitives if not found
          if (!attribution) {
            const defRes = await fetch(`/api/proxy/contrats?path=attributions-definitives/?soumission_id=${id}`, {
              headers: authHeaders
            });
            if (defRes.ok) {
              const defAttributions = await defRes.json();
              attribution = defAttributions.find((a: any) => a.soumission_id === Number(id)) || defAttributions[0] || null;
            }
          }

          if (attribution) attributionIdFromAppel = attribution.id;
        } catch (attrError) {
          console.warn(`Attribution introuvable pour la soumission ${id}`, attrError);
        }


        try {
          if (soum?.id_soumissionnaire) {
            const opRes = await fetch(`/api/proxy/acteurs?path=operateurs-economiques/${soum.id_soumissionnaire}/`);
            if (opRes.ok) {
              const opData = await opRes.json();
              operateurNom = opData.nom_officiel || opData.nom;
            }
          }
        } catch (e) {
          console.warn(`Operateur introuvable`, e);
        }

        try {
          if (appel?.id_service_contractant) {
            const scRes = await fetch(`/api/proxy/contractant?path=services-contractants/${appel.id_service_contractant}/`);
            if (scRes.ok) {
              const scData = await scRes.json();
              serviceNom = scData.nom_service || scData.nom;
            }
          }
        } catch (e) {
          console.warn(`Service contractant introuvable`, e);
        }

        if (mounted) {
          setDossierData({
            soumission: soum,
            appelOffre: appel,
            documents,
            documentsByType,
            evaluations,
            attribution: attribution,
            operateurNom: operateurNom,
            serviceNom: serviceNom,
            validations: []
          });
        }
      } catch (err: any) {
        console.error('Error loading dossier data', err);
        if (mounted) {
          setLoadError(err?.message || String(err));
        }
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-gray-500 font-medium">Chargement des documents du dossier...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h2 className="mb-3 text-xl font-semibold">Erreur de chargement du dossier</h2>
        <p>{loadError}</p>
      </div>
    );
  }

  const isDefinitive = dossierData?.attribution?.statut === 'definitive';

  return (
    <div className="space-y-6">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} showDecision={isDefinitive || role === 'validator'} />

      <FileDetails
        activeTab={activeTab}
        role={role}
        data={dossierData}
        onDownload={(url) => {
          // Extract document ID from URL (e.g. http://localhost:8000/api/documents/1035/ -> 1035)
          const docIdMatch = url.match(/documents\/(\d+)/);
          if (!docIdMatch) {
            window.open(url, '_blank');
            return;
          }
          const docId = docIdMatch[1];
          const token = getAuthToken();
          const headers: Record<string, string> = { Accept: '*/*' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          fetch(`/api/proxy/documents?path=api/documents/${docId}/`, { headers })
            .then(res => {
              if (!res.ok) throw new Error(`Download failed: ${res.status}`);
              const contentDisposition = res.headers.get('content-disposition');
              const filenameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
              const filename = filenameMatch ? filenameMatch[1].replace(/['"]/g, '') : `document_${docId}.pdf`;
              return res.blob().then(blob => ({ blob, filename }));
            })
            .then(({ blob, filename }) => {
              const blobUrl = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = blobUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(blobUrl);
            })
            .catch(err => {
              console.error('Download error:', err);
              alert('Erreur lors du téléchargement du document');
            });
        }}
        onTransmit={() => console.log('Transmettre')}
        renderDocumentViewer={(url?: string) => (
          <DocumentViewer url={url} />
        )}
      />
    </div>
  );
}