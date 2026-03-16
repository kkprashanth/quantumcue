/**
 * Job status badge component.
 */

import { type JobStatus, getJobStatusConfig } from '../../api/endpoints/jobs';

interface JobStatusBadgeProps {
  status: JobStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const JobStatusBadge = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: JobStatusBadgeProps) => {
  const config = getJobStatusConfig(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const isActive = ['pending', 'queued', 'running'].includes(status);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-none font-medium
        ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}
      `}
    >
      {showDot && (
        <span
          className={`
            rounded-none ${dotSizes[size]}
            ${config.color.replace('text-', 'bg-')}
            ${isActive ? 'animate-pulse' : ''}
          `}
        />
      )}
      {config.label}
    </span>
  );
};

export default JobStatusBadge;
