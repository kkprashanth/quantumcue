/**
 * Energy histogram component for optimization results using Recharts.
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ChartContainer, CustomTooltip, GradientDefs } from '../charts';
import type { SolutionSample } from '../../api/endpoints/results';

interface EnergyHistogramProps {
  samples: SolutionSample[];
  optimalEnergy?: number;
}

export const EnergyHistogram = ({ samples, optimalEnergy }: EnergyHistogramProps) => {
  const chartData = useMemo(() => {
    // Sort samples by energy
    const sortedSamples = [...samples]
      .filter((s) => s.energy !== undefined)
      .sort((a, b) => (a.energy || 0) - (b.energy || 0));

    // Take top 10 samples
    const topSamples = sortedSamples.slice(0, 10);

    return topSamples.map((s, i) => ({
      name: `Sample ${i + 1}`,
      energy: s.energy || 0,
      isOptimal: s.energy === optimalEnergy,
    }));
  }, [samples, optimalEnergy]);

  if (samples.length === 0) {
    return (
      <ChartContainer title="Energy Distribution">
        <div className="h-64 flex items-center justify-center">
          <p className="text-grey-500 dark:text-text-tertiary">No sample data available</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title="Energy Distribution" height={400}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
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
            label={{ value: 'Energy', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
          />
          <Tooltip
            content={<CustomTooltip formatter={(value) => [`${Number(value).toFixed(4)}`, 'Energy']} />}
          />
          <Bar
            dataKey="energy"
            radius={[8, 8, 0, 0]}
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isOptimal ? '#22c55e' : 'url(#barGradient)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default EnergyHistogram;
