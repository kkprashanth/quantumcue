/**
 * Dashboard API endpoints.
 */

import apiClient from '../client';

export interface JobStats {
  total: number;
  draft: number;
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface DataUsage {
  budget_mb: number;
  used_mb: number;
  percentage: number;
}

export interface ProviderStatus {
  id: string;
  name: string;
  code: string;
  status: 'online' | 'offline' | 'degraded';
  queue_depth: number;
  avg_wait_time_seconds: number;
}

export interface RecentJob {
  id: string;
  name: string;
  status: string;
  job_type: string | null;
  provider_name: string | null;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
}

export interface ModelStats {
  total: number;
  training: number;
  ready: number;
  hosted_active: number;
  archived: number;
  error: number;
}

export interface DatasetStats {
  total: number;
  ready: number;
  total_size_gb: number;
  used_in_training: number;
}

export interface RecentModel {
  id: string;
  display_id: string | null;
  name: string;
  status: string;
  model_type: string;
  created_at: string;
  prediction_count: number;
}

export interface RecentActivity {
  type: 'job' | 'model' | 'dataset' | 'interaction';
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MetricsStats {
  total_interactions: number;
  submitted: number;
  corrected: number;
  accepted: number;
}

export interface DashboardData {
  job_stats: JobStats;
  model_stats: ModelStats;
  dataset_stats: DatasetStats;
  data_usage: DataUsage;
  provider_statuses: ProviderStatus[];
  recent_jobs: RecentJob[];
  recent_models: RecentModel[];
  recent_activity: RecentActivity[];
  metrics_stats: MetricsStats;
}

/**
 * Get dashboard statistics.
 */
export const getDashboardStats = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/dashboard/stats');
  return response.data;
};
