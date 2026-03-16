/**
 * Doughnut gauge component for displaying single metric values.
 * Uses Recharts PieChart to create a circular doughnut chart.
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { GradientDefs } from './index';

interface DoughnutGaugeProps {
  value: number;
  label: string;
  maxValue?: number;
  color?: string;
  size?: number;
  showPercentage?: boolean;
}

export const DoughnutGauge: React.FC<DoughnutGaugeProps> = ({
  value,
  label,
  maxValue = 1,
  color = '#334e68', // navy-700
  size = 200,
  showPercentage = true,
}) => {
  // Normalize value to 0-1 range
  const normalizedValue = Math.min(Math.max(value / maxValue, 0), 1);
  const percentage = normalizedValue * 100;

  // Create data for the pie chart: filled portion and remaining portion
  const data = [
    { name: 'filled', value: normalizedValue },
    { name: 'empty', value: 1 - normalizedValue },
  ];

  // Calculate inner and outer radius for doughnut shape
  const outerRadius = size * 0.4;
  const innerRadius = size * 0.25;

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Label above chart */}
      <div className="mb-2 text-sm text-grey-600 dark:text-text-secondary text-center font-medium">
        {label}
      </div>
      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <GradientDefs />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              animationDuration={800}
            >
              <Cell key="filled" fill={color} />
              <Cell key="empty" fill="#e2e8f0" className="dark:fill-grey-700" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Value display in center */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          {showPercentage ? (
            <span className="text-xl font-bold text-grey-900 dark:text-text-primary">
              {percentage.toFixed(1)}%
            </span>
          ) : (
            <span className="text-xl font-bold text-grey-900 dark:text-text-primary">
              {normalizedValue.toFixed(3)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoughnutGauge;
