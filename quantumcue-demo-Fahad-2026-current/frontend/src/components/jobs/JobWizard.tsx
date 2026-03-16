/**
 * Multi-step job creation wizard component.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Database, Target, Server, Settings, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { JobWizardStep1Upload } from './JobWizardStep1Upload';
import { JobWizardStep2ProblemType } from './JobWizardStep2ProblemType';
import { JobWizardStep3DataReview } from './JobWizardStep3DataReview';
import { JobWizardStep4Provider } from './JobWizardStep4Provider';
import { JobWizardStep5Config } from './JobWizardStep5Config';
import { JobWizardStep6Review } from './JobWizardStep6Review';
import { estimateJobCost } from '../../api/endpoints/jobs';
import { useDataset } from '../../hooks/useDatasets';
import type { JobType, JobPriority } from '../../api/endpoints/jobs';
import type { Dataset } from '../../types';

export interface JobWizardData {
  // Step 1: Upload
  dataset: Dataset | null;
  uploadedFile: File | null;

  // Step 2: Problem Type
  job_type: JobType;
  name: string;
  description: string;

  // Step 3: Data Review
  dataset_id: string | null;
  input_data_type: string | null;
  input_data_ref: string | null;

  // Step 4: Provider
  provider_id: string | null;

  // Step 5: Configuration
  priority: JobPriority;
  shot_count: number;
  optimization_level: number;
  qubit_count_requested: number | null;
  parameters: Record<string, unknown>;

  // Step 6: Review (calculated)
  cost_min_est: number | null;
  cost_max_est: number | null;
}

const STEPS = [
  {
    id: 1,
    label: 'Select Dataset',
    description: 'Choose a dataset for training',
    icon: Database
  },
  {
    id: 2,
    label: 'Problem Type',
    description: 'Define the job type and details',
    icon: Target
  },
  {
    id: 3,
    label: 'Data Review',
    description: 'Review dataset structure',
    icon: Database
  },
  {
    id: 4,
    label: 'Provider',
    description: 'Select quantum provider',
    icon: Server
  },
  {
    id: 5,
    label: 'Configuration',
    description: 'Configure job parameters',
    icon: Settings
  },
  {
    id: 6,
    label: 'Review',
    description: 'Review and submit',
    icon: FileText
  },
];

interface JobWizardProps {
  onComplete: (data: JobWizardData) => Promise<void>;
  onCancel?: () => void;
  preselectedDatasetId?: string;
  onNavigationReady?: (handlers: {
    handleNext: () => void;
    handleBack: () => void;
    handleSubmit: () => Promise<void>;
    canProceed: () => boolean;
    currentStep: number;
    totalSteps: number;
  }) => void;
}

export const JobWizard = ({ onComplete, onCancel, preselectedDatasetId, onNavigationReady }: JobWizardProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStep = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState(urlStep);
  const [wizardData, setWizardData] = useState<JobWizardData>({
    dataset: null,
    uploadedFile: null,
    job_type: 'optimization',
    name: '',
    description: '',
    dataset_id: preselectedDatasetId || null,
    input_data_type: null,
    input_data_ref: null,
    provider_id: null,
    priority: 'normal',
    shot_count: 1000,
    optimization_level: 1,
    qubit_count_requested: null,
    parameters: {},
    cost_min_est: null,
    cost_max_est: null,
  });

  // Fetch pre-selected dataset if ID is provided
  const { data: preselectedDataset } = useDataset(preselectedDatasetId || null);

  // Update wizard data when pre-selected dataset is loaded
  useEffect(() => {
    if (preselectedDataset && !wizardData.dataset) {
      updateWizardData({
        dataset: preselectedDataset,
        dataset_id: preselectedDataset.id,
      });
    }
  }, [preselectedDataset, wizardData.dataset]);

  // Sync state step with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('step', currentStep.toString());
    setSearchParams(params, { replace: true });
  }, [currentStep, setSearchParams, searchParams]);

  const updateWizardData = (updates: Partial<JobWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  // Calculate cost estimate when provider and parameters are available
  useEffect(() => {
    const calculateCost = async () => {
      if (wizardData.provider_id && wizardData.job_type) {
        try {
          const dataSizeMb = wizardData.dataset
            ? Math.round((wizardData.dataset.file_size_bytes / (1024 * 1024)) * 100) / 100 // Round to 2 decimal places
            : undefined;

          const estimate = await estimateJobCost({
            provider_id: wizardData.provider_id,
            job_type: wizardData.job_type,
            shots: wizardData.shot_count,
            qubits: wizardData.qubit_count_requested || undefined,
            epochs: wizardData.job_type === 'machine_learning' ? 50 : undefined, // Default epochs for ML
            data_size_mb: dataSizeMb,
          });

          updateWizardData({
            cost_min_est: estimate.min,
            cost_max_est: estimate.max,
          });
        } catch (error) {
          console.error('Failed to estimate cost:', error);
        }
      }
    };

    // Calculate cost when provider is selected (step 4+) or parameters change
    if (wizardData.provider_id && currentStep >= 4) {
      calculateCost();
    }
  }, [wizardData.provider_id, wizardData.job_type, wizardData.shot_count, wizardData.qubit_count_requested, wizardData.dataset, currentStep]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.dataset !== null || wizardData.uploadedFile !== null;
      case 2:
        return wizardData.job_type !== null && wizardData.name.trim() !== '';
      case 3:
        return wizardData.dataset_id !== null;
      case 4:
        return wizardData.provider_id !== null;
      case 5:
        return true; // Configuration is optional
      case 6:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (canProceed()) {
      await onComplete(wizardData);
    }
  };

  // Expose navigation handlers to parent component
  useEffect(() => {
    if (onNavigationReady) {
      onNavigationReady({
        handleNext,
        handleBack,
        handleSubmit,
        canProceed,
        currentStep,
        totalSteps: STEPS.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, wizardData]);

  const isStepComplete = (step: number) => {
    // Only mark a step as complete if the user has reached or passed that step
    if (currentStep < step) {
      return false;
    }

    // Now check if the step's requirements are met
    switch (step) {
      case 1:
        return wizardData.dataset_id !== null || wizardData.uploadedFile !== null;
      case 2:
        return wizardData.job_type !== null && wizardData.name.trim() !== '';
      case 3:
        return wizardData.dataset_id !== null;
      case 4:
        return wizardData.provider_id !== null;
      case 5:
        // Configuration step is always considered complete once reached
        return currentStep >= 5;
      case 6:
        // Review step is always considered complete once reached
        return currentStep >= 6;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <JobWizardStep1Upload
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 2:
        return (
          <JobWizardStep2ProblemType
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 3:
        return (
          <JobWizardStep3DataReview
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 4:
        return (
          <JobWizardStep4Provider
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 5:
        return (
          <JobWizardStep5Config
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 6:
        return (
          <JobWizardStep6Review
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 relative top-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4 pb-12">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isComplete = isStepComplete(step.id);
          const isPast = currentStep > step.id;

          const stepWords = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
          const stepWord = stepWords[index] || step.id.toString();

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle and Labels */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`
                    w-12 h-12 rounded-none flex items-center justify-center
                    transition-all duration-300 relative
                    ${isActive
                      ? 'bg-navy-600 text-white ring-4 ring-navy-600/20 shadow-[0_0_15px_rgba(16,42,67,0.3)] scale-110'
                      : isPast
                        ? 'bg-navy-600 text-white'
                        : 'bg-white dark:bg-surface text-grey-400 dark:text-text-tertiary border-2 border-grey-300 dark:border-border'
                    }
                  `}
                >
                  {isPast ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-bold">{step.id}</span>
                  )}

                  {/* Labels positioned below the circle */}
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 w-32 text-center pointer-events-none">
                    {/* <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive || isPast ? 'text-navy-600 dark:text-navy-400' : 'text-grey-400 dark:text-text-tertiary'}`}>
                      {index === STEPS.length - 1 ? 'Final Step' : `Step ${stepWord}`}
                    </p> */}
                    <p className={`text-xs font-semibold whitespace-nowrap ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connecting Line with Badge and Dot */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 relative flex items-center h-12">
                  {(() => {
                    const lineState = index + 1 < currentStep ? 'completed' : index + 1 === currentStep ? 'in-progress' : 'pending';
                    return (
                      <div className="w-full flex items-center">
                        {/* Badge */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 transition-opacity duration-300">
                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all whitespace-nowrap
                            ${lineState === 'completed'
                              ? 'bg-success-500/10 border-success-500/30 text-success-600 dark:text-success-400'
                              : lineState === 'in-progress'
                                ? 'bg-navy-600 border-navy-600 text-white'
                                : 'border-grey-300 dark:border-border text-grey-400 dark:text-text-tertiary opacity-40'
                            }
                          `}>
                            {lineState === 'completed' ? 'Completed' : lineState === 'in-progress' ? 'In Progress' : 'Pending'}
                          </div>
                        </div>

                        {/* Line */}
                        <div className={`h-[2px] w-full relative
                          ${lineState === 'completed' || lineState === 'in-progress' ? 'bg-navy-600' : 'bg-grey-200 dark:bg-border'}
                        `}>
                          {/* Central Dot */}
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-none border border-white dark:border-surface
                            ${lineState === 'completed' || lineState === 'in-progress' ? 'bg-navy-600' : 'bg-white dark:bg-surface'}
                          `} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card padding="lg">
        {renderStepContent()}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              Submit Job
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobWizard;
