/**
 * Authentication API endpoints.
 */

import apiClient, { clearTokens, setTokens } from '../client';
import type { User } from '../../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AccountInfo {
  id: string;
  name: string;
  tier: string;
  status: string;
  data_budget_mb: number;
  data_used_mb: number;
  created_at: string;
  updated_at: string;
}

export interface CurrentUserResponse {
  user: User;
  account: AccountInfo;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  password: string;
  access_code: string;
}


/**
 * Login with admin credentials.
 */
export const adminLogin = async (credentials: LoginRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/auth/admin/login', credentials);
  const { access_token, refresh_token } = response.data;
  setTokens(access_token, refresh_token);
  return response.data;
};

/**
 * Login with email and password.
 */
export const login = async (credentials: LoginRequest): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/auth/login', credentials);
  const { access_token, refresh_token } = response.data;
  setTokens(access_token, refresh_token);
  return response.data;
};

/**
 * Logout current user.
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    clearTokens();
  }
};

/**
 * Get current authenticated user.
 */
export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await apiClient.get<CurrentUserResponse>('/auth/me');
  return response.data;
};

/**
 * Change password for current user.
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await apiClient.post('/auth/change-password', data);
};

/**
 * Refresh access token.
 */
export const refreshToken = async (refresh_token: string): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>('/auth/refresh', {
    refresh_token,
  });
  const { access_token, refresh_token: newRefreshToken } = response.data;
  setTokens(access_token, newRefreshToken);
  return response.data;
};

/**
 * Sign up a new user and create account.
 */
export const signup = async (data: SignupRequest): Promise<TokenResponse> => {
  const { access_code, ...rest } = data;
  const response = await apiClient.post<TokenResponse>('/auth/signup', rest, {
    headers: { 'X-Access-Code': access_code }
  });
  const { access_token, refresh_token } = response.data;
  setTokens(access_token, refresh_token);
  return response.data;
};

/**
 * Validate an early access code.
 */
export const validateCode = async (code: string): Promise<void> => {
  await apiClient.get(`/auth/validate-code`, { headers: { 'X-Access-Code': code } });
};

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

/**
 * Initiate forgot password flow.
 */
export const forgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  await apiClient.post('/auth/forgot-password', data);
};

/**
 * Reset password using token.
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await apiClient.post('/auth/reset-password', data);
};
