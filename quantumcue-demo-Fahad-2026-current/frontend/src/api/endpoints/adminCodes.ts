/**
 * Admin API endpoints for Early Access Code management.
 */

import apiClient from '../client';

export interface AccessCode {
    code: string;
    status: 'issued' | 'unused' | 'activated' | 'expired';
    email?: string; // Optional email restriction
    expires_in?: number;
    created_at: string;
    user?: {
        id: string;
        full_name: string;
        email: string;
        last_login_at?: string;
    };
}

/*List all active early access codes.*/
export const listCodes = async (): Promise<AccessCode[]> => {
    const response = await apiClient.get<AccessCode[]>('/admin/codes');
    return response.data;
};

/**
 * Generate a new early access code.
 */
export const createCode = async (code?: string, email?: string, expiresIn?: number): Promise<{ code: string }> => {
    const response = await apiClient.post<{ code: string }>('/admin/codes', { code, email, expires_in: expiresIn });
    return response.data;
};

/**
 * Delete an early access code.
 */
export const deleteCode = async (code: string): Promise<void> => {
    await apiClient.delete(`/admin/codes/${code}`);
};
