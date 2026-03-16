/**
 * Provider status panel showing all quantum providers with new design system.
 */

import React from 'react';
import { Server, Clock, Users } from 'lucide-react';
import { ProviderLogo } from '../providers/ProviderLogo';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ProviderStatus {
  id: string;
  name: string;
  code: string;
  status: 'online' | 'offline' | 'degraded';
  queue_depth: number;
  avg_wait_time_seconds: number;
}

interface ProviderStatusPanelProps {
  providers: ProviderStatus[];
  className?: string;
}

export const ProviderStatusPanel: React.FC<ProviderStatusPanelProps> = ({
  providers,
  className = '',
}) => {
  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'online':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'degraded':
        return 'Degraded';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const formatWaitTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Provider Status</h3>
        <Server size={20} className="text-grey-400 dark:text-text-tertiary" />
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="flex items-center justify-between p-4 bg-grey-50 dark:bg-surface-elevated rounded-lg hover:bg-grey-100 dark:hover:bg-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Status indicator with pulse animation for online */}
              <div className="relative">
                <div
                  className={`w-2 h-2 rounded-full ${provider.status === 'online'
                      ? 'bg-success-500 animate-pulse'
                      : provider.status === 'degraded'
                        ? 'bg-warning-500'
                        : 'bg-red-500'
                    }`}
                  title={getStatusText(provider.status)}
                />
              </div>
              {/* Provider logo */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-surface flex-shrink-0 border border-grey-200 dark:border-border">
                <ProviderLogo code={provider.code} size={32} />
              </div>
              <div>
                <p className="text-sm font-semibold text-grey-900 dark:text-text-primary">
                  {provider.name}
                </p>
                <p className="text-xs text-grey-500 dark:text-text-tertiary uppercase">
                  {provider.code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Queue depth */}
              <div className="flex items-center gap-1.5 text-grey-600 dark:text-text-secondary" title="Queue depth">
                <Users size={14} />
                <span className="text-sm font-medium">{provider.queue_depth}</span>
              </div>

              {/* Wait time */}
              <div className="flex items-center gap-1.5 text-grey-600 dark:text-text-secondary" title="Avg wait time">
                <Clock size={14} />
                <span className="text-sm font-medium">
                  {formatWaitTime(provider.avg_wait_time_seconds)}
                </span>
              </div>

              {/* Status badge */}
              <Badge variant={getStatusVariant(provider.status)}>
                {getStatusText(provider.status)}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-8 text-grey-500 dark:text-text-tertiary">
          No providers available
        </div>
      )}
    </Card>
  );
};

export default ProviderStatusPanel;
