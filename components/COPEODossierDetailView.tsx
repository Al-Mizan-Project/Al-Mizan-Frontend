'use client';

import { useState } from 'react';
import { Dossier } from '@/lib/dossiers-data';
import RegistreReceptionTab from '@/components/RegistreReceptionTab';
import SeanceOuvertureTab from '@/components/SeanceOuvertureTab';
import ConformiteTab from '@/components/ConformiteTab';
import CapacitesTab from '@/components/CapacitesTab';
import EvalTechniqueTab from '@/components/EvalTechniqueTab';
import EvalFinanciereTab from '@/components/EvalFinanciereTab';
import PrixAnomaliesTab from '@/components/PrixAnomaliesTab';
import ClassementTab from '@/components/ClassementTab';
import RapportCTTab from '@/components/RapportCTTab';
import PVTab from '@/components/PVTab';
import { EvaluationProvider, useEvaluation } from '@/lib/evaluation-context';

type Step = 'registre' | 'ouverture' | 'conformite' | 'capacites' | 'rapport-ct' | 'technique' | 'financiere' | 'prix-anomalies' | 'classement' | 'pv';

const STEPS: { id: Step; label: string; short: string }[] = [
  { id: 'registre',       label: '1. Registre',        short: 'Registre' },
  { id: 'ouverture',      label: '2. Ouverture',        short: 'Ouverture' },
  { id: 'conformite',     label: '3. Conformité',       short: 'Conformité' },
  { id: 'capacites',      label: '4. Capacités',        short: 'Capacités' },
  { id: 'rapport-ct', label: 'Rapport CT', short: 'Rapport CT' },
  { id: 'technique',      label: '5. Éval. Technique',  short: 'Technique' },
  { id: 'financiere',     label: '6. Éval. Financière', short: 'Financière' },
  { id: 'prix-anomalies', label: '7. Prix Anomalies',   short: 'Prix' },
  { id: 'classement',     label: '8. Classement',       short: 'Classement' },
  { id: 'pv',             label: '9. PV & Avis',        short: 'PV' },
];

const STEP_ORDER = STEPS.map(s => s.id);

interface Props { dossier: Dossier; onBack: () => void; currentMembreId: number; commissionId: number; }

function isStepUnlocked(step: Step, state: ReturnType<typeof useEvaluation>['state']): boolean {
  if (step === 'registre') return true;
  if (!state) return false;

  switch (step) {
    case 'ouverture':
      return state.registre.integrite_confirmed;
    case 'conformite':
      return !!(state.pvs?.ouverture as any)?.locked;
    case 'capacites':
      return state.conformites.length > 0;
    case 'rapport-ct':
      return true;
    case 'technique':
      return state.capacites.length > 0;
    case 'financiere':
      return state.evals_technique.length > 0;
    case 'prix-anomalies':
      return state.evals_financiere.length > 0;
    case 'classement':
      return state.evals_financiere.length > 0;
    case 'pv':
      return state.classement.length > 0;
    default:
      return true;
  }
}

function COPEODossierDetailViewInner({ dossier, onBack }: { dossier: Dossier; onBack: () => void }) {
  const [activeStep, setActiveStep] = useState<Step>('registre');
  const { state } = useEvaluation();

  return (
    <div className="flex flex-col gap-0 -mt-6 -mx-6">
      <div className="bg-white border-b border-gray-100 px-8 pt-6 pb-0">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#00738C] hover:text-[#1C4532] mb-3 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Retour aux dossiers
        </button>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00738C' }}>SÉANCE D'ÉVALUATION — COPEO</p>
        <h2 className="text-2xl font-black mb-4" style={{ color: '#1C4532' }}>
          {dossier.reference} &nbsp;<span className="text-gray-400 font-normal text-lg">{dossier.operateur}</span>
        </h2>

        <div className="flex items-center overflow-x-auto">
          {STEPS.map(step => {
            const unlocked = isStepUnlocked(step.id, state);
            const isActive = activeStep === step.id;
            const nextStep = STEP_ORDER[STEP_ORDER.indexOf(step.id) + 1];
            const done = nextStep ? isStepUnlocked(nextStep as Step, state) : false;

            return (
              <button
                key={step.id}
                onClick={() => unlocked && setActiveStep(step.id)}
                disabled={!unlocked}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold relative whitespace-nowrap transition-all duration-200 ${
                  !unlocked
                    ? 'text-gray-300 cursor-not-allowed'
                    : isActive
                      ? 'text-[#00738C]'
                      : 'text-gray-500 hover:text-[#1C4532]'
                }`}
              >
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {step.short}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#00738C' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-8 py-6">
        {activeStep === 'registre'       && <RegistreReceptionTab   dossier={dossier} />}
        {activeStep === 'ouverture'      && <SeanceOuvertureTab     dossier={dossier} />}
        {activeStep === 'conformite'     && <ConformiteTab          dossier={dossier} />}
        {activeStep === 'capacites'      && <CapacitesTab           dossier={dossier} />}
        {activeStep === 'rapport-ct' && <RapportCTTab dossier={dossier} />}
        {activeStep === 'technique'      && <EvalTechniqueTab       dossier={dossier} />}
        {activeStep === 'financiere'     && <EvalFinanciereTab      dossier={dossier} />}
        {activeStep === 'prix-anomalies' && <PrixAnomaliesTab       dossier={dossier} />}
        {activeStep === 'classement'     && <ClassementTab          dossier={dossier} />}
        {activeStep === 'pv'             && <PVTab                  dossier={dossier} />}
      </div>
    </div>
  );
}

export default function COPEODossierDetailView({ dossier, onBack, currentMembreId, commissionId }: Props) {
  return (
    <EvaluationProvider commissionId={String(commissionId)} currentMembreId={currentMembreId}>
      <COPEODossierDetailViewInner dossier={dossier} onBack={onBack} />
    </EvaluationProvider>
  );
}