/**
 * Badge component with status variants following QuantumCue design system.
 */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'quantum' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-success-500',
    warning: 'bg-warning-100 dark:bg-warning-500/20 text-warning-700 dark:text-warning-500',
    error: 'bg-error-100 dark:bg-error-500/20 text-error-700 dark:text-error-500',
    info: 'bg-info-100 dark:bg-info-500/20 text-info-700 dark:text-info-500',
    quantum: 'bg-gradient-to-r from-navy-100 to-cyan-100 dark:from-navy-700/20 dark:to-cyan-500/20 text-navy-800 dark:text-navy-600',
    default: 'bg-grey-100 dark:bg-grey-800 text-grey-700 dark:text-grey-300',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;

