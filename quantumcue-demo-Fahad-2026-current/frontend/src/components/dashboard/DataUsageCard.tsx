/**
 * Data usage card with progress bar.
 */

import React from 'react';
import { Database } from 'lucide-react';

interface DataUsageCardProps {
  usedMb: number;
  budgetMb: number;
  percentage: number;
  className?: string;
}

export const DataUsageCard: React.FC<DataUsageCardProps> = ({
  usedMb,
  budgetMb,
  percentage,
  className = '',
}) => {
  // Format MB to appropriate unit
  const formatSize = (mb: number): string => {
    if (mb >= 1000) {
      return `${(mb / 1000).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  // Determine color based on usage percentage
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-status-error';
    if (percentage >= 75) return 'bg-status-warning';
    return 'bg-quantum-cyan';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-status-error';
    if (percentage >= 75) return 'text-status-warning';
    return 'text-quantum-cyan';
  };

  return (
    <div
      className={`
        bg-bg-secondary
        border border-border-primary
        rounded-xl
        p-6
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-text-tertiary font-medium">Data Usage</p>
          <p className="text-2xl font-bold text-text-primary mt-1">
            {formatSize(usedMb)}
            <span className="text-text-tertiary text-base font-normal">
              {' '}/ {formatSize(budgetMb)}
            </span>
          </p>
        </div>
        <div className="p-3 rounded-lg bg-bg-tertiary text-quantum-cyan">
          <Database size={20} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className={getTextColor()}>{percentage.toFixed(1)}% used</span>
          <span className="text-text-tertiary">
            {formatSize(budgetMb - usedMb)} remaining
          </span>
        </div>
      </div>

      {/* Warning message if near limit */}
      {percentage >= 75 && (
        <div
          className={`
            mt-4 p-3 rounded-lg text-sm
            ${percentage >= 90
              ? 'bg-status-error/10 text-status-error'
              : 'bg-status-warning/10 text-status-warning'
            }
          `}
        >
          {percentage >= 90
            ? 'Critical: Data usage near limit. Consider upgrading your plan.'
            : 'Warning: Approaching data limit. Monitor your usage.'}
        </div>
      )}
    </div>
  );
};

export default DataUsageCard;
