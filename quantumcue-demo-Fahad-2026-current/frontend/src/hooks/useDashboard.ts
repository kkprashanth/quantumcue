/**
 * Dashboard data hook using React Query.
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, type DashboardData } from '../api/endpoints/dashboard';

export const useDashboard = () => {
  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
};

export default useDashboard;
