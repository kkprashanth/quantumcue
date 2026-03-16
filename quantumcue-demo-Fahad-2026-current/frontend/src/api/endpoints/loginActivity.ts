import api from '../client';

export interface LoginHistoryEntry {
    id: string;
    email: string;
    status: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user_id: string | null;
}

export interface LoginHistoryResponse {
    items: LoginHistoryEntry[];
    total: number;
    page: number;
    size: number;
}

export interface LoginHistorySummary {
    success: number;
    failure: number;
    total: number;
}

export const listLoginActivity = async (
    page: number = 1,
    size: number = 20,
    userId?: string,
    email?: string,
    date?: string,
    sortBy?: string,
    sortOrder?: string
): Promise<LoginHistoryResponse> => {
    const response = await api.get('/login-activity', {
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

export const getLoginActivitySummary = async (): Promise<LoginHistorySummary> => {
    const response = await api.get('/login-activity/summary');
    return response.data;
};

export interface DailyLoginStats {
    date: string;
    success: number;
    failure: number;
    total: number;
}

export interface LoginStatsResponse {
    daily_stats: DailyLoginStats[];
}

export const getLoginActivityStats = async (period: '1h' | '24h' | '7d' | '30d' = '30d'): Promise<LoginStatsResponse> => {
    const response = await api.get('/login-activity/stats', {
        params: { period }
    });
    return response.data;
};

export const pruneLoginActivity = async (beforeDate: string): Promise<{ deleted_count: number }> => {
    const response = await api.delete('/login-activity/prune', {
        params: { before_date: beforeDate }
    });
    return response.data;
};
