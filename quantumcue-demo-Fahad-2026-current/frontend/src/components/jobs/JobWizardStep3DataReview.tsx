/**
 * Job Wizard Step 3: Data Review
 */

import { Database, FileText, BarChart3 } from 'lucide-react';
import { useDataset } from '../../hooks/useDatasets';
import { Card } from '../ui/Card';

interface JobWizardStep3DataReviewProps {
  data: { dataset_id: string | null; input_data_type: string | null; input_data_ref: string | null };
  onUpdate: (updates: Partial<{ dataset_id: string | null; input_data_type: string | null; input_data_ref: string | null }>) => void;
}

export const JobWizardStep3DataReview = ({ data }: JobWizardStep3DataReviewProps) => {
  const { data: dataset, isLoading } = useDataset(data.dataset_id);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Calculate size in GB from bytes to ensure consistency
  const sizeGbFromBytes = (bytes: number) => {
    return bytes / (1024 * 1024 * 1024);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading dataset...</div>;
  }

  if (!dataset) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No dataset selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Review Your Data</h2>
        <p className="text-text-secondary">
          Review the dataset details and statistics before proceeding
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dataset Info */}
        <Card title="Dataset Information" padding="md">
          <div className="space-y-3">
            <div>
              <p className="text-text-tertiary text-sm mb-1">Name</p>
              <p className="text-text-primary font-medium">{dataset.name}</p>
            </div>
            {dataset.description && (
              <div>
                <p className="text-text-tertiary text-sm mb-1">Description</p>
                <p className="text-text-secondary text-sm">{dataset.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-tertiary text-sm mb-1">Format</p>
                <p className="text-text-primary font-medium uppercase">{dataset.file_format}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-sm mb-1">Type</p>
                <p className="text-text-primary font-medium capitalize">{dataset.data_type}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-sm mb-1">Size</p>
                <p className="text-text-primary font-medium">{formatFileSize(dataset.file_size_bytes)}</p>
              </div>
              {dataset.row_count && (
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Rows</p>
                  <p className="text-text-primary font-medium">{dataset.row_count.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Statistics */}
        {dataset.statistics && (
          <Card title="Statistics" padding="md">
            <div className="space-y-3">
              {Object.entries(dataset.statistics as Record<string, unknown>).map(([key, value]) => {
                // Handle nested objects like class_balance
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  return (
                    <div key={key}>
                      <p className="text-text-secondary text-sm capitalize mb-2">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <div className="space-y-1.5 pl-4 border-l-2 border-border-primary">
                        {Object.entries(value as Record<string, unknown>).map(([nestedKey, nestedValue]) => (
                          <div key={nestedKey} className="flex justify-between">
                            <span className="text-text-tertiary text-sm capitalize">
                              {nestedKey.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-text-primary text-sm font-medium">
                              {typeof nestedValue === 'number'
                                ? nestedValue.toLocaleString()
                                : typeof nestedValue === 'object' && nestedValue !== null
                                  ? JSON.stringify(nestedValue)
                                  : String(nestedValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Handle arrays
                if (Array.isArray(value)) {
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-text-secondary text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-text-primary text-sm font-medium">
                        {value.join(', ')}
                      </span>
                    </div>
                  );
                }

                // Handle primitive values
                // Special handling for size_gb to ensure it matches file_size_bytes
                let displayValue: string | number | boolean = value as string | number | boolean;
                if (key === 'size_gb' && typeof value === 'number') {
                  // Override with calculated value from file_size_bytes to ensure consistency
                  displayValue = sizeGbFromBytes(dataset.file_size_bytes);
                }

                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-text-secondary text-sm capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-text-primary text-sm font-medium">
                      {displayValue === null || displayValue === undefined
                        ? '-'
                        : typeof displayValue === 'number'
                          ? key === 'size_gb'
                            ? `${displayValue.toFixed(1)} GB`
                            : displayValue.toLocaleString()
                          : typeof displayValue === 'boolean'
                            ? displayValue
                              ? 'Yes'
                              : 'No'
                            : String(displayValue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Schema Preview */}
      {dataset.schema && (
        <Card title="Data Schema" padding="md">
          <pre className="text-sm text-text-secondary overflow-auto">
            {JSON.stringify(dataset.schema, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};
