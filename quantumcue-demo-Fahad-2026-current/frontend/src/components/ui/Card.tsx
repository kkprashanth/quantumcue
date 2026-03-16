/**
 * Card component for content containers with QuantumCue design system variants.
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'stat' | 'section';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  title,
  icon,
  variant = 'default',
  onClick,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const variantStyles = {
    default: 'bg-surface border-2 border-border rounded-xl',
    elevated: 'bg-surface border-2 border-border rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all',
    stat: 'bg-surface border-2 border-border rounded-xl relative hover:border-border-subtle hover:shadow-md transition-all cursor-pointer',
    section: 'bg-surface border-2 border-border-subtle rounded-xl shadow-sm',
  };

  return (
    <div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className} flex flex-col ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {variant === 'stat' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-quantum opacity-0 hover:opacity-100 transition-opacity duration-normal rounded-t-[10px]" />
      )}
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-grey-400 dark:text-text-tertiary">{icon}</span>}
          <h3 className="text-lg font-semibold text-grey-700 dark:text-text-primary">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
}) => {
  return (
    <h3 className={`text-lg font-semibold text-grey-700 dark:text-text-primary ${className}`}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className = '',
}) => {
  return (
    <p className={`text-sm text-grey-500 dark:text-text-secondary mt-1 ${className}`}>
      {children}
    </p>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={className}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`mt-4 pt-4 border-t border-grey-200 dark:border-border ${className}`}>
      {children}
    </div>
  );
};

export default Card;
