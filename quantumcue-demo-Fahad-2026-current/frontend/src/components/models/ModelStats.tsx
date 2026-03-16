/**
 * Model statistics component with charts for aggregated statistics using Recharts.
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useModelStats, useModel } from '@/hooks/useModels';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChartContainer, CustomTooltip, GradientDefs, WaffleChart } from '../charts';

interface ModelStatsProps {
  modelId: string;
}

const COLORS = [
  '#334e68', // quantum navy
  '#06b6d4', // cyan
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
];

// Helper function to normalize classification label for matching
const normalizeLabel = (label: string): string => {
  return label.toLowerCase().replace(/\s+/g, '').replace(/_/g, '').replace(/-/g, '');
};

export function ModelStats({ modelId }: ModelStatsProps) {
  const { data: stats, isLoading, error } = useModelStats(modelId);
  const { data: model } = useModel(modelId);

  // Get classification order from model if available, otherwise use alphabetical
  const classificationOrder = useMemo(() => {
    if (model?.classifications && model.classifications.length > 0) {
      return model.classifications;
    }
    // Fallback: extract from stats and sort alphabetically
    if (stats?.class_distribution) {
      return Object.keys(stats.class_distribution).sort();
    }
    return [];
  }, [model?.classifications, stats?.class_distribution]);

  const waffleChartData = useMemo(() => {
    if (!stats || !stats.class_distribution || Object.keys(stats.class_distribution).length === 0) {
      return [];
    }

    // Create a map for quick lookup
    const distributionMap = new Map(
      Object.entries(stats.class_distribution).map(([label, value]) => [
        normalizeLabel(label),
        { label, value: value as number }
      ])
    );

    // Build data array in the order specified by classificationOrder
    const orderedData: Array<{ name: string; value: number; color: string }> = [];
    classificationOrder.forEach((classLabel, index) => {
      const normalized = normalizeLabel(classLabel);
      const entry = distributionMap.get(normalized);
      if (entry) {
        orderedData.push({
          name: entry.label.replace(/_/g, ' '),
          value: entry.value,
          color: COLORS[index % COLORS.length],
        });
      }
    });

    // Add any remaining entries that weren't in the order (shouldn't happen, but safety check)
    distributionMap.forEach((entry, normalized) => {
      if (!classificationOrder.some(cls => normalizeLabel(cls) === normalized)) {
        orderedData.push({
          name: entry.label.replace(/_/g, ' '),
          value: entry.value,
          color: COLORS[orderedData.length % COLORS.length],
        });
      }
    });

    return orderedData;
  }, [stats, classificationOrder]);

  const barChartData = useMemo(() => {
    // Use class_distribution from stats as source of truth for counts (already calculated from ALL interactions)
    if (!stats || !stats.class_distribution || Object.keys(stats.class_distribution).length === 0) {
      return [];
    }

    // Use class_avg_confidence from stats (calculated from ALL interactions in backend)
    const classificationConfidences = stats.class_avg_confidence || {};

    // Create maps for quick lookup
    const distributionMap = new Map(
      Object.entries(stats.class_distribution).map(([label, value]) => [
        normalizeLabel(label),
        { label, value: value as number }
      ])
    );
    const confidenceMap = new Map(
      Object.entries(classificationConfidences).map(([label, value]) => [
        normalizeLabel(label),
        value as number
      ])
    );

    // Build data array in the same order as waffleChartData to ensure consistency
    return waffleChartData.map((waffleItem) => {
      const normalized = normalizeLabel(waffleItem.name);
      const distributionEntry = Array.from(distributionMap.entries()).find(
        ([normLabel]) => normalizeLabel(normLabel) === normalized
      );
      const confidence = confidenceMap.get(normalized) || 0;

      return {
        name: waffleItem.name,
        confidence: confidence * 100,
        count: distributionEntry ? distributionEntry[1].value : 0,
        color: waffleItem.color,
      };
    });
  }, [stats, waffleChartData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-error/20 bg-red-500">
        <p className="text-error">Failed to load statistics.</p>
      </Card>
    );
  }

  if (!stats || stats.total_predictions === 0) {
    return (
      <Card className="p-6">
        <p className="text-grey-500 dark:text-text-tertiary text-center py-8">
          No statistics available yet. Make some predictions to see stats.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="stat" className="p-6">
          <h4 className="text-sm text-grey-500 dark:text-text-secondary mb-2">Total Predictions</h4>
          <p className="text-3xl font-bold text-grey-900 dark:text-text-primary">{stats.total_predictions}</p>
        </Card>

        <Card variant="stat" className="p-6">
          <h4 className="text-sm text-grey-500 dark:text-text-secondary mb-2">Average Confidence</h4>
          <p className="text-3xl font-bold text-grey-900 dark:text-text-primary">
            {(stats.average_confidence * 100).toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution Chart */}
        {waffleChartData.length > 0 && (
          <ChartContainer title="Class Distribution" height={400}>
            <div className="h-full flex flex-col p-4">
              <WaffleChart
                data={waffleChartData}
                total={stats.total_predictions}
                rows={10}
                columns={10}
                size={14}
                gap={3}
              />
            </div>
          </ChartContainer>
        )}

        {/* Aggregate Confidence by Classification Chart */}
        {barChartData.length > 0 && (
          <ChartContainer title="Average Confidence by Classification" height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <GradientDefs />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-border" />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  className="dark:stroke-text-secondary"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#64748b"
                  className="dark:stroke-text-secondary"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Average Confidence (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                  domain={[0, 100]}
                />
                <Tooltip
                  content={<CustomTooltip formatter={(value, name, props) => {
                    const count = props.payload?.count || 0;
                    return [`${Number(value).toFixed(1)}%`, `Avg Confidence (${count} predictions)`];
                  }} />}
                />
                <Bar
                  dataKey="confidence"
                  radius={[8, 8, 0, 0]}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
