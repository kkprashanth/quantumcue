/**
 * Page container component for consistent page layout with new design system.
 */

import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  titlePrefix?: React.ReactNode;
  titleSuffix?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  headerClassName = '',
  maxWidth = 'full',
  padding = true,
  title,
  description,
  action,
  titlePrefix,
  titleSuffix,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`
        ${maxWidthClasses[maxWidth]}
        mx-auto
        ${padding ? 'p-6' : ''}
        ${className}
      `}
    >
      {title && (
        <PageHeader
          title={title}
          description={description}
          action={action}
          titlePrefix={titlePrefix}
          titleSuffix={titleSuffix}
          className={headerClassName}
        />
      )}
      {children}
    </div>
  );
};

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  titlePrefix?: React.ReactNode;
  titleSuffix?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  icon,
  titlePrefix,
  titleSuffix,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {titlePrefix}
        {icon && (
          <div className="p-2 bg-navy-100 dark:bg-navy-700/20 rounded-lg text-navy-800 dark:text-navy-600">
            {icon}
          </div>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-grey-900 dark:text-text-primary">{title}</h1>
            {titleSuffix}
          </div>
          {description && (
            <p className="mt-1 text-grey-500 dark:text-text-secondary">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};

export default PageContainer;
