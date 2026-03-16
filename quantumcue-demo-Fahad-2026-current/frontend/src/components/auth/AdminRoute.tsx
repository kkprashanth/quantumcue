/**
 * Admin route component that requires admin role.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { user, isInitialized } = useAuthContext();

  // ProtectedRoute handles auth check and loading state
  return (
    <ProtectedRoute>
      {isInitialized && user?.role !== 'admin' && user?.role !== 'superadmin' ? (
        <Navigate to={redirectTo} replace />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
};

export default AdminRoute;
