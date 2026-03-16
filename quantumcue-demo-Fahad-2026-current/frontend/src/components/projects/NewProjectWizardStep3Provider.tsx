/**
 * New Project Wizard Step 3: Provider Selection
 */

import { AlertCircle } from 'lucide-react';
import { useProviders } from '../../hooks/useProviders';
import { ProviderCard } from '../providers/ProviderCard';
import type { NewProjectWizardData } from './NewProjectWizard';

interface NewProjectWizardStep3ProviderProps {
  data: NewProjectWizardData;
  onUpdate: (updates: Partial<NewProjectWizardData>) => void;
}

export const NewProjectWizardStep3Provider = ({ data, onUpdate }: NewProjectWizardStep3ProviderProps) => {
  const { data: providersData } = useProviders({ include_inactive: true });

  // Dashboard shows the full list; keep the wizard list identical (no filtering).
  const providers = providersData?.providers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Select Provider</h2>

      </div>

      {providers.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary">
            No providers available
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((provider) => {
            const isSelected = data.provider_id === provider.id;
            const isOnline = provider.status === 'online';
            const isActive = isOnline && provider.is_active;

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
