/**
 * Models API endpoints.
 */

import apiClient from '../client';
import type {
  Model,
  ModelCreate,
  ModelUpdate,
  ModelStatus,
  ModelInteraction,
  ModelInteractionCreate,
  ModelStats,
  ModelStatusStats,
  QuantumClassicalComparison,
} from '@/types';

export interface ModelListResponse {
  models: Model[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ModelInteractionListResponse {
  interactions: ModelInteraction[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Create a new model.
 */
export const createModel = async (data: ModelCreate): Promise<Model> => {
  const response = await apiClient.post<Model>('/models', data);
  return response.data;
};

/**
 * Get models list with pagination and filters.
 */
export const getModels = async (params?: {
  status?: ModelStatus;
  training_job_id?: string;
  page?: number;
  page_size?: number;
}): Promise<ModelListResponse> => {
  const response = await apiClient.get<ModelListResponse>('/models', { params });
  return response.data;
};

/**
 * Get model by ID.
 */
export const getModel = async (modelId: string): Promise<Model> => {
  const response = await apiClient.get<Model>(`/models/${modelId}`);
  return response.data;
};

/**
 * Update a model.
 */
export const updateModel = async (modelId: string, data: ModelUpdate): Promise<Model> => {
  const response = await apiClient.put<Model>(`/models/${modelId}`, data);
  return response.data;
};

/**
 * Delete a model.
 */
export const deleteModel = async (modelId: string): Promise<void> => {
  await apiClient.delete(`/models/${modelId}`);
};

/**
 * Create a model interaction (prediction/evaluation).
 */
export const createModelInteraction = async (
  modelId: string,
  data: ModelInteractionCreate
): Promise<ModelInteraction> => {
  const response = await apiClient.post<ModelInteraction>(`/models/${modelId}/interactions`, data);
  return response.data;
};

/**
 * Get model interactions.
 */
export const getModelInteractions = async (
  modelId: string,
  params?: {
    page?: number;
    page_size?: number;
  }
): Promise<ModelInteractionListResponse> => {
  const response = await apiClient.get<ModelInteractionListResponse>(
    `/models/${modelId}/interactions`,
    { params }
  );
  return response.data;
};

/**
 * Host/deploy a model.
 */
export const hostModel = async (modelId: string): Promise<Model> => {
  const response = await apiClient.post<Model>(`/models/${modelId}/host`);
  return response.data;
};

/**
 * Make a prediction with a model using file upload.
 * If no file is provided, simulates inference using file metadata.
 */
export const predictModel = async (
  modelId: string,
  file?: File | null,
  fileName?: string,
  fileType?: string,
  fileSize?: number
): Promise<ModelInteraction> => {
  const formData = new FormData();

  // If a file is provided, send it for real inference
  // Otherwise, send metadata for simulation
  if (file) {
    formData.append('file', file);
  }
  
  if (fileName) {
    formData.append('file_name', fileName);
  }
  if (fileType) {
    formData.append('file_type', fileType);
  }
  if (fileSize !== undefined) {
    formData.append('file_size', fileSize.toString());
  }

  const response = await apiClient.post<ModelInteraction>(
    `/models/${modelId}/predict`,
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    }
  );
  return response.data;
};

/**
 * Get model statistics.
 */
export const getModelStats = async (modelId: string): Promise<ModelStats> => {
  const response = await apiClient.get<ModelStats>(`/models/${modelId}/stats`);
  return response.data;
};

/**
 * Get model status statistics for the current account.
 */
export const getModelStatusStats = async (): Promise<ModelStatusStats> => {
  const response = await apiClient.get<ModelStatusStats>('/models/stats');
  return response.data;
};

/**
 * Get quantum vs classical model comparison.
 */
export const getModelComparison = async (modelId: string): Promise<QuantumClassicalComparison> => {
  const response = await apiClient.get<QuantumClassicalComparison>(`/models/${modelId}/comparison`);
  return response.data;
};

/**
 * Get recommendations for a classification.
 */
export interface ModelRecommendationsResponse {
  model_id: string;
  classification: string;
  recommendations: string[];
}

export const getRecommendations = async (
  modelId: string,
  classification: string
): Promise<ModelRecommendationsResponse> => {
  const response = await apiClient.get<ModelRecommendationsResponse>(
    `/models/${modelId}/recommendations`,
    { params: { classification } }
  );
  return response.data;
};

/**
 * Update model recommendations configuration.
 */
export const updateRecommendations = async (
  modelId: string,
  config: Record<string, string[]>
): Promise<Model> => {
  const response = await apiClient.put<Model>(`/models/${modelId}/recommendations`, config);
  return response.data;
};

/**
 * Update model reasoning setting.
 */
export const updateModelReasoning = async (
  modelId: string,
  enableReasoning: boolean
): Promise<Model> => {
  const response = await apiClient.patch<Model>(`/models/${modelId}/reasoning`, {
    enable_reasoning: enableReasoning,
  });
  return response.data;
};

/**
 * Update model interaction with feedback.
 */
export interface ModelInteractionFeedbackUpdate {
  user_feedback?: Record<string, unknown>;
  feedback_type?: 'accepted' | 'corrected' | 'rejected';
  recommendations_shown?: string[];
}

/**
 * Chat with AI about a model.
 */
export interface ModelChatRequest {
  message: string;
}

export interface ModelChatResponse {
  message: string;
  insights?: string[] | null;
  recommendations?: string[] | null;
}

export const chatWithModel = async (
  modelId: string,
  message: string
): Promise<ModelChatResponse> => {
  const response = await apiClient.post<ModelChatResponse>(
    `/models/${modelId}/chat`,
    { message }
  );
  return response.data;
};

export const updateInteractionFeedback = async (
  interactionId: string,
  data: ModelInteractionFeedbackUpdate
): Promise<ModelInteraction> => {
  const response = await apiClient.put<ModelInteraction>(
    `/models/interactions/${interactionId}/feedback`,
    data
  );
  return response.data;
};
