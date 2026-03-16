/**
 * Model Recommendations Component
 */

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { useModelRecommendations } from '@/hooks/useModels';

interface ModelRecommendationsProps {
  modelId: string;
  classification: string;
}

export const ModelRecommendations = ({
  modelId,
  classification,
}: ModelRecommendationsProps) => {
  const { data, isLoading, error } = useModelRecommendations(modelId, classification);

  if (isLoading) {
    return (
      <Card padding="md">
        <p className="text-text-secondary">Loading recommendations...</p>
      </Card>
    );
  }

  if (error || !data?.recommendations || data.recommendations.length === 0) {
    return null;
  }

  const isCritical = classification.toLowerCase() === 'critical';

  return (
    <Card
      padding="md"
      className={isCritical ? 'border-status-error/20 bg-status-error/10' : ''}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <AlertCircle className="w-5 h-5 text-status-error" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-status-success" />
          )}
          {/* <h3 className="text-lg font-medium text-text-primary">
            Recommendations for {classification}
          </h3> */}
        </div>

        <ul className="space-y-2">
          {data.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-status-success mt-1">→</span>
              <span className="text-text-secondary">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

