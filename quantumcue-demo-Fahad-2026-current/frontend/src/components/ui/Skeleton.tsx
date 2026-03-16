/**
 * Skeleton loading placeholder component with shimmer animation.
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
}: SkeletonProps) => {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`
        bg-grey-100 dark:bg-surface-elevated
        ${variantClasses[variant]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText = ({ lines = 3, className = '' }: SkeletonTextProps) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height="1rem"
        width={i === lines - 1 ? '70%' : '100%'}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-xl p-6 ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" height="1rem" width="60%" className="mb-2" />
        <Skeleton variant="text" height="0.75rem" width="40%" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
);

export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) => (
  <div className={`bg-white dark:bg-surface border border-grey-200 dark:border-border rounded-xl overflow-hidden ${className}`}>
    {/* Header */}
    <div className="flex border-b border-grey-200 dark:border-border p-4 gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" height="1rem" width={`${100 / columns}%`} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="flex p-4 gap-4 border-b border-grey-200 dark:border-border last:border-0"
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            height="1rem"
            width={`${100 / columns}%`}
          />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
