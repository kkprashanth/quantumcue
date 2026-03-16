/**
 * Quantum-branded loading spinner component.
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const LoadingSpinner = ({
  size = 'md',
  className = '',
  label,
}: LoadingSpinnerProps) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
    {/* Quantum spinner with gradient circle */}
    <svg
      className={`${sizeClasses[size]} animate-spin`}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334e68" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#spinnerGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="31.416"
        opacity="0.3"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#spinnerGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="15.708"
      />
    </svg>
    {label && (
      <p className="text-grey-600 dark:text-text-secondary text-sm">{label}</p>
    )}
  </div>
);

interface FullPageLoadingProps {
  label?: string;
}

export const FullPageLoading = ({ label = 'Loading...' }: FullPageLoadingProps) => (
  <div className="min-h-screen flex items-center justify-center bg-grey-50 dark:bg-background">
    <LoadingSpinner size="xl" label={label} />
  </div>
);

interface InlineLoadingProps {
  className?: string;
}

export const InlineLoading = ({ className = '' }: InlineLoadingProps) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <LoadingSpinner size="sm" />
    <span className="text-grey-500 dark:text-text-tertiary text-sm">Loading...</span>
  </div>
);

export default LoadingSpinner;
