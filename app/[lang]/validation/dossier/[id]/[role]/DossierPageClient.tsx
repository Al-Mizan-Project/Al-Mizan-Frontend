'use client';

import { useState, useEffect } from 'react';
import TabNavigation from '../../../components/dossier/TabNavigation';
import FileDetails from '../../../components/dossier/FileDetails';
import DocumentViewer from '../../../components/dossier/DocumentViewer';
import { soumissionsApi } from '@/lib/api/soumissions';
import { appelsApi } from '@/lib/api/appels';
import { documentsApi } from '@/lib/api/documents';

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

        const documentsByType: Record<string, any> = {
          financiere: documents.find((doc) => documentMatchesType(doc, 'financiere')),
          technique: documents.find((doc) => documentMatchesType(doc, 'technique')),
          cdc: documents.find((doc) => documentMatchesType(doc, 'cdc')),
          evaluation_administrative: documents.find((doc) => documentMatchesType(doc, 'evaluation_administrative')),
          evaluation_offre: documents.find((doc) => documentMatchesType(doc, 'evaluation_offre')),
          decision_validation: documents.find((doc) => documentMatchesType(doc, 'decision_validation')),
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
          // If we can't get it by user_id, let's fetch by soumission_id directly from the provisoirs endpoint
          const attrRes = await fetch(`/api/proxy/contrats?path=attributions-provisoires/?soumission_id=${id}`);
          if (attrRes.ok) {
            const attributions = await attrRes.json();
            attribution = attributions.find((a: any) => a.soumission_id === Number(id)) || attributions[0] || null;
            if (attribution) attributionIdFromAppel = attribution.id;
          }
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

  return (
    <div className="space-y-6">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <FileDetails
        activeTab={activeTab}
        role={role}
        data={dossierData}
        onDownload={(url) => window.open(url, '_blank')}
        onTransmit={() => console.log('Transmettre')}
        renderDocumentViewer={(url?: string) => (
          <DocumentViewer url={url} />
        )}
      />
    </div>
  );
}