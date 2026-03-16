/**
 * Dataset Upload Wizard Step 3: Summary & Review
 */

import { BarChart3, Users, FileText, Database } from 'lucide-react';
import { Card } from '../ui/Card';
import { DatasetSummaryCard } from './DatasetSummaryCard';
import type { Dataset } from '@/types';

interface DatasetUploadStep3SummaryProps {
  dataset: Dataset | null;
  isLoading?: boolean;
}

export const DatasetUploadStep3Summary = ({
  dataset,
  isLoading,
}: DatasetUploadStep3SummaryProps) => {
  if (isLoading || !dataset) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">Loading dataset summary...</p>
      </div>
    );
  }

  // Safely extract nested data with proper null checking
  const extractedLabels = (dataset as any)?.extracted_labels || {};
  const splitEstimates = (dataset as any)?.split_estimates || {};
  const statistics = dataset?.statistics || {};

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Dataset Summary Debug:', {
      extractedLabels,
      statistics,
      dataset,
      hasExtractedLabels: !!extractedLabels,
      hasStatistics: !!statistics,
    });
  }

  // Safely access nested arrays and objects
  const records = extractedLabels?.patients || extractedLabels?.records || [];
  const classifications = extractedLabels?.classifications || {};

  // Use statistics total if available, otherwise count records array
  // Handle both number and string types for totals
  const statsTotalRecords = statistics?.total_records ?? statistics?.total_patients;
  const totalRecords = typeof statsTotalRecords === 'number'
    ? statsTotalRecords
    : (typeof statsTotalRecords === 'string'
      ? parseInt(statsTotalRecords, 10) || 0
      : (Array.isArray(records) ? records.length : 0));

  // Ensure classifications is an object
  const classificationsCount = classifications && typeof classifications === 'object'
    ? Object.keys(classifications).length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Dataset Summary</h2>
        <p className="text-text-secondary">
          Review the processed dataset information before saving
        </p>
      </div>

      {/* Label Structure Breakdown */}
      <Card padding="md" icon={<Users className="w-5 h-5" />}>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-text-primary">Label Structure</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-text-tertiary text-sm mb-1">Total Records</p>
              <p className="text-2xl font-semibold text-text-primary">{totalRecords}</p>
            </div>
            <div>
              <p className="text-text-tertiary text-sm mb-1">Classifications Found</p>
              <p className="text-2xl font-semibold text-text-primary">
                {classificationsCount}
              </p>
            </div>
          </div>

          {/* Classification Breakdown */}
          {classificationsCount > 0 && classifications && typeof classifications === 'object' && (
            <div className="mt-4">
              <p className="text-text-tertiary text-sm mb-3">Records by Classification</p>
              <div className="space-y-2">
                {Object.entries(classifications).map(([classification, count]) => (
                  <div key={classification} className="flex items-center justify-between">
                    <span className="text-text-primary capitalize">{classification}</span>
                    <span className="text-text-secondary font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Split Estimates */}
      {splitEstimates.total && (
        <Card padding="md" icon={<BarChart3 className="w-5 h-5" />}>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-text-primary">Split Estimates</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-text-tertiary text-sm mb-1">Training</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {splitEstimates.train || 0}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  {splitEstimates.percentages?.train || 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-text-tertiary text-sm mb-1">Validation</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {splitEstimates.validation || 0}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  {splitEstimates.percentages?.validation || 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-text-tertiary text-sm mb-1">Test</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {splitEstimates.test || 0}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  {splitEstimates.percentages?.test || 0}%
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card padding="md" icon={<Database className="w-5 h-5" />}>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-text-primary">Metadata</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-text-tertiary text-sm mb-1">Total Files</p>
              <p className="text-text-primary font-medium">
                {statistics.file_count as React.ReactNode || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-sm mb-1">Total Size</p>
              <p className="text-text-primary font-medium">
                {formatBytes(statistics.total_size as number || 0)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Dataset Summary Card */}
      <DatasetSummaryCard dataset={dataset} />
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

