/**
 * Results table component for detailed data view with new design system.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Card } from '../ui/Card';
import type { SolutionSample, OptimizationResult, MeasurementCounts } from '../../api/endpoints/results';

interface ResultsTableProps {
  samples?: SolutionSample[];
  solution?: OptimizationResult;
  measurements?: MeasurementCounts;
  rawData?: Record<string, unknown>;
  modelMetrics?: Record<string, unknown>;
}

export const ResultsTable = ({
  samples,
  solution,
  measurements,
  rawData,
  modelMetrics,
}: ResultsTableProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('samples');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleExport = (data: unknown, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Solution Variables */}
      {solution && (
        <CollapsibleSection
          title="Solution Variables"
          isExpanded={expandedSection === 'solution'}
          onToggle={() => toggleSection('solution')}
          onExport={() => handleExport(solution, 'solution')}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-grey-200 dark:border-border">
                  <th className="text-left py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">Variable</th>
                  <th className="text-right py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(solution.variables).map(([key, value]) => (
                  <tr key={key} className="border-b border-grey-100 dark:border-border-subtle hover:bg-grey-50 dark:hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 text-grey-600 dark:text-text-secondary font-mono">{key}</td>
                    <td className="py-3 px-4 text-right text-grey-900 dark:text-text-primary font-mono">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Samples */}
      {samples && samples.length > 0 && (
        <CollapsibleSection
          title={`Samples (${samples.length})`}
          isExpanded={expandedSection === 'samples'}
          onToggle={() => toggleSection('samples')}
          onExport={() => handleExport(samples, 'samples')}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-grey-200 dark:border-border">
                  <th className="text-left py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">#</th>
                  <th className="text-left py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">State</th>
                  <th className="text-right py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">Energy</th>
                  <th className="text-right py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">Count</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((sample, index) => (
                  <tr key={index} className="border-b border-grey-100 dark:border-border-subtle hover:bg-grey-50 dark:hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 text-grey-500 dark:text-text-tertiary">{index + 1}</td>
                    <td className="py-3 px-4 text-grey-600 dark:text-text-secondary font-mono text-xs">
                      {typeof sample.state === 'string'
                        ? sample.state
                        : JSON.stringify(sample.state)}
                    </td>
                    <td className="py-3 px-4 text-right text-grey-900 dark:text-text-primary font-mono">
                      {sample.energy?.toFixed(4) ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-grey-900 dark:text-text-primary">
                      {sample.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Measurement Counts */}
      {measurements && (
        <CollapsibleSection
          title={`Measurement Counts (${Object.keys(measurements.counts).length} states)`}
          isExpanded={expandedSection === 'measurements'}
          onToggle={() => toggleSection('measurements')}
          onExport={() => handleExport(measurements, 'measurements')}
        >
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-surface">
                <tr className="border-b border-grey-200 dark:border-border">
                  <th className="text-left py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">State</th>
                  <th className="text-right py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">Count</th>
                  <th className="text-right py-3 px-4 text-grey-500 dark:text-text-tertiary font-semibold">Probability</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(measurements.counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([state, count]) => (
                    <tr key={state} className="border-b border-grey-100 dark:border-border-subtle hover:bg-grey-50 dark:hover:bg-surface-elevated transition-colors">
                      <td className="py-3 px-4 text-grey-600 dark:text-text-secondary font-mono">|{state}⟩</td>
                      <td className="py-3 px-4 text-right text-grey-900 dark:text-text-primary">{count}</td>
                      <td className="py-3 px-4 text-right text-grey-900 dark:text-text-primary">
                        {((count / measurements.shots) * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Model Metrics (for machine learning jobs) */}
      {modelMetrics && (
        <CollapsibleSection
          title="Training Outputs"
          isExpanded={expandedSection === 'modelMetrics'}
          onToggle={() => toggleSection('modelMetrics')}
          onExport={() => handleExport(modelMetrics, 'model_metrics')}
        >
          <pre className="text-xs text-grey-600 dark:text-text-tertiary bg-grey-50 dark:bg-surface-elevated p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto font-mono">
            {JSON.stringify(modelMetrics, null, 2)}
          </pre>
        </CollapsibleSection>
      )}

      {/* Raw Data (for non-ML jobs) */}
      {rawData && !modelMetrics && (
        <CollapsibleSection
          title="Raw Data"
          isExpanded={expandedSection === 'raw'}
          onToggle={() => toggleSection('raw')}
          onExport={() => handleExport(rawData, 'raw_data')}
        >
          <pre className="text-xs text-grey-600 dark:text-text-tertiary bg-grey-50 dark:bg-surface-elevated p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto font-mono">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </CollapsibleSection>
      )}
    </div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  onExport: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  title,
  isExpanded,
  onToggle,
  onExport,
  children,
}: CollapsibleSectionProps) => (
  <Card className="overflow-hidden">
    <div
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-grey-50 dark:hover:bg-surface-elevated transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-grey-500 dark:text-text-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-grey-500 dark:text-text-tertiary" />
        )}
        <h3 className="font-semibold text-grey-900 dark:text-text-primary">{title}</h3>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExport();
        }}
        className="p-2 rounded-lg hover:bg-grey-100 dark:hover:bg-surface-elevated text-grey-500 dark:text-text-tertiary hover:text-grey-900 dark:hover:text-text-primary transition-colors"
        title="Export as JSON"
        aria-label="Export as JSON"
      >
        <Download className="w-4 h-4" />
      </button>
    </div>
    {isExpanded && <div className="p-4 pt-0 border-t border-grey-200 dark:border-border">{children}</div>}
  </Card>
);

export default ResultsTable;
