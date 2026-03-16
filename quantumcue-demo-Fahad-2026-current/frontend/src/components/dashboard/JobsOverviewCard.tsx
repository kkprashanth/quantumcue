/**
 * Small jobs overview card showing key stats with gauge chart.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { GaugeChart } from '@/components/charts/GaugeChart';
import type { JobStats } from '@/api/endpoints/dashboard';

interface JobsOverviewCardProps {
  stats: JobStats;
  className?: string;
}

export const JobsOverviewCard: React.FC<JobsOverviewCardProps> = ({
  stats,
  className = '',
}) => {
  const navigate = useNavigate();

  const gaugeData = useMemo(() => {
    return [
      {
        name: 'Completed',
        value: stats.completed,
        color: '#22c55e', // success-500
      },
      {
        name: 'Running',
        value: stats.running,
        color: '#f59e0b', // warning-500
      },
      {
        name: 'Failed',
        value: stats.failed,
        color: '#ef4444', // error-500
      },
      {
        name: 'Pending',
        value: stats.pending,
        color: '#64748b', // grey-500
      },
    ];
  }, [stats]);

  return (
    <Card
      variant="stat"
      className={`p-6 cursor-pointer ${className}`}
      onClick={() => navigate('/jobs')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-navy-700" />
          <h3 className="text-base font-semibold text-grey-700 dark:text-text-primary">Jobs</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-navy-900 dark:text-text-primary">{stats.total}</p>
          <p className="text-xs text-grey-500 dark:text-text-tertiary">Total</p>
        </div>
      </div>
      
      <GaugeChart data={gaugeData} total={stats.total} height={180} showLegend={true} />
    </Card>
  );
};

export default JobsOverviewCard;
