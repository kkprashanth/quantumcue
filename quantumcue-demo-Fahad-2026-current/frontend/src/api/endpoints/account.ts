/**
 * Account and user management API endpoints.
 */

import apiClient from '../client';

// ============================================================================
// Types
// ============================================================================

export interface AccountResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'suspended' | 'cancelled';
  tier: 'trial' | 'starter' | 'professional' | 'enterprise';
  data_budget_mb: number;
  data_used_mb: number;
  data_usage_percentage: number;
  total_time_allotted_seconds: number;
  time_remaining_seconds: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  logins: number;
  llm_total_tokens: number;
  llm_total_cost: number;
  llm_usage_stats: Record<string, unknown> | null;
}

export interface AccountUpdate {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface AccountStats {
  total_users: number;
  active_users: number;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  data_budget_mb: number;
  data_used_mb: number;
  data_usage_percentage: number;
}

export interface AccountUsageResponse {
  total_tokens: number;
  total_cost: number;
  models_used: Record<string, number>;
  tokens_by_model: Record<string, { input: number; output: number; total: number }>;
  cost_by_model: Record<string, number>;
}

export interface UserListItem {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  role: 'admin' | 'superadmin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  last_login_at: string | null;
  created_at: string;
  account_tier?: string;
  account_status?: string;
  account_logins?: number;
  login_count: number;
  failed_login_count: number;
  description?: string | null;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
}

export interface UserCreate {
  email: string;
  first_name: string;
  last_name: string;
  role?: 'admin' | 'superadmin' | 'user';
  password?: string;
  create_new_account?: boolean;
  company_name?: string;
  tier?: 'free' | 'starter' | 'professional' | 'enterprise';
  description?: string;
}

export interface UserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'superadmin' | 'user';
  status?: 'active' | 'inactive' | 'pending';
  tier?: 'free' | 'starter' | 'professional' | 'enterprise';
  logins?: number;
  login_count?: number;
  failed_login_count?: number;
  description?: string;
}

export interface UserDetailResponse {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  role: 'admin' | 'superadmin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  account?: AccountResponse;
  failed_login_count: number;
  description?: string | null;
}

export interface InviteResponse {
  user: UserListItem;
  message: string;
  temporary_password: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  role: 'admin' | 'superadmin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

export interface UserExportItem {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  role: 'admin' | 'superadmin' | 'user';
  status: 'active' | 'inactive' | 'pending';
  last_login_at: string | null;
  created_at: string;
  account_id: string | null;
  account_name: string | null;
  account_slug: string | null;
  account_tier: string | null;
  account_status: string | null;
  data_budget_mb: number | null;
  data_used_mb: number | null;
  logins_limit: number | null;
  llm_total_tokens: number | null;
  llm_total_cost: number | null;
}

// ============================================================================
// Account API
// ============================================================================

export const getAccount = async (): Promise<AccountResponse> => {
  const response = await apiClient.get<AccountResponse>('/account');
  return response.data;
};

export const updateAccount = async (data: AccountUpdate): Promise<AccountResponse> => {
  const response = await apiClient.patch<AccountResponse>('/account', data);
  return response.data;
};

export const getAccountStats = async (): Promise<AccountStats> => {
  const response = await apiClient.get<AccountStats>('/account/stats');
  return response.data;
};

export const getAccountUsage = async (): Promise<AccountUsageResponse> => {
  const response = await apiClient.get<AccountUsageResponse>('/account/usage');
  return response.data;
};

// ============================================================================
// User Management API
// ============================================================================

export const listUsers = async (
  page: number = 1,
  size: number = 20,
  filters?: { role?: string; status?: string; login_filter?: string }
): Promise<UserListResponse> => {
  const response = await apiClient.get<UserListResponse>('/account/users', {
    params: { page, size, ...filters },
  });
  return response.data;
};

export const createUser = async (data: UserCreate): Promise<InviteResponse> => {
  const response = await apiClient.post<InviteResponse>('/account/users', data);
  return response.data;
};

export const getUser = async (userId: string): Promise<UserDetailResponse> => {
  const response = await apiClient.get<UserDetailResponse>(`/account/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: string, data: UserUpdate): Promise<UserDetailResponse> => {
  const response = await apiClient.patch<UserDetailResponse>(`/account/users/${userId}`, data);
  return response.data;
};

export const deactivateUser = async (userId: string): Promise<MessageResponse> => {
  const response = await apiClient.delete<MessageResponse>(`/account/users/${userId}`);
  return response.data;
};

export const exportUsers = async (): Promise<UserExportItem[]> => {
  const response = await apiClient.get<UserExportItem[]>('/account/users/export');
  return response.data;
};

// ============================================================================
// Profile API
// ============================================================================

export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get<ProfileResponse>('/users/me');
  return response.data;
};

export const updateProfile = async (data: ProfileUpdate): Promise<ProfileResponse> => {
  const response = await apiClient.patch<ProfileResponse>('/users/me', data);
  return response.data;
};

export const changePassword = async (data: PasswordChange): Promise<MessageResponse> => {
  const response = await apiClient.patch<MessageResponse>('/users/me/password', data);
  return response.data;
};

export const getPreferences = async (): Promise<Record<string, unknown>> => {
  const response = await apiClient.get<Record<string, unknown>>('/users/me/preferences');
  return response.data;
};

export const updatePreferences = async (
  preferences: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const response = await apiClient.patch<Record<string, unknown>>('/users/me/preferences', preferences);
  return response.data;
};
