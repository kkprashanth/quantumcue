/**
 * Recent Activity card showing quick summary of recent activity.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, CheckCircle2, Box, Database, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { isToday, isThisWeek } from 'date-fns';
import type { RecentActivity } from '@/api/endpoints/dashboard';

interface RecentActivityCardProps {
  activities: RecentActivity[];
  className?: string;
}

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

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  totalValue: number | string;
  totalLabel: string;
  progressTrack?: React.ReactNode;
  children?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  icon,
  title,
  totalValue,
  totalLabel,
  progressTrack,
  children
}) => (
  <div className="group h-full flex flex-col">
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

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activities,
  className = '',
}) => {
  const navigate = useNavigate();

  const activityCounts = useMemo(() => {
    const today = activities.filter(a => isToday(new Date(a.created_at))).length;
    const thisWeek = activities.filter(a => isThisWeek(new Date(a.created_at))).length;

    // Count by type
    const byType = {
      job: activities.filter(a => a.type === 'job').length,
      model: activities.filter(a => a.type === 'model').length,
      dataset: activities.filter(a => a.type === 'dataset').length,
      interaction: activities.filter(a => a.type === 'interaction').length,
    };

    return { today, thisWeek, byType, total: activities.length };
  }, [activities]);

  return (
    <Card
      variant="stat"
      className={`h-full flex flex-col cursor-pointer ${className}`}
      onClick={() => navigate('/dashboard')}
    >
      {/* Card Header matching SummaryCard */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
          Recent Activity
        </h3>
        {/* Optional: Add a subtle indicator if desired, or keep clean */}
      </div>

      <div className="flex-1 p-6 space-y-6">
        <Section
          icon={<Activity size={16} />}
          title="Activity"
          totalValue={activityCounts.total}
          totalLabel="Total Events"
          progressTrack={
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${(activityCounts.thisWeek / Math.max(activityCounts.total, 1)) * 100}%` }}
            />
          }
        >
          <StatItem
            label="Today"
            value={activityCounts.today}
            icon={<Clock size={10} className="text-secondary-500" />}
          />
          <StatItem
            label="This Week"
            value={activityCounts.thisWeek}
            color="text-primary-500"
            icon={<Activity size={10} className="text-primary-500" />}
            className="ml-6"
          />
          <StatItem
            label="Jobs"
            value={activityCounts.byType.job}
            icon={<Box size={10} className="text-text-tertiary" />}
          />
          <StatItem
            label="Models"
            value={activityCounts.byType.model}
            icon={<Sparkles size={10} className="text-text-tertiary" />}
            className="ml-[33px]"
          />
        </Section>
      </div>
    </Card>
  );
};

export default RecentActivityCard;
