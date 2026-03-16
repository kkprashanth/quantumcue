/**
 * Core type definitions for QuantumCue frontend
 */

// User and Account Types
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'superadmin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  account: AccountSummary;
  created_at: string;
  last_login_at: string | null;
}

export interface AccountSummary {
  id: string;
  name: string;
  slug: string;
}

export interface Account extends AccountSummary {
  status: 'active' | 'suspended' | 'cancelled';
  tier: 'trial' | 'starter' | 'professional' | 'enterprise';
  description: string | null;
  data_budget_mb: number;
  data_used_mb: number;
  data_usage_percentage: number;
  total_time_allotted_seconds: number;
  time_remaining_seconds: number;
  settings: Record<string, unknown>;
  created_at: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Provider Types
export type ProviderType = 'annealer' | 'gate-based' | 'hybrid';
export type ProviderStatus = 'available' | 'degraded' | 'unavailable';

export interface Provider {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  documentation_url: string | null;
  provider_type: ProviderType;
  hardware_info: Record<string, unknown>;
  capabilities: Record<string, unknown>;
  pricing_info: Record<string, unknown>;
  status: ProviderStatus;
  queue_depth: number;
  estimated_wait_seconds: number;
  is_enabled_for_account?: boolean;
}

// Job Types
export type JobStatus =
  | 'draft'
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type JobType = 'optimization' | 'simulation' | 'machine_learning' | 'chemistry' | 'custom';

export interface Job {
  id: string;
  display_id: string | null;
  name: string;
  description: string | null;
  job_type: JobType;
  status: JobStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  provider_id: string | null;
  dataset_id: string | null;
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
  training_metrics_history: TrainingMetrics[] | null;
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
  submitted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  chat_history: Record<string, unknown> | null;
  provider_name: string | null;
  created_by_name: string | null;
  dataset_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  validation_loss: number;
  validation_accuracy: number;
  timestamp: string;
}

export interface ProviderSummary {
  id: string;
  name: string;
  slug: string;
}

export interface JobCreate {
  name: string;
  description?: string;
  job_type?: JobType;
  provider_id?: string;
  dataset_id?: string;
  cost_min_est?: number;
  cost_max_est?: number;
  total_epochs?: number;
}

export interface JobUpdate {
  name?: string;
  description?: string;
  job_type?: JobType;
  provider_id?: string;
  dataset_id?: string;
  progress_percentage?: number;
  current_epoch?: number;
  total_epochs?: number;
  training_metrics_history?: Record<string, unknown>;
  final_metrics?: Record<string, unknown>;
  cost_actual?: number;
  cost_breakdown?: Record<string, unknown>;
}

// Dataset Types
export type DatasetFileFormat = 'csv' | 'json' | 'parquet' | 'images' | 'image_directory' | 'zip' | 'txt';
export type DatasetDataType = 'structured' | 'unstructured' | 'images' | 'text' | 'mixed';
export type DatasetStatus = 'uploading' | 'processing' | 'ready' | 'error';

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_size_bytes: number;
  file_format: DatasetFileFormat;
  data_type: DatasetDataType;
  row_count: number | null;
  column_count: number | null;
  schema: Record<string, unknown> | null;
  statistics: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  status: DatasetStatus;
  is_public: boolean;
  validation_errors: Record<string, unknown> | null;
  processing_stage?: string | null;
  labeling_structure?: Record<string, unknown> | null;
  extracted_labels?: {
    patients?: Array<{
      patient_id: string;
      classification: string;
      directory: string;
      files: Record<string, unknown>;
    }>;
    classifications?: Record<string, number>;
    total_patients?: number;
  } | null;
  split_estimates?: {
    train: number;
    validation: number;
    test: number;
    total: number;
    percentages?: {
      train: number;
      validation: number;
      test: number;
    };
  } | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatasetStats {
  total: number;
  uploading: number;
  processing: number;
  ready: number;
  error: number;
}

// Provider Configuration Types
export type ConfigurationFieldType = 'integer' | 'float' | 'string' | 'select' | 'boolean';

export interface ValidationRules {
  min?: number;
  max?: number;
  required?: boolean;
  options?: unknown[];
  unit?: string;
  step?: number;
}

export interface ProviderConfigurationField {
  field_key: string;
  field_type: ConfigurationFieldType;
  label: string;
  description: string | null;
  default_value: unknown;
  validation_rules: ValidationRules | null;
  controlling_field: string | null;
  controlling_value: unknown | unknown[] | null;
  parameter_type: 'standard' | 'hardware';
  display_order: number;
  is_user_problem_specific: boolean;
}

export interface ProviderConfiguration {
  provider_id: string;
  provider_code: string;
  fields: ProviderConfigurationField[];
}

export interface ProviderConfigurationDefaults {
  provider_id: string;
  values: Record<string, unknown>;
  num_classes: number | null;
}

export interface ProviderConfigurationValidationRequest {
  values: Record<string, unknown>;
}

export interface ProviderConfigurationValidationResponse {
  valid: boolean;
  errors: Record<string, string[]>;
}

export interface DatasetCreate {
  name: string;
  description?: string;
  file_path: string;
  file_size_bytes: number;
  file_format: DatasetFileFormat;
  data_type: DatasetDataType;
  row_count?: number;
  column_count?: number;
  schema?: Record<string, unknown>;
  statistics?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  is_public?: boolean;
}

export interface DatasetUpdate {
  name?: string;
  description?: string;
  status?: DatasetStatus;
  statistics?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  validation_errors?: Record<string, unknown>;
  is_public?: boolean;
}

// Model Types
export type ModelType = 'qnn' | 'vqc' | 'qsvm' | 'generative' | 'custom';
export type ModelStatus = 'training' | 'ready' | 'hosted_active' | 'archived' | 'error';
export type HostingStatus = 'not_hosted' | 'deploying' | 'active' | 'error';
export type InteractionType = 'inference_single' | 'inference_batch' | 'evaluation' | 'fine_tune';

export interface Model {
  id: string;
  display_id: string | null;
  name: string;
  description: string | null;
  model_type: ModelType;
  model_architecture: Record<string, unknown>;
  model_weights_path: string | null;
  configuration: Record<string, unknown>;
  version: number;
  metrics: Record<string, unknown>;
  evaluation_results: Record<string, unknown> | null;
  status: ModelStatus;
  hosting_endpoint: string | null;
  hosting_status: HostingStatus | null;
  client_id: string | null;
  client_secret: string | null;
  prediction_count: number;
  average_confidence?: number | null;
  last_used_at: string | null;
  usage_stats: Record<string, unknown> | null;
  recommendations_config?: Record<string, string[]> | null;
  classifications?: string[] | null;
  classes?: string[] | null;
  num_of_classes?: number | null;
  num_weights?: number | null;
  num_variables?: number | null;
  enable_reasoning?: boolean;
  training_job_id: string | null;
  dataset_id: string | null;
  provider_id: string | null;
  parent_model_id: string | null;
  created_by_name: string | null;
  training_job_name: string | null;
  dataset_name: string | null;
  provider_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelCreate {
  name: string;
  description?: string;
  model_type: ModelType;
  model_architecture: Record<string, unknown>;
  configuration: Record<string, unknown>;
  metrics: Record<string, unknown>;
  training_job_id?: string;
  dataset_id?: string;
  provider_id?: string;
  parent_model_id?: string;
  version?: number;
  model_weights_path?: string;
  evaluation_results?: Record<string, unknown>;
}

export interface ModelUpdate {
  name?: string;
  description?: string;
  status?: ModelStatus;
  hosting_status?: HostingStatus;
  hosting_endpoint?: string;
  metrics?: Record<string, unknown>;
  evaluation_results?: Record<string, unknown>;
  usage_stats?: Record<string, unknown>;
  classifications?: string[];
}

export interface ModelMetrics {
  weights?: number[];
  specs?: {
    num_classes: number;
    accuracy: number;
    precision: number;
    recall: number;
    F1: number;
    'ROC-AUC': number;
  };
  // ... existing fields (final_accuracy, validation_accuracy, etc.)
  [key: string]: unknown;
}

export interface QuantumClassicalComparison {
  quantum: {
    f1: number;
    accuracy: number;
    precision: number;
  };
  classical: {
    f1: number;
    accuracy: number;
    precision: number;
  };
}

export interface ModelStats {
  total_predictions: number;
  average_confidence: number;
  class_distribution: Record<string, number>;
  class_avg_confidence?: Record<string, number> | null; // Average confidence per classification
  recent_predictions: Array<{
    id: string;
    prediction: string | null;
    confidence: number | null;
    created_at: string;
    file_name: string | null;
  }>;
}

export interface ModelStatusStats {
  total: number;
  training: number;
  ready: number;
  hosted_active: number;
  archived: number;
  error: number;
}

export type FeedbackType = 'accepted' | 'corrected' | 'rejected';

export interface ModelInteraction {
  id: string;
  model_id: string;
  user_id: string | null;
  interaction_type: InteractionType;
  input_data: Record<string, unknown> | null;
  input_metadata: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  result_metadata: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  user_feedback?: Record<string, unknown> | null;
  feedback_type?: FeedbackType | null;
  recommendations_shown?: Record<string, unknown> | null;
  user_name: string | null;
  created_at: string;
}

export interface ModelInteractionCreate {
  interaction_type: InteractionType;
  input_data?: Record<string, unknown>;
  input_metadata?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  result_metadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  user_feedback?: Record<string, unknown>;
  feedback_type?: FeedbackType;
  recommendations_shown?: string[];
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  suggestions?: ChatSuggestion[];
  job_updates?: Record<string, unknown>;
}

export interface ChatSuggestion {
  type: 'action' | 'question';
  label: string;
  action?: string;
}

export interface ModelChatRequest {
  message: string;
}

export interface ModelChatResponse {
  message: string;
  insights?: string[] | null;
  recommendations?: string[] | null;
}

export interface ChatRequest {
  message: string;
  attachments?: string[];
}

// Result Types
export interface Result {
  id: string;
  job_id: string;
  result_type: 'primary' | 'intermediate' | 'comparison';
  solution_vector: number[];
  energy_values: number[];
  probabilities: number[];
  summary_stats: ResultStats;
  chart_data: ChartData;
  execution_time_ms: number;
  queue_time_ms: number;
  total_shots: number;
  created_at: string;
}

export interface ResultStats {
  best_energy: number;
  average_energy: number;
  num_solutions: number;
  unique_solutions: number;
}

export interface ChartData {
  energy_histogram: HistogramData;
  solution_distribution: DistributionData;
}

export interface HistogramData {
  labels: string[];
  data: number[];
}

export interface DistributionData {
  labels: string[];
  data: number[];
  energies: number[];
}

// Dashboard Types
export interface DashboardStats {
  jobs: JobStats;
  data_usage: DataUsage;
  recent_jobs: Job[];
  provider_status: ProviderStatusSummary[];
}

export interface JobStats {
  total: number;
  completed: number;
  running: number;
  queued: number;
  draft: number;
}

export interface DataUsage {
  budget_bytes: number;
  used_bytes: number;
  percentage: number;
}

export interface ProviderStatusSummary {
  provider_id: string;
  name: string;
  slug: string;
  status: ProviderStatus;
  queue_depth: number;
  estimated_wait_seconds: number;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// Filter Types
export interface JobFilters extends PaginationParams {
  status?: JobStatus[];
  provider_id?: string;
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'name';
  order?: 'asc' | 'desc';
}

// API Error Types
export interface APIError {
  detail: string;
  code: string;
}
