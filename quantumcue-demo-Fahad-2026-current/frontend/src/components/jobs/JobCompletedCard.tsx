/**
 * Job Completed Card Component
 * Shows a prominent card when a job is completed
 */

import { useState } from 'react';
import { CheckCircle, Clock, BarChart3, Zap, Download, Server } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useModelByTrainingJob, useHostModel } from '@/hooks/useModels';
import { useQueryClient } from '@tanstack/react-query';
import { HostModelModal } from '../models/HostModelModal';

interface JobCompletedCardProps {
  jobId: string;
  displayId: string | null;
  resultSummary: string | null;
  executionTimeMs: number | null;
  totalCost: number | null;
  jobType: string;
}

export const JobCompletedCard = ({
  jobId,
  displayId,
  resultSummary,
  executionTimeMs,
  totalCost,
  jobType,
}: JobCompletedCardProps) => {
  const [showHostModal, setShowHostModal] = useState(false);
  const queryClient = useQueryClient();
  const hostModel = useHostModel();
  const navigate = useNavigate();

  // Get model for ML jobs - refetch more frequently to catch newly created models
  const { data: model, isLoading: isLoadingModel } = useModelByTrainingJob(
    jobType === 'machine_learning' ? jobId : null
  );

  const formatDuration = (ms: number | null): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const handleDownload = () => {
    if (!model) return;

    // Create mock model files as JSON
    const modelData = {
      name: model.name,
      model_type: model.model_type,
      version: model.version || 1,
      created_at: new Date().toISOString(),
      weights: model.metrics?.weights || [],
      configuration: model.configuration || {},
      metadata: {
        display_id: model.display_id,
        training_job_id: model.training_job_id,
        provider_id: model.provider_id,
      },
    };

    // Create a blob with the model data
    const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.name}quantumcue_model.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleHostConfirm = async () => {
    if (!model) return;
    try {
      await hostModel.mutateAsync(model.id);
      setShowHostModal(false);
      // Invalidate queries to refresh model data
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['model', model.id] });
      // Navigate to model detail page
      navigate(`/models/${model.id}`);
    } catch (err) {
      console.error('Failed to host model:', err);
    }
  };

  return (
    <Card padding="lg" className="mb-6 border-2 border-status-success/30 bg-status-success/5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-status-success" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-text-primary">Job Completed Successfully</h2>
            {displayId && (
              <span className="text-text-tertiary text-sm font-mono">({displayId})</span>
            )}
          </div>

          {resultSummary && (
            <p className="text-text-secondary mb-4">{resultSummary}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="w-5 h-5 text-navy-700" />
              <div>
                <p className="text-xs text-text-tertiary">Execution Time</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDuration(executionTimeMs)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/jobs/${jobId}/results`}>
              <Button className="!bg-accent-primary !hover:bg-accent-primary/90">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Results
              </Button>
            </Link>
            {jobType === 'machine_learning' && model && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download
                </Button>
                {model.hosting_status !== 'active' && (
                  <Button
                    variant="quantum"
                    onClick={() => setShowHostModal(true)}
                    leftIcon={<Server className="w-4 h-4" />}
                  >
                    Host
                  </Button>
                )}
                <Link to={`/models/${model.id}?tab=test`}>
                  <Button variant="quantum">
                    <Zap className="w-4 h-4 mr-2" />
                    Test Model
                  </Button>
                </Link>
                <Link to={`/models/${model.id}`}>
                  <Button variant="secondary">
                    View Model
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {model && (
        <HostModelModal
          isOpen={showHostModal}
          onClose={() => setShowHostModal(false)}
          onConfirm={handleHostConfirm}
          modelName={model.name}
          isLoading={hostModel.isPending}
        />
      )}
    </Card>
  );
};
