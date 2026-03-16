/**
 * Input component with QuantumCue design system styling.
 */

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-grey-700 dark:text-text-primary mb-4"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full ${icon ? 'pl-10' : 'px-3'} py-2
              bg-white dark:bg-surface
              border-black
              border rounded-lg
              text-grey-900 dark:text-text-primary
              placeholder:text-grey-400 dark:placeholder:text-text-tertiary
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-navy-900/20 dark:focus:ring-navy-700/20 focus:border-navy-900 dark:focus:border-navy-700
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500 dark:border-red-500' : 'border-black dark:border-black hover:border-black dark:hover:border-blue-600'}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-grey-500 dark:text-text-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
