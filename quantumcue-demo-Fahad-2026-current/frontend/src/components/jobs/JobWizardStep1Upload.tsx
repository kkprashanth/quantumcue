/**
 * Job Wizard Step 1: Select Dataset
 */

import { useState, useEffect } from 'react';
import { Database, Check, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useDatasets } from '../../hooks/useDatasets';
import type { JobWizardData } from './JobWizard';
import type { Dataset } from '../../types';

interface JobWizardStep1UploadProps {
  data: JobWizardData;
  onUpdate: (updates: Partial<JobWizardData>) => void;
}

export const JobWizardStep1Upload = ({ data, onUpdate }: JobWizardStep1UploadProps) => {
  const navigate = useNavigate();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(data.dataset_id);

  const { data: datasetsData, isLoading } = useDatasets({ status: 'ready' });

  // Auto-select dataset if dataset_id is provided but dataset object is not set
  useEffect(() => {
    if (data.dataset_id && !data.dataset && datasetsData?.datasets) {
      const preselectedDataset = datasetsData.datasets.find(d => d.id === data.dataset_id);
      if (preselectedDataset) {
        handleDatasetSelect(preselectedDataset);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.dataset_id, data.dataset, datasetsData]);

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDatasetId(dataset.id);
    onUpdate({
      dataset,
      dataset_id: dataset.id,
      uploadedFile: null,
      input_data_type: dataset.data_type,
      input_data_ref: dataset.file_path,
    });
  };

  const handleAddNewDataset = () => {
    // Navigate to dataset upload wizard
    navigate('/datasets/upload');
  };

  return (
    <div className="space-y-6">
      {/* Header with title and Add New Dataset button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-text-tertiary" />
          <h2 className="text-xl font-semibold text-text-primary">Select Dataset</h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAddNewDataset}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Dataset
        </Button>
      </div>

      <p className="text-text-secondary">
        Choose a dataset from your library to use for this job
      </p>

      {/* Select Dataset Card */}
      <Card padding="lg">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">Loading datasets...</p>
          </div>
        ) : !datasetsData || datasetsData.datasets.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-primary font-medium mb-2">No datasets available</p>
            <p className="text-text-secondary text-sm mb-4">
              Create a new dataset to get started
            </p>
            <Button
              onClick={handleAddNewDataset}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add New Dataset
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {datasetsData.datasets.map((dataset) => {
              const isSelected = selectedDatasetId === dataset.id;
              return (
                <button
                  key={dataset.id}
                  onClick={() => handleDatasetSelect(dataset)}
                  className={`
                    relative p-4 rounded-lg border text-left transition-all
                    ${
                      isSelected
                        ? 'border-navy-700 bg-navy-50 dark:bg-navy-700/10 ring-2 ring-navy-700 ring-offset-2 ring-offset-white dark:ring-offset-background'
                        : 'border-grey-200 dark:border-border hover:border-navy-700/50 hover:bg-grey-50 dark:hover:bg-surface-elevated'
                    }
                  `}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`
                      absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all
                      ${
                        isSelected
                          ? 'bg-navy-700 text-white'
                          : 'border-2 border-grey-300 dark:border-border bg-white dark:bg-surface'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>

                  <div className="pr-8">
                    <p className={`font-medium ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>
                      {dataset.name}
                    </p>
                    {dataset.description && (
                      <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                        {dataset.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                      <span className="uppercase font-medium">{dataset.file_format}</span>
                      <span>•</span>
                      <span>{(dataset.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
                      {dataset.row_count && (
                        <>
                          <span>•</span>
                          <span>{dataset.row_count.toLocaleString()} rows</span>
                        </>
                      )}
                    </div>
                    {dataset.status && (
                      <div className="mt-2">
                        <span
                          className={`
                            inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                            ${
                              dataset.status === 'ready'
                                ? 'bg-green-500/20 text-green-500'
                                : dataset.status === 'processing'
                                ? 'bg-blue-500/20 text-blue-500'
                                : 'bg-text-tertiary/20 text-text-tertiary'
                            }
                          `}
                        >
                          {dataset.status}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
