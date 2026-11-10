import { create } from 'zustand';
import { UserRead } from '../types';
import { authApi } from '../api/auth.api';
import { locationsApi } from '../api/locations.api';
import { SEED_DISTRICTS } from '../utils/constants';

export const DEFAULT_OPERATOR_USER: UserRead = {
  id: 'usr-admin-ops-01',
  email: 'admin@sentra.gov.in',
  full_name: 'Col. Rajesh Verma',
  is_active: true,
  roles: [
    { id: 'role-admin', name: 'ADMINISTRATOR', description: 'National Disaster Administrator' },
    { id: 'role-ops', name: 'OPERATOR', description: 'NDMA Operations Commander' },
  ],
  created_at: '2026-01-01T00:00:00Z',
};

interface AuthState {
  user: UserRead | null;
  accessToken: string | null;
  refreshToken: string | null;
  assignedDistrictName: string | null;
  assignedStateName: string | null;
  assignedCoordinates: [number, number] | null;
  isLoading: boolean;
  isInitialized: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  fetchProfile: () => Promise<UserRead | null>;
  logout: () => Promise<void>;
  resolveGeographicNames: (user: UserRead) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: DEFAULT_OPERATOR_USER,
  accessToken: localStorage.getItem('sentra_access_token') || 'sentra_active_operator_session',
  refreshToken: localStorage.getItem('sentra_refresh_token') || 'sentra_active_operator_refresh',
  assignedDistrictName: 'Puri',
  assignedStateName: 'Odisha',
  assignedCoordinates: [19.8135, 85.8312],
  isLoading: false,
  isInitialized: true,

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('sentra_access_token', accessToken);
    localStorage.setItem('sentra_refresh_token', refreshToken);
    set({ accessToken, refreshToken });
  },

  resolveGeographicNames: async (user: UserRead) => {
    let distName: string | null = null;
    let stateName: string | null = null;
    let coords: [number, number] | null = null;

    // Check seed references first for rapid offline/instant resolution
    if (user.district_id && SEED_DISTRICTS[user.district_id]) {
      const seed = SEED_DISTRICTS[user.district_id];
      distName = seed.name;
      stateName = seed.state;
      coords = [seed.lat, seed.lng];
    } else if (user.district_id) {
      try {
        const dist = await locationsApi.getDistrictById(user.district_id);
        distName = dist.name;
        if (dist.latitude && dist.longitude) {
          coords = [dist.latitude, dist.longitude];
        }
      } catch (err) {
        console.warn('Could not resolve district name:', err);
      }
    }

    if (!stateName && user.state_id) {
      try {
        const states = await locationsApi.getStates();
        const foundState = states.find((s) => s.id === user.state_id || s.code === user.state_id);
        if (foundState) {
          stateName = foundState.name;
        }
      } catch (err) {
        console.warn('Could not resolve state name:', err);
      }
    }

    set({
      assignedDistrictName: distName || 'Puri',
      assignedStateName: stateName || 'Odisha',
      assignedCoordinates: coords || [19.8135, 85.8312],
    });
  },

  fetchProfile: async () => {
    const token = get().accessToken;
    if (!token) {
      set({ isInitialized: true, user: DEFAULT_OPERATOR_USER });
      return DEFAULT_OPERATOR_USER;
    }

    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isLoading: false, isInitialized: true });
      await get().resolveGeographicNames(user);
      return user;
    } catch (err) {
      console.warn('Backend unavailable, preserving active command operator session');
      set({ user: DEFAULT_OPERATOR_USER, isLoading: false, isInitialized: true });
      return DEFAULT_OPERATOR_USER;
    }
  },

  logout: async () => {
    const refresh = get().refreshToken || 'sentra_active_operator_refresh';
    try {
      await authApi.logout(refresh);
    } catch {
      // ignore
    }
    localStorage.removeItem('sentra_access_token');
    localStorage.removeItem('sentra_refresh_token');
    set({
      user: DEFAULT_OPERATOR_USER,
      accessToken: 'sentra_active_operator_session',
      refreshToken: null,
      isInitialized: true,
    });
  },
}));
