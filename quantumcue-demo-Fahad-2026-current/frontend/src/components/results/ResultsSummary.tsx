/**
 * Results summary component with new design system.
 */

import {
  Clock,
  Cpu,
} from 'lucide-react';
import { Card } from '../ui/Card';
import type { JobResultResponse } from '../../api/endpoints/results';

interface ResultsSummaryProps {
  results: JobResultResponse;
}

export const ResultsSummary = ({ results }: ResultsSummaryProps) => {
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card className="p-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Execution Time"
          value={formatDuration(results.metrics?.execution_time_ms)}
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Queue Time"
          value={formatDuration(results.metrics?.queue_time_ms)}
        />
        <MetricCard
          icon={<Cpu className="w-5 h-5" />}
          label="Provider"
          value={results.provider_name || '-'}
        />
      </div>

      {/* Type-specific Summary */}
      {results.job_type === 'optimization' && results.solution && (
        <div className="mt-6 pt-6 border-t border-grey-200 dark:border-border">
          <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-3">
            Optimization Results
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SummaryItem
              label="Variables"
              value={Object.keys(results.solution.variables).length.toString()}
            />
            <SummaryItem
              label="Feasible"
              value={results.solution.is_feasible ? 'Yes' : 'No'}
              valueColor={results.solution.is_feasible ? 'text-success-600 dark:text-success-500' : 'text-error-600 dark:text-error-500'}
            />
          </div>
        </div>
      )}

      {results.job_type === 'simulation' && results.simulation && (
        <div className="mt-6 pt-6 border-t border-grey-200 dark:border-border">
          <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-3">
            Simulation Results
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.simulation.ground_state_energy != null && (
              <SummaryItem
                label="Ground State Energy"
                value={results.simulation.ground_state_energy.toFixed(4)}
              />
            )}
            {results.simulation.state_fidelity != null && (
              <SummaryItem
                label="State Fidelity"
                value={`${(results.simulation.state_fidelity * 100).toFixed(2)}%`}
              />
            )}
          </div>
        </div>
      )}

      {results.job_type === 'machine_learning' && results.ml_result && (
        <div className="mt-6 pt-6 border-t border-grey-200 dark:border-border">
          <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-3">
            Machine Learning Results
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.ml_result.model_accuracy != null && (
              <SummaryItem
                label="Model Accuracy"
                value={`${(results.ml_result.model_accuracy * 100).toFixed(2)}%`}
              />
            )}
            {results.ml_result.training_loss != null && (
              <SummaryItem
                label="Training Loss"
                value={results.ml_result.training_loss.toFixed(4)}
              />
            )}
          </div>
        </div>
      )}

      {results.job_type === 'chemistry' && results.chemistry && (
        <div className="mt-6 pt-6 border-t border-grey-200 dark:border-border">
          <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-3">
            Chemistry Results
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.chemistry.ground_state_energy != null && (
              <SummaryItem
                label="Ground State Energy"
                value={`${results.chemistry.ground_state_energy.toFixed(6)} Ha`}
              />
            )}
            {results.chemistry.correlation_energy != null && (
              <SummaryItem
                label="Correlation Energy"
                value={`${results.chemistry.correlation_energy.toFixed(6)} Ha`}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const MetricCard = ({ icon, label, value }: MetricCardProps) => (
  <div className="bg-grey-50 dark:bg-surface-elevated rounded-lg p-4">
    <div className="flex items-center gap-2 text-grey-500 dark:text-text-tertiary mb-1">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className="text-grey-900 dark:text-text-primary font-semibold">{value}</p>
  </div>
);

interface SummaryItemProps {
  label: string;
  value: string;
  valueColor?: string;
}

const SummaryItem = ({ label, value, valueColor = 'text-grey-900 dark:text-text-primary' }: SummaryItemProps) => (
  <div>
    <dt className="text-grey-500 dark:text-text-tertiary text-xs mb-1">{label}</dt>
    <dd className={`font-semibold ${valueColor}`}>{value}</dd>
  </div>
);

export default ResultsSummary;
