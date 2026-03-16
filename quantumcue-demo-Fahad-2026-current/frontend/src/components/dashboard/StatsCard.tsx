/**
 * Stats card component for displaying metrics.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  iconColor?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconColor = 'text-navy-700',
  className = '',
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp size={14} className="text-status-success" />;
    if (trend.value < 0) return <TrendingDown size={14} className="text-status-error" />;
    return <Minus size={14} className="text-text-tertiary" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-status-success';
    if (trend.value < 0) return 'text-status-error';
    return 'text-text-tertiary';
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
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-tertiary font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-text-tertiary text-sm">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg bg-bg-tertiary ${iconColor}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
