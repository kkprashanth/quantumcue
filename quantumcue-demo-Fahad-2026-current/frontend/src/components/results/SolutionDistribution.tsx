/**
 * Solution distribution component for measurement counts using Recharts.
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, CustomTooltip, GradientDefs } from '../charts';
import type { MeasurementCounts } from '../../api/endpoints/results';

interface SolutionDistributionProps {
  measurements: MeasurementCounts;
  maxBars?: number;
}

export const SolutionDistribution = ({
  measurements,
  maxBars = 15,
}: SolutionDistributionProps) => {
  const chartData = useMemo(() => {
    // Sort by count descending
    const sortedEntries = Object.entries(measurements.counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxBars);

    return sortedEntries.map(([state, count]) => ({
      state: `|${state}⟩`,
      count,
      probability: (count / measurements.shots) * 100,
    }));
  }, [measurements, maxBars]);

  const totalStates = Object.keys(measurements.counts).length;
  const topState = Object.entries(measurements.counts).sort(([, a], [, b]) => b - a)[0];

  return (
    <ChartContainer title="Measurement Distribution" height={400}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <GradientDefs />
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-border" />
          <XAxis
            dataKey="state"
            stroke="#64748b"
            className="dark:stroke-text-secondary"
            tick={{ fontSize: 10, fontFamily: 'monospace' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#64748b"
            className="dark:stroke-text-secondary"
            tick={{ fontSize: 12 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
          />
          <Tooltip
            content={
              <CustomTooltip
                formatter={(value, name, props) => {
                  const data = props.payload as { probability?: number };
                  return [
                    <>
                      <div>Count: {Number(value).toLocaleString()}</div>
                      <div>Probability: {data.probability?.toFixed(2)}%</div>
                    </>,
                    name,
                  ];
                }}
                labelFormatter={(label) => `State: ${label}`}
              />
            }
          />
          <Bar
            dataKey="count"
            fill="url(#barGradient)"
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex justify-between text-sm text-grey-500 dark:text-text-tertiary flex-wrap gap-2">
        <span>Total shots: {measurements.shots.toLocaleString()}</span>
        <span>Unique states: {totalStates}</span>
        {topState && (
          <span>
            Most frequent: |{topState[0]}⟩ ({((topState[1] / measurements.shots) * 100).toFixed(1)}%)
          </span>
        )}
      </div>
    </ChartContainer>
  );
};

export default SolutionDistribution;
