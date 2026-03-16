/**
 * Dataset Labeling API endpoints
 */

import { apiClient } from '../client';

export interface DatasetLabelingChatRequest {
  message: string;
}

export interface DatasetLabelingChatResponse {
  message: string;
  extracted_structure: {
    labeling_structure: Record<string, unknown>;
    classifications: string[];
    required_subdirectories: string[];
    file_types: Record<string, string[]>;
    description: string;
  } | null;
  is_complete: boolean;
}

export interface DatasetLabelingSaveRequest {
  labeling_structure: Record<string, unknown>;
  description: string;
}

/**
 * Chat with LLM about dataset labeling
 */
export const chatDatasetLabeling = async (
  datasetId: string,
  message: string
): Promise<DatasetLabelingChatResponse> => {
  const response = await apiClient.post<DatasetLabelingChatResponse>(
    `/datasets/${datasetId}/labeling/chat`,
    { message }
  );
  return response.data;
};

/**
 * Save extracted labeling structure
 */
export const saveDatasetLabeling = async (
  datasetId: string,
  data: DatasetLabelingSaveRequest
): Promise<void> => {
  await apiClient.post(`/datasets/${datasetId}/labeling/save`, data);
};

