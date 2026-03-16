/**
 * Authentication state store using Zustand.
 */

import type { AxiosError } from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { getCurrentUser, login as apiLogin, adminLogin as apiAdminLogin, logout as apiLogout, signup as apiSignup, type AccountInfo, type LoginRequest, type SignupRequest } from '../api/endpoints/auth';
import { getAccessToken, clearTokens } from '../api/client';

type FastApiValidationErrorItem = {
  loc: Array<string | number>;
  msg: string;
  type: string;
};

type FastApiErrorResponse = {
  detail?: string | FastApiValidationErrorItem[];
  code?: string;
};

const toFriendlyAuthErrorMessage = (error: unknown, fallback: string): string => {
  const maybeAxios = error as AxiosError<FastApiErrorResponse>;

  // Network error / CORS / server unreachable
  if (maybeAxios?.isAxiosError && !maybeAxios.response) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (maybeAxios?.isAxiosError) {
    const status = maybeAxios.response?.status;
    const data = maybeAxios.response?.data;
    const detail = data?.detail;

    // FastAPI string detail
    if (typeof detail === 'string' && detail.trim().length > 0) {
      const normalized = detail.trim();

      // Signup-specific: duplicate email
      if (status === 400 && /already exists/i.test(normalized)) {
        return 'That email is already registered. Please sign in instead, or use a different email.';
      }

      return normalized;
    }

    // FastAPI validation detail array (422)
    if (Array.isArray(detail) && detail.length > 0) {
      const messages = detail
        .map((e) => e?.msg)
        .filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
      if (messages.length > 0) {
        return messages.join(' • ');
      }
      return 'Please check the form fields and try again.';
    }

    // Fallback for any other API error shape
    if (status === 400) return fallback;
    if (status === 401) return 'Incorrect email or password.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (status && status >= 500) return 'The server hit an error. Please try again in a moment.';
  }

  // Non-Axios / unknown error
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
};

interface AuthState {
  user: User | null;
  account: AccountInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  loginAdmin: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      account: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,


      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          await apiLogin(credentials);
          // Fetch user data after successful login
          await get().fetchCurrentUser();
        } catch (error) {
          const message = toFriendlyAuthErrorMessage(error, 'Login failed. Please try again.');
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      loginAdmin: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          await apiAdminLogin(credentials);
          await get().fetchCurrentUser();
        } catch (error) {
          const message = toFriendlyAuthErrorMessage(error, 'Admin login failed. Please check your credentials.');
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      signup: async (data: SignupRequest) => {
        set({ isLoading: true, error: null });
        try {
          await apiSignup(data);
          // Fetch user data after successful signup
          await get().fetchCurrentUser();
        } catch (error) {
          const message = toFriendlyAuthErrorMessage(error, 'Signup failed. Please try again.');
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiLogout();
        } finally {
          set({
            user: null,
            account: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await getCurrentUser();
          set({
            user: data.user,
            account: data.account,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          clearTokens();
          set({
            user: null,
            account: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Session expired. Please login again.',
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ isAuthenticated: false, user: null, account: null });
          return false;
        }

        try {
          await get().fetchCurrentUser();
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        account: state.account,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
