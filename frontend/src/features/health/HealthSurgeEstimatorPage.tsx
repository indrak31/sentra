import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi } from '../../api/health.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SEED_DISTRICTS } from '../../utils/constants';
import { formatNumber, formatDate } from '../../utils/formatters';
import { HeartPulse, Bed, Ambulance, Users, Home, Package, Calculator, CheckCircle2, MapPin } from 'lucide-react';
import { HealthImpactRead } from '../../types';

export const HealthSurgeEstimatorPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [districtId, setDistrictId] = useState('dist-mh-pu');
  const [severityScore, setSeverityScore] = useState<number>(0.75);
  const [vulnerability, setVulnerability] = useState<number>(0.6);
  const [populationOverride, setPopulationOverride] = useState<number | undefined>(undefined);
  const [estimationResult, setEstimationResult] = useState<HealthImpactRead | null>(null);
  const [localHistory, setLocalHistory] = useState<HealthImpactRead[]>([]);

  // Fetch historical estimates
  const { data: impactsData, isLoading } = useQuery({
    queryKey: ['health-impacts'],
    queryFn: () => healthApi.getImpacts({ page_size: 20 }),
  });

  const historicalImpacts = [
    ...localHistory,
    ...(impactsData?.items || []).filter((item) => !localHistory.some((lh) => lh.id === item.id)),
  ];

  // Estimate mutation
  const estimateMutation = useMutation({
    mutationFn: healthApi.estimateImpact,
    onSuccess: (data) => {
      setEstimationResult(data);
      setLocalHistory((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
      queryClient.invalidateQueries({ queryKey: ['health-impacts'] });
    },
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    estimateMutation.mutate({
      district_id: districtId,
      hazard_severity_score: severityScore,
      vulnerability_factor: vulnerability,
      exposed_population_override: populationOverride || undefined,
    });
  };

  const selectedMeta = SEED_DISTRICTS[districtId] || SEED_DISTRICTS['dist-mh-pu'];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PUBLIC HEALTH & CLINICAL SURGE"
        title="Health Surge Estimator"
        subtitle="Dynamic casualty projection, triage load balancing, and trauma ICU bed surge estimation across healthcare networks."
      />

      {/* Interactive Estimator Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                <Calculator className="w-4 h-4 text-amber-500" />
                <span>Surge Scenario Parameters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-4">
                <Select
                  label="Target Administrative District"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                >
                  {Object.entries(SEED_DISTRICTS).map(([id, d]) => (
                    <option key={id} value={id}>
                      {d.name} ({d.state}) — Census: {formatNumber(d.population)}
                    </option>
                  ))}
                </Select>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold">
                      Hazard Severity Index ({severityScore})
                    </span>
                    <span className="font-bold text-amber-600 font-mono">
                      {Math.round(severityScore * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={severityScore}
                    onChange={(e) => setSeverityScore(parseFloat(e.target.value))}
                    className="w-full accent-slate-900 bg-slate-200 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Scaled impact severity score (0.0 = Minor Event, 1.0 = Catastrophic)
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 uppercase tracking-wider font-semibold">
                      District Vulnerability Factor ({vulnerability})
                    </span>
                    <span className="font-bold text-orange-600 font-mono">
                      {Math.round(vulnerability * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={vulnerability}
                    onChange={(e) => setVulnerability(parseFloat(e.target.value))}
                    className="w-full accent-orange-600 bg-slate-200 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Demographic resilience and healthcare infrastructure fragility multiplier
                  </p>
                </div>

                <Input
                  label="Exposed Population Override (Optional)"
                  type="number"
                  placeholder={`Default census: ${selectedMeta.population}`}
                  value={populationOverride || ''}
                  onChange={(e) => setPopulationOverride(parseInt(e.target.value) || undefined)}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={estimateMutation.isPending}
                    icon={<HeartPulse className="w-4 h-4" />}
                  >
                    Execute Mathematical Estimation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Calculation Output Display */}
        <div className="lg:col-span-7">
          <Card className="h-full border-slate-200">
            <CardHeader className="bg-slate-50/60">
              <CardTitle>
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Projected Emergency Surges: {selectedMeta.name}</span>
              </CardTitle>
              {estimationResult && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  CALCULATED
                </span>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {estimationResult ? (
                <>
                  {/* Macro Demographics */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Exposed Population</span>
                      <p className="text-xl font-bold text-slate-900">
                        {formatNumber(estimationResult.exposed_population)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Estimated Affected</span>
                      <p className="text-xl font-bold text-amber-600">
                        {formatNumber(estimationResult.estimated_affected)}
                      </p>
                    </div>
                  </div>

                  {/* Medical Surge Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Bed className="w-4 h-4 text-slate-800" />
                        <span>Hospital Beds</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatNumber(estimationResult.estimated_medical_demand.hospital_beds)}
                      </span>
                      <p className="text-[10px] text-slate-400">5% of affected</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Ambulance className="w-4 h-4 text-amber-600" />
                        <span>ALS Ambulances</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatNumber(estimationResult.estimated_medical_demand.als_ambulances)}
                      </span>
                      <p className="text-[10px] text-slate-400">0.5% of affected</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>Medical Teams</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatNumber(estimationResult.estimated_medical_demand.medical_teams)}
                      </span>
                      <p className="text-[10px] text-slate-400">0.2% of affected</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Home className="w-4 h-4 text-orange-600" />
                        <span>Shelter Beds</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatNumber(estimationResult.estimated_medical_demand.temporary_shelters)}
                      </span>
                      <p className="text-[10px] text-slate-400">20% displacement</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Package className="w-4 h-4 text-purple-600" />
                        <span>Relief Supply Packs</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatNumber(estimationResult.estimated_medical_demand.relief_packs)}
                      </span>
                      <p className="text-[10px] text-slate-400">100% of affected population</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-500">
                    Method: {estimationResult.estimation_method} • Model: {estimationResult.estimation_version}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Calculator className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Configure parameters on the left and click "Execute Mathematical Estimation".</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Estimations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Surge Projections</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Exposed Pop</th>
                <th className="py-3 px-4">Estimated Affected</th>
                <th className="py-3 px-4">ICU Bed Demand</th>
                <th className="py-3 px-4">Ambulances</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading historical impact models...
                  </td>
                </tr>
              ) : historicalImpacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No historical estimations recorded yet.
                  </td>
                </tr>
              ) : (
                historicalImpacts.map((imp) => {
                  const district = SEED_DISTRICTS[imp.district_id];
                  const loc = district ? `${district.name}, ${district.state}` : imp.district_id;

                  return (
                    <tr key={imp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loc}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatNumber(imp.exposed_population)}</td>
                      <td className="py-3 px-4 font-bold text-amber-600">
                        {formatNumber(imp.estimated_affected)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {formatNumber(imp.estimated_medical_demand.hospital_beds)}
                      </td>
                      <td className="py-3 px-4 text-orange-600 font-medium">
                        {formatNumber(imp.estimated_medical_demand.als_ambulances)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {formatDate(imp.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
