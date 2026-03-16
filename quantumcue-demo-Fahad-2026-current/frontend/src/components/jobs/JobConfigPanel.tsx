/**
 * Job configuration panel component.
 */

import { useState } from 'react';
import {
  Settings,
  Cpu,
  Zap,
  Hash,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { type JobType, type JobPriority } from '../../api/endpoints/jobs';
import { ProviderConfigurationForm } from './ProviderConfigurationForm';
import { useProviderConfiguration, useProviderConfigurationDefaults } from '../../hooks/useProviderConfiguration';

export interface JobConfig {
  name: string;
  description: string;
  job_type: JobType;
  provider_id: string;
  priority: JobPriority;
  shot_count: number;
  optimization_level: number;
  qubit_count_requested: number | null;
  parameters: Record<string, unknown>;
}

interface JobConfigPanelProps {
  config: JobConfig;
  onChange: (config: JobConfig) => void;
  providers: { id: string; name: string }[];
  disabled?: boolean;
}

export const JobConfigPanel = ({
  config,
  onChange,
  providers,
  disabled = false,
}: JobConfigPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch provider configuration if provider is selected
  const { data: configData } = useProviderConfiguration(config.provider_id || undefined);
  const { data: defaultsData } = useProviderConfigurationDefaults(
    config.provider_id || undefined,
    undefined // JobConfigPanel doesn't have dataset_id, but could be added if needed
  );

  const updateConfig = (updates: Partial<JobConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleParametersChange = (newParameters: Record<string, unknown>) => {
    updateConfig({ parameters: newParameters });
  };

  const jobTypes: { value: JobType; label: string; description: string }[] = [
    { value: 'optimization', label: 'Optimization', description: 'Combinatorial problems' },
    { value: 'simulation', label: 'Simulation', description: 'Quantum system modeling' },
    { value: 'machine_learning', label: 'Machine Learning', description: 'Quantum-enhanced ML' },
    { value: 'chemistry', label: 'Chemistry', description: 'Molecular simulations' },
    { value: 'custom', label: 'Custom', description: 'Custom circuits' },
  ];

  const priorities: { value: JobPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  return (
    <div className="bg-background-secondary rounded-xl border border-border-primary overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-background-tertiary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent-primary" />
          <span className="font-medium text-text-primary">Job Configuration</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-tertiary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-tertiary" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Job Name
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              disabled={disabled}
              placeholder="Enter job name..."
              className="
                w-full px-3 py-2 rounded-lg
                bg-background-primary border border-border-primary
                text-text-primary placeholder-text-tertiary
                focus:outline-none focus:border-accent-primary
                disabled:opacity-50
              "
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              disabled={disabled}
              placeholder="Describe what this job does..."
              rows={2}
              className="
                w-full px-3 py-2 rounded-lg resize-none
                bg-background-primary border border-border-primary
                text-text-primary placeholder-text-tertiary
                focus:outline-none focus:border-accent-primary
                disabled:opacity-50
              "
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              <Cpu className="w-4 h-4 inline mr-1" />
              Job Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {jobTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateConfig({ job_type: type.value })}
                  disabled={disabled}
                  className={`
                    px-3 py-2 rounded-lg text-left text-sm
                    border transition-colors
                    ${config.job_type === type.value
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-primary bg-background-primary text-text-secondary hover:border-accent-primary/50'
                    }
                    disabled:opacity-50
                  `}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-70">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Provider
            </label>
            <select
              value={config.provider_id}
              onChange={(e) => updateConfig({ provider_id: e.target.value })}
              disabled={disabled}
              className="
                w-full px-3 py-2 rounded-lg
                bg-background-primary border border-border-primary
                text-text-primary
                focus:outline-none focus:border-accent-primary
                disabled:opacity-50
              "
            >
              <option value="">Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Provider-Specific Configuration */}
          {config.provider_id && configData && (
            <div className="pt-2 border-t border-border-primary">
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Provider Configuration
              </label>
              <ProviderConfigurationForm
                providerId={config.provider_id}
                datasetId={undefined}
                fields={configData.fields}
                defaults={defaultsData || null}
                values={config.parameters}
                onChange={handleParametersChange}
                disabled={disabled}
              />
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <Zap className="w-4 h-4 inline mr-1" />
              Priority
            </label>
            <div className="flex gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => updateConfig({ priority: priority.value })}
                  disabled={disabled}
                  className={`
                    flex-1 px-3 py-2 rounded-lg text-sm font-medium
                    border transition-colors
                    ${config.priority === priority.value
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                      : 'border-border-primary bg-background-primary text-text-secondary hover:border-accent-primary/50'
                    }
                    disabled:opacity-50
                  `}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary"
          >
            <Sliders className="w-4 h-4" />
            Advanced Settings
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-border-primary">
              {/* Shot Count */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Shot Count
                </label>
                <input
                  type="number"
                  value={config.shot_count}
                  onChange={(e) => updateConfig({ shot_count: parseInt(e.target.value) || 1000 })}
                  disabled={disabled}
                  min={1}
                  max={100000}
                  className="
                    w-full px-3 py-2 rounded-lg
                    bg-background-primary border border-border-primary
                    text-text-primary
                    focus:outline-none focus:border-accent-primary
                    disabled:opacity-50
                  "
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Number of measurement repetitions (1-100,000)
                </p>
              </div>

              {/* Optimization Level */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Optimization Level: {config.optimization_level}
                </label>
                <input
                  type="range"
                  value={config.optimization_level}
                  onChange={(e) => updateConfig({ optimization_level: parseInt(e.target.value) })}
                  disabled={disabled}
                  min={0}
                  max={3}
                  className="w-full accent-accent-primary"
                />
                <div className="flex justify-between text-xs text-text-tertiary">
                  <span>None (0)</span>
                  <span>Light (1)</span>
                  <span>Medium (2)</span>
                  <span>Heavy (3)</span>
                </div>
              </div>

              {/* Qubit Count */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Qubit Count (optional)
                </label>
                <input
                  type="number"
                  value={config.qubit_count_requested || ''}
                  onChange={(e) => updateConfig({
                    qubit_count_requested: e.target.value ? parseInt(e.target.value) : null
                  })}
                  disabled={disabled}
                  min={1}
                  placeholder="Auto-detect"
                  className="
                    w-full px-3 py-2 rounded-lg
                    bg-background-primary border border-border-primary
                    text-text-primary placeholder-text-tertiary
                    focus:outline-none focus:border-accent-primary
                    disabled:opacity-50
                  "
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Leave empty to auto-detect based on problem size
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobConfigPanel;
