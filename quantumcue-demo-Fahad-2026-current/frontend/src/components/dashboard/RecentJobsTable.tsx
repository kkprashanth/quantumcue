/**
 * Recent jobs table component with new design system.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface RecentJob {
  id: string;
  name: string;
  status: string;
  job_type: string | null;
  provider_name: string | null;
  created_at: string;
  completed_at: string | null;
}

interface RecentJobsTableProps {
  jobs: RecentJob[];
  className?: string;
}

export const RecentJobsTable: React.FC<RecentJobsTableProps> = ({
  jobs,
  className = '',
}) => {
  const navigate = useNavigate();

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
      case 'queued':
        return 'warning';
      case 'failed':
        return 'error';
      case 'draft':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      queued: 'Queued',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      draft: 'Draft',
    };
    return labels[status] || status;
  };


  return (
    <Card className={`p-6 pl-8 h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-grey-900 dark:text-text-primary">Jobs</h3>
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-1 text-sm text-navy-700 hover:text-navy-800 dark:text-navy-600 transition-colors font-medium"
        >
          View all
          <ExternalLink size={14} />
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="p-6 text-center text-grey-500 dark:text-text-tertiary">
          No recent jobs
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pt-0">
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="flex items-start gap-3 py-3 pr-3 rounded-lg hover:bg-grey-50 dark:hover:bg-surface-elevated transition-colors cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-grey-100 dark:bg-surface-elevated text-navy-700 group-hover:bg-grey-200 dark:group-hover:bg-surface transition-colors">
                  <Briefcase size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-grey-900 dark:text-text-primary truncate">
                      {job.name}
                    </p>
                    <Badge variant={getStatusVariant(job.status)}>
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                  {job.provider_name && (
                    <p className="text-xs text-grey-500 dark:text-text-tertiary">
                      {job.provider_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default RecentJobsTable;
