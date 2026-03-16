/**
 * Provider Configuration Form Component.
 * 
 * Dynamically renders configuration fields based on provider configuration schema.
 * Handles conditional visibility, validation, and different field types.
 */

import { useState, useEffect, useMemo } from 'react';
import { Input } from '../ui/Input';
import type {
  ProviderConfigurationField,
  ProviderConfigurationDefaults,
} from '../../types';

interface ProviderConfigurationFormProps {
  providerId: string | null;
  datasetId?: string | null;
  fields: ProviderConfigurationField[];
  defaults?: ProviderConfigurationDefaults | null;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  errors?: Record<string, string[]>;
  disabled?: boolean;
}

export const ProviderConfigurationForm = ({
  providerId,
  datasetId,
  fields,
  defaults,
  values,
  onChange,
  errors = {},
  disabled = false,
}: ProviderConfigurationFormProps) => {
  // Track the last provider to detect changes
  const [lastProviderId, setLastProviderId] = useState<string | null>(null);

  // Reset parameters when provider changes
  useEffect(() => {
    if (providerId && providerId !== lastProviderId) {
      setLastProviderId(providerId);
      onChange({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  // Initialize values with defaults when defaults become available
  useEffect(() => {
    if (!defaults || !fields.length) return;

    // Build complete set of defaults
    const allDefaults: Record<string, unknown> = {};

    // First, use defaults from API if available
    if (defaults.values) {
      Object.assign(allDefaults, defaults.values);
    }

    // Then, fall back to field defaults for any missing values
    fields.forEach((field) => {
      if (
        allDefaults[field.field_key] === undefined &&
        field.default_value !== null &&
        field.default_value !== undefined
      ) {
        allDefaults[field.field_key] = field.default_value;
      }
    });

    // Merge with existing values, but only set defaults for missing values
    const initialValues: Record<string, unknown> = { ...values };
    let hasChanges = false;

    Object.keys(allDefaults).forEach((key) => {
      // Only set if value is not already set (undefined or null)
      if (initialValues[key] === undefined || initialValues[key] === null) {
        initialValues[key] = allDefaults[key];
        hasChanges = true;
      }
    });

    // Always apply defaults if we have any, even if values object is empty
    // This ensures defaults are saved to state immediately
    if (hasChanges || Object.keys(values).length === 0) {
      // Merge all defaults with existing values to ensure everything is set
      const mergedValues = { ...allDefaults, ...values };
      onChange(mergedValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults, fields, providerId]); // Apply defaults when they become available or provider changes

  // Auto-populate num_classes from dataset if available
  useEffect(() => {
    if (defaults?.num_classes !== null && defaults?.num_classes !== undefined) {
      const numClassesField = fields.find((f) => f.field_key === 'num_classes');
      if (numClassesField && values.num_classes === undefined) {
        onChange({ ...values, num_classes: defaults.num_classes });
      }
    }
  }, [defaults?.num_classes, fields, onChange, values]);

  // Determine which fields should be visible based on controlling fields
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.controlling_field) {
        return true; // Always visible if no controlling field
      }

      const controllingValue = values[field.controlling_field];
      if (controllingValue === undefined || controllingValue === null) {
        return false;
      }

      // Check if controlling value matches
      if (field.controlling_value === null || field.controlling_value === undefined) {
        return true;
      }

      if (Array.isArray(field.controlling_value)) {
        return field.controlling_value.includes(controllingValue);
      }

      return field.controlling_value === controllingValue;
    });
  }, [fields, values]);

  // Sort fields by 
  const sortedFields = useMemo(() => {
    return [...visibleFields].sort((a, b) => a.display_order - b.display_order);
  }, [visibleFields]);

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    let finalValue = value;

    // Type conversion for select fields that should be numbers
    const field = fields.find(f => f.field_key === fieldKey);
    if (field?.field_type === 'select' && typeof value === 'string') {
      const originalOptions = field.validation_rules?.options || [];
      const isNumericOption = originalOptions.some(opt => typeof opt === 'number');

      if (isNumericOption) {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && originalOptions.includes(parsed)) {
          finalValue = parsed;
        }
      }
    }

    let newValues = { ...values, [fieldKey]: finalValue };

    if (fieldKey === 'training_data_percentage' && typeof finalValue === 'number') {
      const val = Math.max(5, Math.min(95, finalValue));
      newValues[fieldKey] = val;
      newValues.test_data_percentage = 100 - val;
    } else if (fieldKey === 'test_data_percentage' && typeof finalValue === 'number') {
      const val = Math.max(5, Math.min(95, finalValue));
      newValues[fieldKey] = val;
      newValues.training_data_percentage = 100 - val;
    }

    onChange(newValues);
  };

  const renderField = (field: ProviderConfigurationField) => {
    // Get current value, or fall back to default for display
    const hasValue = values[field.field_key] !== undefined && values[field.field_key] !== null;
    let fieldValue = hasValue
      ? values[field.field_key]
      : (defaults?.values?.[field.field_key] !== undefined
        ? defaults.values[field.field_key]
        : (field.default_value !== null && field.default_value !== undefined
          ? field.default_value
          : undefined));

    // If we're using a default value but it's not in state, save it
    if (!hasValue && fieldValue !== undefined && fieldValue !== null) {
      // Use a ref or effect to avoid state updates during render
      // This will be handled by the useEffect that applies defaults
    }

    const fieldErrors = errors[field.field_key] || [];
    const hasError = fieldErrors.length > 0;

    const baseInputProps = {
      disabled,
      className: hasError ? 'border-status-error' : '',
    };

    switch (field.field_type) {
      case 'integer':
        return (
          <Input
            {...baseInputProps}
            type="number"
            label={field.label}
            helperText={field.description || undefined}
            value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ''}
            onChange={(e) => {
              const val = e.target.value;
              handleFieldChange(field.field_key, val === '' ? undefined : parseInt(val, 10));
            }}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
            step={field.validation_rules?.step || 1}
            error={fieldErrors[0]}
          />
        );

      case 'float':
        return (
          <Input
            {...baseInputProps}
            type="number"
            label={field.label}
            helperText={
              field.description
                ? `${field.description}${field.validation_rules?.unit ? ` (${field.validation_rules.unit})` : ''}`
                : field.validation_rules?.unit
                  ? `Unit: ${field.validation_rules.unit}`
                  : undefined
            }
            value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ''}
            onChange={(e) => {
              const val = e.target.value;
              handleFieldChange(field.field_key, val === '' ? undefined : parseFloat(val));
            }}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
            step={field.validation_rules?.step || 0.01}
            error={fieldErrors[0]}
          />
        );

      case 'string':
        return (
          <Input
            {...baseInputProps}
            type="text"
            label={field.label}
            helperText={field.description || undefined}
            value={fieldValue !== undefined && fieldValue !== null ? String(fieldValue) : ''}
            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
            error={fieldErrors[0]}
          />
        );

      case 'select':
        // Use default value if current value is empty
        const selectValue = fieldValue !== undefined && fieldValue !== null
          ? String(fieldValue)
          : (field.default_value !== null && field.default_value !== undefined
            ? String(field.default_value)
            : (defaults?.values?.[field.field_key] !== undefined
              ? String(defaults.values[field.field_key])
              : ''));

        return (
          <div className="w-full">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              {field.label}
              {field.validation_rules?.required && (
                <span className="text-error-500 ml-1">*</span>
              )}
            </label>
            <select
              {...baseInputProps}
              value={selectValue}
              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
              className={`
                w-full px-3 py-2 rounded-lg
                bg-surface border
                text-text-primary
                focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${hasError ? 'border-status-error' : 'border-border hover:border-border-subtle'}
              `}
            >
              {!selectValue && <option value="">Select...</option>}
              {field.validation_rules?.options?.map((option) => {
                const optionValue = String(option);
                // Format device_type options nicely
                let optionLabel = optionValue;
                if (field.field_key === 'device_type') {
                  if (optionValue === 'dirac-1') optionLabel = 'Dirac 1';
                  else if (optionValue === 'dirac-3') optionLabel = 'Dirac 3';
                  else if (optionValue === 'advantage') optionLabel = 'DWave Advantage';
                  else if (optionValue === 'advantage2') optionLabel = 'DWave Advantage 2';
                }
                return (
                  <option key={optionValue} value={optionValue}>
                    {optionLabel}
                  </option>
                );
              })}
            </select>
            {field.description && (
              <p className="mt-1.5 text-sm text-text-tertiary">{field.description}</p>
            )}
            {fieldErrors[0] && (
              <p className="mt-1.5 text-sm text-error-500">{fieldErrors[0]}</p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="w-full">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                {...baseInputProps}
                type="checkbox"
                checked={fieldValue === true}
                onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
                className="w-4 h-4 rounded border-grey-300 dark:border-border bg-white dark:bg-surface text-navy-700 focus:ring-navy-700 focus:ring-2 checked:bg-navy-700 checked:border-navy-700"
              />
              <div>
                <span className="text-sm font-medium text-grey-900 dark:text-text-primary">{field.label}</span>
                {field.description && (
                  <p className="text-xs text-grey-500 dark:text-text-tertiary mt-0.5">{field.description}</p>
                )}
              </div>
            </label>
            {fieldErrors[0] && (
              <p className="mt-1.5 text-sm text-error-500">{fieldErrors[0]}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!providerId || sortedFields.length === 0) {
    return (
      <div className="text-grey-600 dark:text-text-secondary text-sm">
        {!providerId
          ? 'Select a provider to see configuration options'
          : 'No configuration fields available for this provider'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedFields.map((field) => (
        <div key={field.field_key}>{renderField(field)}</div>
      ))}
    </div>
  );
};

