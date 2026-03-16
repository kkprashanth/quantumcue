/**
 * Job Wizard Step 5: Configuration
 */

import { useEffect, useMemo } from 'react';
import { Zap, Check } from 'lucide-react';
import { ProviderConfigurationForm } from './ProviderConfigurationForm';
import { Card } from '../ui/Card';
import { useProviderConfiguration, useProviderConfigurationDefaults } from '../../hooks/useProviderConfiguration';
import type { JobWizardData } from './JobWizard';
import type { JobPriority } from '../../api/endpoints/jobs';

interface JobWizardStep5ConfigProps {
  data: JobWizardData;
  onUpdate: (updates: Partial<JobWizardData>) => void;
}

const PRIORITY_OPTIONS: { value: JobPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Run when resources are available' },
  { value: 'normal', label: 'Normal', description: 'Standard queue priority' },
  { value: 'high', label: 'High', description: 'Priority queue access' },
];

export const JobWizardStep5Config = ({ data, onUpdate }: JobWizardStep5ConfigProps) => {
  // Fetch provider configuration if provider is selected
  const { data: configData } = useProviderConfiguration(data.provider_id || undefined);
  const { data: defaultsData } = useProviderConfigurationDefaults(
    data.provider_id || undefined,
    data.dataset_id || undefined
  );

  // Get current parameters or initialize empty
  const parameters = (data.parameters as Record<string, unknown>) || {};

  const handleParametersChange = (newParameters: Record<string, unknown>) => {
    onUpdate({ parameters: newParameters });
  };

  // Ensure defaults are applied immediately when they become available
  // This handles the case where user navigates to this step before defaults are loaded
  useEffect(() => {
    if (!defaultsData || !configData || !data.provider_id) return;

    const currentParams = (data.parameters as Record<string, unknown>) || {};
    const hasAnyParams = Object.keys(currentParams).length > 0;

    // If we have defaults but no parameters set, apply defaults immediately
    if (defaultsData.values && !hasAnyParams) {
      handleParametersChange(defaultsData.values);
    } else if (defaultsData.values && hasAnyParams) {
      // Merge defaults with existing params for any missing values
      const merged = { ...defaultsData.values, ...currentParams };
      // Only update if there are actual differences
      const hasChanges = Object.keys(defaultsData.values).some(
        (key) => currentParams[key] === undefined || currentParams[key] === null
      );
      if (hasChanges) {
        handleParametersChange(merged);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultsData, configData, data.provider_id]);

  // Separate fields by parameter type
  const standardFields = useMemo(() => {
    if (!configData) return [];
    return configData.fields
      .filter((field) => field.parameter_type === 'standard')
      .sort((a, b) => a.display_order - b.display_order);
  }, [configData]);

  const hardwareFields = useMemo(() => {
    if (!configData) return [];
    return configData.fields
      .filter((field) => field.parameter_type === 'hardware')
      .sort((a, b) => a.display_order - b.display_order);
  }, [configData]);

  return (
    <div className="flex flex-col gap-6 auto-rows-min">
      {/* Priority Card - Top Left (Row 1, Col 1) */}
      <div>
        <Card title="Priority" padding="md">
          <div className="space-y-3">
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = data.priority === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onUpdate({ priority: option.value })}
                  className={`
                      relative w-full p-4 rounded-lg border text-left transition-all
                      ${isSelected
                      ? 'border-navy-700 bg-navy-50 dark:bg-navy-700/10 ring-2 ring-navy-700 ring-offset-2 ring-offset-white dark:ring-offset-background'
                      : 'border-grey-200 dark:border-border hover:border-navy-700/50 hover:bg-grey-50 dark:hover:bg-surface-elevated'
                    }
                    `}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`
                        absolute top-3 right-3 w-5 h-5 rounded flex items-center justify-center transition-all
                        ${isSelected
                        ? 'bg-navy-700 border-2 border-navy-700 text-white'
                        : 'border-2 border-grey-400 dark:border-grey-500 bg-white dark:bg-surface'
                      }
                      `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="pr-8">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-accent-primary' : 'text-text-tertiary'}`} />
                      <div>
                        <p className={`font-medium ${isSelected ? 'text-accent-primary' : 'text-text-primary'}`}>
                          {option.label}
                        </p>
                        <p className="text-text-tertiary text-xs mt-0.5">{option.description}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Hardware Parameters Card - Top Right, spans both rows (Row 1-2, Col 2) */}
      <div className="md:row-span-2">
        <Card title="Hardware Parameters" padding="md" className="h-full">
          {configData && hardwareFields.length > 0 ? (
            <ProviderConfigurationForm
              providerId={data.provider_id}
              datasetId={data.dataset_id || undefined}
              fields={hardwareFields}
              defaults={defaultsData || null}
              values={parameters}
              onChange={handleParametersChange}
            />
          ) : (
            <div className="text-text-secondary text-sm">
              {data.provider_id
                ? hardwareFields.length === 0
                  ? 'No hardware parameters available for this provider'
                  : 'Loading provider configuration...'
                : 'Select a provider to see configuration options'}
            </div>
          )}
        </Card>
      </div>

      {/* Standard Parameters Card - Bottom Left (Row 2, Col 1) */}
      <div>
        <Card title="Standard Parameters" padding="md">
          {configData && standardFields.length > 0 ? (
            <ProviderConfigurationForm
              providerId={data.provider_id}
              datasetId={data.dataset_id || undefined}
              fields={standardFields}
              defaults={defaultsData || null}
              values={parameters}
              onChange={handleParametersChange}
            />
          ) : (
            <div className="text-text-secondary text-sm">
              {data.provider_id
                ? standardFields.length === 0
                  ? 'No standard parameters available for this provider'
                  : 'Loading provider configuration...'
                : 'Select a provider to see configuration options'}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
