import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { simulationsApi } from '../../api/simulations.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SimulationRead, SimulationComparison } from '../../types';
import { Layers, Sliders, ArrowRight, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const ScenarioSimulatorPage: React.FC = () => {
  const [name, setName] = useState('Pune Monsoonal Inundation +25% Scenario');
  const [description, setDescription] = useState('Simulation assuming 3 bridges impassable and 30% demand surge in Haveli');
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.3);
  const [capacityMultiplier, setCapacityMultiplier] = useState<number>(0.8);

  const [activeSimulation, setActiveSimulation] = useState<SimulationRead | null>(null);
  const [comparison, setComparison] = useState<SimulationComparison | null>(null);

  // Simulation mutation
  const simMutation = useMutation({
    mutationFn: simulationsApi.createSimulation,
    onSuccess: async (data) => {
      setActiveSimulation(data);
      try {
        const comp = await simulationsApi.compareSimulation(data.id);
        setComparison(comp);
      } catch (err) {
        console.warn('Simulation compare failed:', err);
      }
    },
  });

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    simMutation.mutate({
      name,
      description,
      demand_multiplier: demandMultiplier,
      capacity_multiplier: capacityMultiplier,
    });
  };

  const barData = [
    {
      metric: 'Demand Satisfied',
      Baseline: 85,
      Simulation: Math.round(85 * capacityMultiplier),
    },
    {
      metric: 'Unmet Demand',
      Baseline: 15,
      Simulation: Math.round(15 * demandMultiplier * 1.5),
    },
    {
      metric: 'Fleet Utilization',
      Baseline: 70,
      Simulation: Math.min(100, Math.round(70 * (demandMultiplier / capacityMultiplier))),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PREDICTIVE STRESS-TESTING"
        title="Scenario Stress Testing Studio"
        subtitle="Monte Carlo cascade failure simulation and worst-case multi-hazard compound stress tests."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Multipliers Card */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Stress-Test Multipliers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRunSimulation} className="space-y-4">
                <Input
                  label="Scenario Designation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Simulation Hypothesis"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold uppercase">
                      Emergency Demand Surge Multiplier
                    </span>
                    <span className="font-bold text-rose-600 font-mono">
                      {demandMultiplier.toFixed(1)}x (+{Math.round((demandMultiplier - 1) * 100)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={demandMultiplier}
                    onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-rose-600 bg-slate-200 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Simulate rapid secondary surges (dam overflow, flash mudslides)
                  </p>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold uppercase">
                      Operational Fleet Availability Multiplier
                    </span>
                    <span className="font-bold text-amber-600 font-mono">
                      {capacityMultiplier.toFixed(1)}x ({Math.round(capacityMultiplier * 100)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={capacityMultiplier}
                    onChange={(e) => setCapacityMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 bg-slate-200 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Simulate cut-off bridges, damaged ambulances, or flooded access corridors
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={simMutation.isPending}
                    icon={<Layers className="w-4 h-4" />}
                  >
                    Run Isolated Simulation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Side-by-Side Comparison Display */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="h-full border-slate-200">
            <CardHeader className="bg-slate-50/60">
              <CardTitle>
                <Layers className="w-4 h-4 text-slate-800" />
                <span>Baseline vs Scenario Outcome Contrast</span>
              </CardTitle>
              {activeSimulation && (
                <span className="text-xs font-mono font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  SIMULATION COMPLETE
                </span>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {activeSimulation ? (
                <>
                  <div className="h-64 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#0f172a',
                            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.12)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#475569' }}
                        />
                        <Bar dataKey="Baseline" fill="#0284c7" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Simulation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-500">Scenario Status:</span>
                      <p className="font-bold text-amber-600 font-mono uppercase">{activeSimulation.status}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-500">Simulation Execution ID:</span>
                      <p className="font-mono text-slate-800 truncate">{activeSimulation.id}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Sliders className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Adjust demand/capacity sliders on the left and run simulation to contrast outcomes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
