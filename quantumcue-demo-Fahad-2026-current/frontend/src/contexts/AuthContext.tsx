/**
 * Authentication context for React components.
 *
 * This provides a React Context wrapper around the Zustand auth store
 * for components that prefer the context pattern.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';
import type { AccountInfo, LoginRequest } from '../api/endpoints/auth';

interface AuthContextType {
  user: User | null;
  account: AccountInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const store = useAuthStore();

  // Check authentication on mount
  useEffect(() => {
    const init = async () => {
      await store.checkAuth();
      setIsInitialized(true);
    };
    init();
  }, []);

  // Handle tab close / browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (store.isAuthenticated) {
        const token = localStorage.getItem('access_token');
        if (token) {
          // Use sendBeacon for reliable delivery during unload
          const url = '/api/v1/auth/logout';
          const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          };

          // Try sendBeacon first (more reliable but might have header limitations depending on browser)
          // Most modern browsers support Blob with type for headers in sendBeacon only somewhat recently or not at all for Auth headers
          // So we'll use fetch with keepalive which is the modern standard for this
          fetch(url, {
            method: 'POST',
            headers,
            keepalive: true,
          }).catch(() => {
            // Ignore errors during unload
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [store.isAuthenticated]);

  const value: AuthContextType = {
    user: store.user,
    account: store.account,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized,
    error: store.error,
    login: store.login,
    logout: store.logout,
    clearError: store.clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
