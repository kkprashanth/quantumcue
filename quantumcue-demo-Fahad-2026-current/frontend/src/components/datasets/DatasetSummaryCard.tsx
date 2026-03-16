/**
 * Dataset Summary Card Component
 */

import { FileText } from 'lucide-react';
import { Card } from '../ui/Card';
import type { Dataset } from '@/types';

interface DatasetSummaryCardProps {
  dataset: Dataset;
}

export const DatasetSummaryCard = ({ dataset }: DatasetSummaryCardProps) => {
  return (
    <Card padding="md" icon={<FileText className="w-5 h-5" />}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-text-primary">Dataset Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-text-tertiary text-sm mb-1">Name</p>
            <p className="text-text-primary font-medium">{dataset.name}</p>
          </div>
          <div>
            <p className="text-text-tertiary text-sm mb-1">Status</p>
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                dataset.status === 'ready'
                  ? 'bg-status-success/20 text-status-success'
                  : dataset.status === 'error'
                  ? 'bg-status-error/20 text-status-error'
                  : 'bg-status-warning/20 text-status-warning'
              }`}
            >
              {dataset.status}
            </span>
          </div>
          <div>
            <p className="text-text-tertiary text-sm mb-1">File Format</p>
            <p className="text-text-primary font-medium uppercase">{dataset.file_format}</p>
          </div>
          <div>
            <p className="text-text-tertiary text-sm mb-1">Data Type</p>
            <p className="text-text-primary font-medium capitalize">{dataset.data_type}</p>
          </div>
        </div>

        {dataset.description && (
          <div>
            <p className="text-text-tertiary text-sm mb-1">Description</p>
            <p className="text-text-secondary">{dataset.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

