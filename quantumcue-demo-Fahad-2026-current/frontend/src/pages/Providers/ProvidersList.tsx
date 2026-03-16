/**
 * Providers list page with new design system.
 */

import React, { useState } from 'react';
import { Server, Filter } from 'lucide-react';
import { PageContainer, PageHeader } from '../../components/layout/PageContainer';
import { ProviderCard } from '../../components/providers/ProviderCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useProviders } from '../../hooks/useProviders';
import {
  type ProviderType,
  getProviderTypeLabel,
} from '../../api/endpoints/providers';

const PROVIDER_TYPES: ProviderType[] = [
  'superconducting',
  'trapped_ion',
  'quantum_annealer',
  'photonic',
  'neutral_atom',
  'gate_based',
];

export const ProvidersList: React.FC = () => {
  const [selectedType, setSelectedType] = useState<ProviderType | undefined>(undefined);
  const { data, isLoading, error } = useProviders({ provider_type: selectedType });

  return (
    <PageContainer>
      <PageHeader
        title="Quantum Providers"
        description="Explore available quantum computing providers and their capabilities"
      />

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-grey-500 dark:text-text-tertiary" />
          <span className="text-sm text-grey-600 dark:text-text-secondary font-medium">Filter by technology:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedType === undefined ? 'quantum' : 'secondary'}
            size="sm"
            onClick={() => setSelectedType(undefined)}
          >
            All
          </Button>
          {PROVIDER_TYPES.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'quantum' : 'secondary'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {getProviderTypeLabel(type)}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="rectangular" width={48} height={48} />
                <div className="flex-1">
                  <Skeleton variant="text" height="1.25rem" width="60%" className="mb-2" />
                  <Skeleton variant="text" height="1rem" width="40%" />
                </div>
              </div>
              <Skeleton variant="text" height="1.5rem" width="80%" className="mb-4" />
              <div className="flex items-center gap-2 mb-6">
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton variant="text" height="1rem" width="40%" />
              </div>
              <div className="mt-auto pt-4 border-t border-grey-100 dark:border-border flex justify-between items-center">
                <Skeleton variant="text" height="0.75rem" width="30%" />
                <Skeleton variant="circular" width={20} height={20} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="p-6 text-center border-error/20 bg-error/10">
          <Server className="mx-auto text-error mb-2" size={32} />
          <p className="text-error font-semibold">Failed to load providers</p>
          <p className="text-grey-500 dark:text-text-tertiary text-sm mt-1">{error.message}</p>
        </Card>
      )}

      {/* Provider grid */}
      {data && (
        <>
          <div className="text-sm text-grey-500 dark:text-text-tertiary mb-4">
            Showing {data.providers.length} provider{data.providers.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>

          {data.providers.length === 0 && (
            <Card className="p-12 text-center">
              <Server className="mx-auto text-grey-400 dark:text-text-tertiary mb-4" size={48} />
              <p className="text-grey-900 dark:text-text-primary font-semibold mb-2">No providers found</p>
              {selectedType && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedType(undefined)}
                  className="mt-2"
                >
                  Clear filter
                </Button>
              )}
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ProvidersList;
