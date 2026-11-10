import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hazardsApi } from '../../api/hazards.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Select } from '../../components/ui/Select';
import { HazardBadge } from '../../components/common/StatusBadge';
import { HAZARD_CONFIG, SEED_DISTRICTS } from '../../utils/constants';
import { HazardType, HazardPredictionOutput } from '../../types';
import {
  Play,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  History,
  Activity,
  Calculator,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HazardsOverviewPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<HazardType>('TSUNAMI');
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('dist-od-pu');
  const [timeHorizon, setTimeHorizon] = useState<string>('24h');
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Simulator state for active hazard
  const [simInputs, setSimInputs] = useState<Record<string, any>>({
    rainfall_24h_mm: 95.0,
    cumulative_rainfall_72h_mm: 180.0,
    river_water_level_m: 51.2,
    danger_level_m: 50.0,
    magnitude_mw: 6.8,
    focal_depth_km: 15.0,
    hypocentral_distance_km: 40.0,
    rainfall_deficit_pct: -45.0,
    spei_index: -1.75,
    soil_moisture_pct: 18.0,
    consecutive_dry_days: 35,
    undersea_earthquake_magnitude: 8.2,
    bathymetry_depth_m: 3500.0,
    coastal_distance_km: 120.0,
    coastal_elevation_m: 3.5,
    fault_mechanism: 'THRUST',
  });

  const [simResult, setSimResult] = useState<HazardPredictionOutput | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Queries
  const { data: readinessList } = useQuery({
    queryKey: ['hazard-detailed-readiness'],
    queryFn: hazardsApi.getDetailedReadiness,
  });

  const { data: historicalEvents } = useQuery({
    queryKey: ['hazard-historical-events', activeTab],
    queryFn: () => hazardsApi.getHistoricalEvents({ hazard_type: activeTab }),
  });

  // Simulator Mutation
  const simMutation = useMutation({
    mutationFn: (payload: { hazard: string; data: Record<string, any> }) =>
      hazardsApi.simulateHazard(payload.hazard, payload.data),
    onSuccess: (data) => {
      setSimResult(data);
      setSimError(null);
    },
    onError: (err: any) => {
      setSimResult(null);
      const detail = err.response?.data?.error?.details || err.response?.data?.error?.message || err.message;
      setSimError(detail || 'Inference execution blocked for uncalibrated model.');
    },
  });

  // DB Risk Assessment Mutation
  const assessMutation = useMutation({
    mutationFn: hazardsApi.requestRiskAssessment,
    onSuccess: (data) => {
      setModalFeedback({
        type: 'success',
        message: `Risk assessment registered with status: ${data.status}. Trace recorded in SENTRA audit ledger.`,
      });
      queryClient.invalidateQueries({ queryKey: ['hazard-assessments'] });
    },
    onError: (err: any) => {
      if (err.response?.status === 503) {
        setModalFeedback({
          type: 'info',
          message:
            'Trained ML model weights for this hazard are currently blocked or uncalibrated. A traceable audit entry was logged.',
        });
      } else {
        setModalFeedback({
          type: 'error',
          message: err.response?.data?.error?.message || 'Failed to trigger risk assessment.',
        });
      }
    },
  });

  const activeReadiness = readinessList?.find((r) => r.hazard_type === activeTab);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setSimError(null);
    setSimResult(null);

    let payload: Record<string, any> = {};
    if (activeTab === 'FLOOD') {
      payload = {
        rainfall_24h_mm: Number(simInputs.rainfall_24h_mm || 95),
        cumulative_rainfall_72h_mm: Number(simInputs.cumulative_rainfall_72h_mm || 180),
        river_water_level_m: Number(simInputs.river_water_level_m || 51.2),
        danger_level_m: Number(simInputs.danger_level_m || 50),
      };
    } else if (activeTab === 'EARTHQUAKE') {
      payload = {
        magnitude_mw: Number(simInputs.magnitude_mw || 6.8),
        focal_depth_km: Number(simInputs.focal_depth_km || 15),
        hypocentral_distance_km: Number(simInputs.hypocentral_distance_km || 40),
        seismic_zone: 'ZONE_V',
      };
    } else if (activeTab === 'DROUGHT') {
      payload = {
        rainfall_deficit_pct: Number(simInputs.rainfall_deficit_pct || -45),
        spei_index: Number(simInputs.spei_index || -1.75),
        soil_moisture_pct: Number(simInputs.soil_moisture_pct || 18),
        consecutive_dry_days: Number(simInputs.consecutive_dry_days || 35),
      };
    } else if (activeTab === 'TSUNAMI') {
      payload = {
        undersea_earthquake_magnitude: Number(simInputs.undersea_earthquake_magnitude || 8.2),
        focal_depth_km: Number(simInputs.focal_depth_km || 15.0),
        bathymetry_depth_m: Number(simInputs.bathymetry_depth_m || 3500.0),
        coastal_distance_km: Number(simInputs.coastal_distance_km || 120.0),
        coastal_elevation_m: Number(simInputs.coastal_elevation_m || 3.5),
        fault_mechanism: simInputs.fault_mechanism || 'THRUST',
      };
    } else {
      payload = {};
    }

    simMutation.mutate({ hazard: activeTab, data: payload });
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <PageHeader
        eyebrow="MULTI-HAZARD INTELLIGENCE"
        title="Hazard Intelligence"
        subtitle="Physics-informed predictive simulation and spatial hazard monitoring across all 7 disaster disciplines."
        actions={
          <Button
            variant="primary"
            icon={<Play className="w-3.5 h-3.5" />}
            onClick={() => {
              setModalFeedback(null);
              setIsAssessmentModalOpen(true);
            }}
          >
            Record Audit Assessment
          </Button>
        }
      />

      {/* Clean Seven Hazard Categories Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {(Object.keys(HAZARD_CONFIG) as HazardType[]).map((type) => {
          const readiness = readinessList?.find((r) => r.hazard_type === type);
          const isSelected = activeTab === type;
          const isAvailable = readiness?.is_available ?? ['FLOOD', 'EARTHQUAKE', 'DROUGHT', 'TSUNAMI'].includes(type);

          return (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setSimResult(null);
                setSimError(null);
              }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                isSelected
                  ? 'bg-white border-[#0F172A] shadow-xs ring-2 ring-slate-900/10'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 tracking-tight">
                  {HAZARD_CONFIG[type].name.split(' ')[0]}
                </span>
                {isAvailable ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                ) : (
                  <Lock className="w-3 h-3 text-slate-300" />
                )}
              </div>

              <div className="mt-2">
                <span
                  className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-slate-50 text-slate-500 border-slate-200/80'
                  }`}
                >
                  {isAvailable ? 'Operational' : 'Planned'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Hazard Main Content */}
      {activeReadiness && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Key Model Intelligence & Historical Benchmarks */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-4 border-b border-slate-100/90 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <HazardBadge hazard={activeTab} size="md" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                      {activeReadiness.model_name}
                    </h2>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 ${
                    activeReadiness.is_available
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {activeReadiness.is_available ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Validated</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Planned Research</span>
                    </>
                  )}
                </span>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Clean, Non-Redundant Operational Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {activeTab === 'TSUNAMI'
                        ? 'Coupled Shallow-Water wave propagation with 1,012-event NOAA ML runup regression.'
                        : activeReadiness.scientific_methodology}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded shrink-0 ml-3">
                    Active
                  </span>
                </div>

                {/* Important Benchmark Metrics Only */}
                {activeReadiness.evaluation_metrics && activeReadiness.evaluation_metrics.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {activeReadiness.evaluation_metrics.map((m) => (
                      <div
                        key={m.metric_name}
                        className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs font-medium text-slate-700">{m.metric_name}</span>
                          <span className="text-base font-semibold font-mono text-slate-900">
                            {m.value} <span className="text-xs text-slate-500 font-normal">{m.unit || ''}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{m.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historical Ground-Truth Records Table */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100/90 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-800" />
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Verified Historical Records
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {historicalEvents?.length || 0} Events
                </span>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/90 border-b border-slate-100 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Event</th>
                        <th className="py-2.5 px-4">Location</th>
                        <th className="py-2.5 px-4">Year</th>
                        <th className="py-2.5 px-4">Peak Metric</th>
                        <th className="py-2.5 px-4">Loss</th>
                        <th className="py-2.5 px-4">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {historicalEvents && historicalEvents.length > 0 ? (
                        historicalEvents.slice(0, 8).map((event) => (
                          <tr key={event.event_id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-900">
                              {event.event_name}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">
                              {event.district_name}, {event.state_name}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                              {event.event_year}
                            </td>
                            <td className="py-2.5 px-4 text-slate-900 font-mono font-bold">
                              {event.peak_metric_value} {event.peak_metric_unit}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-700">
                              ₹{event.economic_loss_inr_cr.toLocaleString()} Cr
                            </td>
                            <td className="py-2.5 px-4 text-[11px] text-slate-500 max-w-xs truncate" title={event.data_source}>
                              {event.data_source}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No historical records currently registered for this hazard category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Interactive Prediction Simulator & Sandbox */}
          <div className="space-y-6">
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100/90">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-slate-800" />
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Model Simulator
                  </h2>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <form onSubmit={handleSimulate} className="space-y-3.5">
                  {/* Dynamic Inputs based on active tab */}
                  {activeTab === 'TSUNAMI' && (
                    <>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                          Undersea Rupture Magnitude
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="6.0"
                            max="9.9"
                            value={simInputs.undersea_earthquake_magnitude ?? 8.2}
                            onChange={(e) => setSimInputs({ ...simInputs, undersea_earthquake_magnitude: parseFloat(e.target.value) })}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono pr-12 bg-white"
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono pointer-events-none">
                            Mw
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            Focal Depth
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              value={simInputs.focal_depth_km ?? 15}
                              onChange={(e) => setSimInputs({ ...simInputs, focal_depth_km: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono pr-10 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono pointer-events-none">
                              km
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            Bathymetry Depth
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="100"
                              value={simInputs.bathymetry_depth_m ?? 3500}
                              onChange={(e) => setSimInputs({ ...simInputs, bathymetry_depth_m: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono pr-8 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono pointer-events-none">
                              m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            Coastal Distance
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="5"
                              value={simInputs.coastal_distance_km ?? 120}
                              onChange={(e) => setSimInputs({ ...simInputs, coastal_distance_km: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono pr-10 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono pointer-events-none">
                              km
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            Shoreline Elevation
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.5"
                              value={simInputs.coastal_elevation_m ?? 3.5}
                              onChange={(e) => setSimInputs({ ...simInputs, coastal_elevation_m: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono pr-8 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono pointer-events-none">
                              m
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                          Fault Rupture Mechanism
                        </label>
                        <select
                          value={simInputs.fault_mechanism || 'THRUST'}
                          onChange={(e) => setSimInputs({ ...simInputs, fault_mechanism: e.target.value })}
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono bg-white"
                        >
                          <option value="THRUST">THRUST (Subduction Zone)</option>
                          <option value="NORMAL">NORMAL (Extensional Fault)</option>
                          <option value="STRIKE_SLIP">STRIKE_SLIP (Lateral Shear)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {activeTab === 'FLOOD' && (
                    <>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                          24h Cumulative Rainfall
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={simInputs.rainfall_24h_mm ?? 95}
                            onChange={(e) => setSimInputs({ ...simInputs, rainfall_24h_mm: parseFloat(e.target.value) })}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-12 bg-white"
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">mm</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            River Water Level
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              value={simInputs.river_water_level_m ?? 51.2}
                              onChange={(e) => setSimInputs({ ...simInputs, river_water_level_m: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-8 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">m</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            CWC Danger Mark
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              value={simInputs.danger_level_m ?? 50.0}
                              onChange={(e) => setSimInputs({ ...simInputs, danger_level_m: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-8 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">m</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'EARTHQUAKE' && (
                    <>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                          Moment Magnitude
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={simInputs.magnitude_mw ?? 6.8}
                            onChange={(e) => setSimInputs({ ...simInputs, magnitude_mw: parseFloat(e.target.value) })}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-12 bg-white"
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">Mw</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            Focal Depth
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              value={simInputs.focal_depth_km ?? 15}
                              onChange={(e) => setSimInputs({ ...simInputs, focal_depth_km: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-10 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">km</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            Centroid Distance
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              value={simInputs.hypocentral_distance_km ?? 40}
                              onChange={(e) => setSimInputs({ ...simInputs, hypocentral_distance_km: parseFloat(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-10 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">km</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'DROUGHT' && (
                    <>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                          Monsoon Rainfall Deficit
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            value={simInputs.rainfall_deficit_pct ?? -45}
                            onChange={(e) => setSimInputs({ ...simInputs, rainfall_deficit_pct: parseFloat(e.target.value) })}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-8 bg-white"
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            SPEI-3 Index
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            value={simInputs.spei_index ?? -1.75}
                            onChange={(e) => setSimInputs({ ...simInputs, spei_index: parseFloat(e.target.value) })}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                            Consecutive Dry Days
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={simInputs.consecutive_dry_days ?? 35}
                              onChange={(e) => setSimInputs({ ...simInputs, consecutive_dry_days: parseInt(e.target.value) })}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono pr-12 bg-white"
                            />
                            <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-mono">days</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {['CYCLONE', 'LANDSLIDE', 'HEATWAVE'].includes(activeTab) && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">Planned Research Module</div>
                      <p className="text-[11px] text-slate-500">
                        Scheduled for future radar and telemetry feeds.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full justify-center py-2.5 font-medium"
                    icon={<Zap className="w-3.5 h-3.5" />}
                    isLoading={simMutation.isPending}
                  >
                    Run Model Inference
                  </Button>
                </form>

                {/* Simulation Output Card */}
                {simResult && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white space-y-3.5 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono text-blue-400 font-semibold tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Inference Result
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          simResult.severity_level === 'CRITICAL'
                            ? 'bg-rose-500/90 text-white'
                            : simResult.severity_level === 'HIGH'
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-emerald-500/90 text-white'
                        }`}
                      >
                        {simResult.severity_level}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Risk Score</span>
                        <span className="text-2xl font-bold font-mono text-white tracking-tight">
                          {simResult.risk_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Evaluated</span>
                        <span className="text-[11px] font-mono text-slate-300">
                          {new Date(simResult.calculated_at || simResult.evaluated_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">{simResult.primary_metric_name}:</span>
                      <span className="text-sm font-mono font-bold text-blue-300">
                        {simResult.primary_metric_value} {simResult.primary_metric_unit}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                      {simResult.summary}
                    </p>

                    {simResult.recommended_actions.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 mb-2">
                          Operational Actions:
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-300 pl-1">
                          {simResult.recommended_actions.map((act, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                              <span className="leading-snug">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {simError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Model Unavailable</div>
                      <div className="text-[11px] mt-0.5 leading-relaxed">{simError}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Surge Estimator Link */}
            <Card className="bg-slate-50/70 border-slate-200/80 shadow-xs">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                  <Activity className="w-4 h-4 text-slate-800" />
                  <span>Health Surge Projection</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Calculate required hospital ICU beds, ambulances, and triage logistics based on calibrated casualty rates.
                </p>
                <Link to="/health" className="block pt-1">
                  <Button variant="outline" size="sm" className="w-full justify-center" icon={<ArrowUpRight className="w-3.5 h-3.5 text-slate-700" />}>
                    Open Health Surge Estimator
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Record Formal Assessment Modal */}
      <Dialog
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        title="Execute Multi-Hazard Risk Assessment"
        description="Trigger hazard prediction adapter or record verified operational assessment"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setModalFeedback(null);
            assessMutation.mutate({
              district_id: selectedDistrict,
              hazard_type: activeTab,
              time_horizon: timeHorizon,
            });
          }}
          className="space-y-4 pt-1"
        >
          {modalFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                modalFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : modalFeedback.type === 'info'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {modalFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              )}
              <span>{modalFeedback.message}</span>
            </div>
          )}

          <Select
            label="Target Hazard Category"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as HazardType)}
          >
            {Object.keys(HAZARD_CONFIG).map((h) => (
              <option key={h} value={h}>
                {HAZARD_CONFIG[h as HazardType].name}
              </option>
            ))}
          </Select>

          <Select
            label="Target Operational District"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            {Object.entries(SEED_DISTRICTS).map(([id, d]) => (
              <option key={id} value={id}>
                {d.name} ({d.state})
              </option>
            ))}
          </Select>

          <Select
            label="Forecast Horizon"
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
          >
            <option value="24h">24 Hours (Immediate Response)</option>
            <option value="48h">48 Hours (Tactical Staging)</option>
            <option value="7d">7 Days (Strategic Advisory)</option>
          </Select>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAssessmentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={assessMutation.isPending}>
              Submit Assessment Run
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

export default HazardsOverviewPage;
