import { apiClient } from './client';
import { TokenResponse, UserRead } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', { email, password });
    return response.data;
  },

  getMe: async (): Promise<UserRead> => {
    const response = await apiClient.get<UserRead>('/auth/me');
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    } finally {
      localStorage.removeItem('sentra_access_token');
      localStorage.removeItem('sentra_refresh_token');
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};
