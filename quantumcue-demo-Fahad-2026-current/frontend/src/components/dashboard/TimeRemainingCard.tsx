/**
 * Time remaining overview card showing account execution time budget.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Hourglass, Activity, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAccount } from '@/hooks/useAccount';

interface TimeRemainingCardProps {
  className?: string;
}

// Reuse Section from SummaryCard pattern
interface SectionProps {
  icon: React.ReactNode;
  title: string;
  totalValue: number | string;
  totalLabel: string;
  progressTrack?: React.ReactNode;
  children?: React.ReactNode;
}

// Reuse StatItem from SummaryCard pattern
interface StatItemProps {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color = 'text-text-primary', icon, className = '' }) => (
  <div className={`flex flex-col mt-1 ${className}`}>
    <div className="max-w-fit flex flex-row gap-1">
      <span className="text-xs text-text-tertiary mb-6 flex items-center">
        {icon}
      </span>
      <div className="flex flex-col w-full items-center">
        <span className="text-xs text-text-tertiary mb-0.5 flex items-center gap-1.5">
          {label}
        </span>
        <span className={`font-semibold text-sm min-w-14 text-center ${color}`}>{value}</span>
      </div>
    </div>
  </div>
);


const Section: React.FC<SectionProps> = ({
  icon,
  title,
  totalValue,
  totalLabel,
  progressTrack,
  children
}) => (
  <div className="group h-full flex flex-col">
    {/* Section Header */}
    <div className="flex flex-col items-start gap-4 mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500">
          {icon}
        </div>
        <h4 className="font-semibold text-text-primary text-sm">{title}</h4>
      </div>
      <div className="flex flex-row justify-between w-full pt-7">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium mt-1">
          {totalLabel}
        </div>
        <div className="text-xl font-bold text-text-primary leading-none">{totalValue}</div>
      </div>
    </div>

    {/* Progress Bar (Optional) */}
    {progressTrack && (
      <div className="h-1.5 w-full bg-grey-100 dark:bg-grey-800 rounded-full mb-4 overflow-hidden">
        {progressTrack}
      </div>
    )}

    {/* Detail Grid */}
    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-auto">
      {children}
    </div>
  </div>
);

export const TimeRemainingCard: React.FC<TimeRemainingCardProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();
  const { data: account, isLoading } = useAccount();

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const CardSkeleton = () => (
    <Card variant="stat" className={`h-full flex flex-col ${className}`}>
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="h-4 w-24 bg-grey-200 dark:bg-grey-800 rounded animate-pulse" />
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="h-8 w-full bg-grey-200 dark:bg-grey-800 rounded animate-pulse" />
        <div className="h-24 w-full bg-grey-200 dark:bg-grey-800 rounded animate-pulse" />
      </div>
    </Card>
  );

  if (isLoading) return <CardSkeleton />;
  if (!account) return null;

  // Force 1 hour allocation for demo display
  const total = 3600;
  const remaining = account.time_remaining_seconds || 0;
  const used = Math.max(0, total - remaining);

  // Calculate used percentage (0% to 100% as time is used)
  const usedPercentage = (used / total) * 100;
  // Or alternatively: const usedPercentage = 100 - ((remaining / total) * 100);

  return (
    <Card
      variant="stat"
      className={`h-full flex flex-col cursor-pointer ${className}`}
      onClick={() => navigate('/account')}
    >
      {/* Card Header matching SummaryCard */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Time Budget
        </h3>
        <div className="flex gap-1.5">
          {/* Optional indicator, keeping it clean for now or match design */}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        <Section
          icon={<Clock size={16} />}
          title="Compute Time"
          totalValue={`${usedPercentage.toFixed(1)}%`}
          totalLabel="Used" // Changed from "Remaining" to "Used"
          progressTrack={
            <div
              className="h-full rounded-full transition-all bg-success-500"
              style={{
                width: `${Math.max(0, Math.min(100, usedPercentage))}%`,
              }}
            />
          }
        >
          <StatItem
            label="Total"
            value={formatTime(total)}
            icon={<Hourglass size={10} className="text-text-tertiary" />}
          />
          <StatItem
            label="Used"
            value={formatTime(used)}
            color="text-primary-500"
            icon={<Activity size={10} className="text-primary-500" />}
            className="ml-10"
          />
          <StatItem
            label="Remaining"
            value={formatTime(remaining)}
            icon={<Zap size={10} className="" />}
          />
          <StatItem
            label="Status"
            value="Active"
            color='text-success-500'
            icon={<Activity size={10} className="" />}
            className='ml-12'
          />
        </Section>
      </div>
    </Card>
  );
};

export default TimeRemainingCard;
