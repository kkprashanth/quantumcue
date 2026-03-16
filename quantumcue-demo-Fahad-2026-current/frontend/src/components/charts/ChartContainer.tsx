/**
 * Chart container wrapper with consistent styling.
 */

import React from 'react';

interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  height?: number | string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  title,
  className = '',
  height = 400,
}) => {
  return (
    <div
      className={`
        bg-white dark:bg-surface
        border-2 border-grey-400 dark:border-border
        rounded-xl
        p-2
        ${className}
      `}
    >
      {title && (
        <h3 className="text-lg font-semibold text-grey-700 dark:text-text-primary mb-2 text-center">
          {title}
        </h3>
      )}
      <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;

