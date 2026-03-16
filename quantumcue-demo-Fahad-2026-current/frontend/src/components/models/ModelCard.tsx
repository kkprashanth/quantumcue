/**
 * Model card component for model list.
 */

import { Link } from 'react-router-dom';
import { Brain, Activity, Calendar, User, ChevronRight, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { Model } from '@/types';

interface ModelCardProps {
  model: Model;
}

export const ModelCard = ({ model }: ModelCardProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hosted_active':
        return 'text-green-500 bg-green-500/20';
      case 'ready':
        return 'text-blue-500 bg-blue-500/20';
      case 'training':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'archived':
        return 'text-text-tertiary bg-text-tertiary/20';
      case 'error':
        return 'text-red-500 bg-red-500/20';
      default:
        return 'text-text-tertiary bg-text-tertiary/20';
    }
  };

  const getModelTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      qnn: 'Quantum Neural Network',
      vqc: 'Variational Quantum Classifier',
      qsvm: 'Quantum SVM',
      generative: 'Generative Model',
      custom: 'Custom Model',
    };
    return labels[type] || type;
  };

  return (
    <Link
      to={`/models/${model.id}`}
      className="block"
    >
      <Card variant="stat" padding="md" className="hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-text-primary font-medium truncate">
                {model.name}
              </h3>
              {model.display_id && (
                <span className="text-text-tertiary text-xs font-mono">
                  {model.display_id}
                </span>
              )}
            </div>
            {model.description && (
              <p className="text-text-tertiary text-sm mt-0.5 line-clamp-1">
                {model.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 capitalize rounded text-xs font-medium ${getStatusColor(model.status)}`}>
              {model.status.replace('_', ' ')}
            </span>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
          {/* Model Type */}
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-text-tertiary" />
            <span>{getModelTypeLabel(model.model_type)}</span>
          </div>

          {/* Hosting Status */}
          {model.hosting_status === 'active' && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Hosted</span>
            </div>
          )}

          {/* Predictions */}
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-text-tertiary" />
            <span>{model.prediction_count} predictions</span>
          </div>

          {/* Provider */}
          {model.provider_name && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-tertiary">on</span>
              <span>{model.provider_name}</span>
            </div>
          )}

          {/* Creator */}
          {model.created_by_name && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-text-tertiary" />
              <span>{model.created_by_name}</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Calendar className="w-4 h-4 text-text-tertiary" />
            <span>{formatDate(model.last_used_at || model.created_at)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ModelCard;
