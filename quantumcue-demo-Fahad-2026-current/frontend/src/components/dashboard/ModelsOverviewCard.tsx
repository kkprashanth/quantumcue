/**
 * Small models overview card showing key stats with gauge chart.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { GaugeChart } from '@/components/charts/GaugeChart';
import type { ModelStats } from '@/api/endpoints/dashboard';

interface ModelsOverviewCardProps {
  stats: ModelStats;
  className?: string;
}

export const ModelsOverviewCard: React.FC<ModelsOverviewCardProps> = ({
  stats,
  className = '',
}) => {
  const navigate = useNavigate();

  const gaugeData = useMemo(() => {
    return [
      {
        name: 'Ready',
        value: stats.ready,
        color: '#22c55e', // success-500
      },
      {
        name: 'Hosted',
        value: stats.hosted_active,
        color: '#06b6d4', // cyan-500
      },
      {
        name: 'Archived',
        value: stats.archived,
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
          <Brain className="w-5 h-5 text-navy-700" />
          <h3 className="text-base font-semibold text-grey-700 dark:text-text-primary">Models</h3>
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

export default ModelsOverviewCard;
