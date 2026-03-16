/**
 * Provider Configuration API endpoints.
 */

import apiClient from '../client';
import type {
  ProviderConfiguration,
  ProviderConfigurationDefaults,
  ProviderConfigurationValidationRequest,
  ProviderConfigurationValidationResponse,
} from '../../types';

/**
 * Get provider configuration schema by provider ID.
 */
export const getProviderConfiguration = async (
  providerId: string
): Promise<ProviderConfiguration> => {
  const response = await apiClient.get<ProviderConfiguration>(
    `/providers/${providerId}/configuration`
  );
  return response.data;
};

/**
 * Get provider configuration schema by provider code.
 */
export const getProviderConfigurationByCode = async (
  code: string
): Promise<ProviderConfiguration> => {
  const response = await apiClient.get<ProviderConfiguration>(
    `/providers/code/${code}/configuration`
  );
  return response.data;
};

/**
 * Get default configuration values for a provider, optionally with dataset.
 */
export const getProviderConfigurationDefaults = async (
  providerId: string,
  datasetId?: string
): Promise<ProviderConfigurationDefaults> => {
  const params = datasetId ? { dataset_id: datasetId } : {};
  const response = await apiClient.get<ProviderConfigurationDefaults>(
    `/providers/${providerId}/configuration/defaults`,
    { params }
  );
  return response.data;
};

/**
 * Get default configuration values for a provider by code, optionally with dataset.
 */
export const getProviderConfigurationDefaultsByCode = async (
  code: string,
  datasetId?: string
): Promise<ProviderConfigurationDefaults> => {
  const params = datasetId ? { dataset_id: datasetId } : {};
  const response = await apiClient.get<ProviderConfigurationDefaults>(
    `/providers/code/${code}/configuration/defaults`,
    { params }
  );
  return response.data;
};

/**
 * Validate configuration values against provider schema.
 */
export const validateProviderConfiguration = async (
  providerId: string,
  values: Record<string, unknown>
): Promise<ProviderConfigurationValidationResponse> => {
  const response = await apiClient.post<ProviderConfigurationValidationResponse>(
    `/providers/${providerId}/configuration/validate`,
    { values } as ProviderConfigurationValidationRequest
  );
  return response.data;
};

/**
 * Validate configuration values against provider schema by code.
 */
export const validateProviderConfigurationByCode = async (
  code: string,
  values: Record<string, unknown>
): Promise<ProviderConfigurationValidationResponse> => {
  const response = await apiClient.post<ProviderConfigurationValidationResponse>(
    `/providers/code/${code}/configuration/validate`,
    { values } as ProviderConfigurationValidationRequest
  );
  return response.data;
};

/**
 * Update configuration field default value (Admin only).
 */
export const updateProviderConfigurationDefault = async (
  providerId: string,
  fieldKey: string,
  defaultValue: any
): Promise<ProviderConfiguration> => {
  const response = await apiClient.patch<ProviderConfiguration>(
    `/provider-configurations/${providerId}/configuration/${fieldKey}`,
    { default_value: defaultValue }
  );
  return response.data;
};

