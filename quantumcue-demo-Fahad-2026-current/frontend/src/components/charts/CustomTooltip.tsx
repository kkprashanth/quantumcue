/**
 * Custom tooltip component for Recharts with branded styling.
 */

import React from 'react';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number;
  formatter?: (value: number | string, name: string, props: { payload?: Record<string, unknown> }) => [React.ReactNode, string] | React.ReactNode;
  labelFormatter?: (label: string | number) => React.ReactNode;
}

export const CustomTooltip: React.FC<TooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-lg p-3 shadow-lg">
      {label && (
        <p className="text-sm font-semibold text-grey-700 dark:text-text-primary mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = entry.value;
          const name = entry.name || entry.dataKey || 'Value';
          const color = entry.color || '#334e68';

          let displayValue: React.ReactNode = value;
          let displayName: string = name;

          if (formatter) {
            const result = formatter(value as number | string, name, { payload: entry.payload });
            if (Array.isArray(result) && result.length === 2) {
              [displayValue, displayName] = result;
            } else {
              displayValue = result;
            }
          }

          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-grey-600 dark:text-text-secondary">
                {displayName}:
              </span>
              <span className="text-sm font-semibold text-grey-900 dark:text-text-primary">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomTooltip;
