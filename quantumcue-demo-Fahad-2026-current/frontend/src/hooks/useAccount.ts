/**
 * Account and user management hooks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccount,
  updateAccount,
  getAccountStats,
  getAccountUsage,
  listUsers,
  createUser,
  getUser,
  updateUser,
  deactivateUser,
  getProfile,
  updateProfile,
  changePassword,
  type AccountUpdate,
  type UserCreate,
  type UserUpdate,
  type ProfileUpdate,
  type PasswordChange,
} from '../api/endpoints/account';

// ============================================================================
// Account Hooks
// ============================================================================

export const useAccount = () => {
  return useQuery({
    queryKey: ['account'],
    queryFn: getAccount,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAccountStats = () => {
  return useQuery({
    queryKey: ['account', 'stats'],
    queryFn: getAccountStats,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useAccountUsage = () => {
  return useQuery({
    queryKey: ['account', 'usage'],
    queryFn: getAccountUsage,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountUpdate) => updateAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
};

// ============================================================================
// User Management Hooks
// ============================================================================

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUser = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserCreate) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['account', 'stats'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdate }) => updateUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['account', 'stats'] });
    },
  });
};

// ============================================================================
// Profile Hooks
// ============================================================================

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileUpdate) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Also refresh auth user data
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordChange) => changePassword(data),
  });
};
