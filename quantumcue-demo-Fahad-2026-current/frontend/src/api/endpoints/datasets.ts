/**
 * Datasets API endpoints.
 */

import apiClient from '../client';
import type { Dataset, DatasetCreate, DatasetUpdate, DatasetStatus, DatasetStats } from '@/types';

export interface DatasetListResponse {
  datasets: Dataset[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/**
 * Create a new dataset.
 */
export const createDataset = async (data: DatasetCreate): Promise<Dataset> => {
  const response = await apiClient.post<Dataset>('/datasets', data);
  return response.data;
};

/**
 * Get datasets list with pagination and filters.
 */
export const getDatasets = async (params?: {
  status?: DatasetStatus;
  provider_id?: string;
  created_date?: string;
  timezone_offset?: number;
  page?: number;
  page_size?: number;
}): Promise<DatasetListResponse> => {
  const response = await apiClient.get<DatasetListResponse>('/datasets', { params });
  return response.data;
};

/**
 * Get dataset statistics.
 */
export const getDatasetStats = async (): Promise<DatasetStats> => {
  const response = await apiClient.get<DatasetStats>('/datasets/stats');
  return response.data;
};

/**
 * Get dataset by ID.
 */
export const getDataset = async (datasetId: string): Promise<Dataset> => {
  const response = await apiClient.get<Dataset>(`/datasets/${datasetId}`);
  return response.data;
};

/**
 * Update a dataset.
 */
export const updateDataset = async (datasetId: string, data: DatasetUpdate): Promise<Dataset> => {
  const response = await apiClient.put<Dataset>(`/datasets/${datasetId}`, data);
  return response.data;
};

/**
 * Delete a dataset.
 */
export const deleteDataset = async (datasetId: string): Promise<void> => {
  await apiClient.delete(`/datasets/${datasetId}`);
};

/**
 * Upload dataset file.
 * Uses raw binary upload for better streaming support with large files.
 */
export const uploadDataset = async (datasetId: string, file: File): Promise<Dataset> => {
  const response = await apiClient.post<Dataset>(
    `/datasets/${datasetId}/upload`,
    file, // Send file directly as binary
    {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': file.name, // Send filename in custom header
      },
      timeout: 600000, // 10 minutes timeout for large file uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      },
    }
  );
  return response.data;
};

/**
 * Start processing a zip dataset.
 */
export const processDataset = async (
  datasetId: string,
  labelingStructure: Record<string, unknown>
): Promise<{ message: string; dataset_id: string; processing_stage: string }> => {
  const response = await apiClient.post<{ message: string; dataset_id: string; processing_stage: string }>(
    `/datasets/${datasetId}/process`,
    { labeling_structure: labelingStructure }
  );
  return response.data;
};

/**
 * Get dataset processing status.
 */
export interface DatasetProcessingStatus {
  dataset_id: string;
  processing_stage: string | null;
  status: DatasetStatus;
  validation_errors?: {
    errors?: string[];
    warnings?: string[];
    valid_directories?: string[];
    invalid_directories?: string[];
  } | null;
}

export const getProcessingStatus = async (datasetId: string): Promise<DatasetProcessingStatus> => {
  const response = await apiClient.get<DatasetProcessingStatus>(`/datasets/${datasetId}/processing-status`);
  return response.data;
};
