'use client';

import { useEffect, useState } from 'react';
import TabNavigation from '../../../components/dossier/TabNavigation';
import FileDetails from '../../../components/dossier/FileDetails';
import DocumentViewer from '../../../components/dossier/DocumentViewer';
import { soumissionsApi } from '@/lib/api/soumissions';
import { appelsApi } from '@/lib/api/appels';
import { evaluationsApi } from '@/lib/api/evaluations';
import { validationsApi } from '@/lib/api/validation';
import { documentsApi } from '@/lib/api/documents';
import { useValidationAuth } from '../../../context/ValidationAuthContext';

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

  const { token, user, isLoading: authLoading } = useValidationAuth();

  useEffect(() => {
    async function fetchDossier() {
      try {
        // 1. Soumission core data
        const soum = await soumissionsApi.getSoumission(id);

        // 2. Fetch parallel entities
        const [ao, evals, vals] = await Promise.all([
          appelsApi.getAppelOffre(soum.id_appel_offre),
          evaluationsApi.getSoumissionEvaluations(id),
          validationsApi.getSoumissionValidations(id)
        ]);

        // 3. Detailed document metadata
        const docs = await Promise.all(
          (soum.document_ids || []).map(docId => documentsApi.getDocument(Number(docId)))
        );

        setDossierData({
          soumission: soum,
          appelOffre: ao,
          evaluations: evals,
          validations: vals,
          documents: docs
        });
        setIsLoaded(true);
      } catch (err) {
        console.error("Erreur lors de la récupération du dossier:", err);
      }
    }

    if (id && !authLoading && token) fetchDossier();
  }, [id, token, authLoading]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-gray-500 font-medium">Chargement des documents du dossier...</p>
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