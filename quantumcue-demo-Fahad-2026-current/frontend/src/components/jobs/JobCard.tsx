/**
 * Job card component for job list.
 */

import { Link } from 'react-router-dom';
import {
  Clock,
  Cpu,
  User,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { type JobSummary, getJobTypeLabel, getJobPriorityConfig } from '../../api/endpoints/jobs';
import { JobStatusBadge } from './JobStatusBadge';

interface JobCardProps {
  job: JobSummary;
}

export const JobCard = ({ job }: JobCardProps) => {
  const priorityConfig = getJobPriorityConfig(job.priority);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block"
    >
      <Card variant="stat" padding="md" className="hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-text-primary font-medium truncate">
              {job.name}
            </h3>
            {job.description && (
              <p className="text-text-tertiary text-sm mt-0.5 line-clamp-1">
                {job.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <JobStatusBadge status={job.status} size="sm" />
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
          {/* Job Type */}
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-text-tertiary" />
            <span>{getJobTypeLabel(job.job_type)}</span>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <Zap className={`w-4 h-4 ${priorityConfig.color}`} />
            <span className={priorityConfig.color}>{priorityConfig.label}</span>
          </div>

          {/* Provider */}
          {job.provider_name && (
            <div className="flex items-center gap-1.5">
              <span className="text-text-tertiary">on</span>
              <span>{job.provider_name}</span>
            </div>
          )}

          {/* Creator */}
          {job.created_by_name && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-text-tertiary" />
              <span>{job.created_by_name}</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Clock className="w-4 h-4 text-text-tertiary" />
            <span>{formatDate(job.completed_at || job.submitted_at || job.created_at)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default JobCard;
