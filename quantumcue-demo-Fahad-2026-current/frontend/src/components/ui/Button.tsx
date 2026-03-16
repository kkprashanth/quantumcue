/**
 * Button component with variants following QuantumCue design system.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'quantum' | 'secondary' | 'ghost' | 'danger' | 'quick_action' | 'luxury';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const buttonVariants = {
  primary:
    'bg-gradient-primary text-white hover:bg-gradient-primary-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-navy-900 dark:focus:ring-navy-700',
  quantum:
    'bg-gradient-quantum text-white hover:bg-gradient-quantum-hover hover:shadow-quantum hover:-translate-y-0.5 active:translate-y-0 focus:ring-navy-700',
  secondary:
    'bg-white dark:bg-surface border border-grey-200 dark:border-border text-grey-700 dark:text-text-primary hover:bg-[#3860A0] hover:text-white dark:hover:bg-surface-elevated focus:ring-grey-400',
  ghost:
    'bg-transparent text-grey-600 dark:text-text-secondary hover:text-grey-900 dark:hover:text-text-primary hover:bg-grey-100 dark:hover:bg-surface focus:ring-grey-400',
  danger:
    'bg-red-500 text-white hover:bg-red-500/90 focus:ring-reg-500',
  quick_action:
    'bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#06b6d4] text-white hover:bg-gradient-quantum-hover hover:shadow-quantum hover:-translate-y-0.5 active:translate-y-0 focus:ring-navy-700',
  luxury:
    'bg-[#3850A0] text-white hover:bg-[#3850A0] hover:shadow-[0_8px_32px_rgba(79,70,229,0.35)] hover:-translate-y-0.5 active:translate-y-0 focus:ring-[#4f46e5]',
};

export const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      className={`${baseStyles} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
