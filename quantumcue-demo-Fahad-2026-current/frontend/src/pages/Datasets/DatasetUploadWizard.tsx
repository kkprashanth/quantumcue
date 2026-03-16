import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Upload, Settings, FileText, Check, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/layout/PageContainer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
  DatasetUploadStep1,
  type DatasetUploadData,
} from '@/components/datasets/DatasetUploadStep1';
import { DatasetProcessingProgress } from '@/components/datasets/DatasetProcessingProgress';
import { DatasetUploadStep3Summary } from '@/components/datasets/DatasetUploadStep3Summary';
import {
  useCreateDataset,
  useUploadDataset,
  useProcessDataset,
  useDatasetProcessingStatus,
} from '@/hooks/useDatasets';
import { useDataset } from '@/hooks/useDatasets';
import type { DatasetCreate } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

const STEPS = [
  { id: 1, label: 'Upload Data', description: 'Upload your dataset file', icon: Upload },
  { id: 2, label: 'Processing', description: 'Processing dataset', icon: Loader },
  { id: 3, label: 'Summary', description: 'Review and complete', icon: FileText },
];

export const DatasetUploadWizard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNewProject = searchParams.get('new_project') === 'true';
  const urlStep = parseInt(searchParams.get('step') || '1', 10);
  const [currentStep, setCurrentStep] = useState(urlStep);
  const [wizardData, setWizardData] = useState<DatasetUploadData>({
    uploadedFile: null,
    fileFormat: null,
    dataType: null,
  });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createdDatasetId, setCreatedDatasetId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCreatingDataset, setIsCreatingDataset] = useState(false);
  const [datasetCreationError, setDatasetCreationError] = useState<string | null>(null);

  // Sync state step with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('step', currentStep.toString());
    setSearchParams(params, { replace: true });
  }, [currentStep, setSearchParams, searchParams]);

  const queryClient = useQueryClient();
  const createDataset = useCreateDataset();
  const uploadDataset = useUploadDataset();
  const processDataset = useProcessDataset();
  const { data: dataset, isLoading: datasetLoading, refetch: refetchDataset } = useDataset(createdDatasetId);

  const isZipFile = wizardData.fileFormat === 'zip';

  // Poll processing status during processing/summary steps (step 2 or 3)
  // This prevents unnecessary polling during the upload step
  const shouldPollStatus = (currentStep === 2 || currentStep === 3) && !!createdDatasetId;
  const { data: processingStatus, refetch: refetchProcessingStatus } = useDatasetProcessingStatus(
    shouldPollStatus ? createdDatasetId : null
  );
  const maxStep = STEPS.length;

  // Auto-navigate to summary when processing completes on step 2
  useEffect(() => {
    if (currentStep === 2 &&
      processingStatus?.processing_stage === 'completed' &&
      processingStatus?.status === 'ready' &&
      createdDatasetId) {
      // Invalidate and refetch dataset to get fresh data with statistics
      queryClient.invalidateQueries({ queryKey: ['dataset', createdDatasetId] });

      let timer: NodeJS.Timeout | null = null;
      refetchDataset().then(() => {
        // Wait a bit to ensure dataset is refetched before navigating
        timer = setTimeout(() => {
          setCurrentStep(3);
        }, 1500);
      }).catch((error) => {
        console.error('Failed to refetch dataset:', error);
        // Still navigate even if refetch fails - user can refresh manually
        timer = setTimeout(() => {
          setCurrentStep(3);
        }, 2000);
      });

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [currentStep, processingStatus?.processing_stage, processingStatus?.status, createdDatasetId, queryClient, refetchDataset]);

  // Prevent manual navigation to step 3 if processing isn't complete
  useEffect(() => {
    if (currentStep === 3 &&
      processingStatus &&
      processingStatus.processing_stage !== 'completed' &&
      processingStatus.status !== 'ready' &&
      createdDatasetId) {
      // Redirect back to step 2 if user somehow navigated to step 3 without completion
      console.warn('Processing not complete, redirecting to step 2');
      setCurrentStep(2);
    }
  }, [currentStep, processingStatus, createdDatasetId]);

  const updateWizardData = (updates: Partial<DatasetUploadData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  };

  // Auto-fill name from filename when file is uploaded
  useEffect(() => {
    if (wizardData.uploadedFile && !name) {
      const filenameWithoutExt = wizardData.uploadedFile.name.replace(/\.[^/.]+$/, '');
      setName(filenameWithoutExt);
    }
  }, [wizardData.uploadedFile, name]);

  const handleNext = async () => {
    if (currentStep < maxStep) {
      // For all file types moving from step 1 to step 2, create dataset first
      if (currentStep === 1 && !createdDatasetId) {
        if (!wizardData.uploadedFile || !name.trim()) {
          setDatasetCreationError('Please provide a dataset name and upload a file');
          return;
        }

        setIsCreatingDataset(true);
        setDatasetCreationError(null);

        try {
          // Create dataset record
          const datasetData: DatasetCreate = {
            name: name.trim(),
            description: description.trim() || undefined,
            file_path: `s3://quantumcue-data/temp/${wizardData.uploadedFile.name}`,
            file_size_bytes: wizardData.uploadedFile.size,
            file_format: (wizardData.fileFormat || 'csv') as 'csv' | 'json' | 'parquet' | 'images' | 'image_directory' | 'zip' | 'txt',
            data_type: (wizardData.dataType || 'structured') as 'structured' | 'unstructured' | 'images' | 'text' | 'mixed',
          };

          console.log('Creating dataset...', datasetData);
          const createdDataset = await createDataset.mutateAsync(datasetData);
          console.log('Dataset created:', createdDataset.id);
          setCreatedDatasetId(createdDataset.id);

          // Upload the file
          console.log('Uploading file...');
          await uploadDataset.mutateAsync({
            datasetId: createdDataset.id,
            file: wizardData.uploadedFile,
          });
          console.log('File uploaded');

          // Automatically start processing for all file types
          try {
            await processDataset.mutateAsync({
              datasetId: createdDataset.id,
              labelingStructure: {}
            });
          } catch (error) {
            console.error('Failed to start processing:', error);
          }

          // Move to processing step
          setCurrentStep(2);
        } catch (error) {
          console.error('Failed to create dataset:', error);
          setDatasetCreationError(
            error instanceof Error ? error.message : 'Failed to create dataset. Please try again.'
          );
        } finally {
          setIsCreatingDataset(false);
        }
      } else {
        // For other cases, just move to next step
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    navigate('/datasets');
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (createdDatasetId) {
      // If this is part of the "New Project" flow, navigate to job creation with dataset pre-selected
      if (isNewProject) {
        navigate(`/jobs/new?dataset_id=${createdDatasetId}`);
      } else {
        navigate(`/datasets/${createdDatasetId}`);
      }
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return !!wizardData.uploadedFile;
    }
    if (currentStep === 2) {
      // Step 2 is processing - can proceed if processing is complete
      return processingStatus?.processing_stage === 'completed' || processingStatus?.status === 'ready';
    }
    if (currentStep === 3) {
      // Step 3 is summary - can proceed if processing is complete
      return processingStatus?.processing_stage === 'completed' || processingStatus?.status === 'ready' || !isZipFile;
    }
    return false;
  };

  const isLoading = createDataset.isPending || uploadDataset.isPending || processDataset.isPending;
  const isProcessing = processingStatus?.processing_stage &&
    processingStatus.processing_stage !== 'completed' &&
    processingStatus.processing_stage !== 'error';

  return (
    <PageContainer
      title="Upload Dataset"
      description="Upload a new dataset to use in your quantum computing jobs"
    >
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between px-4 pb-12">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              const stepWords = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
              const stepWord = stepWords[index] || step.id.toString();

              return (
                <React.Fragment key={step.id}>
                  {/* Step Circle and Labels */}
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-300 relative
                        ${isActive
                          ? 'bg-navy-900 text-white ring-4 ring-navy-900/20 shadow-[0_0_15px_rgba(16,42,67,0.3)] scale-110'
                          : isCompleted
                            ? 'bg-navy-900 text-white'
                            : 'bg-white dark:bg-surface text-grey-400 dark:text-text-tertiary border-2 border-grey-300 dark:border-border'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="text-lg font-bold">{step.id}</span>
                      )}

                      {/* Labels positioned below the circle */}
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-32 text-center pointer-events-none">
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive || isCompleted ? 'text-navy-900 dark:text-navy-400' : 'text-grey-400 dark:text-text-tertiary'}`}>
                          {index === STEPS.length - 1 ? 'Final Step' : `Step ${stepWord}`}
                        </p>
                        <p className={`text-xs font-semibold whitespace-nowrap ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
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
                                    ? 'bg-navy-900 border-navy-900 text-white'
                                    : 'border-grey-300 dark:border-border text-grey-400 dark:text-text-tertiary opacity-40'
                                }
                              `}>
                                {lineState === 'completed' ? 'Completed' : lineState === 'in-progress' ? 'In Progress' : 'Pending'}
                              </div>
                            </div>

                            {/* Line */}
                            <div className={`h-[2px] w-full relative
                              ${lineState === 'completed' || lineState === 'in-progress' ? 'bg-navy-900' : 'bg-grey-200 dark:bg-border'}
                            `}>
                              {/* Central Dot */}
                              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-white dark:border-surface
                                ${lineState === 'completed' || lineState === 'in-progress' ? 'bg-navy-900' : 'bg-white dark:bg-surface'}
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
        </div>

        {/* Step Content */}
        <Card padding="lg">
          {currentStep === 1 && (
            <div className="space-y-6">
              <DatasetUploadStep1 data={wizardData} onUpdate={updateWizardData} />

              {/* Name and description input on step 1 */}
              {wizardData.uploadedFile && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="dataset-name" className="block text-sm font-medium text-text-primary mb-2">
                      Dataset Name <span className="text-status-error">*</span>
                    </label>
                    <input
                      id="dataset-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setName(newName);
                        // Auto-fill from filename if empty
                        if (!newName && wizardData.uploadedFile) {
                          const filenameWithoutExt = wizardData.uploadedFile.name.replace(/\.[^/.]+$/, '');
                          setName(filenameWithoutExt);
                        }
                      }}
                      placeholder={wizardData.uploadedFile ? wizardData.uploadedFile.name.replace(/\.[^/.]+$/, '') : "Enter dataset name"}
                      required
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary"
                    />
                  </div>
                  <div>
                    <label htmlFor="dataset-description" className="block text-sm font-medium text-text-primary mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="dataset-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a description for this dataset (optional)"
                      rows={3}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Loading state when creating dataset */}
              {isCreatingDataset && (
                <div className="p-4 bg-bg-secondary rounded-lg border border-border-primary">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy-700"></div>
                    <p className="text-sm text-text-secondary">Creating dataset and uploading file...</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {datasetCreationError && (
                <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
                  <p className="text-sm text-status-error">{datasetCreationError}</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {createdDatasetId ? (
                <>
                  <DatasetProcessingProgress
                    datasetId={createdDatasetId}
                    onComplete={() => {
                      // Processing complete, can proceed
                    }}
                    onError={(error) => {
                      console.error('Processing error:', error);
                    }}
                  />

                  {processingStatus?.status === 'error' && (
                    <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
                      <p className="text-status-error">
                        Processing failed. Please check the errors above and try again.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary">
                    Processing will begin after you upload the file.
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {datasetLoading ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary mb-2">Loading dataset data...</p>
                  <p className="text-text-tertiary text-sm">Fetching processed statistics and metadata.</p>
                </div>
              ) : dataset && (processingStatus?.processing_stage === 'completed' || processingStatus?.status === 'ready' || !isZipFile) ? (
                // Show summary if dataset has been processed and has statistics, or for non-ZIP files
                dataset.statistics && (dataset.statistics.total_records || dataset.statistics.total_patients) ? (
                  <DatasetUploadStep3Summary dataset={dataset} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-text-secondary mb-2">Processing completed, but statistics are not yet available.</p>
                    <p className="text-text-tertiary text-sm mb-4">Please wait while we fetch the processed data, or try refreshing.</p>
                    <Button
                      onClick={() => refetchDataset()}
                      variant="secondary"
                    >
                      Refresh Data
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary">Please complete processing before viewing the summary.</p>
                  {processingStatus && (
                    <p className="text-text-tertiary text-sm mt-2">
                      Status: {processingStatus.status}, Stage: {processingStatus.processing_stage || 'unknown'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            onClick={currentStep === 1 ? handleCancel : handleBack}
            variant="secondary"
            disabled={isLoading || !!isProcessing}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-3">
            {currentStep < maxStep ? (
              <Button
                onClick={async () => {
                  if (currentStep === 2) {
                    // Only allow navigation if processing is complete
                    if (processingStatus?.processing_stage === 'completed' && processingStatus?.status === 'ready') {
                      setCurrentStep(3);
                    } else {
                      // Processing not complete - prevent navigation
                      console.warn('Processing not complete, cannot proceed to summary');
                      return;
                    }
                  } else {
                    handleNext();
                  }
                }}
                disabled={
                  (currentStep === 2 &&
                    (processingStatus?.processing_stage !== 'completed' || processingStatus?.status !== 'ready'))
                  || !canProceed()
                  || isLoading
                  || !!isProcessing
                }
                rightIcon={currentStep === 2 && processingStatus?.processing_stage === 'completed' ? undefined : <ChevronRight className="w-4 h-4" />}
                isLoading={isLoading || (currentStep === 2 && !!isProcessing)}
              >
                {currentStep === 2
                  ? (processingStatus?.processing_stage === 'completed' && processingStatus?.status === 'ready'
                    ? 'View Summary'
                    : isProcessing
                      ? 'Processing...'
                      : 'Waiting for Processing...')
                  : 'Next'}
              </Button>
            ) : (
              <Button
                onClick={handleFinalSubmit}
                disabled={!canProceed() || isLoading || !!isProcessing}
                isLoading={isLoading}
              >
                Save Dataset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Upload"
        message="Are you sure you want to cancel? Your uploaded file will be lost."
        confirmLabel="Yes, Cancel"
        cancelLabel="Continue Upload"
        variant="warning"
      />
    </PageContainer>
  );
};

export default DatasetUploadWizard;
