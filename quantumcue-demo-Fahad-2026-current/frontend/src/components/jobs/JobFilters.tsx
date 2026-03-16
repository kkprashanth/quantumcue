/**
 * Job filters component.
 */

import { type JobStatus, type JobType } from '../../api/endpoints/jobs';

interface JobFiltersProps {
  status: JobStatus | undefined;
  jobType: JobType | undefined;
  onStatusChange: (status: JobStatus | undefined) => void;
  onJobTypeChange: (jobType: JobType | undefined) => void;
}

const statusOptions: { value: JobStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const jobTypeOptions: { value: JobType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'optimization', label: 'Optimization' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'machine_learning', label: 'Machine Learning' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'custom', label: 'Custom' },
];

export const JobFilters = ({
  status,
  jobType,
  onStatusChange,
  onJobTypeChange,
}: JobFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Filter by Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const isActive = (status || '') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onStatusChange(option.value ? (option.value as JobStatus) : undefined)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-navy-700/20 text-navy-700 border border-navy-700/30'
                      : 'bg-surface border border-border-primary text-text-primary hover:bg-bg-tertiary hover:border-border-subtle'
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Job Type Filter */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Filter by Type
        </label>
        <div className="flex flex-wrap gap-2">
          {jobTypeOptions.map((option) => {
            const isActive = (jobType || '') === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onJobTypeChange(option.value ? (option.value as JobType) : undefined)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-navy-700/20 text-navy-700 border border-navy-700/30'
                      : 'bg-surface border border-border-primary text-text-primary hover:bg-bg-tertiary hover:border-border-subtle'
                  }
                `}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JobFilters;
