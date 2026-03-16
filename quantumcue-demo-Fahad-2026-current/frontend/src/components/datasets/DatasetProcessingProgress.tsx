/**
 * Dataset Processing Progress Component
 */

import { useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Upload, Search, FileText, Check } from 'lucide-react';
import { useDatasetProcessingStatus } from '@/hooks/useDatasets';

interface DatasetProcessingProgressProps {
  datasetId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

type ProcessingStage = 'uploading' | 'analyzing' | 'parsing' | 'completed' | 'error' | null;

const STAGES: Array<{ id: ProcessingStage; label: string; icon: typeof Upload; progress: number }> = [
  { id: 'uploading', label: 'Uploading', icon: Upload, progress: 25 },
  { id: 'analyzing', label: 'Analyzing', icon: Search, progress: 50 },
  { id: 'parsing', label: 'Parsing', icon: FileText, progress: 75 },
  { id: 'completed', label: 'Completed', icon: Check, progress: 100 },
];

export const DatasetProcessingProgress = ({
  datasetId,
  onComplete,
  onError,
}: DatasetProcessingProgressProps) => {
  const { data: status, isLoading } = useDatasetProcessingStatus(datasetId);

  const currentStage = status?.processing_stage as ProcessingStage;
  const datasetStatus = status?.status;
  const isError = datasetStatus === 'error';

  // If stage is null but status is uploading/processing, default to uploading
  const effectiveStage: ProcessingStage = currentStage ||
    (datasetStatus === 'uploading' ? 'uploading' :
      datasetStatus === 'processing' ? 'analyzing' :
        null);

  useEffect(() => {
    if (effectiveStage === 'completed' && onComplete) {
      onComplete();
    }
    if (isError && onError) {
      onError(status?.validation_errors?.errors?.[0] || 'Processing failed');
    }
  }, [effectiveStage, isError, onComplete, onError, status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-navy-700" />
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.id === effectiveStage);
  const isCompleted = effectiveStage === 'completed';
  // Calculate progress - use 100 if completed, otherwise use stage progress
  // If no stage is set but status indicates processing, show minimal progress
  const progress = isCompleted
    ? 100
    : (currentStageIndex >= 0
      ? STAGES[currentStageIndex].progress
      : (datasetStatus === 'uploading' || datasetStatus === 'processing' ? 10 : 0));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-2">Processing Status</h3>
        <p className="text-sm text-text-secondary">
          {isCompleted
            ? 'Processing completed successfully! You can now view the summary.'
            : 'Your dataset is being processed. This may take a few moments.'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-4">
        <div className="relative h-2 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-navy-700 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Indicators */}
        <div className="grid grid-cols-4 gap-4">
          {STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = effectiveStage === stage.id;
            const isStageCompleted = currentStageIndex > index || isCompleted;
            const isPending = currentStageIndex < index && !isCompleted;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all
                    ${isError
                      ? 'bg-status-error/20 border-2 border-status-error'
                      : isStageCompleted
                        ? 'bg-navy-400 border-2 border-navy-400'
                        : isActive
                          ? 'bg-navy-500 border-2 border-navy-500 shadow-lg shadow-navy-500/50'
                          : 'bg-bg-secondary border-2 border-border-primary'
                    }
                  `}
                >
                  {isError && stage.id === 'error' ? (
                    <XCircle className="w-6 h-6 text-status-error" />
                  ) : isStageCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <StageIcon className="w-6 h-6 text-text-tertiary" />
                  )}
                </div>
                <p
                  className={`mt-2 text-xs font-medium text-center transition-colors ${isActive
                    ? 'text-navy-600 font-semibold'
                    : isStageCompleted
                      ? 'text-navy-500 font-medium'
                      : 'text-text-tertiary'
                    }`}
                >
                  {stage.label}
                </p>
                {isActive && (
                  <div className="mt-1 w-2 h-2 rounded-full bg-navy-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {isError && status?.validation_errors && (
        <div className="p-4 bg-status-error/10 border border-status-error/20 rounded-lg">
          <h4 className="text-sm font-medium text-status-error mb-2">Processing Errors</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
            {status.validation_errors.errors?.map((error: string, index: number) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          {status.validation_errors.warnings && status.validation_errors.warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-status-error/20">
              <h5 className="text-sm font-medium text-text-primary mb-1">Warnings</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                {status.validation_errors.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Current Stage Info */}
      {effectiveStage && !isError && effectiveStage !== 'completed' && (
        <div className="p-4 bg-bg-secondary rounded-lg">
          <p className="text-sm text-text-secondary">
            Current stage: <span className="font-medium text-text-primary capitalize">{effectiveStage}</span>
            {!currentStage && datasetStatus && (
              <span className="text-text-tertiary ml-2">(Status: {datasetStatus})</span>
            )}
          </p>
        </div>
      )}

      {/* Show message when processing but no stage set yet */}
      {!effectiveStage && (datasetStatus === 'uploading' || datasetStatus === 'processing') && (
        <div className="p-4 bg-bg-secondary rounded-lg">
          <p className="text-sm text-text-secondary">
            Processing is starting... Please wait while we initialize.
          </p>
        </div>
      )}

      {/* Completed State */}
      {isCompleted && !isError && (
        <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-status-success flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-status-success mb-1">
                Processing Completed Successfully
              </p>
              <p className="text-xs text-text-secondary">
                Your dataset has been processed and is ready for review.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

