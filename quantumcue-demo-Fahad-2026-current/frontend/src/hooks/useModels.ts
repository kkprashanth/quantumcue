/**
 * React Query hooks for models.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as modelsApi from '@/api/endpoints/models';
import type { ModelCreate, ModelUpdate, ModelStatus, ModelInteractionCreate } from '@/types';

/**
 * Get models list.
 */
export const useModels = (params?: {
  status?: ModelStatus;
  training_job_id?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: ['models', params],
    queryFn: () => modelsApi.getModels(params),
    staleTime: 30000,
  });
};

/**
 * Get model by training job ID.
 * Continues polling until a model is found, then polls periodically to catch updates.
 */
export const useModelByTrainingJob = (trainingJobId: string | null) => {
  return useQuery({
    queryKey: ['models', { training_job_id: trainingJobId }],
    queryFn: () => modelsApi.getModels({ training_job_id: trainingJobId! }),
    enabled: !!trainingJobId,
    staleTime: 0, // Always consider stale to allow refetching
    refetchInterval: (query) => {
      const hasModel = query.state.data && query.state.data.models.length > 0;
      const model = hasModel ? query.state.data?.models[0] : null;

      // If model exists but has no classifications, continue polling to catch updates
      if (hasModel && model && (!model.classifications || model.classifications.length === 0)) {
        return 2000; // Poll every 2 seconds until classifications are set
      }

      // If no model found yet, refetch every 2 seconds
      if (!hasModel) {
        return 2000;
      }

      // Model found with classifications, stop polling
      return false;
    },
    refetchIntervalInBackground: true,
    select: (data) => {
      // Return the first model if any exist
      return data.models.length > 0 ? data.models[0] : null;
    },
  });
};

/**
 * Get a single model.
 */
export const useModel = (modelId: string | null) => {
  return useQuery({
    queryKey: ['model', modelId],
    queryFn: () => modelsApi.getModel(modelId!),
    enabled: !!modelId,
  });
};

/**
 * Create a model.
 */
export const useCreateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ModelCreate) => modelsApi.createModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};

/**
 * Update a model.
 */
export const useUpdateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, data }: { modelId: string; data: ModelUpdate }) =>
      modelsApi.updateModel(modelId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['model', variables.modelId] });
    },
  });
};

/**
 * Delete a model.
 */
export const useDeleteModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => modelsApi.deleteModel(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};

/**
 * Create a model interaction (prediction/evaluation).
 */
export const useModelInteraction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, data }: { modelId: string; data: ModelInteractionCreate }) =>
      modelsApi.createModelInteraction(modelId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['model', variables.modelId] });
      queryClient.invalidateQueries({ queryKey: ['model-interactions', variables.modelId] });
    },
  });
};

/**
 * Get model interactions.
 */
export const useModelInteractions = (
  modelId: string | null,
  params?: {
    page?: number;
    page_size?: number;
  }
) => {
  return useQuery({
    queryKey: ['model-interactions', modelId, params],
    queryFn: () => modelsApi.getModelInteractions(modelId!, params),
    enabled: !!modelId,
  });
};

/**
 * Host/deploy a model.
 */
export const useHostModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => modelsApi.hostModel(modelId),
    onSuccess: (_, modelId) => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['model', modelId] });
    },
  });
};

/**
 * Make a prediction with a model using file upload.
 */
export const usePredictModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      modelId,
      file,
      fileName,
      fileType,
      fileSize
    }: {
      modelId: string;
      file?: File | null;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    }) =>
      modelsApi.predictModel(modelId, file, fileName, fileType, fileSize),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['model', variables.modelId] });
      queryClient.invalidateQueries({ queryKey: ['model-interactions', variables.modelId] });
      queryClient.invalidateQueries({ queryKey: ['model-stats', variables.modelId] });
    },
  });
};

/**
 * Get model statistics.
 */
export const useModelStats = (modelId: string | null) => {
  return useQuery({
    queryKey: ['model-stats', modelId],
    queryFn: () => modelsApi.getModelStats(modelId!),
    enabled: !!modelId,
    staleTime: 10000, // 10 seconds
  });
};

/**
 * Get model status statistics (counts by status).
 */
export const useModelStatusStats = () => {
  return useQuery({
    queryKey: ['model-status-stats'],
    queryFn: () => modelsApi.getModelStatusStats(),
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Get quantum vs classical model comparison.
 */
export const useModelComparison = (modelId: string | null) => {
  return useQuery({
    queryKey: ['model-comparison', modelId],
    queryFn: () => modelsApi.getModelComparison(modelId!),
    enabled: !!modelId,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Get recommendations for a classification.
 */
export const useModelRecommendations = (modelId: string, classification: string) => {
  return useQuery({
    queryKey: ['model-recommendations', modelId, classification],
    queryFn: () => modelsApi.getRecommendations(modelId, classification),
    enabled: !!modelId && !!classification,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Update model recommendations configuration.
 */
export const useUpdateRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, config }: { modelId: string; config: Record<string, string[]> }) =>
      modelsApi.updateRecommendations(modelId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['model', variables.modelId] });
      queryClient.invalidateQueries({ queryKey: ['model-recommendations', variables.modelId] });
    },
  });
};

/**
 * Update model reasoning setting.
 */
export const useUpdateModelReasoning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, enableReasoning }: { modelId: string; enableReasoning: boolean }) =>
      modelsApi.updateModelReasoning(modelId, enableReasoning),
    onSuccess: (updatedModel, variables) => {
      // Invalidate and refetch the model query
      queryClient.invalidateQueries({ queryKey: ['model', variables.modelId] });
      // Also update the cache optimistically
      queryClient.setQueryData(['model', variables.modelId], updatedModel);
    },
  });
};

/**
 * Update model interaction with feedback.
 */
export const useUpdateInteractionFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      interactionId,
      data,
    }: {
      interactionId: string;
      data: modelsApi.ModelInteractionFeedbackUpdate;
    }) => modelsApi.updateInteractionFeedback(interactionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['model-interactions'] });
    },
  });
};

/**
 * Chat with AI about a model.
 */
export const useModelChat = () => {
  return useMutation({
    mutationFn: ({ modelId, message }: { modelId: string; message: string }) =>
      modelsApi.chatWithModel(modelId, message),
  });
};
