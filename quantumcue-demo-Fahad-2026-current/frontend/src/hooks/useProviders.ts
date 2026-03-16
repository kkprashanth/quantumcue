/**
 * Provider hooks using React Query.
 */

import { useQuery } from '@tanstack/react-query';
import {
  getProviders,
  getProvider,
  getProviderByCode,
  getProviderStatus,
  getAllProviderStatuses,
  type ProviderType,
  type ProviderListResponse,
  type ProviderDetail,
  type ProviderStatusResponse,
} from '../api/endpoints/providers';

/**
 * Hook to fetch all providers.
 */
export const useProviders = (params?: {
  provider_type?: ProviderType;
  include_inactive?: boolean;
}) => {
  return useQuery<ProviderListResponse, Error>({
    queryKey: ['providers', params],
    queryFn: () => getProviders(params),
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to fetch a single provider by ID.
 */
export const useProvider = (providerId: string | undefined) => {
  return useQuery<ProviderDetail, Error>({
    queryKey: ['provider', providerId],
    queryFn: () => getProvider(providerId!),
    enabled: !!providerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a provider by code.
 */
export const useProviderByCode = (code: string | undefined) => {
  return useQuery<ProviderDetail, Error>({
    queryKey: ['provider', 'code', code],
    queryFn: () => getProviderByCode(code!),
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch provider status.
 */
export const useProviderStatus = (providerId: string | undefined) => {
  return useQuery<ProviderStatusResponse, Error>({
    queryKey: ['provider-status', providerId],
    queryFn: () => getProviderStatus(providerId!),
    enabled: !!providerId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
};

/**
 * Hook to fetch all provider statuses.
 */
export const useAllProviderStatuses = () => {
  return useQuery<ProviderStatusResponse[], Error>({
    queryKey: ['provider-statuses'],
    queryFn: getAllProviderStatuses,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export default useProviders;
