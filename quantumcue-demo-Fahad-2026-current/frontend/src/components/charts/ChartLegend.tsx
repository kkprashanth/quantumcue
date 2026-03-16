/**
 * Custom legend component for Recharts with branded styling.
 */

import React from 'react';

interface LegendProps {
  payload?: Array<{
    value?: string;
    color?: string;
    type?: string;
  }>;
}

export const ChartLegend: React.FC<LegendProps> = ({ payload }) => {
  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: entry.color || '#334e68',
            }}
          />
          <span className="text-sm text-grey-600 dark:text-text-secondary">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartLegend;

