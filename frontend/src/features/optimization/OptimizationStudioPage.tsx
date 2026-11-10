import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizationApi } from '../../api/optimization.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Dialog } from '../../components/ui/Dialog';
import { SEED_DISTRICTS } from '../../utils/constants';
import { OptimizationRequest, OptimizationResponse, DemandItem } from '../../types';
import { Cpu, CheckCircle2, ShieldAlert, ArrowRight, Plus, Trash2, Lock } from 'lucide-react';

export const OptimizationStudioPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [districtId, setDistrictId] = useState('dist-mh-pu');
  const [objective, setObjective] = useState<'MINIMIZE_UNMET_DEMAND' | 'PRIORITIZE_VULNERABLE' | 'MINIMIZE_TRAVEL_TIME'>('MINIMIZE_UNMET_DEMAND');
  const [maxTravelTime, setMaxTravelTime] = useState<number>(45);

  // Demand builder list
  const [demands, setDemands] = useState<DemandItem[]>([
    {
      demand_id: 'zone-pune-north',
      name: 'Mula-Mutha Riverfront Evacuation Staging Area',
      resource_type: 'AMBULANCE',
      quantity_demanded: 6,
      priority_weight: 2.5,
    },
    {
      demand_id: 'zone-pune-field',
      name: 'Haveli Sub-District Emergency Field Clinic',
      resource_type: 'HOSPITAL_BED',
      quantity_demanded: 30,
      priority_weight: 1.8,
    },
  ]);

  const [activeRunResult, setActiveRunResult] = useState<OptimizationResponse | null>({
    run_id: 'opt-run-pune-01',
    status: 'SUCCEEDED',
    solver_status: 'OPTIMAL',
    objective_value: 120.6,
    allocations: [
      {
        demand_id: 'Mula-Mutha Riverfront Evacuation Staging Area',
        resource_id: 'res-depot-1',
        resource_name: 'NDRF 5th Battalion Staging Base, Pune',
        resource_type: 'AMBULANCE',
        allocated_quantity: 6,
      },
      {
        demand_id: 'Haveli Sub-District Emergency Field Clinic',
        resource_id: 'res-depot-2',
        resource_name: 'Pune District Civil Hospital Surge Wing',
        resource_type: 'HOSPITAL_BED',
        allocated_quantity: 30,
      },
    ],
    unmet_demand: {},
    unused_capacity: {
      'Pune Central Logistics Depot': 18,
      'NDRF Regional Depot': 34,
    },
    result_summary: {
      total_demanded: 36,
      total_allocated: 36,
      demand_satisfaction_rate_pct: 100,
      mean_transit_time_minutes: 18,
      solver_wall_time_ms: 32,
      solver_engine: 'Google OR-Tools Mixed-Integer Linear Programming (SCIP/CBC)',
    },
    completed_at: new Date().toISOString(),
  });
  const [confirmingAllocationId, setConfirmingAllocationId] = useState<string | null>(null);

  // Add demand item
  const handleAddDemand = () => {
    setDemands([
      ...demands,
      {
        demand_id: `zone-${Date.now().toString().slice(-4)}`,
        name: 'New Evacuation Demand Sector',
        resource_type: 'AMBULANCE',
        quantity_demanded: 5,
        priority_weight: 1.0,
      },
    ]);
  };

  const handleRemoveDemand = (index: number) => {
    setDemands(demands.filter((_, i) => i !== index));
  };

  // Run Solver Mutation
  const solverMutation = useMutation({
    mutationFn: optimizationApi.runOptimization,
    onSuccess: (data) => {
      setActiveRunResult(data);
      queryClient.invalidateQueries({ queryKey: ['optimization-runs'] });
    },
  });

  const handleExecuteSolver = (e: React.FormEvent) => {
    e.preventDefault();
    solverMutation.mutate({
      district_id: districtId,
      objective,
      demands,
      max_travel_time_minutes: maxTravelTime,
    });
  };

  // Confirm Allocation Mutation
  const confirmMutation = useMutation({
    mutationFn: optimizationApi.confirmAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-inventory'] });
      setConfirmingAllocationId(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OPERATIONAL LOGISTICS"
        title="Resource Allocation Solver"
        subtitle="Mixed-integer linear programming (MILP) solver for rapid evacuation routing and resource dispatch."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Solver Configuration Form */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Cpu className="w-4 h-4 text-amber-500" />
                <span>Solver Model Constraints</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExecuteSolver} className="space-y-4">
                <Select
                  label="Target Geographic Operational Bounds"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                >
                  {Object.entries(SEED_DISTRICTS).map(([id, d]) => (
                    <option key={id} value={id}>
                      {d.name} ({d.state})
                    </option>
                  ))}
                </Select>

                <Select
                  label="Optimization Objective Function"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value as any)}
                >
                  <option value="MINIMIZE_UNMET_DEMAND">
                    MINIMIZE_UNMET_DEMAND (Maximal Demand Coverage)
                  </option>
                  <option value="PRIORITIZE_VULNERABLE">
                    PRIORITIZE_VULNERABLE (Heaviest Weight to High-Risk Zones)
                  </option>
                  <option value="MINIMIZE_TRAVEL_TIME">
                    MINIMIZE_TRAVEL_TIME (Shortest Transit Distance)
                  </option>
                </Select>

                <Input
                  label="Max Permissible Transit Time (Minutes)"
                  type="number"
                  min="5"
                  max="300"
                  value={maxTravelTime}
                  onChange={(e) => setMaxTravelTime(parseInt(e.target.value) || 30)}
                  helperText="Strict constraint: allocations exceeding cutoff are eliminated."
                />

                {/* Demands Builder */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Emergency Demand Points ({demands.length})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Plus className="w-3 h-3" />}
                      onClick={handleAddDemand}
                    >
                      Add Demand Point
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {demands.map((demand, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={demand.name}
                            onChange={(e) => {
                              const updated = [...demands];
                              updated[idx].name = e.target.value;
                              setDemands(updated);
                            }}
                            className="bg-transparent font-semibold text-slate-800 focus:outline-none focus:underline truncate w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDemand(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={demand.resource_type}
                            onChange={(e) => {
                              const updated = [...demands];
                              updated[idx].resource_type = e.target.value;
                              setDemands(updated);
                            }}
                            className="bg-white border border-slate-200 text-[11px] text-slate-700 p-1.5 rounded-lg focus:outline-none focus:border-sky-500"
                          >
                            <option value="AMBULANCE">Ambulance</option>
                            <option value="HOSPITAL_BED">Hospital Bed</option>
                            <option value="MEDICAL_TEAM">Medical Team</option>
                            <option value="TEMPORARY_SHELTER">Shelter</option>
                          </select>

                          <div>
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={demand.quantity_demanded}
                              onChange={(e) => {
                                const updated = [...demands];
                                updated[idx].quantity_demanded = parseInt(e.target.value) || 1;
                                setDemands(updated);
                              }}
                              className="w-full bg-white border border-slate-200 text-[11px] text-slate-700 p-1.5 rounded-lg focus:outline-none focus:border-sky-500"
                            />
                          </div>

                          <div>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="10.0"
                              placeholder="Weight"
                              value={demand.priority_weight}
                              onChange={(e) => {
                                const updated = [...demands];
                                updated[idx].priority_weight = parseFloat(e.target.value) || 1.0;
                                setDemands(updated);
                              }}
                              className="w-full bg-white border border-slate-200 text-[11px] text-slate-700 p-1.5 rounded-lg focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={solverMutation.isPending}
                    icon={<Cpu className="w-4 h-4" />}
                  >
                    Run OR-Tools Solver
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Solver Execution Results */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="h-full border-slate-200">
            <CardHeader className="bg-slate-50/60">
              <CardTitle>
                <Cpu className="w-4 h-4 text-slate-800" />
                <span>Solver Optimization Solution</span>
              </CardTitle>
              {activeRunResult && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-emerald-50/70 text-emerald-700 border border-emerald-200/80 uppercase font-medium">
                  STATUS: {activeRunResult.status}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {activeRunResult ? (
                <>
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500">Objective Value:</span>
                      <p className="text-lg font-bold text-amber-600 font-mono">
                        {activeRunResult.objective_value?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Solver Status:</span>
                      <p className="text-sm font-semibold text-slate-900">
                        {activeRunResult.solver_status}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Proposed Allocations:</span>
                      <p className="text-lg font-bold text-slate-900 font-mono">
                        {activeRunResult.allocations.length}
                      </p>
                    </div>
                  </div>

                  {/* Proposed Plan Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Proposed Allocation Decisions (x_i,j)
                    </h4>

                    {activeRunResult.allocations.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-xl">
                        Solver returned no viable allocation paths under given transit constraints.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                              <th className="py-2.5 px-3">Destination Demand Point</th>
                              <th className="py-2.5 px-3">Supply Resource Depot</th>
                              <th className="py-2.5 px-3">Type</th>
                              <th className="py-2.5 px-3">Units Allocated</th>
                              <th className="py-2.5 px-3 text-right">Commit Lock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeRunResult.allocations.map((alloc, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80">
                                <td className="py-3 px-3 font-semibold text-slate-900">
                                  {alloc.demand_id}
                                </td>
                                <td className="py-3 px-3 text-slate-500">{alloc.resource_name}</td>
                                <td className="py-3 px-3 font-mono text-[11px] text-slate-800 font-semibold">
                                  {alloc.resource_type}
                                </td>
                                <td className="py-3 px-3 font-mono font-bold text-amber-600">
                                  {alloc.allocated_quantity} units
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={<Lock className="w-3 h-3 text-amber-600" />}
                                    onClick={() => setConfirmingAllocationId(alloc.resource_id)}
                                  >
                                    Confirm
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Cpu className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Configure demands and click "Run OR-Tools Solver" to generate mathematical solutions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Safety Confirmation Dialog */}
      <Dialog
        isOpen={!!confirmingAllocationId}
        onClose={() => setConfirmingAllocationId(null)}
        title="Confirm Operational Resource Allocation"
        description="Safety-first live inventory deduction policy"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            Confirming this allocation acquires a database row-lock and immediately deducts allocated units from live emergency inventory.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmingAllocationId(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={confirmMutation.isPending}
              onClick={() => {
                if (confirmingAllocationId) {
                  confirmMutation.mutate(confirmingAllocationId);
                }
              }}
            >
              Commit Deduction
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
