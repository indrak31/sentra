import { apiClient } from './client';
import { StateRead, DistrictRead, LocationRead } from '../types';

export const locationsApi = {
  getStates: async (): Promise<StateRead[]> => {
    const response = await apiClient.get<StateRead[]>('/locations/states');
    return response.data;
  },

  getDistrictsByState: async (stateId: string): Promise<DistrictRead[]> => {
    const response = await apiClient.get<DistrictRead[]>(`/locations/states/${stateId}/districts`);
    return response.data;
  },

  getDistrictById: async (districtId: string): Promise<DistrictRead> => {
    const response = await apiClient.get<DistrictRead>(`/locations/districts/${districtId}`);
    return response.data;
  },

  getLocations: async (districtId?: string): Promise<LocationRead[]> => {
    const params = districtId ? { district_id: districtId } : {};
    const response = await apiClient.get<LocationRead[]>('/locations', { params });
    return response.data;
  },
};
