/**
 * Quantum vs Classical comparison component with charts using Recharts.
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useModelComparison } from '@/hooks/useModels';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ChartContainer, CustomTooltip, GradientDefs } from '../charts';

interface QuantumClassicalComparisonProps {
  modelId: string;
}

export function QuantumClassicalComparison({ modelId }: QuantumClassicalComparisonProps) {
  const { data: comparison, isLoading, error } = useModelComparison(modelId);

  const chartData = useMemo(() => {
    if (!comparison) return [];

    return [
      {
        metric: 'F1 Score',
        quantum: comparison.quantum.f1 * 100,
        classical: comparison.classical.f1 * 100,
      },
      {
        metric: 'Accuracy',
        quantum: comparison.quantum.accuracy * 100,
        classical: comparison.classical.accuracy * 100,
      },
      {
        metric: 'Precision',
        quantum: comparison.quantum.precision * 100,
        classical: comparison.classical.precision * 100,
      },
    ];
  }, [comparison]);

  const calculateImprovement = (quantum: number, classical: number): number => {
    if (classical === 0) return 0;
    return ((quantum - classical) / classical) * 100;
  };

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
        <p className="text-white">Failed to load comparison data.</p>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card className="p-6">
        <p className="text-grey-500 dark:text-text-secondary">No comparison data available.</p>
      </Card>
    );
  }

  const improvements = {
    f1: calculateImprovement(comparison.quantum.f1, comparison.classical.f1),
    accuracy: calculateImprovement(comparison.quantum.accuracy, comparison.classical.accuracy),
    precision: calculateImprovement(comparison.quantum.precision, comparison.classical.precision),
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 w-full">
        <div className="flex flex-col items-center justify-center">
          <img
            src="/examples/gifs/heartbeat.gif"
            alt="Heartbeat visualization"
            className="w-full h-auto max-w-2xl rounded-lg"
          />
        </div>
      </Card>
      <ChartContainer
        title="Quantum vs Classical Performance Comparison"
        height={400}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <GradientDefs />
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-border" />
            <XAxis
              dataKey="metric"
              stroke="#64748b"
              className="dark:stroke-text-secondary"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#64748b"
              className="dark:stroke-text-secondary"
              tick={{ fontSize: 12 }}
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
              domain={[0, 100]}
            />
            <Tooltip
              content={<CustomTooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Value']} />}
            />
            <Legend />
            <Bar
              dataKey="quantum"
              fill="#334e68"
              radius={[8, 8, 0, 0]}
              animationBegin={0}
              animationDuration={800}
            />
            <Bar
              dataKey="classical"
              fill="#64748b"
              radius={[8, 8, 0, 0]}
              animationBegin={100}
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 pt-4 border-t border-grey-200 dark:border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-grey-500 dark:text-text-secondary">F1 Score</p>
              <p className="text-sm font-medium text-success-600">
                +{improvements.f1.toFixed(1)}% improvement
              </p>
            </div>
            <div>
              <p className="text-sm text-grey-500 dark:text-text-secondary">Accuracy</p>
              <p className="text-sm font-medium text-success-600">
                +{improvements.accuracy.toFixed(1)}% improvement
              </p>
            </div>
            <div>
              <p className="text-sm text-grey-500 dark:text-text-secondary">Precision</p>
              <p className="text-sm font-medium text-success-600">
                +{improvements.precision.toFixed(1)}% improvement
              </p>
            </div>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}
