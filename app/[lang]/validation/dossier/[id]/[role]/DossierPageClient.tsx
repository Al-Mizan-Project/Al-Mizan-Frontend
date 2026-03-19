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
      { }
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      { }
      <FileDetails 
        activeTab={activeTab} 
        role={role}
        onDownload={() => console.log('Télécharger')}
        onTransmit={() => console.log('Transmettre')}
         
        renderDocumentViewer={() => (
          <DocumentViewer
          />
        )}
      />
    </div>
  );
}