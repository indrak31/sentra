// SENTRA TypeScript Type Definitions (mirrored from backend Pydantic models)

export interface RoleRead {
  id: string;
  name: 'ADMINISTRATOR' | 'DISASTER_MANAGER' | 'HEALTHCARE_COORDINATOR' | 'FIELD_RESPONDER' | 'ANALYST' | string;
  description?: string | null;
}

export interface UserRead {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  state_id?: string | null;
  district_id?: string | null;
  roles: RoleRead[];
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface StateRead {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface DistrictRead {
  id: string;
  state_id: string;
  name: string;
  code: string;
  population: number;
  area_sq_km?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface LocationRead {
  id: string;
  district_id: string;
  name: string;
  location_type: 'HOSPITAL' | 'SHELTER' | 'STAGING_AREA' | 'OBSERVATION_STATION' | 'DEMAND_ZONE';
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  created_at: string;
}

export type ObservationType =
  | 'RAINFALL'
  | 'RIVER_LEVEL'
  | 'TEMPERATURE'
  | 'WIND_SPEED'
  | 'SEISMIC_INTENSITY'
  | 'HUMIDITY'
  | 'SOIL_MOISTURE';

export interface ObservationRead {
  id: string;
  district_id: string;
  location_id?: string | null;
  observation_type: ObservationType;
  value: number;
  unit: string;
  timestamp: string;
  data_source: string;
  external_record_id?: string | null;
  quality_status: 'VERIFIED' | 'UNVERIFIED' | 'SUSPECT';
  ingestion_timestamp: string;
}

export interface ObservationCreate {
  district_id: string;
  location_id?: string | null;
  observation_type: ObservationType;
  value: number;
  unit: string;
  timestamp: string;
  data_source: string;
  external_record_id?: string | null;
  quality_status?: 'VERIFIED' | 'UNVERIFIED' | 'SUSPECT';
}

export type HazardType =
  | 'FLOOD'
  | 'CYCLONE'
  | 'EARTHQUAKE'
  | 'DROUGHT'
  | 'LANDSLIDE'
  | 'TSUNAMI'
  | 'HEATWAVE';

export interface EvaluationMetric {
  metric_name: string;
  value: number;
  unit?: string | null;
  description: string;
  benchmark_dataset: string;
}

export interface HazardReadinessInfo {
  hazard_type: HazardType;
  model_name: string;
  model_version: string;
  is_available: boolean;
  readiness_status: string;
  scientific_methodology: string;
  expected_inputs: string[];
  input_units: Record<string, string>;
  wave_propagation?: string | null;
  coastal_inundation?: string | null;
  blocker_reason?: string | null;
  evaluation_metrics: EvaluationMetric[];
  last_calibrated_at?: string | null;
  provenance_reference: string;
}

export interface HistoricalEvent {
  event_id: string;
  event_name: string;
  event_year: number;
  hazard_type: HazardType;
  state_code: string;
  state_name: string;
  district_name: string;
  start_date: string;
  severity: string;
  peak_metric_name: string;
  peak_metric_value: number;
  peak_metric_unit: string;
  estimated_exposed_population: number;
  reported_fatalities: number;
  economic_loss_inr_cr: number;
  description: string;
  data_source: string;
}

export interface HazardPredictionOutput {
  hazard_type: HazardType;
  risk_score: number;
  severity_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence_score?: number;
  primary_metric_name: string;
  primary_metric_value: number;
  primary_metric_unit: string;
  secondary_metrics?: Record<string, any>;
  summary: string;
  recommended_actions: string[];
  assumptions_and_limitations?: string[];
  calculated_at: string;
  model_version?: string;
  evaluated_at?: string;
}

export interface GeospatialImpactEnvelope {
  hazard_type: HazardType;
  center: { latitude: number; longitude: number };
  estimated_impact_radius_km: number;
  severity_level: string;
  envelope_geometry_type: string;
  disclaimer: string;
}

export interface HazardModelStatus {
  hazard_type: HazardType;
  model_name: string;
  model_version: string;
  is_available: boolean;
  readiness_status: string;
}

export interface RiskAssessmentRead {
  id: string;
  district_id: string;
  hazard_type: HazardType;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'MODEL_UNAVAILABLE' | 'INSUFFICIENT_DATA';
  time_horizon: string;
  input_snapshot: Record<string, any>;
  prediction_result?: Record<string, any> | null;
  model_name?: string | null;
  model_version?: string | null;
  data_provenance?: Record<string, any> | null;
  error_details?: string | null;
  completed_at?: string | null;
  created_at: string;
}

export interface RiskAssessmentCreate {
  district_id: string;
  hazard_type: HazardType;
  time_horizon?: string;
  input_data?: Record<string, any> | null;
}

export interface HealthImpactRead {
  id: string;
  risk_assessment_id?: string | null;
  district_id: string;
  status: string;
  exposed_population: number;
  estimated_affected: number;
  vulnerability_indicators: Record<string, any>;
  estimated_medical_demand: {
    hospital_beds?: number;
    als_ambulances?: number;
    medical_teams?: number;
    temporary_shelters?: number;
    relief_packs?: number;
    [key: string]: any;
  };
  estimation_method: string;
  estimation_version: string;
  assumptions: Record<string, any>;
  limitations?: string | null;
  created_at: string;
}

export interface HealthImpactEstimateRequest {
  district_id: string;
  risk_assessment_id?: string | null;
  hazard_severity_score?: number | null;
  vulnerability_factor?: number;
  exposed_population_override?: number | null;
}

export type ResourceTypeEnum =
  | 'AMBULANCE'
  | 'HOSPITAL_BED'
  | 'MEDICAL_TEAM'
  | 'TEMPORARY_SHELTER'
  | 'RESCUE_TEAM'
  | 'RELIEF_SUPPLY_PACK';

export type OperationalStatusEnum = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';

export interface ResourceRead {
  id: string;
  district_id: string;
  location_id?: string | null;
  resource_type: ResourceTypeEnum;
  name: string;
  total_capacity: number;
  available_capacity: number;
  operational_status: OperationalStatusEnum;
  capabilities: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ResourceUpdate {
  name?: string;
  total_capacity?: number;
  available_capacity?: number;
  operational_status?: OperationalStatusEnum;
  capabilities?: Record<string, any>;
}

export interface DemandItem {
  demand_id: string;
  name: string;
  resource_type: string;
  quantity_demanded: number;
  priority_weight: number;
}

export interface SupplyItem {
  resource_id: string;
  name: string;
  resource_type: string;
  available_quantity: number;
  district_id?: string | null;
}

export interface OptimizationRequest {
  district_id?: string | null;
  objective?: 'MINIMIZE_UNMET_DEMAND' | 'PRIORITIZE_VULNERABLE' | 'MINIMIZE_TRAVEL_TIME';
  demands: DemandItem[];
  supplies?: SupplyItem[] | null;
  max_travel_time_minutes?: number | null;
}

export interface PlannedAllocation {
  demand_id: string;
  resource_id: string;
  resource_name: string;
  resource_type: string;
  allocated_quantity: number;
}

export interface OptimizationResponse {
  run_id: string;
  status: string;
  solver_status: string;
  objective_value?: number | null;
  allocations: PlannedAllocation[];
  unmet_demand: Record<string, number>;
  unused_capacity: Record<string, number>;
  result_summary: Record<string, any>;
  completed_at?: string | null;
}

export interface AllocationRead {
  id: string;
  optimization_run_id?: string | null;
  resource_id: string;
  district_id: string;
  allocated_quantity: number;
  status: string;
  notes?: string | null;
  created_at: string;
}

export interface SimulationCreate {
  name: string;
  description?: string | null;
  baseline_run_id?: string | null;
  demand_multiplier: number;
  capacity_multiplier: number;
  demands?: DemandItem[] | null;
  supplies?: SupplyItem[] | null;
}

export interface SimulationRead {
  id: string;
  name: string;
  description?: string | null;
  baseline_run_id?: string | null;
  scenario_parameters: Record<string, any>;
  status: string;
  result_summary: Record<string, any>;
  created_at: string;
}

export interface SimulationComparison {
  simulation_id: string;
  baseline_run_id?: string | null;
  baseline_metrics: Record<string, any>;
  simulation_metrics: Record<string, any>;
  differences: Record<string, any>;
}

export type AlertSeverityEnum = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type AlertStatusEnum = 'DRAFT' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED';

export interface AlertRead {
  id: string;
  district_id: string;
  hazard_type: HazardType;
  risk_assessment_id?: string | null;
  severity: AlertSeverityEnum;
  status: AlertStatusEnum;
  title: string;
  description: string;
  issued_by: string;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertCreate {
  district_id: string;
  hazard_type: HazardType;
  risk_assessment_id?: string | null;
  severity: AlertSeverityEnum;
  title: string;
  description: string;
}

export interface AlertUpdate {
  severity?: AlertSeverityEnum;
  status?: AlertStatusEnum;
  title?: string;
  description?: string;
}

export interface SystemSummaryReport {
  total_states: number;
  total_districts: number;
  total_observations: number;
  total_risk_assessments: number;
  total_active_alerts: number;
  total_registered_resources: number;
  total_optimization_runs: number;
  generated_at: string;
}

export interface DistrictImpactSummary {
  district_id: string;
  district_name: string;
  state_name: string;
  total_observations: number;
  latest_hazard_assessment?: string | null;
  latest_assessment_status?: string | null;
  estimated_affected_population?: number | null;
  active_alerts_count: number;
  available_resources_count: number;
}

export interface DisasterImpactReport {
  state_id?: string | null;
  summary_by_district: DistrictImpactSummary[];
  total_districts_reported: number;
  generated_at: string;
}

export interface AuditLogRead {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  timestamp: string;
}
