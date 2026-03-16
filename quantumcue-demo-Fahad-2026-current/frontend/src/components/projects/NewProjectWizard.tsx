/**
 * Multi-step new project wizard component for first-time users.
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Upload, Target, Server, Settings, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { NewProjectWizardStep1Upload } from './NewProjectWizardStep1Upload';
import { NewProjectWizardStep2ProblemType } from './NewProjectWizardStep2ProblemType';
import { NewProjectWizardStep3Provider } from './NewProjectWizardStep3Provider';
import { NewProjectWizardStep4Config } from './NewProjectWizardStep4Config';
import { NewProjectWizardStep5Review } from './NewProjectWizardStep5Review';
import { NewProjectWizardStep6Completed } from './NewProjectWizardStep6Completed';
import { estimateJobCost } from '../../api/endpoints/jobs';
import type { JobType, JobPriority } from '../../api/endpoints/jobs';

export interface NewProjectWizardData {
  // Step 1: Data Upload
  uploadedFile: File | null;
  fileFormat: string | null;
  fileSize: number | null;
  description: string | null;
  dataset_id: string | null;

  // Step 2: Problem Type
  job_type: JobType;
  name: string;
  // description: string; // Removed duplicate

  // Step 3: Provider
  provider_id: string | null;

  // Step 4: Configuration
  priority: JobPriority;
  shot_count: number;
  optimization_level: number;
  qubit_count_requested: number | null;
  parameters: Record<string, unknown>;
  classes: string[];
  num_of_classes: number;

  // Step 5: Review (calculated)
  cost_min_est: number | null;
  cost_max_est: number | null;

  // Step 6: Completed
  job_id?: string;
}

const STEPS = [
  {
    id: 1,
    label: 'Data Upload',
    description: 'Upload your dataset',
    icon: Upload
  },
  {
    id: 2,
    label: 'Problem Type',
    description: 'Define the job type and details',
    icon: Target
  },
  {
    id: 3,
    label: 'Provider',
    description: 'Select quantum provider',
    icon: Server
  },
  {
    id: 4,
    label: 'Configuration',
    description: 'Configure job parameters',
    icon: Settings
  },
  {
    id: 5,
    label: 'Review',
    description: 'Review and submit',
    icon: FileText
  },
  {
    id: 6,
    label: 'Completed',
    description: 'Project created',
    icon: Check
  },
];

interface NewProjectWizardProps {
  onComplete: (data: NewProjectWizardData) => Promise<string | void>;
  onCancel?: () => void;
  onNavigationReady?: (handlers: {
    handleNext: () => void;
    handleBack: () => void;
    handleSubmit: () => Promise<void>;
    handleRestart: () => void;
    canProceed: () => boolean;
    currentStep: number;
    totalSteps: number;
  }) => void;
  navigationHandlers?: {
    handleNext: () => void;
    handleBack: () => void;
    handleSubmit: () => Promise<void>;
    handleRestart: () => void;
    canProceed: () => boolean;
    currentStep: number;
    totalSteps: number;
  } | null;
  isSubmitting?: boolean;
}

export const NewProjectWizard = ({ onComplete, onCancel, onNavigationReady, navigationHandlers, isSubmitting = false }: NewProjectWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<NewProjectWizardData>({
    uploadedFile: null,
    fileFormat: null,
    fileSize: null,
    description: null,
    dataset_id: null,
    job_type: 'machine_learning', // Default to machine_learning
    name: '',
    // description: '', // Removed duplicate
    provider_id: null,
    priority: 'normal',
    shot_count: 1000,
    optimization_level: 1,
    qubit_count_requested: null,
    parameters: {},
    classes: ['Class 1'],
    num_of_classes: 1,
    cost_min_est: null,
    cost_max_est: null,
  });

  const updateWizardData = (updates: Partial<NewProjectWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  // Calculate cost estimate when provider and parameters are available
  useEffect(() => {
    const calculateCost = async () => {
      if (wizardData.provider_id && wizardData.job_type && wizardData.fileSize) {
        try {
          const dataSizeMb = Math.round((wizardData.fileSize / (1024 * 1024)) * 100) / 100;

          const estimate = await estimateJobCost({
            provider_id: wizardData.provider_id,
            job_type: wizardData.job_type,
            shots: wizardData.shot_count,
            qubits: wizardData.qubit_count_requested || undefined,
            epochs: wizardData.job_type === 'machine_learning' ? 50 : undefined,
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
    calculateCost();
  }, [wizardData.provider_id, wizardData.job_type, wizardData.shot_count, wizardData.qubit_count_requested, wizardData.fileSize]);

  const maxStep = STEPS.length;

  const handleNext = () => {
    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    // Reset to step 1 and clear all wizard data
    setCurrentStep(1);
    setWizardData({
      uploadedFile: null,
      fileFormat: null,
      fileSize: null,
      description: null,
      dataset_id: null,
      job_type: 'machine_learning',
      name: '',
      // description: '', // Removed duplicate
      provider_id: null,
      priority: 'normal',
      shot_count: 1000,
      optimization_level: 1,
      qubit_count_requested: null,
      parameters: {},
      classes: ['Class 1'],
      num_of_classes: 1,
      cost_min_est: null,
      cost_max_est: null,
    });
  };

  const handleSubmit = async () => {
    try {
      const result = await onComplete(wizardData);
      if (typeof result === 'string') {
        updateWizardData({ job_id: result });
      }
      setCurrentStep(6);
    } catch (error) {
      console.error('Wizard submission error:', error);
    }
  };

  const isStepComplete = (step: number): boolean => {
    // Only mark a step as complete if the user has reached or passed that step
    if (currentStep < step) {
      return false;
    }

    switch (step) {
      case 1:
        return (!!wizardData.uploadedFile && !!wizardData.fileFormat && !!wizardData.fileSize) || !!wizardData.dataset_id;
      case 2:
        return !!wizardData.job_type && !!wizardData.name.trim();
      case 3:
        return !!wizardData.provider_id;
      case 4:
        return true; // Configuration is always valid (has defaults)
      case 5:
        return true; // Review step is always complete
      default:
        return false;
    }
  };

  const canProceed = (): boolean => {
    return isStepComplete(currentStep);
  };

  // Expose navigation handlers to parent
  useEffect(() => {
    if (onNavigationReady) {
      onNavigationReady({
        handleNext,
        handleBack,
        handleSubmit,
        handleRestart,
        canProceed,
        currentStep,
        totalSteps: maxStep,
      });
    }
  }, [currentStep, wizardData, onNavigationReady, maxStep]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <NewProjectWizardStep1Upload
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 2:
        return (
          <NewProjectWizardStep2ProblemType
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 3:
        return (
          <NewProjectWizardStep3Provider
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 4:
        return (
          <NewProjectWizardStep4Config
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 5:
        return (
          <NewProjectWizardStep5Review
            data={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 6:
        return (
          <NewProjectWizardStep6Completed
            jobId={wizardData.job_id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between px-4 pb-12">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isComplete = isStepComplete(step.id);
          const isPast = currentStep > step.id;
          const isClickable = isPast;

          // const stepWords = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
          // const stepWord = stepWords[index] || step.id.toString();

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle and Labels */}
              <div className="flex flex-col items-center relative z-10">
                <button
                  onClick={() => isClickable && setCurrentStep(step.id)}
                  disabled={!isClickable}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300 relative
                    ${step.id === 6 && isActive
                      ? 'bg-success-500 text-white ring-4 ring-success-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-110'
                      : isActive
                        ? 'bg-[#3850A0] text-white ring-4 ring-navy-600/20 shadow-[0_0_15px_rgba(16,42,67,0.3)] scale-110'
                        : isPast
                          ? 'bg-[#3850A0] text-white cursor-pointer hover:bg-navy-800'
                          : 'bg-white dark:bg-surface text-grey-400 dark:text-text-tertiary border-2 border-grey-300 dark:border-border cursor-not-allowed'
                    }
                  `}
                >
                  {isPast || step.id === 6 ? (
                    <Check className={`w-6 h-6 ${(step.id === 6 && isActive) ? 'animate-scale-pop' : ''}`} />
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
                </button>
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
                                ? 'bg-[#3850A0] border-[#3850A0] text-white'
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
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white dark:border-surface
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
      {currentStep === 6 ? (
        <div>
          {renderStepContent()}
        </div>
      ) : (
        <Card className="p-6">
          {renderStepContent()}
        </Card>
      )}

      {/* Bottom Navigation Buttons */}
      {navigationHandlers && currentStep < 6 && (
        <div className="flex items-center justify-between pt-4 border-t border-grey-200 dark:border-border">
          <div>
            <Button variant="secondary" onClick={navigationHandlers.handleBack}>
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {navigationHandlers.currentStep < navigationHandlers.totalSteps - 1 ? (
              <Button
                onClick={navigationHandlers.handleNext}
                disabled={!navigationHandlers.canProceed()}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={navigationHandlers.handleSubmit}
                disabled={!navigationHandlers.canProceed() || isSubmitting}
                variant="primary"
                isLoading={isSubmitting}
              >
                Submit Project
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
