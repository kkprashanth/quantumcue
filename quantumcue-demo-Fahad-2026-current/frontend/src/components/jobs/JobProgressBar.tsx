/**
 * Job Progress Bar Component
 * Shows progress through job stages with estimated time and percentage complete
 */

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import type { JobStatus } from '@/api/endpoints/jobs';

interface JobProgressBarProps {
  status: JobStatus;
  submittedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  progressPercentage: number | null;
  jobType: string;
  jobMetadata?: Record<string, unknown> | null;
}

interface Stage {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
}

const STAGE_WEIGHTS: Record<string, number> = {
  transforming_input: 10,
  transforming_input_progress: 20, // Intermediate stage
  queued: 30,
  queued_waiting: 40, // Intermediate stage
  executing: 50,
  executing_progress: 70, // Intermediate stage
  translating: 80,
  translating_progress: 90, // Intermediate stage
  completed: 100,
};

const ESTIMATED_STAGE_DURATIONS: Record<string, number> = {
  transforming_input: 1200, // ~1.2 seconds (15% of 8s)
  queued: 1600, // ~1.6 seconds (20% of 8s)
  executing: 3120, // ~3.1 seconds (60% of 5.2s running time)
  translating: 2080, // ~2.1 seconds (40% of 5.2s running time)
  completed: 0,
};

export const JobProgressBar = ({
  status,
  submittedAt,
  startedAt,
  completedAt,
  progressPercentage,
  jobType,
  jobMetadata,
}: JobProgressBarProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTotalTime, setEstimatedTotalTime] = useState(0);

  // Get current stage from metadata (with safe defaults)
  const currentStage: string | undefined = jobMetadata?.current_stage as string | undefined;
  const stageProgress: number = (jobMetadata?.stage_progress as number | undefined) || 0;

  // Calculate elapsed time
  useEffect(() => {
    if (completedAt) {
      // Job is done, calculate total time
      const start = submittedAt ? new Date(submittedAt).getTime() : Date.now();
      const end = new Date(completedAt).getTime();
      setElapsedTime(end - start);
      setEstimatedTotalTime(end - start);
      return;
    }

    const interval = setInterval(() => {
      const start = submittedAt ? new Date(submittedAt).getTime() : Date.now();
      const now = Date.now();
      setElapsedTime(now - start);
    }, 1000);

    return () => clearInterval(interval);
  }, [submittedAt, completedAt]);

  // Calculate estimated total time based on current stage (8-10 seconds total)
  useEffect(() => {
    if (completedAt) {
      const start = submittedAt ? new Date(submittedAt).getTime() : Date.now();
      const end = new Date(completedAt).getTime();
      setEstimatedTotalTime(end - start);
      return;
    }

    const now = Date.now();
    const submitted = submittedAt ? new Date(submittedAt).getTime() : now;
    const totalElapsed = now - submitted;

    // Total estimated time: 8-10 seconds
    const totalEstimated = 9000; // Average of 8-10 seconds

    if (status === 'pending') {
      // Estimate: transforming (1.2s) + queued (1.6s) + executing (3.1s) + translating (2.1s) = ~8s
      setEstimatedTotalTime(totalEstimated);
    } else if (status === 'queued') {
      // Estimate based on elapsed time and remaining stages
      // Remaining: executing (3.1s) + translating (2.1s) = 5.2s
      const remaining = ESTIMATED_STAGE_DURATIONS.executing + ESTIMATED_STAGE_DURATIONS.translating;
      setEstimatedTotalTime(Math.max(totalEstimated, totalElapsed + remaining));
    } else if (status === 'running') {
      const started = startedAt ? new Date(startedAt).getTime() : now;
      const runningElapsed = now - started;

      // For ML jobs, estimate based on progress percentage if available
      if (jobType === 'machine_learning' && progressPercentage !== null && progressPercentage > 0) {
        if (currentStage === 'executing') {
          // Progress is within executing stage
          const executingProgress = (progressPercentage / 100) * ESTIMATED_STAGE_DURATIONS.executing;
          const remainingExecuting = ESTIMATED_STAGE_DURATIONS.executing - executingProgress;
          const remainingTranslating = ESTIMATED_STAGE_DURATIONS.translating;
          setEstimatedTotalTime(totalElapsed + remainingExecuting + remainingTranslating);
        } else if (currentStage === 'translating') {
          // Progress is within translating stage
          const remainingTranslating = ESTIMATED_STAGE_DURATIONS.translating * (1 - progressPercentage / 100);
          setEstimatedTotalTime(totalElapsed + remainingTranslating);
        } else {
          // Default estimate: assume we're early in executing
          const remaining = ESTIMATED_STAGE_DURATIONS.executing + ESTIMATED_STAGE_DURATIONS.translating;
          setEstimatedTotalTime(totalElapsed + remaining);
        }
      } else {
        // Estimate remaining time for executing + translating
        // If we have elapsed time, use it to estimate remaining
        if (totalElapsed > 0) {
          // We've passed transforming (1.2s) and queued (1.6s) = 2.8s
          // Remaining: executing (3.1s) + translating (2.1s) = 5.2s
          const remaining = ESTIMATED_STAGE_DURATIONS.executing + ESTIMATED_STAGE_DURATIONS.translating;
          if (currentStage === 'translating') {
            // Already in translating, estimate remaining translating time
            const translatingElapsed = Math.max(0, totalElapsed - ESTIMATED_STAGE_DURATIONS.transforming_input - ESTIMATED_STAGE_DURATIONS.queued - ESTIMATED_STAGE_DURATIONS.executing);
            const remainingTranslating = Math.max(500, ESTIMATED_STAGE_DURATIONS.translating - translatingElapsed);
            setEstimatedTotalTime(totalElapsed + remainingTranslating);
          } else {
            // In executing stage, estimate remaining
            const executingElapsed = Math.max(0, totalElapsed - ESTIMATED_STAGE_DURATIONS.transforming_input - ESTIMATED_STAGE_DURATIONS.queued);
            const remainingExecuting = Math.max(500, ESTIMATED_STAGE_DURATIONS.executing - executingElapsed);
            setEstimatedTotalTime(totalElapsed + remainingExecuting + ESTIMATED_STAGE_DURATIONS.translating);
          }
        } else {
          // No elapsed time yet, use default estimate
          setEstimatedTotalTime(totalEstimated);
        }
      }
    } else {
      setEstimatedTotalTime(totalEstimated);
    }
  }, [status, submittedAt, startedAt, elapsedTime, progressPercentage, jobType, completedAt, currentStage]);

  // Determine stages
  const getStages = (): Stage[] => {
    const stages: Stage[] = [
      { id: 'transforming_input', label: 'Encoding', status: 'pending' },
      { id: 'queued', label: 'Queued', status: 'pending' },
      { id: 'executing', label: 'Executing', status: 'pending' },
      { id: 'translating', label: 'Decoding', status: 'pending' },
    ];

    // Determine stage status based on current status and metadata
    if (status === 'pending') {
      if (currentStage === 'transforming_input') {
        stages[0].status = 'active';
      } else {
        stages[0].status = 'completed';
      }
    } else if (status === 'queued') {
      stages[0].status = 'completed';
      stages[1].status = 'active';
    } else if (status === 'running') {
      stages[0].status = 'completed';
      stages[1].status = 'completed';

      if (currentStage === 'executing') {
        stages[2].status = 'active';
      } else if (currentStage === 'translating') {
        stages[2].status = 'completed';
        stages[3].status = 'active';
      } else {
        // Default: assume executing
        stages[2].status = 'active';
      }
    } else if (status === 'completed') {
      stages.forEach(stage => {
        stage.status = 'completed';
      });
    }

    return stages;
  };

  // Calculate overall percentage based on status and stage
  const calculatePercentage = (): number => {
    if (status === 'completed') return 100;
    if (status === 'failed' || status === 'cancelled') return 0;

    // Use current stage from metadata if available
    const stage = currentStage;
    const progress = stageProgress;

    // Direct mapping: status + stage -> percentage range
    // This ensures the progress bar updates as the job progresses through stages

    if (status === 'pending') {
      // Pending status: transforming_input stage (10-30%)
      if (stage === 'transforming_input' || !stage) {
        const baseWeight = 10;
        const stageRange = 20; // 10 to 30
        if (progress > 0) {
          return Math.min(30, baseWeight + (stageRange * progress / 100));
        }
        return baseWeight;
      }
      // If somehow past transforming but still pending, show 30%
      return 30;
    } else if (status === 'queued') {
      // Queued status: should show 30-50%
      // If we have a stage, use it; otherwise default to queued stage
      if (stage === 'queued' || !stage) {
        const baseWeight = 30;
        const stageRange = 20; // 30 to 50
        if (progress > 0) {
          return Math.min(50, baseWeight + (stageRange * progress / 100));
        }
        return baseWeight;
      }
      // If stage is transforming_input but status is queued, show 30%
      if (stage === 'transforming_input') {
        return 30;
      }
      // Default for queued status
      return 30;
    } else if (status === 'running') {
      // Running status: executing (50-80%) or translating (80-100%)
      if (stage === 'executing') {
        const baseWeight = 50;
        const stageRange = 30; // 50 to 80
        // For ML jobs, use progress_percentage if available
        if (jobType === 'machine_learning' && progressPercentage !== null && progressPercentage > 0) {
          return Math.min(80, baseWeight + (progressPercentage * 0.30));
        }
        if (progress > 0) {
          return Math.min(80, baseWeight + (stageRange * progress / 100));
        }
        return baseWeight;
      } else if (stage === 'translating') {
        const baseWeight = 80;
        const stageRange = 20; // 80 to 100
        // For ML jobs, use progress_percentage if available
        if (jobType === 'machine_learning' && progressPercentage !== null && progressPercentage > 0) {
          return Math.min(100, baseWeight + (progressPercentage * 0.20));
        }
        if (progress > 0) {
          return Math.min(100, baseWeight + (stageRange * progress / 100));
        }
        return baseWeight;
      } else {
        // Running but no stage specified - default to executing (50%)
        // For ML jobs, use progress_percentage if available
        if (jobType === 'machine_learning' && progressPercentage !== null && progressPercentage > 0) {
          return Math.min(80, 50 + (progressPercentage * 0.30));
        }
        // Default to early executing stage
        return 50;
      }
    }

    // Fallback: should not reach here, but return 0 if we do
    return 0;
  };

  const percentage = calculatePercentage();
  const stages = getStages();
  const estimatedRemaining = estimatedTotalTime > elapsedTime ? estimatedTotalTime - elapsedTime : 0;

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  // Don't show progress bar for draft, failed, or cancelled jobs
  if (status === 'draft' || status === 'failed' || status === 'cancelled') {
    return null;
  }

  return (
    <Card padding="md" className="mb-6">
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-grey-900 dark:text-text-primary font-medium">{Math.round(percentage)}% Complete</span>
          </div>
          <div className="w-full bg-grey-200 dark:bg-surface rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-navy-700 to-cyan-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex items-center justify-between pt-2">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-all shadow-sm
                    ${stage.status === 'completed'
                      ? 'bg-navy-400 border-navy-400 text-white'
                      : stage.status === 'active'
                        ? 'bg-navy-500 border-navy-500 text-white animate-pulse shadow-navy-500/50'
                        : 'bg-white dark:bg-surface border-grey-300 dark:border-border text-grey-400 dark:text-text-tertiary'
                    }
                  `}
                >
                  {stage.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : stage.status === 'active' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-current" />
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${stage.status === 'completed'
                      ? 'text-navy-500 dark:text-navy-400'
                      : stage.status === 'active'
                        ? 'text-navy-600 dark:text-navy-500'
                        : 'text-grey-500 dark:text-text-tertiary'
                    }
                  `}
                >
                  {stage.label}
                </span>
              </div>
              {index < stages.length - 1 && (
                <div
                  className={`
                    h-1 flex-1 mx-2 transition-all rounded-full
                    ${stage.status === 'completed'
                      ? 'bg-navy-400'
                      : stage.status === 'active'
                        ? 'bg-navy-500'
                        : 'bg-grey-200 dark:bg-border'
                    }
                  `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Time Information */}
        {submittedAt && (
          <div className="flex items-center justify-between text-xs text-grey-500 dark:text-text-tertiary pt-2 border-t border-grey-200 dark:border-border">
            <span>Elapsed: {formatDuration(elapsedTime)}</span>
            {status !== 'completed' && estimatedTotalTime > 0 && (
              <span>Estimated total: {formatDuration(estimatedTotalTime)}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
