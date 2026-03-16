import apiClient from '../client';
import { LoginHistoryEntry, LoginHistoryResponse } from './loginActivity';

export interface LogoutStats {
    average_duration_seconds: number;
    total_sessions: number;
    active_sessions: number;
}

export const getLogoutActivityStats = async (days: number = 30): Promise<LogoutStats> => {
    const response = await apiClient.get<LogoutStats>('/logout-activity/stats', {
        params: { days }
    });
    return response.data;
};

export const listLogoutActivity = async (
    page: number = 1,
    size: number = 20,
    userId?: string,
    email?: string,
    date?: string,
    sortBy: string = 'created_at',
    sortOrder: string = 'desc'
): Promise<LoginHistoryResponse> => {
    const response = await apiClient.get<LoginHistoryResponse>('/logout-activity', {
        params: {
            page,
            size,
            user_id: userId,
            email,
            date,
            sort_by: sortBy,
            sort_order: sortOrder
        }
    });
    return response.data;
};
