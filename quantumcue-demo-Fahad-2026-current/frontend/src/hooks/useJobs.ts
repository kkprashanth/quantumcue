/**
 * Jobs hooks using React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  submitJob,
  cancelJob,
  getJobStats,
  getJobAudit,
  type JobStatus,
  type JobType,
  type JobListResponse,
  type JobDetail,
  type JobStatsResponse,
  type JobAuditEntry,
  type JobCreateRequest,
  type JobUpdateRequest,
} from '../api/endpoints/jobs';

/**
 * Hook to fetch jobs list.
 */
export const useJobs = (params?: {
  status?: JobStatus;
  job_type?: JobType;
  page?: number;
  page_size?: number;
}) => {
  return useQuery<JobListResponse, Error>({
    queryKey: ['jobs', params],
    queryFn: () => getJobs(params),
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch a single job.
 */
export const useJob = (jobId: string | undefined) => {
  return useQuery<JobDetail, Error>({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId!),
    enabled: !!jobId,
    staleTime: 10 * 1000,
    refetchInterval: (query) => {
      // Auto-refresh running jobs
      const status = query.state.data?.status;
      if (status && ['pending', 'queued', 'running'].includes(status)) {
        return 5000; // 5 seconds
      }
      return false;
    },
  });
};

/**
 * Hook to fetch job statistics.
 */
export const useJobStats = () => {
  return useQuery<JobStatsResponse, Error>({
    queryKey: ['job-stats'],
    queryFn: getJobStats,
    staleTime: 30 * 1000,
  });
};

/**
 * Hook to fetch job audit trail.
 * Polls automatically while job is not completed.
 */
export const useJobAudit = (jobId: string | undefined, jobStatus?: string | null) => {
  const isJobComplete = jobStatus === 'completed' || jobStatus === 'failed' || jobStatus === 'cancelled';
  const terminalStatus = jobStatus === 'completed' || jobStatus === 'failed' || jobStatus === 'cancelled' ? jobStatus : null;
  
  return useQuery<JobAuditEntry[], Error>({
    queryKey: ['job-audit', jobId],
    queryFn: () => getJobAudit(jobId!),
    enabled: !!jobId,
    staleTime: 0, // Always consider stale to allow refetching
    refetchInterval: (query) => {
      // Poll every 2 seconds while job is in progress.
      if (!isJobComplete) return 2000;

      // Once the job is terminal, keep polling until the audit log contains the terminal entry.
      // This avoids missing the final "completed/failed/cancelled" event due to backend write timing.
      if (terminalStatus) {
        const logs = query.state.data;
        const hasTerminalLog = logs?.some(
          (log) => log.new_status === terminalStatus || log.action === terminalStatus
        );
        if (!hasTerminalLog) return 2000;
      }

      return false;
    },
    refetchIntervalInBackground: true,
  });
};

/**
 * Hook to create a job.
 */
export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreateRequest) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
  });
};

/**
 * Hook to update a job.
 */
export const useUpdateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: JobUpdateRequest }) =>
      updateJob(jobId, data),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

/**
 * Hook to delete a job.
 */
export const useDeleteJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => deleteJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
  });
};

/**
 * Hook to submit a job.
 */
export const useSubmitJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => submitJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
  });
};

/**
 * Hook to cancel a job.
 */
export const useCancelJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => cancelJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-stats'] });
    },
  });
};

export default useJobs;
