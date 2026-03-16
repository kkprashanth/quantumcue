/**
 * Small datasets overview card showing key stats with gauge chart.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { GaugeChart } from '@/components/charts/GaugeChart';
import type { DatasetStats } from '@/api/endpoints/dashboard';

interface DatasetsOverviewCardProps {
  stats: DatasetStats;
  className?: string;
}

export const DatasetsOverviewCard: React.FC<DatasetsOverviewCardProps> = ({
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
        name: 'In Training',
        value: stats.used_in_training,
        color: '#f59e0b', // warning-500
      },
    ];
  }, [stats]);

  return (
    <Card
      variant="stat"
      className={`p-6 cursor-pointer ${className}`}
      onClick={() => navigate('/datasets')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-navy-700" />
          <h3 className="text-base font-semibold text-grey-700 dark:text-text-primary">Datasets</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-navy-900 dark:text-text-primary">{stats.total_size_gb.toFixed(1)} GB</p>
          <p className="text-xs text-grey-500 dark:text-text-tertiary">Total Size</p>
        </div>
      </div>
      
      <GaugeChart data={gaugeData} total={stats.total} height={180} showLegend={true} />
    </Card>
  );
};

export default DatasetsOverviewCard;
