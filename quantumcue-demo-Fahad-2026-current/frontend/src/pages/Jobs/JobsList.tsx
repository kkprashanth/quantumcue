/**
 * Jobs list page with new design system.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, AlertCircle, MoreVertical, Check } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { JobCard, JobRow, JobStatusBadge } from '../../components/jobs';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Dropdown } from '../../components/ui/Dropdown';
import { Tooltip } from '../../components/ui/Tooltip';
import { useJobs, useJobStats } from '../../hooks/useJobs';
import { type JobStatus, type JobType } from '../../api/endpoints/jobs';

const PAGE_SIZE = 10;

export const JobsList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<JobStatus | undefined>();
  const [jobTypeFilter, setJobTypeFilter] = useState<JobType | undefined>();

  const { data: jobsData, isLoading, error } = useJobs({
    status: statusFilter,
    job_type: jobTypeFilter,
    page,
    page_size: PAGE_SIZE,
  });

  const { data: statsData } = useJobStats();

  const handleStatusChange = (status: JobStatus | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleJobTypeChange = (jobType: JobType | undefined) => {
    setJobTypeFilter(jobType);
    setPage(1);
  };

  const statusFilterItems = [
    { label: 'All Statuses', value: undefined },
    { label: 'Draft', value: 'draft' as JobStatus },
    { label: 'Pending', value: 'pending' as JobStatus },
    { label: 'Queued', value: 'queued' as JobStatus },
    { label: 'Running', value: 'running' as JobStatus },
    { label: 'Completed', value: 'completed' as JobStatus },
    { label: 'Failed', value: 'failed' as JobStatus },
    { label: 'Cancelled', value: 'cancelled' as JobStatus },
  ];

  const jobTypeFilterItems = [
    { label: 'All Types', value: undefined },
    { label: 'Optimization', value: 'optimization' as JobType },
    { label: 'Simulation', value: 'simulation' as JobType },
    { label: 'Machine Learning', value: 'machine_learning' as JobType },
    { label: 'Chemistry', value: 'chemistry' as JobType },
    { label: 'Custom', value: 'custom' as JobType },
  ];

  const filterDropdownItems = [
    ...statusFilterItems.map(item => ({
      label: item.label,
      onClick: () => handleStatusChange(item.value),
      icon: statusFilter === item.value ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />
    })),
    { divider: true, label: '' },
    ...jobTypeFilterItems.map(item => ({
      label: item.label,
      onClick: () => handleJobTypeChange(item.value),
      icon: jobTypeFilter === item.value ? <Check size={14} className="text-navy-700" /> : <div className="w-[14px]" />
    }))
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-500';
      case 'failed': return 'bg-error-500';
      case 'running': return 'bg-warning-500';
      case 'queued': return 'bg-navy-600';
      case 'pending': return 'bg-blue-500';
      case 'draft': return 'bg-[#3850A0]';
      default: return 'bg-grey-200';
    }
  };

  const stats = statsData ? [
    { label: 'Completed', value: statsData.completed, status: 'completed' },
    { label: 'Running', value: statsData.running, status: 'running' },
    { label: 'Queued', value: statsData.queued, status: 'queued' },
    { label: 'Pending', value: statsData.pending, status: 'pending' },
    { label: 'Failed', value: statsData.failed, status: 'failed' },
    { label: 'Draft', value: statsData.draft, status: 'draft' },
  ].filter(s => s.value > 0) : [];

  const totalForBar = stats.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <PageContainer
      title="Jobs"
      titleSuffix={
        <Dropdown
          trigger={
            <div className="p-1.5 hover:bg-grey-100 dark:hover:bg-surface-elevated rounded-lg transition-colors text-grey-500 dark:text-text-tertiary">
              <MoreVertical size={20} />
            </div>
          }
          items={filterDropdownItems}
          align="left"
        />
      }
    >
      {/* Stats Summary Bar */}
      {statsData && totalForBar > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Job Distribution</span>
            <span className="text-sm font-bold text-text-primary">{statsData.total} Total Jobs</span>
          </div>
          <div className="w-full h-5 flex rounded-full bg-grey-100 dark:bg-surface-elevated">
            {stats.map((stat, index) => {
              const percentage = totalForBar > 0 ? ((stat.value / totalForBar) * 100).toFixed(1) : 0;
              const isFirst = index === 0;
              const isLast = index === stats.length - 1;
              const roundedClasses = `${isFirst ? 'rounded-l-full' : ''} ${isLast ? 'rounded-r-full' : ''}`.trim();

              return (
                <Tooltip
                  key={stat.status}
                  content={`${stat.label}: ${stat.value} (${percentage}%)`}
                  className="h-full block flex-shrink-0"
                  style={{ width: `${(stat.value / totalForBar) * 100}%` }}
                >
                  <div
                    className={`h-full w-full ${getStatusColor(stat.status)} ${roundedClasses} transition-all hover:opacity-80`}
                  />
                </Tooltip>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
            {stats.map((stat) => (
              <div key={stat.status} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-none ${getStatusColor(stat.status)}`} />
                <span className="text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">{stat.value}</span> {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height="80px" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-error/20 bg-error/10">
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-2" />
          <p className="text-error font-semibold">Failed to load jobs</p>
          <p className="text-grey-500 dark:text-text-tertiary text-sm mt-1">{error.message}</p>
        </Card>
      ) : !jobsData?.jobs.length ? (
        <Card className="p-12 text-center">
          <Briefcase className="w-12 h-12 text-grey-400 dark:text-text-tertiary mx-auto mb-4" />
          <h3 className="text-grey-900 dark:text-text-primary font-semibold mb-2">No jobs found</h3>
          <p className="text-grey-500 dark:text-text-tertiary text-sm mb-4">
            {statusFilter || jobTypeFilter
              ? 'No jobs match your filters. Try adjusting your search.'
              : 'No jobs are currently available.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase text-text-primary font-semibold tracking-wider">
                    <th className="px-6 py-4 w-[35%] pl-[33px]">Name</th>
                    <th className="px-6 py-4 w-[16%]">Status</th>
                    <th className="px-6 py-4 w-[16%]">Type</th>
                    <th className="px-6 py-4 w-[16%]">Priority</th>
                    <th className="px-6 py-4 w-[16%]">Provider</th>
                    <th className="px-6 py-4 w-[16%]">Completed</th>
                    <th className="px-6 py-4 w-[16%] text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobsData.jobs.map((job) => (
                    <JobRow key={job.id} job={job} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {jobsData.total_pages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={jobsData.total_pages}
                onPageChange={setPage}
              />
            </div>
          )}

          {/* Results info */}
          <p className="text-center text-grey-500 dark:text-text-tertiary text-sm mt-4">
            Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(page * PAGE_SIZE, jobsData.total)} of {jobsData.total} jobs
          </p>
        </>
      )}
    </PageContainer>
  );
};

export default JobsList;
