/**
 * New Project Wizard Step 4: Configuration
 */

import { useEffect, useMemo } from 'react';
import { Zap, Check, Plus, X } from 'lucide-react';
import { ProviderConfigurationForm } from '../jobs/ProviderConfigurationForm';
import { Card } from '../ui/Card';
import { useProviderConfiguration, useProviderConfigurationDefaults } from '../../hooks/useProviderConfiguration';
import { useProvider } from '../../hooks/useProviders';
import type { NewProjectWizardData } from './NewProjectWizard';
import type { JobPriority } from '../../api/endpoints/jobs';

interface NewProjectWizardStep4ConfigProps {
  data: NewProjectWizardData;
  onUpdate: (updates: Partial<NewProjectWizardData>) => void;
}

const PRIORITY_OPTIONS: { value: JobPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Run when resources are available' },
  { value: 'normal', label: 'Normal', description: 'Standard queue priority' },
  { value: 'high', label: 'High', description: 'Priority queue access' },
];

export const NewProjectWizardStep4Config = ({ data, onUpdate }: NewProjectWizardStep4ConfigProps) => {
  // Fetch provider details to get the provider code
  const { data: provider } = useProvider(data.provider_id || undefined);

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

  const handleAddClass = () => {
    const classes = data.classes || [];
    onUpdate({
      classes: [...classes, `Class ${classes.length + 1}`],
      num_of_classes: classes.length + 1,
    });
  };

  const handleRemoveClass = (index: number) => {
    const classes = data.classes || [];
    if (classes.length > 1) {
      const newClasses = [...classes];
      newClasses.splice(index, 1);
      onUpdate({
        classes: newClasses,
        num_of_classes: newClasses.length,
      });
    }
  };

  const handleChangeClass = (index: number, value: string) => {
    const classes = data.classes || [];
    const newClasses = [...classes];
    newClasses[index] = value;
    onUpdate({ classes: newClasses });
  };

  // Ensure defaults are applied immediately when they become available
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

  const standardFields = useMemo(() => {
    if (!configData) return [];

    const allowedKeys = ['training_data_percentage', 'test_data_percentage', 'device_type'];

    return configData.fields
      .filter((field) =>
        (field.parameter_type === 'standard' && allowedKeys.includes(field.field_key)) ||
        (field.field_key === 'device_type')
      )
      .map((field) => {
        // Filter device_type options based on provider code
        if (field.field_key === 'device_type' && provider?.code) {
          const providerCode = provider.code.toLowerCase();
          let filteredOptions: string[] = [];

          if (providerCode === 'qci') {
            filteredOptions = ['dirac-1', 'dirac-3'];
          } else if (providerCode === 'dwave') {
            filteredOptions = ['advantage2'];
          } else {
            // Keep original options for other providers
            return field;
          }

          return {
            ...field,
            validation_rules: {
              ...field.validation_rules,
              options: filteredOptions,
            },
          };
        }
        return field;
      })
      .sort((a, b) => {
        // Ensure device_type is first
        if (a.field_key === 'device_type') return -1;
        if (b.field_key === 'device_type') return 1;
        return a.display_order - b.display_order;
      });
  }, [configData, provider]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Priority Card - Takes 1/3 width on desktop */}
        <div className="md:col-span-1">
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

        {/* Standard Parameters Card - Takes 2/3 width on desktop */}
        <div className="md:col-span-2">
          <Card title="Configuration Parameters" padding="md">
            {configData && standardFields.length > 0 ? (
              <div className="space-y-6">
                {/* Device Type - rendered first */}
                {standardFields.filter(f => f.field_key === 'device_type').length > 0 && (
                  <ProviderConfigurationForm
                    providerId={data.provider_id}
                    datasetId={data.dataset_id || undefined}
                    fields={standardFields.filter(f => f.field_key === 'device_type')}
                    defaults={defaultsData || null}
                    values={parameters}
                    onChange={handleParametersChange}
                  />
                )}

                {/* Classes Section - Injected between Device Type and others */}
                <div className="space-y-4 pt-2 pb-2">
                  <div className="flex flex-col gap-1">
                    <label className="block text-sm font-medium text-text-primary">
                      Classes
                    </label>
                    <p className="text-sm text-text-tertiary">
                      Define at least one classification category for your model.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {(data.classes || []).map((className, index) => (
                      <div key={index} className="flex items-center gap-3 w-full">
                        <input
                          type="text"
                          value={className}
                          onChange={(e) => handleChangeClass(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-grey-300 dark:border-border rounded-md bg-white dark:bg-surface focus:outline-none focus:ring-2 focus:ring-navy-500"
                          placeholder={`Class ${index + 1} name`}
                        />
                        <button
                          onClick={() => handleRemoveClass(index)}
                          disabled={(data.classes?.length || 0) <= 1}
                          className="p-2 text-grey-400 hover:text-error-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Remove class"
                          type="button"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleAddClass}
                    className="flex items-center gap-2 text-sm font-medium text-navy-600 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors"
                    type="button"
                  >
                    <Plus className="w-4 h-4" />
                    Add Class
                  </button>
                </div>

                {/* Remaining fields (like training_data_percentage) */}
                {standardFields.filter(f => f.field_key !== 'device_type').length > 0 && (
                  <ProviderConfigurationForm
                    providerId={data.provider_id}
                    datasetId={data.dataset_id || undefined}
                    fields={standardFields.filter(f => f.field_key !== 'device_type')}
                    defaults={defaultsData || null}
                    values={parameters}
                    onChange={handleParametersChange}
                  />
                )}
              </div>
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
    </div>
  );
};
