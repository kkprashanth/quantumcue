/**
 * Model interaction history component displaying previous predictions.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Clock, CheckCircle2, AlertCircle, Brain, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useModelInteractions } from '@/hooks/useModels';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { ModelInteraction } from '@/types';

interface ModelInteractionHistoryProps {
  modelId: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function ModelInteractionHistory({
  modelId,
  page = 1,
  pageSize = 10,
  onPageChange,
}: ModelInteractionHistoryProps) {
  const { data, isLoading, error } = useModelInteractions(modelId, {
    page,
    page_size: pageSize,
  });

  if (isLoading) {
    return (
      <Card title="Interaction History" icon={<History className="w-5 h-5" />} padding="md">
        <p className="text-grey-500 dark:text-text-tertiary">Loading interaction history...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Interaction History" icon={<History className="w-5 h-5" />} padding="md">
        <p className="text-error">Failed to load interaction history.</p>
      </Card>
    );
  }

  if (!data || data.interactions.length === 0) {
    return (
      <Card title="Interaction History" icon={<History className="w-5 h-5" />} padding="md">
        <p className="text-grey-500 dark:text-text-tertiary text-center py-8">
          No interactions yet. Upload a file to make your first prediction.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title={`Interaction History (${data.total})`}
      icon={<History className="w-5 h-5" />}
      padding="md"
    >
      <div className="space-y-3">
        {data.interactions.map((interaction) => {
          const outputData = interaction.output_data as {
            prediction?: string;
            confidence?: number;
            class_probabilities?: Record<string, number>;
            reasoning?: string;
          } | null;

          return (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
              outputData={outputData}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages}
            onPageChange={onPageChange || (() => { })}
          />
        </div>
      )}
    </Card>
  );
}

interface InteractionCardProps {
  interaction: ModelInteraction;
  outputData: {
    prediction?: string;
    confidence?: number;
    class_probabilities?: Record<string, number>;
    reasoning?: string;
  } | null;
}

function InteractionCard({ interaction, outputData }: InteractionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasReasoning = !!outputData?.reasoning;

  return (
    <div className="bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg p-4 hover:border-grey-300 dark:hover:border-border-subtle transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap">
            {interaction.file_name && (
              <div className="flex items-center gap-2 text-grey-600 dark:text-text-secondary">
                <FileText className="w-4 h-4 text-grey-400 dark:text-text-tertiary" />
                <span className="text-sm font-medium">{interaction.file_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-grey-500 dark:text-text-tertiary">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {format(new Date(interaction.created_at), 'MMM d, yyyy HH:mm')}
              </span>
            </div>
            {/* Feedback Status */}
            {interaction.feedback_type && (
              <Badge
                variant={
                  interaction.feedback_type === 'accepted'
                    ? 'success'
                    : interaction.feedback_type === 'corrected'
                      ? 'warning'
                      : 'error'
                }
              >
                <span className="flex items-center gap-1">
                  {interaction.feedback_type === 'accepted' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  <span className="capitalize">{interaction.feedback_type}</span>
                </span>
              </Badge>
            )}
          </div>

          {/* Prediction */}
          {outputData?.prediction && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-grey-900 dark:text-text-primary font-semibold text-base">
                  {outputData.prediction}
                </span>
                {outputData.confidence !== undefined && (
                  <span className="text-sm text-grey-500 dark:text-text-tertiary">
                    ({(outputData.confidence * 100).toFixed(1)}% confidence)
                  </span>
                )}
              </div>

              {/* Class probabilities preview */}
              {outputData.class_probabilities && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(outputData.class_probabilities)
                    .slice(0, 3)
                    .map(([className, prob]) => (
                      <span
                        key={className}
                        className="text-xs px-2 py-1 bg-grey-100 dark:bg-surface-elevated border border-grey-200 dark:border-border rounded text-grey-600 dark:text-text-secondary"
                      >
                        {className.replace(/_/g, ' ')}: {(prob * 100).toFixed(0)}%
                      </span>
                    ))}
                  {Object.keys(outputData.class_probabilities).length > 3 && (
                    <span className="text-xs px-2 py-1 bg-grey-100 dark:bg-surface-elevated border border-grey-200 dark:border-border rounded text-grey-500 dark:text-text-tertiary">
                      +{Object.keys(outputData.class_probabilities).length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reasoning Section */}
          {hasReasoning && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
              >
                <Brain className="w-4 h-4" />
                <span>View Reasoning</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {isExpanded && (
                <div className="mt-3 p-4 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">AI Reasoning</span>
                  </div>
                  <p className="text-grey-700 dark:text-text-secondary text-sm leading-relaxed">
                    {outputData.reasoning}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Details */}
          {interaction.feedback_type === 'corrected' && interaction.user_feedback && (
            <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg">
              <div className="text-sm text-warning-700 dark:text-warning-400 font-medium mb-1">
                Correction Provided
              </div>
              {!!interaction.user_feedback.corrected_classification && (
                <div className="text-sm text-grey-600 dark:text-text-secondary">
                  Corrected to: <span className="font-medium text-text-primary">{interaction.user_feedback.corrected_classification as string}</span>
                </div>
              )}

              {!!interaction.user_feedback.feedback_text && (
                <div className="text-sm text-grey-600 dark:text-text-secondary mt-1">
                  &quot;{interaction.user_feedback.feedback_text as string}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
