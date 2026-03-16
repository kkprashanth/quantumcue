/**
 * Job Wizard Step 6: Review & Submit
 */

import { FileText, Server, Database, Target, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import { useProviders } from '../../hooks/useProviders';
import { useDataset } from '../../hooks/useDatasets';
import { useProviderConfiguration, useProviderConfigurationDefaults } from '../../hooks/useProviderConfiguration';
import { useMemo } from 'react';
import type { JobWizardData } from './JobWizard';
import type { ProviderConfigurationField } from '../../types';

interface JobWizardStep6ReviewProps {
  data: JobWizardData;
  onUpdate: (updates: Partial<JobWizardData>) => void;
}

export const JobWizardStep6Review = ({ data }: JobWizardStep6ReviewProps) => {
  const { data: providersData } = useProviders();
  const { data: dataset } = useDataset(data.dataset_id);
  const { data: configData } = useProviderConfiguration(data.provider_id || undefined);
  const { data: defaultsData } = useProviderConfigurationDefaults(
    data.provider_id || undefined,
    data.dataset_id || undefined
  );

  const selectedProvider = providersData?.providers.find((p) => p.id === data.provider_id);
  const parameters = (data.parameters as Record<string, unknown>) || {};
  
  // Merge defaults with parameters to show all configuration values
  const allParameters = useMemo(() => {
    const merged = { ...(defaultsData?.values || {}), ...parameters };
    return merged;
  }, [defaultsData, parameters]);

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      machine_learning: 'Quantum Machine Learning',
      optimization: 'Optimization',
      simulation: 'Simulation',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getFieldLabel = (fieldKey: string): string => {
    if (!configData) return fieldKey;
    const field = configData.fields.find((f) => f.field_key === fieldKey);
    return field?.label || fieldKey;
  };

  const formatParameterValue = (fieldKey: string, value: unknown): string => {
    if (value === null || value === undefined) return 'Not set';
    
    if (!configData) return String(value);
    
    const field = configData.fields.find((f) => f.field_key === fieldKey);
    if (!field) return String(value);

    // Format based on field type
    switch (field.field_type) {
      case 'float':
        const floatVal = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(floatVal)) return String(value);
        const formatted = floatVal % 1 === 0 ? floatVal.toFixed(0) : floatVal.toFixed(2);
        return field.validation_rules?.unit ? `${formatted} ${field.validation_rules.unit}` : formatted;
      case 'integer':
        return String(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'select':
        return String(value);
      default:
        return String(value);
    }
  };

  const getVisibleParameters = (): Array<{ key: string; label: string; value: unknown; parameter_type: 'hardware' | 'standard' }> => {
    if (!configData || !selectedProvider) return [];

    // First, filter fields based on conditional visibility (controlling_field logic)
    const conditionallyVisibleFields = configData.fields.filter((field) => {
      // If no controlling field, always visible (if it has a value in allParameters)
      if (!field.controlling_field) {
        const value = allParameters[field.field_key];
        return value !== undefined && value !== null && value !== '';
      }

      // Check controlling field value (use allParameters which includes defaults)
      const controllingValue = allParameters[field.controlling_field];
      if (controllingValue === undefined || controllingValue === null) {
        return false; // Controlling field not set, hide dependent field
      }

      // Check if controlling value matches
      if (field.controlling_value === null || field.controlling_value === undefined) {
        // If controlling_value is null/undefined, show if controlling field has any value
        const value = allParameters[field.field_key];
        return value !== undefined && value !== null && value !== '';
      }

      // Handle array of controlling values
      if (Array.isArray(field.controlling_value)) {
        const matches = field.controlling_value.includes(controllingValue);
        if (!matches) return false;
      } else {
        // Direct value comparison
        if (field.controlling_value !== controllingValue) {
          return false;
        }
      }

      // If controlling field matches, check if this field has a value
      const value = allParameters[field.field_key];
      return value !== undefined && value !== null && value !== '';
    });

    // Separate by parameter type
    const hardwareFields = conditionallyVisibleFields
      .filter((field) => field.parameter_type === 'hardware')
      .sort((a, b) => a.display_order - b.display_order);
    
    const standardFields = conditionallyVisibleFields
      .filter((field) => field.parameter_type === 'standard')
      .sort((a, b) => a.display_order - b.display_order);

    // Combine: Hardware first, then Standard
    const allSortedFields = [...hardwareFields, ...standardFields];

    // Map to return format (use allParameters which includes defaults)
    return allSortedFields.map((field) => ({
      key: field.field_key,
      label: field.label,
      value: allParameters[field.field_key],
      parameter_type: field.parameter_type,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Review & Submit</h2>
        <p className="text-text-secondary">
          Review your job configuration before submitting
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Job Details */}
        <Card title="Job Details" padding="md">
          <div className="space-y-3">
            <div>
              <p className="text-text-tertiary text-sm mb-1">Name</p>
              <p className="text-text-primary font-medium">{data.name}</p>
            </div>
            {data.description && (
              <div>
                <p className="text-text-tertiary text-sm mb-1">Description</p>
                <p className="text-text-secondary text-sm">{data.description}</p>
              </div>
            )}
            <div>
              <p className="text-text-tertiary text-sm mb-1">Problem Type</p>
              <p className="text-text-primary font-medium">{getJobTypeLabel(data.job_type)}</p>
            </div>
            {selectedProvider && (
              <div className="pt-2 border-t border-border-primary">
                <p className="text-text-tertiary text-sm mb-2">Provider</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-text-secondary text-xs mb-0.5">Name</p>
                    <p className="text-text-primary text-sm font-medium">{selectedProvider.name}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-0.5">Code</p>
                    <p className="text-text-primary text-sm uppercase">{selectedProvider.code}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Dataset */}
        {dataset && (
          <Card title="Training Dataset" padding="md">
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
              {dataset.metadata && typeof dataset.metadata === 'object' && 'goal' in dataset.metadata && (
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Goal</p>
                  <p className="text-text-secondary text-sm">{String(dataset.metadata.goal)}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Format</p>
                  <p className="text-text-primary text-sm uppercase">{dataset.file_format}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Size</p>
                  <p className="text-text-primary text-sm">{formatFileSize(dataset.file_size_bytes)}</p>
                </div>
              </div>
              {(dataset.row_count || dataset.column_count) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-primary">
                  {dataset.row_count && (
                    <div>
                      <p className="text-text-tertiary text-sm mb-1">Rows</p>
                      <p className="text-text-primary text-sm">{dataset.row_count.toLocaleString()}</p>
                    </div>
                  )}
                  {dataset.column_count && (
                    <div>
                      <p className="text-text-tertiary text-sm mb-1">Columns</p>
                      <p className="text-text-primary text-sm">{dataset.column_count}</p>
                    </div>
                  )}
                </div>
              )}
              {dataset.split_estimates && (
                <div className="pt-2 border-t border-border-primary">
                  <p className="text-text-tertiary text-sm mb-2">Data Split</p>
                  <div className="grid grid-cols-3 gap-2">
                    {dataset.split_estimates.train !== undefined && (
                      <div>
                        <p className="text-text-secondary text-xs mb-0.5">Train</p>
                        <p className="text-text-primary text-sm">
                          {dataset.split_estimates.train.toLocaleString()}
                          {dataset.split_estimates.percentages?.train && (
                            <span className="text-text-tertiary ml-1">
                              ({dataset.split_estimates.percentages.train.toFixed(0)}%)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {dataset.split_estimates.validation !== undefined && (
                      <div>
                        <p className="text-text-secondary text-xs mb-0.5">Validation</p>
                        <p className="text-text-primary text-sm">
                          {dataset.split_estimates.validation.toLocaleString()}
                          {dataset.split_estimates.percentages?.validation && (
                            <span className="text-text-tertiary ml-1">
                              ({dataset.split_estimates.percentages.validation.toFixed(0)}%)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {dataset.split_estimates.test !== undefined && (
                      <div>
                        <p className="text-text-secondary text-xs mb-0.5">Test</p>
                        <p className="text-text-primary text-sm">
                          {dataset.split_estimates.test.toLocaleString()}
                          {dataset.split_estimates.percentages?.test && (
                            <span className="text-text-tertiary ml-1">
                              ({dataset.split_estimates.percentages.test.toFixed(0)}%)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

      </div>

      {/* Provider-Specific Configuration - Full Width */}
      {selectedProvider && getVisibleParameters().length > 0 && (() => {
        const visibleParams = getVisibleParameters();
        const hardwareParams = visibleParams.filter((p) => p.parameter_type === 'hardware');
        const standardParams = visibleParams.filter((p) => p.parameter_type === 'standard');
        
        return (
          <Card title={`${selectedProvider.name} Configuration`} padding="md">
            {hardwareParams.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-3">Hardware Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {hardwareParams.map((param) => (
                    <div key={param.key} className="flex justify-between">
                      <span className="text-text-secondary text-sm">{param.label}</span>
                      <span className="text-text-primary text-sm font-medium">
                        {formatParameterValue(param.key, param.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {standardParams.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-3">Standard Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {standardParams.map((param) => (
                    <div key={param.key} className="flex justify-between">
                      <span className="text-text-secondary text-sm">{param.label}</span>
                      <span className="text-text-primary text-sm font-medium">
                        {formatParameterValue(param.key, param.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })()}

    </div>
  );
};
