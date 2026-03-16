/**
 * Provider Configuration hooks using React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProviderConfiguration,
  getProviderConfigurationByCode,
  getProviderConfigurationDefaults,
  getProviderConfigurationDefaultsByCode,
  updateProviderConfigurationDefault,
} from '../api/endpoints/providerConfigurations';
import type { ProviderConfiguration, ProviderConfigurationDefaults } from '../types';

/**
 * Hook to fetch provider configuration schema by provider ID.
 */
export const useProviderConfiguration = (providerId: string | undefined) => {
  return useQuery<ProviderConfiguration, Error>({
    queryKey: ['provider-configuration', providerId],
    queryFn: () => getProviderConfiguration(providerId!),
    enabled: !!providerId,
    staleTime: 10 * 60 * 1000, // 10 minutes (configurations don't change often)
  });
};

/**
 * Hook to fetch provider configuration schema by provider code.
 */
export const useProviderConfigurationByCode = (code: string | undefined) => {
  return useQuery<ProviderConfiguration, Error>({
    queryKey: ['provider-configuration', 'code', code],
    queryFn: () => getProviderConfigurationByCode(code!),
    enabled: !!code,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch default configuration values for a provider, optionally with dataset.
 */
export const useProviderConfigurationDefaults = (
  providerId: string | undefined,
  datasetId?: string | undefined
) => {
  return useQuery<ProviderConfigurationDefaults, Error>({
    queryKey: ['provider-configuration-defaults', providerId, datasetId],
    queryFn: () => getProviderConfigurationDefaults(providerId!, datasetId),
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch default configuration values for a provider by code, optionally with dataset.
 */
export const useProviderConfigurationDefaultsByCode = (
  code: string | undefined,
  datasetId?: string | undefined
) => {
  return useQuery<ProviderConfigurationDefaults, Error>({
    queryKey: ['provider-configuration-defaults', 'code', code, datasetId],
    queryFn: () => getProviderConfigurationDefaultsByCode(code!, datasetId),
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update provider configuration default value.
 */
export const useUpdateProviderConfigurationDefault = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, fieldKey, defaultValue }: { providerId: string; fieldKey: string; defaultValue: any }) =>
      updateProviderConfigurationDefault(providerId, fieldKey, defaultValue),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['provider-configuration', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['provider-configuration-defaults', variables.providerId] });
      // Also invalidate Code based queries if possible, or just all for safety/simplicity or specific ones if we knew the code
      queryClient.invalidateQueries({ queryKey: ['provider-configuration'] });
      queryClient.invalidateQueries({ queryKey: ['provider-configuration-defaults'] });
    },
  });
};

