/**
 * Jobs API endpoints.
 */

import apiClient from '../client';

export type JobStatus = 'draft' | 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'optimization' | 'simulation' | 'machine_learning' | 'chemistry' | 'custom';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface JobSummary {
  id: string;
  display_id: string | null;
  name: string;
  description: string | null;
  job_type: JobType;
  status: JobStatus;
  priority: JobPriority;
  provider_id: string | null;
  provider_name: string | null;
  created_by_name: string | null;
  progress_percentage: number | null;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
}

export interface JobDetail {
  id: string;
  display_id: string | null;
  account_id: string;
  created_by_id: string | null;
  provider_id: string | null;
  dataset_id: string | null;
  name: string;
  description: string | null;
  job_type: JobType;
  status: JobStatus;
  priority: JobPriority;
  provider_code: string | null;
  provider_metadata: Record<string, unknown> | null;
  job_metadata: Record<string, unknown> | null;
  cost_min_est: number | null;
  cost_max_est: number | null;
  cost_actual: number | null;
  cost_breakdown: Record<string, unknown> | null;
  progress_percentage: number | null;
  current_epoch: number | null;
  total_epochs: number | null;
  training_metrics_history: Array<{
    epoch: number;
    loss: number;
    accuracy: number;
    validation_loss: number;
    validation_accuracy: number;
    timestamp: string;
  }> | null;
  final_metrics: Record<string, unknown> | null;
  logs: string | null;
  checkpoints: Record<string, unknown> | null;
  input_data_type: string | null;
  input_data_ref: string | null;
  parameters: Record<string, unknown> | null;
  qubit_count_requested: number | null;
  shot_count: number;
  optimization_level: number;
  result_data: Record<string, unknown> | null;
  result_summary: string | null;
  error_message: string | null;
  execution_time_ms: number | null;
  queue_time_ms: number | null;
  total_cost: number | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  chat_history: Record<string, unknown> | null;
  provider_name: string | null;
  created_by_name: string | null;
  dataset_name: string | null;
}

export interface JobListResponse {
  jobs: JobSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface JobStatsResponse {
  total: number;
  draft: number;
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface JobAuditEntry {
  id: string;
  job_id: string;
  user_id: string | null;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user_name: string | null;
}

export interface JobCreateRequest {
  name: string;
  description?: string;
  job_type?: JobType;
  provider_id?: string;
  dataset_id?: string;
  priority?: JobPriority;
  input_data_type?: string;
  input_data_ref?: string;
  parameters?: Record<string, unknown>;
  qubit_count_requested?: number;
  shot_count?: number;
  optimization_level?: number;
  cost_min_est?: number;
  cost_max_est?: number;
  total_epochs?: number;
}

export interface JobUpdateRequest {
  name?: string;
  description?: string;
  job_type?: JobType;
  provider_id?: string;
  priority?: JobPriority;
  input_data_type?: string;
  input_data_ref?: string;
  parameters?: Record<string, unknown>;
  qubit_count_requested?: number;
  shot_count?: number;
  optimization_level?: number;
}

export interface JobSubmitResponse {
  job_id: string;
  status: JobStatus;
  message: string;
  queue_position: number | null;
}

export interface JobCancelResponse {
  job_id: string;
  status: JobStatus;
  message: string;
}

/**
 * Create a new job.
 */
export const createJob = async (data: JobCreateRequest): Promise<JobDetail> => {
  const response = await apiClient.post<JobDetail>('/jobs', data);
  return response.data;
};

/**
 * Get jobs list with pagination and filters.
 */
export const getJobs = async (params?: {
  status?: JobStatus;
  job_type?: JobType;
  page?: number;
  page_size?: number;
}): Promise<JobListResponse> => {
  const response = await apiClient.get<JobListResponse>('/jobs', { params });
  return response.data;
};

/**
 * Get job by ID.
 */
export const getJob = async (jobId: string): Promise<JobDetail> => {
  const response = await apiClient.get<JobDetail>(`/jobs/${jobId}`);
  return response.data;
};

/**
 * Update a job.
 */
export const updateJob = async (jobId: string, data: JobUpdateRequest): Promise<JobDetail> => {
  const response = await apiClient.patch<JobDetail>(`/jobs/${jobId}`, data);
  return response.data;
};

/**
 * Delete a job.
 */
export const deleteJob = async (jobId: string): Promise<void> => {
  await apiClient.delete(`/jobs/${jobId}`);
};

/**
 * Submit a job for execution.
 */
export const submitJob = async (jobId: string): Promise<JobSubmitResponse> => {
  const response = await apiClient.post<JobSubmitResponse>(`/jobs/${jobId}/submit`);
  return response.data;
};

/**
 * Cancel a running job.
 */
export const cancelJob = async (jobId: string): Promise<JobCancelResponse> => {
  const response = await apiClient.post<JobCancelResponse>(`/jobs/${jobId}/cancel`);
  return response.data;
};

/**
 * Get job statistics.
 */
export const getJobStats = async (): Promise<JobStatsResponse> => {
  const response = await apiClient.get<JobStatsResponse>('/jobs/stats');
  return response.data;
};

/**
 * Get job audit trail.
 */
export const getJobAudit = async (jobId: string): Promise<JobAuditEntry[]> => {
  const response = await apiClient.get<JobAuditEntry[]>(`/jobs/${jobId}/audit`);
  return response.data;
};

/**
 * Get external job result.
 */
export const getExternalJobResult = async (jobId: string, numClasses: number = 4): Promise<any> => {
  const response = await apiClient.get<any>(`/jobs/${jobId}/external-result`, {
    params: { num_classes: numClasses }
  });
  return response.data;
};

/**
 * Get status display info.
 */
export const getJobStatusConfig = (status: JobStatus) => {
  const configs: Record<JobStatus, { label: string; color: string; bgColor: string }> = {
    draft: { label: 'Draft', color: 'text-[#3850A0]', bgColor: 'bg-[#3850A0]/20' },
    pending: { label: 'Pending', color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
    queued: { label: 'Queued', color: 'text-navy-500', bgColor: 'bg-navy-500/20' },
    running: { label: 'Running', color: 'text-warning-500', bgColor: 'bg-warning-500/20' },
    completed: { label: 'Completed', color: 'text-success-500', bgColor: 'bg-success-500/20' },
    failed: { label: 'Failed', color: 'text-error-500', bgColor: 'bg-red-500/20' },
    cancelled: { label: 'Cancelled', color: 'text-red-500', bgColor: 'bg-red-500/20' },
  };
  return configs[status];
};

/**
 * Get job type display label.
 */
export const getJobTypeLabel = (type: JobType): string => {
  const labels: Record<JobType, string> = {
    optimization: 'Optimization',
    simulation: 'Simulation',
    machine_learning: 'Machine Learning',
    chemistry: 'Chemistry',
    custom: 'Custom',
  };
  return labels[type];
};

/**
 * Get priority display config.
 */
export const getJobPriorityConfig = (priority: JobPriority) => {
  const configs: Record<JobPriority, { label: string; color: string }> = {
    low: { label: 'Low', color: 'text-text-tertiary' },
    normal: { label: 'Normal', color: 'text-text-secondary' },
    high: { label: 'High', color: 'text-status-warning' },
    urgent: { label: 'Urgent', color: 'text-status-error' },
  };
  return configs[priority];
};

/**
 * Estimate job cost.
 */
export interface CostEstimate {
  min: number;
  max: number;
  currency: string;
  breakdown: {
    compute_cost: number;
    storage_cost: number;
    data_transfer_cost: number;
  };
}

export const estimateJobCost = async (params: {
  provider_id: string;
  job_type: JobType;
  shots?: number;
  qubits?: number;
  epochs?: number;
  data_size_mb?: number;
}): Promise<CostEstimate> => {
  const response = await apiClient.get<CostEstimate>('/jobs/estimate-cost', { params });
  return response.data;
};
