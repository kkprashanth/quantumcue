/**
 * Projects API endpoints for new user wizard flow.
 */

import apiClient from '../client';
import type { JobDetail } from './jobs';
import type { JobType, JobPriority } from './jobs';

export interface NewProjectSubmitRequest {
  name: string;
  description?: string;
  job_type: JobType;
  provider_id: string;
  priority: JobPriority;
  shot_count: number;
  optimization_level: number;
  qubit_count_requested?: number;
  parameters?: Record<string, unknown>;
  file_name?: string;
  file_format?: string;
  file_size?: number;
  dataset_id?: string;
  classes?: string[];
  num_of_classes?: number;
}

/**
 * Submit a new project from the wizard.
 */
export const submitNewProject = async (data: NewProjectSubmitRequest): Promise<JobDetail> => {
  const response = await apiClient.post<JobDetail>('/projects/submit', data);
  return response.data;
};
