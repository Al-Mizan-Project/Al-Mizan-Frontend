'use client';

type TabType = 'financial' | 'technical' | 'call' | 'reports' | 'decision';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  dict?: any;
  lang?: string;
  showDecision?: boolean;
}

const tabs = [
  { id: 'financial' as TabType, key: 'financial', defaultLabel: 'Offre Financière' },
  { id: 'technical' as TabType, key: 'technical', defaultLabel: 'Offre Technique' },
  { id: 'call' as TabType, key: 'call', defaultLabel: "Appel d'Offre" },
  { id: 'reports' as TabType, key: 'reports', defaultLabel: "Rapports d'évaluation" },
  { id: 'decision' as TabType, key: 'decision', defaultLabel: 'Décision de Validation' },
];

export default function TabNavigation({ 
  activeTab, 
  onTabChange, 
  dict,
  lang,
  showDecision = true
}: TabNavigationProps) {
  const isAr = lang === 'ar';

  return (
    <div className="val-tabs-container">
      <div className={`flex items-center gap-6 ${isAr ? 'flex-row-reverse' : ''}`}>
        {tabs.filter(tab => showDecision || tab.id !== 'decision').map((tab) => {
          const isActive = activeTab === tab.id;
          const label = dict?.dossier?.tabs?.[tab.key] || tab.defaultLabel;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={isActive ? 'val-tab-active' : 'val-tab-inactive'}
            >
              <span 
                className={isActive ? 'val-tab-active-text' : 'val-tab-inactive-text'}
                style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Roboto, sans-serif' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}