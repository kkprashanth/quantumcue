/**
 * Authentication hook for components.
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const {
    user,
    account,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginAdmin,
    signup,
    logout,
    fetchCurrentUser,
    clearError,
    checkAuth,
  } = useAuthStore();

  return {
    user,
    account,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginAdmin,
    signup,
    logout,
    fetchCurrentUser,
    clearError,
    checkAuth,
    isAdmin: user?.role === 'admin',
  };
};

/**
 * Hook to require authentication - redirects to login if not authenticated.
 */
export const useRequireAuth = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        navigate(redirectTo, {
          state: { from: location.pathname },
          replace: true,
        });
      }
    };
    verify();
  }, [checkAuth, navigate, redirectTo, location.pathname]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook to redirect authenticated users away from auth pages.
 */
export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
  const { isAuthenticated, checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      const authenticated = await checkAuth();
      if (authenticated) {
        // Redirect to the page they were trying to access, or default
        const from = (location.state as { from?: string })?.from || redirectTo;
        navigate(from, { replace: true });
      }
    };
    verify();
  }, [checkAuth, navigate, redirectTo, location.state]);

  return { isAuthenticated };
};

/**
 * Hook to require admin role.
 */
export const useRequireAdmin = (redirectTo: string = '/dashboard') => {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAdmin, isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAdmin, isLoading };
};
