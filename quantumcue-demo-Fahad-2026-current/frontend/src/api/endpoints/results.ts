/**
 * Results API endpoints.
 */

import apiClient from '../client';

export interface SolutionSample {
  state: Record<string, number> | string;
  energy?: number;
  count: number;
  probability?: number;
}

export interface OptimizationResult {
  optimal_value: number;
  variables: Record<string, number>;
  is_feasible: boolean;
  gap_to_bound?: number;
}

export interface SimulationResult {
  ground_state_energy?: number;
  expectation_values?: Record<string, number>;
  state_fidelity?: number;
}

export interface MLResult {
  model_accuracy?: number;
  training_loss?: number;
  classification_report?: Record<string, number>;
  feature_importance?: number[];
}

export interface ChemistryResult {
  ground_state_energy?: number;
  hartree_fock_energy?: number;
  correlation_energy?: number;
  dipole_moment?: number[];
  orbital_energies?: number[];
}

export interface MeasurementCounts {
  counts: Record<string, number>;
  probabilities?: Record<string, number>;
  shots: number;
}

export interface ResultMetrics {
  execution_time_ms?: number;
  queue_time_ms?: number;
  total_cost?: number;
  iterations?: number;
  circuit_depth?: number;
  num_qubits?: number;
}

export interface JobResultResponse {
  job_id: string;
  job_name: string;
  job_type: string;
  status: string;
  provider_name?: string;
  submitted_at?: string;
  completed_at?: string;
  success: boolean;
  result_summary?: string;
  error_message?: string;
  solution?: OptimizationResult;
  simulation?: SimulationResult;
  ml_result?: MLResult;
  chemistry?: ChemistryResult;
  measurements?: MeasurementCounts;
  samples?: SolutionSample[];
  metrics?: ResultMetrics;
  model_metrics?: Record<string, unknown>; // Model metrics for machine learning jobs
  raw_data?: Record<string, unknown>;
}

export interface ResultChatResponse {
  message: string;
  insights?: string[];
  recommendations?: string[];
}

/**
 * Get job results.
 */
export const getJobResults = async (jobId: string): Promise<JobResultResponse> => {
  const response = await apiClient.get<JobResultResponse>(`/jobs/${jobId}/results`);
  return response.data;
};

/**
 * Chat with results assistant.
 */
export const chatWithResults = async (
  jobId: string,
  content: string
): Promise<ResultChatResponse> => {
  const response = await apiClient.post<ResultChatResponse>(
    `/jobs/${jobId}/results/chat`,
    { content }
  );
  return response.data;
};
