import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { observationsApi } from '../../api/observations.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { SEED_DISTRICTS } from '../../utils/constants';
import { formatDate, formatTimeAgo } from '../../utils/formatters';
import { ObservationCreate, ObservationType } from '../../types';
import { Radio, Plus, LineChart as ChartIcon, Gauge, MapPin } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const SensorObservationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // New observation state
  const [form, setForm] = useState<ObservationCreate>({
    district_id: 'dist-mh-pu',
    observation_type: 'RAINFALL',
    value: 45.0,
    unit: 'mm',
    timestamp: new Date().toISOString(),
    data_source: 'CWC_AUTOMATIC_RAIN_GAUGE',
    quality_status: 'VERIFIED',
  });

  const { data: obsData, isLoading } = useQuery({
    queryKey: ['observations-list', selectedType, selectedDistrict],
    queryFn: () =>
      observationsApi.getObservations({
        observation_type: selectedType !== 'all' ? selectedType : undefined,
        district_id: selectedDistrict !== 'all' ? selectedDistrict : undefined,
        page_size: 50,
      }),
  });

  const observations = obsData?.items || [];

  // Ingest mutation
  const ingestMutation = useMutation({
    mutationFn: observationsApi.createObservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations-list'] });
      setIsIngestOpen(false);
    },
  });

  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ingestMutation.mutate({
      ...form,
      value: Number(form.value),
    });
  };

  // Mock trend data for chart if list has limited points
  const chartData = observations.length > 3
    ? observations
        .slice()
        .reverse()
        .map((o) => ({
          time: new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: o.value,
          unit: o.unit,
        }))
    : [
        { time: '04:00', value: 22.4, unit: 'mm' },
        { time: '08:00', value: 45.8, unit: 'mm' },
        { time: '12:00', value: 89.2, unit: 'mm' },
        { time: '16:00', value: 110.5, unit: 'mm' },
        { time: '20:00', value: 78.1, unit: 'mm' },
        { time: '24:00', value: 42.0, unit: 'mm' },
      ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TELEMETRY INGESTION NETWORK"
        title="Sensor Telemetry & Ingestion"
        subtitle="Unified sensor ingest pipeline for IMD Doppler radar, CWC river hydrographs, and USGS/NCS seismic arrays."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsIngestOpen(true)}
          >
            Ingest Sensor Observation
          </Button>
        }
      />

      {/* Observation Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            <ChartIcon className="w-4 h-4 text-slate-800" />
            <span>Precipitation & Stream Runoff Trend (Last 24 Hours)</span>
          </CardTitle>
          <span className="text-[10px] font-bold font-mono text-slate-400 tracking-wider">IMD / CWC REALTIME FEED</span>
        </CardHeader>
        <CardContent className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F172A" stopOpacity="0.18" />
                  <stop offset="95%" stopColor="#0F172A" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0F172A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-48">
          <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="all">All Sensor Types</option>
            <option value="RAINFALL">Rainfall (mm)</option>
            <option value="RIVER_LEVEL">River Level (m)</option>
            <option value="TEMPERATURE">Temperature (°C)</option>
            <option value="WIND_SPEED">Wind Speed (km/h)</option>
            <option value="SEISMIC_INTENSITY">Seismic Intensity (g)</option>
            <option value="SOIL_MOISTURE">Soil Moisture (%)</option>
          </Select>
        </div>

        <div className="w-48">
          <Select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
            <option value="all">All Districts</option>
            {Object.entries(SEED_DISTRICTS).map(([id, d]) => (
              <option key={id} value={id}>
                {d.name} ({d.state})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Observation Records Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Sensor Type</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Data Source</th>
                <th className="py-3 px-4">Quality Status</th>
                <th className="py-3 px-4">Observation Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading sensor records...
                  </td>
                </tr>
              ) : observations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No sensor observations match the selected filters.
                  </td>
                </tr>
              ) : (
                observations.map((obs) => {
                  const district = SEED_DISTRICTS[obs.district_id];
                  const loc = district ? `${district.name}, ${district.state}` : obs.district_id;

                  return (
                    <tr key={obs.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {obs.observation_type}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-base font-bold text-slate-900">
                          {obs.value}
                        </span>{' '}
                        <span className="text-[11px] text-slate-500">{obs.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{loc}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {obs.data_source}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                            obs.quality_status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {obs.quality_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {formatTimeAgo(obs.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(obs.timestamp)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Ingestion Dialog */}
      <Dialog
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        title="Ingest Environmental Observation"
        description="Submit calibrated meteorological or geological station telemetry"
      >
        <form onSubmit={handleIngestSubmit} className="space-y-4">
          <Select
            label="Sensor Measurement Type"
            value={form.observation_type}
            onChange={(e) => setForm({ ...form, observation_type: e.target.value as ObservationType })}
          >
            <option value="RAINFALL">RAINFALL (mm)</option>
            <option value="RIVER_LEVEL">RIVER_LEVEL (m)</option>
            <option value="TEMPERATURE">TEMPERATURE (°C)</option>
            <option value="WIND_SPEED">WIND_SPEED (km/h)</option>
            <option value="SEISMIC_INTENSITY">SEISMIC_INTENSITY (g)</option>
            <option value="SOIL_MOISTURE">SOIL_MOISTURE (%)</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Observed Numeric Value"
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Measurement Unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              required
            />
          </div>

          <Select
            label="Reporting District"
            value={form.district_id}
            onChange={(e) => setForm({ ...form, district_id: e.target.value })}
          >
            {Object.entries(SEED_DISTRICTS).map(([id, d]) => (
              <option key={id} value={id}>
                {d.name} ({d.state})
              </option>
            ))}
          </Select>

          <Input
            label="Data Provenance / Source Identifier"
            value={form.data_source}
            onChange={(e) => setForm({ ...form, data_source: e.target.value })}
            placeholder="IMD_AWS_RADAR_04"
            required
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsIngestOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={ingestMutation.isPending}>
              Ingest Reading
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
