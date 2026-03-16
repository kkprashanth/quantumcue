/**
 * Job Wizard Step 4: Provider Selection
 */

import { AlertCircle } from 'lucide-react';
import { useProviders } from '../../hooks/useProviders';
import { ProviderCard } from '../providers/ProviderCard';
import type { JobWizardData } from './JobWizard';

interface JobWizardStep4ProviderProps {
  data: JobWizardData;
  onUpdate: (updates: Partial<JobWizardData>) => void;
}

export const JobWizardStep4Provider = ({ data, onUpdate }: JobWizardStep4ProviderProps) => {
  const { data: providersData } = useProviders();

  // Map job_type enum values to keywords that might appear in supported_problem_types
  const jobTypeKeywords: Record<string, string[]> = {
    machine_learning: ['machine learning', 'ml', 'image processing', 'image detection', 'neural network', 'classifier', 'deep learning', 'ai'],
    optimization: ['optimization', 'qubo', 'ising', 'binary optimization', 'integer optimization', 'combinatorial', 'scheduling', 'routing', 'portfolio'],
    simulation: ['simulation', 'chemistry', 'materials science', 'molecular', 'quantum simulation'],
    chemistry: ['chemistry', 'molecular', 'drug discovery', 'materials science'],
    custom: [], // Custom jobs can use any provider
  };

  // Filter providers based on job type
  const compatibleProviders = providersData?.providers.filter((provider) => {
    // If no supported_problem_types specified, allow all providers
    if (!provider.supported_problem_types || (provider.supported_problem_types as string[]).length === 0) {
      return true;
    }

    const supportedTypes = (provider.supported_problem_types as string[]).map((t) => t.toLowerCase());
    const keywords = jobTypeKeywords[data.job_type] || [];

    // Check if any keyword matches any supported problem type
    const hasMatch = keywords.some((keyword) =>
      supportedTypes.some((supportedType) => supportedType.includes(keyword))
    );

    // Also check direct enum match (in case seed data uses enum values)
    const directMatch = supportedTypes.includes(data.job_type.toLowerCase());

    return hasMatch || directMatch;
  }) || [];

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Job Type:', data.job_type);
    console.log('Keywords:', jobTypeKeywords[data.job_type]);
    console.log('All Providers:', providersData?.providers.map(p => ({
      name: p.name,
      supported_types: p.supported_problem_types,
      is_active: p.is_active,
      status: p.status
    })));
    console.log('Compatible Providers:', compatibleProviders.map(p => p.name));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Select Provider</h2>
        <p className="text-text-secondary">
          Choose a quantum computing provider for your job
        </p>
      </div>

      {compatibleProviders.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary">
            No compatible providers found for {data.job_type} jobs
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {compatibleProviders.map((provider) => {
            const isSelected = data.provider_id === provider.id;
            // Handle both boolean and string values for is_active
            const isActiveBoolean = typeof provider.is_active === 'boolean'
              ? provider.is_active
              : provider.is_active === true || provider.is_active === 'true' || provider.is_active === 'True';
            // Allow selection if provider is active and status is online or degraded
            const isActive = (provider.status === 'online' || provider.status === 'degraded') && isActiveBoolean;

            return (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isSelected={isSelected}
                onSelect={(id) => onUpdate({ provider_id: id })}
                disabled={!isActive}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
