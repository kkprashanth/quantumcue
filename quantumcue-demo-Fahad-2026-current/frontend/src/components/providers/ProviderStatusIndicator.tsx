/**
 * Provider status indicator component.
 */

import React from 'react';
import type { ProviderStatusType } from '../../api/endpoints/providers';

interface ProviderStatusIndicatorProps {
  status: ProviderStatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProviderStatusIndicator: React.FC<ProviderStatusIndicatorProps> = ({
  status,
  showLabel = true,
  size = 'md',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          pulse: true,
          label: 'Online',
          textColor: 'text-green-700',
          glow: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]'
        };
      case 'degraded':
        return {
          color: 'bg-yellow-500',
          pulse: true,
          label: 'Degraded',
          textColor: 'text-yellow-700',
          glow: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]'
        };
      case 'maintenance':
        return {
          color: 'bg-blue-500',
          pulse: false,
          label: 'Maintenance',
          textColor: 'text-blue-700',
          glow: 'shadow-[0_0_10px_rgba(59,130,246,0.5)]'
        };
      case 'offline':
        return {
          color: 'bg-red-500',
          pulse: false,
          label: 'Offline',
          textColor: 'text-red-700',
          glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]'
        };
      default:
        return {
          color: 'bg-gray-500',
          pulse: false,
          label: 'Unknown',
          textColor: 'text-gray-600',
          glow: ''
        };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-2 mr-28 mt-2">
      <div className="relative">
        <div className={`${sizeClasses[size]} ${config.color} rounded-full ${config.glow}`} />
        {config.pulse && (
          <div
            className={`absolute inset-0 ${sizeClasses[size]} ${config.color} rounded-full animate-ping opacity-75`}
          />
        )}
      </div>
      {showLabel && (
        <span className={`${textSizeClasses[size]} font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default ProviderStatusIndicator;
