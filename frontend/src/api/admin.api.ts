import { apiClient } from './client';
import { UserRead, AuditLogRead, PaginatedResponse } from '../types';

export const adminApi = {
  getUsers: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<UserRead>> => {
    const response = await apiClient.get<PaginatedResponse<UserRead>>('/admin/users', { params });
    return response.data;
  },

  createUser: async (data: any): Promise<UserRead> => {
    const response = await apiClient.post<UserRead>('/admin/users', data);
    return response.data;
  },

  updateUser: async (userId: string, data: any): Promise<UserRead> => {
    const response = await apiClient.patch<UserRead>(`/admin/users/${userId}`, data);
    return response.data;
  },

  getAuditLogs: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<AuditLogRead>> => {
    const response = await apiClient.get<PaginatedResponse<AuditLogRead>>('/admin/audit-logs', { params });
    return response.data;
  },
};
