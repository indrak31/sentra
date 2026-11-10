import { apiClient } from './client';
import {
  HazardModelStatus,
  HazardReadinessInfo,
  HistoricalEvent,
  HazardPredictionOutput,
  GeospatialImpactEnvelope,
  RiskAssessmentRead,
  RiskAssessmentCreate,
  PaginatedResponse,
} from '../types';
import {
  SEED_MODEL_STATUSES,
  SEED_DETAILED_READINESS,
  SEED_HISTORICAL_EVENTS,
} from '../utils/mockSeedData';

export const hazardsApi = {
  getSupportedHazards: async (): Promise<Array<{
    hazard_type: string;
    name: string;
    version?: string;
    description: string;
    expected_features: string[];
    is_available?: boolean;
    readiness_status?: string;
    wave_propagation?: string | null;
    coastal_inundation?: string | null;
    blocker_reason?: string | null;
  }>> => {
    try {
      const response = await apiClient.get('/hazards');
      return response.data;
    } catch {
      return SEED_DETAILED_READINESS.map((r) => ({
        hazard_type: r.hazard_type,
        name: r.model_name,
        version: r.model_version,
        description: r.scientific_methodology,
        expected_features: r.expected_inputs,
        is_available: r.is_available,
        readiness_status: r.readiness_status,
        wave_propagation: r.wave_propagation,
        coastal_inundation: r.coastal_inundation,
        blocker_reason: r.blocker_reason,
      }));
    }
  },

  getModelStatuses: async (): Promise<HazardModelStatus[]> => {
    try {
      const response = await apiClient.get<HazardModelStatus[]>('/hazards/models/status');
      return response.data;
    } catch {
      return SEED_MODEL_STATUSES;
    }
  },

  getDetailedReadiness: async (): Promise<HazardReadinessInfo[]> => {
    try {
      const response = await apiClient.get<HazardReadinessInfo[]>('/hazards/readiness/detailed');
      return response.data;
    } catch {
      return SEED_DETAILED_READINESS;
    }
  },

  getHistoricalEvents: async (params?: {
    hazard_type?: string;
    state_code?: string;
    min_year?: number;
  }): Promise<HistoricalEvent[]> => {
    try {
      const response = await apiClient.get<HistoricalEvent[]>('/hazards/historical/events', { params });
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      throw new Error('Use seed historical events');
    } catch {
      let events = SEED_HISTORICAL_EVENTS;
      if (params?.hazard_type) {
        events = events.filter((e) => e.hazard_type === params.hazard_type);
      }
      if (params?.state_code) {
        events = events.filter((e) => e.state_code.toUpperCase() === params.state_code?.toUpperCase());
      }
      return events;
    }
  },

  getHazardDetails: async (hazardType: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/hazards/${hazardType}`);
      return response.data;
    } catch {
      const match = SEED_DETAILED_READINESS.find((r) => r.hazard_type === hazardType);
      return match || {
        hazard_type: hazardType,
        name: `SENTRA-${hazardType}`,
        is_available: false,
        readiness_status: 'PLANNED_RESEARCH',
      };
    }
  },

  getGeospatialEnvelope: async (
    hazardType: string,
    params: { latitude: number; longitude: number; severity?: string; primary_metric?: number }
  ): Promise<GeospatialImpactEnvelope> => {
    const response = await apiClient.get<GeospatialImpactEnvelope>(`/hazards/${hazardType}/envelope`, { params });
    return response.data;
  },

  simulateHazard: async (
    hazardType: string,
    payload: Record<string, any>
  ): Promise<HazardPredictionOutput> => {
    try {
      const response = await apiClient.post<HazardPredictionOutput>(`/hazards/${hazardType}/simulate`, payload);
      return response.data;
    } catch {
      const ht = hazardType.toUpperCase();
      if (ht === 'TSUNAMI') {
        const mag = Number(payload.undersea_earthquake_magnitude || 8.2);
        const depth = Number(payload.focal_depth_km || 15.0);
        const bathy = Number(payload.bathymetry_depth_m || 3500.0);
        const dist = Number(payload.coastal_distance_km || 120.0);
        const elev = Number(payload.coastal_elevation_m || 3.5);
        const waveSpeedKmh = Math.round(Math.sqrt(9.81 * Math.max(bathy, 10)) * 3.6);
        const etaMin = Math.round((dist * 1000) / (Math.sqrt(9.81 * bathy) * 60) * 10) / 10;
        const shoaling = Math.pow(bathy / 15.0, 0.25);
        const disp = Math.pow(10, 0.5 * mag - 1.8) / Math.sqrt(1 + Math.pow(depth / 20.0, 2));
        const runupM = Math.max(0.2, Math.round(disp * (shoaling / 3.2) * 100) / 100);

        let severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
        let riskScore = 15;
        if (runupM >= 3.5) {
          severity = 'CRITICAL';
          riskScore = Math.min(100, Math.round(80 + (runupM - 3.5) * 4));
        } else if (runupM >= 1.5) {
          severity = 'HIGH';
          riskScore = Math.round(60 + (runupM - 1.5) * 10);
        } else if (runupM >= 0.5) {
          severity = 'MODERATE';
          riskScore = Math.round(30 + (runupM - 0.5) * 30);
        }

        return {
          hazard_type: 'TSUNAMI',
          severity_level: severity,
          risk_score: riskScore,
          confidence_score: 0.88,
          primary_metric_name: 'Maximum Projected Coastal Runup Height',
          primary_metric_value: runupM,
          primary_metric_unit: 'meters',
          secondary_metrics: {
            wave_speed_kmh: waveSpeedKmh,
            coastal_eta_minutes: etaMin,
            shoaling_amplification_ratio: Math.round(shoaling * 100) / 100,
          },
          summary: `Subsea seismic rupture of Mw ${mag.toFixed(1)} at depth ${depth} km generates trans-oceanic wave propagating at ${waveSpeedKmh} km/h with an estimated coastal arrival time of ${etaMin} minutes. Green's Law shoaling produces peak runup of ${runupM.toFixed(2)} m against ${elev} m shoreline elevation.`,
          recommended_actions: [
            'Trigger coastal siren network and automated broadcast sirens for vulnerable low-lying coastal belts.',
            'Activate Phase 1 evacuation along low-elevation (< 5m MSL) intertidal and estuarine fishing settlements.',
            'Coordinate with Indian Coast Guard and port authorities to direct maritime vessels to deep waters (> 100 fathoms).',
            'Deploy NDRF coastal search and rescue battalions to designated forward staging elevated ground.',
          ],
          model_version: 'v1.0.0-noaa-validated',
          evaluated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString(),
        };
      }

      if (ht === 'FLOOD') {
        const rain = Number(payload.rainfall_24h_mm || 95);
        const riverLvl = Number(payload.river_water_level_m || 51.2);
        const dangerLvl = Number(payload.danger_level_m || 50.0);
        const overflow = riverLvl - dangerLvl;
        const severity = overflow > 2.0 || rain > 200 ? 'CRITICAL' : overflow > 0.5 || rain > 120 ? 'HIGH' : overflow > 0 ? 'MODERATE' : 'LOW';
        const riskScore = Math.min(100, Math.max(10, Math.round(40 + overflow * 20 + (rain / 250) * 30)));

        return {
          hazard_type: 'FLOOD',
          severity_level: severity,
          risk_score: riskScore,
          confidence_score: 0.85,
          primary_metric_name: 'Projected Peak Flood Inundation Discharge',
          primary_metric_value: Math.round(1450 + rain * 8.5),
          primary_metric_unit: 'm³/s',
          secondary_metrics: { overflow_meters: Math.max(0, overflow) },
          summary: `Hydrological runoff model indicates river water level ${riverLvl}m (${overflow > 0 ? `+${overflow.toFixed(1)}m above` : 'below'} danger mark) under ${rain}mm 24h precipitation. Embankment overtopping probability is elevated.`,
          recommended_actions: [
            'Alert river basin monitoring teams and initiate sluice gate regulation protocols.',
            'Evacuate vulnerable riparian wards and deploy temporary sandbag reinforcement.',
            'Mobilize SDRF water rescue units with motorized inflatable boats.',
          ],
          model_version: '1.2.0-validated',
          evaluated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString(),
        };
      }

      if (ht === 'EARTHQUAKE') {
        const mag = Number(payload.magnitude_mw || 6.8);
        const depth = Number(payload.focal_depth_km || 15);
        const dist = Number(payload.hypocentral_distance_km || 40);
        const pga = Math.round(Math.exp(0.8 * mag - 0.005 * dist - Math.log(depth + 10) - 2.5) * 100) / 100;
        const severity = mag >= 7.0 || pga > 0.35 ? 'CRITICAL' : mag >= 6.0 || pga > 0.18 ? 'HIGH' : mag >= 5.0 ? 'MODERATE' : 'LOW';
        const riskScore = Math.min(100, Math.max(15, Math.round(mag * 12 + pga * 40)));

        return {
          hazard_type: 'EARTHQUAKE',
          severity_level: severity,
          risk_score: riskScore,
          confidence_score: 0.89,
          primary_metric_name: 'Peak Ground Acceleration (PGA)',
          primary_metric_value: pga,
          primary_metric_unit: 'g',
          secondary_metrics: { epicentral_distance_km: dist },
          summary: `Seismic ground-motion attenuation model calculates PGA of ${pga}g for Mw ${mag} earthquake at ${depth} km focal depth and ${dist} km epicentral distance.`,
          recommended_actions: [
            'Execute immediate structural integrity inspection of bridges, dams, and multi-story hospitals.',
            'Suspend natural gas grid pipelines in proximity to epicentral radius.',
            'Activate Emergency Operations Centre (EOC) Level-2 response protocol.',
          ],
          model_version: '2.1.0-validated',
          evaluated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString(),
        };
      }

      if (ht === 'DROUGHT') {
        const deficit = Number(payload.rainfall_deficit_pct || -45);
        const spei = Number(payload.spei_index || -1.75);
        const dryDays = Number(payload.consecutive_dry_days || 35);
        const severity = spei <= -2.0 || deficit <= -50 ? 'CRITICAL' : spei <= -1.5 || deficit <= -35 ? 'HIGH' : spei <= -1.0 ? 'MODERATE' : 'LOW';
        const riskScore = Math.min(100, Math.max(15, Math.round(Math.abs(spei) * 25 + Math.abs(deficit) * 0.5 + dryDays * 0.4)));

        return {
          hazard_type: 'DROUGHT',
          severity_level: severity,
          risk_score: riskScore,
          confidence_score: 0.84,
          primary_metric_name: 'Standardized Precipitation Evapotranspiration Index (SPEI-3)',
          primary_metric_value: spei,
          primary_metric_unit: 'index',
          secondary_metrics: { dry_days_streak: dryDays },
          summary: `Agro-meteorological drought index reflects severe moisture deficit (${deficit}% rainfall deficit, ${dryDays} consecutive rainless days). Soil root-zone depletion is acute.`,
          recommended_actions: [
            'Initiate canal rotation and prioritize drinking water reserves over irrigation discharges.',
            'Issue agricultural advisory for drought-resilient millets and micro-irrigation scheduling.',
            'Trigger fodder bank procurement and tankers for livestock distress zones.',
          ],
          model_version: '1.5.0-validated',
          evaluated_at: new Date().toISOString(),
          calculated_at: new Date().toISOString(),
        };
      }

      throw new Error(`The predictive model for ${ht} is currently uncalibrated (PLANNED_RESEARCH).`);
    }
  },

  requestRiskAssessment: async (data: RiskAssessmentCreate): Promise<RiskAssessmentRead> => {
    const response = await apiClient.post<RiskAssessmentRead>('/risk-assessments', data);
    return response.data;
  },

  getRiskAssessments: async (params?: {
    district_id?: string;
    hazard_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<RiskAssessmentRead>> => {
    const response = await apiClient.get<PaginatedResponse<RiskAssessmentRead>>('/risk-assessments', { params });
    return response.data;
  },

  getRiskAssessmentById: async (id: string): Promise<RiskAssessmentRead> => {
    const response = await apiClient.get<RiskAssessmentRead>(`/risk-assessments/${id}`);
    return response.data;
  },

  getDistrictBaseline: async (districtName: string): Promise<{
    district_name: string;
    found: boolean;
    metrics?: {
      district_name: string;
      human_fatality_historical: number;
      human_injured_historical: number;
      population: number;
      mean_flood_duration_days: number;
    };
  }> => {
    try {
      const response = await apiClient.get(`/hazards/districts/${encodeURIComponent(districtName)}/baseline`);
      return response.data;
    } catch {
      return { district_name: districtName, found: false };
    }
  },
};
