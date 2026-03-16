/**
 * Model Performance card showing acceptance rate and interaction metrics.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle2, AlertCircle, BarChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { MetricsStats } from '@/api/endpoints/dashboard';

interface ModelPerformanceCardProps {
  stats: MetricsStats;
  className?: string;
  isNewUser?: boolean;
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
        <span className={`font-semibold text-sm ${color}`}>{value}</span>
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
        <h4 className="font-semibold text-text-primary text-sm min-w-fit">{title}</h4>
      </div>
      <div className="flex flex-row justify-between w-full pt-7">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium mt-1">
          {totalLabel}
        </div>
        <div className="text-xl font-bold text-text-primary leading-none">{totalValue}</div>
      </div>
    </div>

    {progressTrack && (
      <div className="h-1.5 w-full bg-grey-100 dark:bg-grey-800 rounded-full mb-4 overflow-hidden">
        {progressTrack}
      </div>
    )}

    <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-auto">
      {children}
    </div>
  </div>
);

export const ModelPerformanceCard: React.FC<ModelPerformanceCardProps> = ({
  stats,
  className = '',
  isNewUser = false,
}) => {
  const navigate = useNavigate();

  const acceptanceRate = stats.submitted > 0
    ? ((stats.accepted / stats.submitted) * 100).toFixed(1)
    : '0.0';

  if (isNewUser) {
    return (
      <Card
        variant="stat"
        className={`h-full flex flex-col ${className}`}
      >
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Model Performance
          </h3>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-xs text-grey-600 dark:text-text-secondary text-center">
            Train your first model to see performance metrics here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant="stat"
      className={`h-full flex flex-col cursor-pointer ${className}`}
      onClick={() => navigate('/models')}
    >
      {/* Card Header matching SummaryCard */}
      <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Model Performance
        </h3>
        {/* Optional: Add a subtle indicator if desired */}
      </div>

      <div className="flex-1 p-6 space-y-6">
        <Section
          icon={<Target size={16} />}
          title="Accuracy"
          totalValue={`${acceptanceRate}%`}
          totalLabel="Acceptance Rate"
          progressTrack={
            <div
              className="h-full rounded-full transition-all bg-success-500"
              style={{
                width: `${Math.min(100, parseFloat(acceptanceRate))}%`,
              }}
            />
          }
        >
          <StatItem
            label="Submitted"
            value={stats.submitted}
            icon={<BarChart size={10} className="text-text-tertiary" />}
          />
          <StatItem
            label="Accepted"
            value={stats.accepted}
            // color="text-success-500"
            icon={<CheckCircle2 size={10} className="" />}
            className="ml-6"
          />
          <StatItem
            label="Corrected"
            value={stats.corrected}
            // color="text-warning-500"
            icon={<AlertCircle size={10} className="" />}
          />
          <StatItem
            label="Accuracy"
            value={parseFloat(acceptanceRate) > 80 ? 'High' : 'Normal'}
            color="text-orange-500"
            icon={<Target size={10} className="" />}
            className="ml-6"
          />
        </Section>
      </div>
    </Card>
  );
};

export default ModelPerformanceCard;
