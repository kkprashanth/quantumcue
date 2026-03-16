/**
 * Gauge chart component using Recharts PieChart.
 * Displays data as a semi-circular gauge with segments.
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CustomTooltip } from './index';

interface GaugeSegment {
  name: string;
  value: number;
  color: string;
}

interface GaugeChartProps {
  data: GaugeSegment[];
  total: number;
  height?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  data,
  total,
  height = 200,
  showLegend = true,
  formatValue,
}) => {
  // Filter out zero values for cleaner display
  const filteredData = data.filter((item) => item.value > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-grey-500 dark:text-text-tertiary text-sm">No data available</p>
      </div>
    );
  }

  // Custom label function
  const renderLabel = (entry: GaugeSegment) => {
    const percent = total > 0 ? (entry.value / total) * 100 : 0;
    if (percent < 5) return ''; // Don't show labels for very small segments
    if (formatValue) {
      return formatValue(entry.value);
    }
    return `${entry.value}`;
  };

  return (
    <div style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="90%"
            startAngle={180}
            endAngle={0}
            innerRadius={height * 0.3}
            outerRadius={height * 0.45}
            paddingAngle={2}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
            animationDuration={800}
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={
              <CustomTooltip
                formatter={(value: number | string, name: string, props: { payload?: Record<string, unknown> }) => {
                  const payload = props.payload || {};
                  const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                  const percent = total > 0 ? ((numValue / total) * 100).toFixed(1) : '0';
                  const label = (payload.name as string) || name;
                  return [`${numValue} (${percent}%)`, label];
                }}
              />
            }
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '10px' }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GaugeChart;

