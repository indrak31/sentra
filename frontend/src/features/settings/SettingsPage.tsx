import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Radio,
  Bell,
  Layers,
  Database,
  CheckCircle2,
  Save,
  ArrowRight,
  Sliders,
  Globe,
  Volume2,
  VolumeX,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [pollingInterval, setPollingInterval] = useState('15s');
  const [autoRunoffModel, setAutoRunoffModel] = useState(true);
  const [dopplerSmoothing, setDopplerSmoothing] = useState(true);
  const [seismicAutoTrigger, setSeismicAutoTrigger] = useState(true);
  const [criticalAlarm, setCriticalAlarm] = useState(true);
  const [autoEvacDraft, setAutoEvacDraft] = useState(false);
  const [defaultBasemap, setDefaultBasemap] = useState('light');
  const [polygonOpacity, setPolygonOpacity] = useState(70);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isAdmin = user?.roles?.some(
    (r) => r.name === 'ADMINISTRATOR' || (r as any).code === 'ADMIN'
  );

  return (
    <div className="space-y-6 max-w-7xl font-sans antialiased">
      <PageHeader
        eyebrow="SYSTEM CONFIGURATION"
        title="Settings & Operator Preferences"
        subtitle="Configure telemetry streaming intervals, geospatial display layers, notification alerts, and command station parameters."
        actions={
          isSaved ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Preferences saved successfully</span>
            </div>
          ) : undefined
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Grid 1: Operator Profile & Command Jurisdiction */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Active Operator Profile */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Operator Clearance</h3>
                <p className="text-[11px] text-slate-500">Active session identity</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operator Name</span>
                <span className="font-bold text-[#0F172A] text-sm">
                  {user?.full_name || 'Alex Carter'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Identifier</span>
                <span className="font-mono text-slate-700">
                  {user?.email || 'alex.carter@sentra.gov.in'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Role</span>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[#0F172A] font-semibold text-xs border border-slate-200">
                  <Shield className="w-3.5 h-3.5 text-slate-700" />
                  <span>{user?.roles?.[0]?.name || 'Operations Analyst (Clearance IV)'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Command Station</span>
                <span className="font-semibold text-slate-700">India National Command HQ</span>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="w-full mt-2 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open User &amp; Role Management</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Telemetry Ingestion & AI Model Pipelines */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Telemetry &amp; Ingestion</h3>
                <p className="text-[11px] text-slate-500">Sensor sampling &amp; ML inference</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Sensor Polling Interval
                </label>
                <select
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="5s">5 seconds (High Frequency / Incident Mode)</option>
                  <option value="15s">15 seconds (Real-Time Recommended)</option>
                  <option value="30s">30 seconds (Standard Operational)</option>
                  <option value="60s">60 seconds (Low Bandwidth Satellite)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-semibold text-slate-900">Hydro-Runoff ML Forecasting</p>
                  <p className="text-[11px] text-slate-500">Continuous wave crest prediction</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoRunoffModel}
                  onChange={(e) => setAutoRunoffModel(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Doppler Radar Velocity Smoothing</p>
                  <p className="text-[11px] text-slate-500">Kalman-filter squall gust tracks</p>
                </div>
                <input
                  type="checkbox"
                  checked={dopplerSmoothing}
                  onChange={(e) => setDopplerSmoothing(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Seismic Trigger (M4.5+)</p>
                  <p className="text-[11px] text-slate-500">Auto-generate NCS ShakeMap</p>
                </div>
                <input
                  type="checkbox"
                  checked={seismicAutoTrigger}
                  onChange={(e) => setSeismicAutoTrigger(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Alert & Notification Dispatch */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">Alert Dispatch Rules</h3>
                <p className="text-[11px] text-slate-500">Audible chimes &amp; auto-drafting</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Critical Incident Chime</p>
                  <p className="text-[11px] text-slate-500">Play audio chime on Flash Flood &amp; Cyclone</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCriticalAlarm((p) => !p)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    criticalAlarm
                      ? 'bg-slate-100 border-slate-300 text-slate-900'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                >
                  {criticalAlarm ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-semibold text-slate-900">Auto-Draft CAP Evacuation Alert</p>
                  <p className="text-[11px] text-slate-500">Draft broadcast when HFL exceeded by &gt;1.5m</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoEvacDraft}
                  onChange={(e) => setAutoEvacDraft(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Default Basemap Layer
                </label>
                <select
                  value={defaultBasemap}
                  onChange={(e) => setDefaultBasemap(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="light">CartoDB Positron (High Contrast Light)</option>
                  <option value="osm">OpenStreetMap Standard</option>
                  <option value="satellite">High-Res Satellite Imagery</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Hazard Inundation Polygon Opacity
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">{polygonOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={polygonOpacity}
                  onChange={(e) => setPolygonOpacity(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Connected Agency Telemetry Pipelines */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Connected Agency Telemetry Pipelines
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real-time national data feeds and API status
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All 5 National Ingest Pipelines Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {[
              {
                agency: 'Central Water Commission (CWC)',
                feed: 'River basin telemetric gauge network (Mahanadi, Brahmaputra, Periyar)',
                endpoint: 'api.cwc.gov.in/v2/telemetry/gauges',
                latency: '42ms',
                status: 'OPERATIONAL',
              },
              {
                agency: 'India Meteorological Dept (IMD)',
                feed: 'Doppler Weather Radars (Puri, Paradip, Kolkata, Balasore) & AWS grid',
                endpoint: 'radar.imd.gov.in/doppler/stream/v1',
                latency: '68ms',
                status: 'OPERATIONAL',
              },
              {
                agency: 'National Center for Seismology (NCS)',
                feed: 'Strong motion accelerograph arrays & broadband seismic network',
                endpoint: 'seismo.gov.in/realtime/events/v3',
                latency: '34ms',
                status: 'OPERATIONAL',
              },
              {
                agency: 'INCOIS Ocean Buoys',
                feed: 'Bay of Bengal & Arabian Sea DART deep-sea tsunameter buoys',
                endpoint: 'incois.gov.in/dart/telemetry/stream',
                latency: '85ms',
                status: 'OPERATIONAL',
              },
              {
                agency: 'Copernicus Sentinel-1 SAR',
                feed: 'Synthetic Aperture Radar flood extent & high-resolution soil saturation',
                endpoint: 'scihub.copernicus.eu/api/s1/granules',
                latency: '110ms',
                status: 'OPERATIONAL',
              },
              {
                agency: 'NDMA Resource Fleet Matrix',
                feed: 'National Disaster Response Force (NDRF) battalion mobilization',
                endpoint: 'ndma.gov.in/fleet/matrix/realtime',
                latency: '28ms',
                status: 'OPERATIONAL',
              },
            ].map((feed, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#0F172A]">{feed.agency}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      {feed.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{feed.feed}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="truncate max-w-[170px]">{feed.endpoint}</span>
                  <span className="text-slate-600 font-semibold">{feed.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
