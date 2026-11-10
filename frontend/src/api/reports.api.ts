import { apiClient } from './client';
import { SystemSummaryReport, DisasterImpactReport } from '../types';
import { SEED_SYSTEM_SUMMARY } from '../utils/mockSeedData';

export const reportsApi = {
  getSystemSummary: async (): Promise<SystemSummaryReport> => {
    try {
      const response = await apiClient.get<SystemSummaryReport>('/reports/summary');
      return response.data;
    } catch (err) {
      console.warn('Backend unavailable, using seed system summary');
      return SEED_SYSTEM_SUMMARY;
    }
  },

  getDisasterImpactReport: async (stateId?: string): Promise<DisasterImpactReport> => {
    const params = stateId ? { state_id: stateId } : {};
    try {
      const response = await apiClient.get<DisasterImpactReport>('/reports/disaster-impact', { params });
      return response.data;
    } catch (err) {
      return {
        state_id: stateId || 'state-od-001',
        total_districts_reported: 2,
        summary_by_district: [
          {
            district_id: 'dist-od-pu',
            district_name: 'Puri',
            state_name: 'Odisha',
            total_observations: 740,
            latest_hazard_assessment: 'CYCLONE',
            latest_assessment_status: 'ACTIVE',
            estimated_affected_population: 1698730,
            active_alerts_count: 2,
            available_resources_count: 4,
          },
          {
            district_id: 'dist-od-ba',
            district_name: 'Balasore',
            state_name: 'Odisha',
            total_observations: 680,
            latest_hazard_assessment: 'CYCLONE',
            latest_assessment_status: 'ACTIVE',
            estimated_affected_population: 2320529,
            active_alerts_count: 1,
            available_resources_count: 4,
          },
        ],
        generated_at: new Date().toISOString(),
      };
    }
  },
};
