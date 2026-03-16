/**
 * React Query hooks for datasets.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as datasetsApi from '@/api/endpoints/datasets';
import type { DatasetCreate, DatasetUpdate, DatasetStatus } from '@/types';

/**
 * Get datasets list.
 */
export const useDatasets = (params?: {
  status?: DatasetStatus;
  provider_id?: string;
  created_date?: string;
  timezone_offset?: number;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['datasets', params],
    queryFn: () => datasetsApi.getDatasets(params),
    staleTime: 30000,
  });
};

export const useDatasetStats = () => {
  return useQuery({
    queryKey: ['dataset-stats'],
    queryFn: () => datasetsApi.getDatasetStats(),
    staleTime: 30000,
  });
};

export const useDataset = (datasetId: string | null) => {
  return useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => datasetsApi.getDataset(datasetId!),
    enabled: !!datasetId,
  });
};

/**
 * Create a dataset.
 */
export const useCreateDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DatasetCreate) => datasetsApi.createDataset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
};

/**
 * Update a dataset.
 */
export const useUpdateDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, data }: { datasetId: string; data: DatasetUpdate }) =>
      datasetsApi.updateDataset(datasetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.datasetId] });
    },
  });
};

/**
 * Delete a dataset.
 */
export const useDeleteDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (datasetId: string) => datasetsApi.deleteDataset(datasetId),
    onSuccess: (_, datasetId) => {
      // Remove queries immediately to prevent refetch attempts
      queryClient.removeQueries({ queryKey: ['dataset', datasetId] });
      queryClient.removeQueries({ queryKey: ['dataset-processing-status', datasetId] });
      // Then invalidate list to refresh
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
    onError: (error, datasetId) => {
      // On error, we might want to keep the queries for retry
      console.error('Failed to delete dataset:', error);
    },
  });
};

/**
 * Upload dataset file.
 */
export const useUploadDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, file }: { datasetId: string; file: File }) =>
      datasetsApi.uploadDataset(datasetId, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.datasetId] });
    },
  });
};

/**
 * Process a zip dataset.
 */
export const useProcessDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ datasetId, labelingStructure }: { datasetId: string; labelingStructure: Record<string, unknown> }) =>
      datasetsApi.processDataset(datasetId, labelingStructure),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset-processing-status', variables.datasetId] });
    },
  });
};

/**
 * Get dataset processing status (with polling).
 */
export const useDatasetProcessingStatus = (datasetId: string | null) => {
  return useQuery({
    queryKey: ['dataset-processing-status', datasetId],
    queryFn: () => datasetsApi.getProcessingStatus(datasetId!),
    enabled: !!datasetId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      // Poll every 1.5 seconds if processing is in progress (faster polling for better UX)
      const data = query.state.data;
      const stage = data?.processing_stage;
      const status = data?.status;

      // Always poll if status is uploading or processing (even if stage is null)
      if (status === 'uploading' || status === 'processing') {
        return 1500;
      }

      // Poll if stage exists and is not completed/error
      if (stage && stage !== 'completed' && stage !== 'error') {
        return 1500;
      }

      // Stop polling if completed or error
      if (stage === 'completed' || stage === 'error' || status === 'ready' || status === 'error') {
        return false;
      }

      // Default: keep polling if we don't know the state
      return 1500;
    },
  });
};
