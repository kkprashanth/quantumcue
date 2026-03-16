/**
 * Small metrics overview card showing interaction metrics with gauge chart.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { GaugeChart } from '@/components/charts/GaugeChart';
import type { MetricsStats } from '@/api/endpoints/dashboard';

interface MetricsOverviewCardProps {
  stats: MetricsStats;
  className?: string;
}

export const MetricsOverviewCard: React.FC<MetricsOverviewCardProps> = ({
  stats,
  className = '',
}) => {
  const navigate = useNavigate();

  const gaugeData = useMemo(() => {
    return [
      {
        name: 'Accepted',
        value: stats.accepted,
        color: '#22c55e', // success-500
      },
      {
        name: 'Corrected',
        value: stats.corrected,
        color: '#f59e0b', // warning-500
      },
      {
        name: 'Other',
        value: Math.max(0, stats.submitted - stats.accepted - stats.corrected),
        color: '#64748b', // grey-500
      },
    ];
  }, [stats]);

  return (
    <Card
      variant="stat"
      className={`p-6 cursor-pointer ${className}`}
      onClick={() => navigate('/models')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-navy-700" />
          <h3 className="text-base font-semibold text-grey-700 dark:text-text-primary">Interactions</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-navy-900 dark:text-text-primary">{stats.submitted}</p>
          <p className="text-xs text-grey-500 dark:text-text-tertiary">Submitted</p>
        </div>
      </div>
      
      <GaugeChart data={gaugeData} total={stats.submitted} height={180} showLegend={true} />
    </Card>
  );
};

export default MetricsOverviewCard;

