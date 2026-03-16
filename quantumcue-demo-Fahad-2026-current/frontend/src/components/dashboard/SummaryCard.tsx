import React from 'react';
import {
  Brain,
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Clock,
  HardDrive,
  Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { DashboardData } from '@/api/endpoints/dashboard';

interface SummaryCardProps {
  data: DashboardData;
  className?: string;
}

interface StatItemProps {
  label: string;
  value: number | string;
  color?: string; // e.g. 'text-success-500'
  icon?: React.ReactNode;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color = 'text-text-primary', icon }) => (
  <div className="flex flex-col">
    <span className="text-xs text-text-tertiary mb-0.5 flex items-center gap-1.5">
      {icon}
      {label}
    </span>
    <span className={`font-semibold text-sm ${color}`}>{value}</span>
  </div>
);

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  totalIsSize?: boolean; // specialized handling for size
  totalValue: number | string;
  totalLabel: string;
  progressTrack?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  icon,
  title,
  totalValue,
  totalLabel,
  progressTrack,
}) => (
  <div className="group">
    {/* Section Header */}
    <div className="flex items-center gap-2 mb-3">
      <div className="p-1.5 rounded-lg bg-primary-500/10 text-primary-500">
        {icon}
      </div>
      <h4 className="font-semibold text-text-primary text-sm min-w-fit">{title}</h4>
      <div className="ml-auto text-right flex flex-row gap-2">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium mt-0.5 min-w-fit">
          {totalLabel}
        </div>
        <div className="text-xl font-bold text-text-primary leading-7">{totalValue}</div>
      </div>
    </div>

    {progressTrack && (
      <div className="h-1.5 w-full bg-grey-100 dark:bg-grey-800 rounded-full mb-1 overflow-hidden">
        {progressTrack}
      </div>
    )}
  </div>
);

export const SummaryCard: React.FC<SummaryCardProps> = ({
  data,
  className = '',
}) => {
  const { model_stats, dataset_stats, job_stats } = data;

  const formatSize = (gb: number): string => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  // Calculate used storage percentage (assuming we have a storage limit)
  // If you have a storage limit from props or config, use that instead
  const storageLimit = 1000; // Example: 1000 GB limit - replace with actual limit from your data
  const usedStoragePercentage = (dataset_stats.total_size_gb / storageLimit) * 100;

  return (
    <Card variant="stat" className={`h-full flex flex-col ${className}`}>
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          System Overview
        </h3>
      </div>

      <div className="flex-1 p-6 space-y-6">

        {/* 1. Models Section */}
        <Section
          icon={<Brain size={16} />}
          title="Models"
          totalValue={model_stats.total}
          totalLabel=""
          progressTrack={
            <div
              className="h-full bg-success-500 rounded-full transition-all duration-1000"
              style={{ width: `${(model_stats.ready / Math.max(model_stats.total, 1)) * 100}%` }}
            />
          }
        />

        {/* 2. Jobs Section (Execution) - Shows progress of jobs created vs target/completed */}
        <Section
          icon={<Briefcase size={16} />}
          title="Jobs Created"
          totalValue={job_stats.total}
          totalLabel=""
          progressTrack={
            <div
              className="h-full bg-success-500 rounded-full transition-all duration-1000"
              style={{
                width: `${(job_stats.completed / Math.max(job_stats.total, 1)) * 100}%`,
                backgroundColor: '#10b981' // success-500
              }}
            />
          }
        />

        {/* Alternative: If you want to show a stacked progress bar of completion status */}
        {/* <Section
          icon={<Briefcase size={16} />}
          title="Jobs Status"
          totalValue={job_stats.total}
          totalLabel="Total"
          progressTrack={
            <div className="flex w-full h-full">
              <div 
                className="h-full bg-success-500 rounded-l-full" 
                style={{ width: `${(job_stats.completed / job_stats.total) * 100}%` }} 
              />
              <div 
                className="h-full bg-warning-500" 
                style={{ width: `${(job_stats.running / job_stats.total) * 100}%` }} 
              />
              <div 
                className="h-full bg-error-500 rounded-r-full" 
                style={{ width: `${(job_stats.failed / job_stats.total) * 100}%` }} 
              />
            </div>
          }
        /> */}

        {/* 3. Storage Section (Datasets) - Shows used storage percentage */}
        <Section
          icon={<Database size={16} />}
          title="Storage Used"
          totalValue={formatSize(dataset_stats.total_size_gb)}
          totalLabel=""
          progressTrack={
            <div
              className="h-full bg-success-500 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, usedStoragePercentage)}%`,
              }}
            />
          }
        />

      </div>
    </Card>
  );
};

export default SummaryCard;