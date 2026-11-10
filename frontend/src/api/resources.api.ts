import { apiClient } from './client';
import { ResourceRead, ResourceUpdate, PaginatedResponse } from '../types';
import { SEED_RESOURCES } from '../utils/mockSeedData';

export const resourcesApi = {
  getResources: async (params?: {
    district_id?: string;
    resource_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<ResourceRead>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<ResourceRead>>('/resources', { params });
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using seed resources for map visualization');
      let filtered = [...SEED_RESOURCES];
      if (params?.district_id) {
        filtered = filtered.filter((r) => r.district_id === params.district_id);
      }
      if (params?.resource_type) {
        filtered = filtered.filter((r) => r.resource_type === params.resource_type);
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

  getResourceById: async (id: string): Promise<ResourceRead> => {
    try {
      const response = await apiClient.get<ResourceRead>(`/resources/${id}`);
      return response.data;
    } catch (err) {
      const found = SEED_RESOURCES.find((r) => r.id === id);
      if (found) return found;
      return SEED_RESOURCES[0];
    }
  },

  updateResource: async (id: string, data: ResourceUpdate): Promise<ResourceRead> => {
    const response = await apiClient.patch<ResourceRead>(`/resources/${id}`, data);
    return response.data;
  },

  getDistrictResources: async (districtId: string): Promise<PaginatedResponse<ResourceRead>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<ResourceRead>>(`/locations/districts/${districtId}/resources`);
      return response.data;
    } catch (err) {
      const filtered = SEED_RESOURCES.filter((r) => r.district_id === districtId);
      return {
        items: filtered,
        total: filtered.length,
        page: 1,
        page_size: 100,
        pages: 1,
      };
    }
  },
};
