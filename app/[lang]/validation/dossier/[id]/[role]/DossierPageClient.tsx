'use client';

import { useState } from 'react';
import TabNavigation from '../../../components/dossier/TabNavigation';
import FileDetails from '../../../components/dossier/FileDetails';
import DocumentViewer from '../../../components/dossier/DocumentViewer';

type TabType = 'financial' | 'technical' | 'call' | 'reports' | 'decision';
type UserRole = 'commission' | 'validator';

interface DossierPageProps {
  role: UserRole;
}

export default function DossierPage({ role }: DossierPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('financial');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* FileDetails avec logique intégrée du DocumentViewer */}
      <FileDetails 
        activeTab={activeTab} 
        role={role}
        onDownload={() => console.log('Télécharger')}
        onTransmit={() => console.log('Transmettre')}
        // ← Fonction qui rend le DocumentViewer
        renderDocumentViewer={() => (
          <DocumentViewer
          />
        )}
      />
    </div>
  );
}