/**
 * Models overview component with stats and recent models.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ModelStats, RecentModel } from '@/api/endpoints/dashboard';

interface ModelsOverviewProps {
  stats: ModelStats;
  recentModels: RecentModel[];
  className?: string;
}

export const ModelsOverview: React.FC<ModelsOverviewProps> = ({
  stats,
  recentModels,
  className = '',
}) => {
  const navigate = useNavigate();


  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'default'; label: string }> = {
      ready: { variant: 'success', label: 'Ready' },
      hosted_active: { variant: 'info', label: 'Active' },
      archived: { variant: 'default', label: 'Archived' },
      training: { variant: 'warning', label: 'Training' },
      error: { variant: 'error', label: 'Error' },
    };

    const config = statusConfig[status] || statusConfig.ready;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className={`h-full ${className}`}>
      <Card className="p-6 px-10 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Models</h3>
          <button
            onClick={() => navigate('/models')}
            className="flex items-center gap-1 text-sm text-navy-700 hover:text-quantum-cyan transition-colors"
          >
            View all
            <ExternalLink size={14} />
          </button>
        </div>

        {recentModels.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {recentModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => navigate(`/models/${model.id}`)}
                  className="flex items-start gap-3 py-3 pr-3 rounded-lg hover:bg-grey-50 dark:hover:bg-surface-elevated transition-colors cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-grey-100 dark:bg-surface-elevated text-cyan-500 group-hover:bg-grey-200 dark:group-hover:bg-surface transition-colors">
                    <Brain size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-grey-900 dark:text-text-primary truncate">
                        {model.name}
                      </p>
                      {getStatusBadge(model.status)}
                    </div>
                    <p className="text-xs text-grey-500 dark:text-text-tertiary">
                      {model.prediction_count} predictions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain size={32} className="mx-auto text-grey-400 dark:text-text-tertiary mb-2" />
            <p className="text-grey-600 dark:text-text-secondary">No models yet</p>
            <button
              onClick={() => navigate('/jobs/new')}
              className="mt-4 text-sm text-navy-700 hover:text-quantum-cyan transition-colors"
            >
              Train your first model
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModelsOverview;
