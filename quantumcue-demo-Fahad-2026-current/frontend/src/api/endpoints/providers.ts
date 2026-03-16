/**
 * Provider API endpoints.
 */

import apiClient from '../client';

export type ProviderType =
  | 'quantum_annealer'
  | 'gate_based'
  | 'photonic'
  | 'trapped_ion'
  | 'superconducting'
  | 'neutral_atom';

export type ProviderStatusType = 'online' | 'offline' | 'degraded' | 'maintenance';

export interface ProviderSummary {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo_url: string | null;
  provider_type: ProviderType;
  qubit_count: number | null;
  processor_name: string | null;
  status: ProviderStatusType;
  is_active: boolean;
  queue_depth: number;
  avg_queue_time_seconds: number;
  supported_problem_types: string[] | null;
  price_per_shot: number | null;
}

export interface ProviderHardwareSpecs {
  qubit_count: number | null;
  qubit_type: string | null;
  connectivity: string | null;
  gate_fidelity_1q: number | null;
  gate_fidelity_2q: number | null;
  coherence_time_t1_us: number | null;
  coherence_time_t2_us: number | null;
  gate_time_ns: number | null;
  processor_name: string | null;
  processor_generation: string | null;
  operating_temperature_k: number | null;
}

export interface ProviderCapabilities {
  supported_algorithms: string[] | null;
  supported_problem_types: string[] | null;
  native_gates: string[] | null;
}

export interface ProviderIntegration {
  api_version: string | null;
  sdk_languages: string[] | null;
  cloud_regions: string[] | null;
}

export interface ProviderPricing {
  pricing_model: string | null;
  price_per_shot: number | null;
  price_per_task: number | null;
  minimum_shots: number | null;
}

export interface CompanyInfo {
  founded: number | null;
  headquarters: string | null;
  employees: string | null;
  public_ticker: string | null;
  funding: string | null;
}

export interface ProviderDetail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  documentation_url: string | null;
  provider_type: ProviderType;
  technology_name: string | null;
  technology_description: string | null;
  hardware: ProviderHardwareSpecs;
  capabilities: ProviderCapabilities;
  integration: ProviderIntegration;
  pricing: ProviderPricing;
  status: ProviderStatusType;
  is_active: boolean;
  queue_depth: number;
  avg_queue_time_seconds: number;
  features: string[] | null;
  limitations: string[] | null;
  certifications: string[] | null;
  company_info: CompanyInfo | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderListResponse {
  providers: ProviderSummary[];
  total: number;
}

export interface ProviderStatusResponse {
  id: string;
  code: string;
  status: ProviderStatusType;
  queue_depth: number;
  avg_queue_time_seconds: number;
  is_active: boolean;
}

/**
 * Get all providers.
 */
export const getProviders = async (params?: {
  provider_type?: ProviderType;
  include_inactive?: boolean;
}): Promise<ProviderListResponse> => {
  const response = await apiClient.get<ProviderListResponse>('/providers', { params });
  return response.data;
};

/**
 * Get provider by ID.
 */
export const getProvider = async (providerId: string): Promise<ProviderDetail> => {
  const response = await apiClient.get<ProviderDetail>(`/providers/${providerId}`);
  return response.data;
};

/**
 * Get provider by code.
 */
export const getProviderByCode = async (code: string): Promise<ProviderDetail> => {
  const response = await apiClient.get<ProviderDetail>(`/providers/code/${code}`);
  return response.data;
};

/**
 * Get provider status.
 */
export const getProviderStatus = async (providerId: string): Promise<ProviderStatusResponse> => {
  const response = await apiClient.get<ProviderStatusResponse>(`/providers/${providerId}/status`);
  return response.data;
};

/**
 * Get all provider statuses.
 */
export const getAllProviderStatuses = async (): Promise<ProviderStatusResponse[]> => {
  const response = await apiClient.get<ProviderStatusResponse[]>('/providers/statuses');
  return response.data;
};

/**
 * Get human-readable provider type label.
 */
export const getProviderTypeLabel = (type: ProviderType): string => {
  const labels: Record<ProviderType, string> = {
    quantum_annealer: 'Quantum Annealer',
    gate_based: 'Gate-Based',
    photonic: 'Photonic',
    trapped_ion: 'Trapped Ion',
    superconducting: 'Superconducting',
    neutral_atom: 'Neutral Atom',
  };
  return labels[type] || type;
};

/**
 * Get provider type color class.
 */
export const getProviderTypeColor = (type: ProviderType): string => {
  const colors: Record<ProviderType, string> = {
    quantum_annealer: 'bg-blue-50 text-blue-700 border border-blue-100',
    gate_based: 'bg-purple-50 text-purple-700 border border-purple-100',
    photonic: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    trapped_ion: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    superconducting: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
    neutral_atom: 'bg-pink-50 text-pink-700 border border-pink-100',
  };
  return colors[type] || 'bg-gray-50 text-gray-600 border border-gray-100';
};
