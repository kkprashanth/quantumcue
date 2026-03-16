/**
 * Provider grid component for dashboard showing providers in a 2-column card layout.
 */

import React from 'react';
import { Server } from 'lucide-react';
import { ProviderCard } from '../providers/ProviderCard';
import { Card } from '../ui/Card';
import { useProviders } from '../../hooks/useProviders';

export const ProviderGrid: React.FC = () => {
  const { data, isLoading, error } = useProviders({ include_inactive: true });

  if (isLoading) {
    return (
      <Card variant="section" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-text-primary">Providers</h3>
          <Server size={20} className="text-grey-400 dark:text-text-tertiary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface border-2 border-grey-300 dark:border-border rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 bg-grey-200 dark:bg-grey-800 rounded w-1/2 mb-4" />
              <div className="h-8 bg-grey-200 dark:bg-grey-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="section" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Providers</h3>
          <Server size={20} className="text-grey-400 dark:text-text-tertiary" />
        </div>
        <div className="text-center py-8 text-grey-500 dark:text-text-tertiary">
          Failed to load providers: {error.message}
        </div>
      </Card>
    );
  }

  if (!data || data.providers.length === 0) {
    return (
      <Card variant="section" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Providers</h3>
          <Server size={20} className="text-grey-400 dark:text-text-tertiary" />
        </div>
        <div className="text-center py-8 text-grey-500 dark:text-text-tertiary">
          No providers available
        </div>
      </Card>
    );
  }

  return (
    <Card variant="section" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Providers</h3>
        <Server size={20} className="text-grey-400 dark:text-text-tertiary" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </Card>
  );
};

export default ProviderGrid;
