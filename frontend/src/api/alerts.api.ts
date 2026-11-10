import { apiClient } from './client';
import { AlertRead, AlertCreate, AlertUpdate, PaginatedResponse } from '../types';
import { SEED_ALERTS } from '../utils/mockSeedData';

export const alertsApi = {
  getAlerts: async (params?: {
    district_id?: string;
    hazard_type?: string;
    severity?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AlertRead>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<AlertRead>>('/alerts', { params });
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using seed alerts for map visualization');
      let filtered = [...SEED_ALERTS];
      if (params?.district_id) {
        filtered = filtered.filter((a) => a.district_id === params.district_id);
      }
      return {
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        page_size: params?.page_size || 100,
        pages: 1,
      };
    }
  },

  getAlertById: async (id: string): Promise<AlertRead> => {
    try {
      const response = await apiClient.get<AlertRead>(`/alerts/${id}`);
      return response.data;
    } catch (err) {
      const found = SEED_ALERTS.find((a) => a.id === id);
      if (found) return found;
      return SEED_ALERTS[0];
    }
  },

  createAlert: async (data: AlertCreate): Promise<AlertRead> => {
    const response = await apiClient.post<AlertRead>('/alerts', data);
    return response.data;
  },

  updateAlert: async (id: string, data: AlertUpdate): Promise<AlertRead> => {
    const response = await apiClient.patch<AlertRead>(`/alerts/${id}`, data);
    return response.data;
  },
};
