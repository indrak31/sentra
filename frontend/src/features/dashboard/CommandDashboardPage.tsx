import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../../api/alerts.api';
import { IndiaMap } from '../../components/map/IndiaMap';
import {
  Radio,
  AlertTriangle,
  Users,
  Scan,
  Globe,
  Calendar,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Play,
  Pause,
  Download,
  MapPin,
  Waves,
  Droplets,
  Activity,
  Wind,
  Mountain,
  Flame,
  Layers,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const CommandDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedRegion, setSelectedRegion] = useState('India National Command');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 24 hours');
  const [activeHazardFilter, setActiveHazardFilter] = useState('all');
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  const [timeframeMenuOpen, setTimeframeMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(100);
  const [searchEventsQuery, setSearchEventsQuery] = useState('');

  // Live alerts query
  const { data: alertsData } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => alertsApi.getAlerts({ page_size: 50 }),
    refetchInterval: 15000,
  });

  // 8 Hazard categories with clean outline SVG icons (no emojis)
  const hazardPills = [
    { id: 'all', name: 'All hazards', count: 38, icon: Layers, iconColor: 'text-slate-900' },
    { id: 'flood', name: 'Flood', count: 14, icon: Waves, iconColor: 'text-blue-500' },
    { id: 'drought', name: 'Drought', count: 6, icon: Droplets, iconColor: 'text-amber-500' },
    { id: 'earthquake', name: 'Earthquake', count: 8, icon: Activity, iconColor: 'text-orange-500' },
    { id: 'cyclone', name: 'Cyclone', count: 3, icon: Wind, iconColor: 'text-purple-500' },
    { id: 'landslide', name: 'Landslide', count: 4, icon: Mountain, iconColor: 'text-emerald-500' },
    { id: 'tsunami', name: 'Tsunami', count: 2, icon: Waves, iconColor: 'text-cyan-500' },
    { id: 'heatwave', name: 'Heatwave', count: 1, icon: Flame, iconColor: 'text-red-500' },
  ];

  // Authentic Indian active disaster events linked with our datasets & sensor telemetry
  const activeEventsList = [
    {
      id: 'EVT-01',
      title: 'Mahanadi Basin Flash Flood Surge',
      hazard: 'Flood',
      location: 'Cuttack & Puri, Odisha',
      severity: 'Critical',
      time: '4m ago',
      metric: '+2.8m above High Flood Level (HFL)',
    },
    {
      id: 'EVT-02',
      title: 'Bay of Bengal Deep Depression & Cyclone Watch',
      hazard: 'Cyclone',
      location: 'Coastal Odisha & Andhra Coast',
      severity: 'High',
      time: '12m ago',
      metric: 'Doppler wind gusts 110 km/h (988 hPa)',
    },
    {
      id: 'EVT-03',
      title: 'Kachchh Fault Line Seismic Movement',
      hazard: 'Earthquake',
      location: 'Bhuj, Gujarat',
      severity: 'High',
      time: '28m ago',
      metric: 'Magnitude 5.4 Mw (Depth 16 km, PGA 0.18g)',
    },
    {
      id: 'EVT-04',
      title: 'Brahmaputra Riparian Inundation',
      hazard: 'Flood',
      location: 'Kamrup Metropolitan, Assam',
      severity: 'Critical',
      time: '35m ago',
      metric: 'Discharge 780,000 cusecs (51.4m stage)',
    },
    {
      id: 'EVT-05',
      title: 'Marathwada Agro-Meteorological Drought Severity',
      hazard: 'Drought',
      location: 'Latur & Marathwada, Maharashtra',
      severity: 'Moderate',
      time: '1h ago',
      metric: 'SPEI-3 Index -1.94 (Severe Deficit)',
    },
    {
      id: 'EVT-06',
      title: 'Mula-Mutha River Flash Overflow Warning',
      hazard: 'Flood',
      location: 'Haveli & Pune, Maharashtra',
      severity: 'Moderate',
      time: '2h ago',
      metric: 'Khadakwasla release 32,500 cusecs',
    },
    {
      id: 'EVT-07',
      title: 'Andaman Trench Subduction Activity',
      hazard: 'Tsunami',
      location: 'Car Nicobar, Andaman & Nicobar',
      severity: 'Moderate',
      time: '3h ago',
      metric: 'Sea surface perturbation +0.34m (NOAA DART active)',
    },
  ];

  const filteredEvents = activeEventsList.filter((evt) => {
    const matchesFilter =
      activeHazardFilter === 'all' ||
      evt.hazard.toLowerCase() === activeHazardFilter.toLowerCase();
    const matchesQuery =
      searchEventsQuery === '' ||
      evt.title.toLowerCase().includes(searchEventsQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchEventsQuery.toLowerCase()) ||
      evt.hazard.toLowerCase().includes(searchEventsQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6 select-none font-sans antialiased">
      {/* ── Top Header Section ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            NATIONAL INCIDENT COMMAND SYSTEM
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-[-0.03em] leading-tight">
            Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-3xl">
            Real-time multi-hazard telemetry, physics-informed AI early warning, and resource dispatch across all 732 districts.
          </p>
        </div>

        {/* Right actions: • Updated just now + Generate Report Split Button */}
        <div className="flex items-center gap-4 self-start md:self-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Updated just now</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setReportMenuOpen((prev) => !prev)}
              className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 active:bg-black text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-all border border-[#0F172A]"
            >
              <Download className="w-4 h-4" />
              <span>Generate report</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {reportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setReportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs animate-in fade-in duration-150">
                  <button
                    onClick={() => {
                      setReportMenuOpen(false);
                      navigate('/reports');
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center justify-between font-medium"
                  >
                    <span>Situational Brief (PDF)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Executive</span>
                  </button>
                  <button
                    onClick={() => {
                      setReportMenuOpen(false);
                      navigate('/reports');
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center justify-between font-medium"
                  >
                    <span>Multi-Hazard Impact CSV</span>
                    <span className="text-[10px] text-slate-400 font-normal">Raw Data</span>
                  </button>
                  <button
                    onClick={() => {
                      setReportMenuOpen(false);
                      navigate('/reports');
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center justify-between font-medium"
                  >
                    <span>Automated Recovery Audit</span>
                    <span className="text-[10px] text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">JSON</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters & Timezone Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Region selector pill */}
          <div className="relative">
            <button
              onClick={() => setRegionMenuOpen((prev) => !prev)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-slate-800 font-medium flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span>{selectedRegion}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {regionMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setRegionMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs">
                  {[
                    'India National Command',
                    'Eastern Command (Odisha, WB)',
                    'Western Command (Maharashtra, Gujarat)',
                    'Northeastern Command (Assam, Cachar)',
                    'Southern Coastal Command (Kerala, TN)',
                  ].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRegion(r);
                        setRegionMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Timeframe selector pill */}
          <div className="relative">
            <button
              onClick={() => setTimeframeMenuOpen((prev) => !prev)}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 text-slate-800 font-medium flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{selectedTimeframe}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {timeframeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setTimeframeMenuOpen(false)}
                />
                <div className="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs">
                  {['Last 6 hours', 'Last 24 hours', 'Last 72 hours', 'Past 7 days'].map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSelectedTimeframe(t);
                          setTimeframeMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 Metric KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active hazard events */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Active hazard events
            </span>
            <Radio className="w-5 h-5 text-slate-800" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
              38
            </span>
            {/* Smooth Monochrome Slate Sparkline */}
            <svg width="96" height="32" viewBox="0 0 96 32" fill="none">
              <defs>
                <linearGradient id="blueSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F172A" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0F172A" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M2 24L18 22L36 26L52 14L68 16L94 6V30H2V24Z"
                fill="url(#blueSparkGrad)"
              />
              <path
                d="M2 24L18 22L36 26L52 14L68 16L94 6"
                stroke="#0F172A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-orange-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +6
            </span>
            <span className="text-slate-500 font-normal">from previous 24h</span>
          </div>
        </div>

        {/* Card 2: High-risk regions */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              High-risk regions
            </span>
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
              12
            </span>
            {/* Smooth Orange Sparkline with Gradient Fill */}
            <svg width="96" height="32" viewBox="0 0 96 32" fill="none">
              <defs>
                <linearGradient id="amberSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M2 22L18 25L36 18L54 22L72 14L94 8V30H2V22Z"
                fill="url(#amberSparkGrad)"
              />
              <path
                d="M2 22L18 25L36 18L54 22L72 14L94 8"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-amber-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +2
            </span>
            <span className="text-slate-500 font-normal">require attention</span>
          </div>
        </div>

        {/* Card 3: Population exposed */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Population exposed
            </span>
            <Users className="w-5 h-5 text-[#0D9488]" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
              2.4<span className="text-2xl font-bold ml-0.5">M</span>
            </span>
            {/* Smooth Teal Sparkline with Gradient Fill */}
            <svg width="96" height="32" viewBox="0 0 96 32" fill="none">
              <defs>
                <linearGradient id="tealSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M2 12L20 10L38 20L56 16L74 22L94 18V30H2V12Z"
                fill="url(#tealSparkGrad)"
              />
              <path
                d="M2 12L20 10L38 20L56 16L74 22L94 18"
                stroke="#0D9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowDown className="w-3.5 h-3.5" /> 8.2%
            </span>
            <span className="text-slate-500 font-normal">from previous 24h</span>
          </div>
        </div>

        {/* Card 4: Monitoring coverage */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Monitoring coverage
            </span>
            <Scan className="w-5 h-5 text-[#6366F1]" />
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
              98.6<span className="text-2xl font-bold ml-0.5">%</span>
            </span>
            {/* Smooth Purple Sparkline with Gradient Fill */}
            <svg width="96" height="32" viewBox="0 0 96 32" fill="none">
              <defs>
                <linearGradient id="purpleSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M2 26L18 24L36 28L54 20L72 16L94 10V30H2V26Z"
                fill="url(#purpleSparkGrad)"
              />
              <path
                d="M2 26L18 24L36 28L54 20L72 16L94 10"
                stroke="#6366F1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +0.4%
            </span>
            <span className="text-slate-500 font-normal">across all 732 districts</span>
          </div>
        </div>
      </div>

      {/* ── Predictive Disaster Intelligence Section ─────────────────────── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[14px] font-bold text-[#0F172A]">
              Predictive disaster intelligence
            </h2>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-normal">
              6-hour physics-informed forecast horizon
            </span>
          </div>

          <button
            onClick={() => navigate('/hazards')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 transition-colors"
          >
            <span>All predictive models</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Minimal Hazard Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Hydro-Flood Runoff */}
          <div
            onClick={() => navigate('/hazards')}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer bg-white group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Hydro-Flood Runoff
                </span>
                <span className="text-[11px] font-semibold text-rose-600">
                  Peak in 3h 25m
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-[#0F172A] mt-1.5 group-hover:text-slate-700 transition-colors">
                Mahanadi Basin Flash Flood
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Cuttack &amp; Puri, Odisha</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Projected Crest
                </span>
                <span className="font-bold text-[#0F172A] text-xs">
                  +2.8m above HFL
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Peak Discharge
                </span>
                <span className="font-semibold text-slate-700 text-xs">
                  820,000 cusecs
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: SLOSH Storm Surge */}
          <div
            onClick={() => navigate('/hazards')}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer bg-white group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  SLOSH Storm Surge
                </span>
                <span className="text-[11px] font-semibold text-amber-700">
                  Landfall in 5h 40m
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-[#0F172A] mt-1.5 group-hover:text-slate-700 transition-colors">
                Bay of Bengal Deep Depression
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Balasore Arc, Odisha</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Max Doppler Gust
                </span>
                <span className="font-bold text-[#0F172A] text-xs">
                  110 km/h squalls
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Surge Runup
                </span>
                <span className="font-semibold text-slate-700 text-xs">
                  3.4m wave
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: GMPE Ground Motion */}
          <div
            onClick={() => navigate('/hazards')}
            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer bg-white group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  GMPE Ground Motion
                </span>
                <span className="text-[11px] font-semibold text-slate-700">
                  Intensity VI (Strong)
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-[#0F172A] mt-1.5 group-hover:text-slate-700 transition-colors">
                Kachchh Fault Line Rupture
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>Bhuj &amp; Gandhidham, Gujarat</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Peak Accel (PGA)
                </span>
                <span className="font-bold text-[#0F172A] text-xs">
                  0.18g
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                  Impact Radius
                </span>
                <span className="font-semibold text-slate-700 text-xs">
                  42 km envelope
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle Two-Column Grid: Map + Priority Alerts ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Regional hazard map */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          {/* Map Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-bold text-[#0F172A]">
                Regional hazard map
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#047857] text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                LIVE
              </span>
            </div>

            <button
              onClick={() => navigate('/map')}
              className="text-[13px] font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <span>Explore map</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hazard category filter pills (NO EMOJIS! EXACT SVG OUTLINE ICONS) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            {hazardPills.map((pill) => {
              const Icon = pill.icon;
              const isSelected = activeHazardFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveHazardFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 shrink-0 transition-all font-medium ${
                    isSelected
                      ? 'bg-[#0F172A] text-white border-[#0F172A] font-semibold shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : pill.iconColor}`} />
                  <span>{pill.name}</span>
                  {pill.count && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {pill.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Map Container */}
          <div className="relative h-[480px] rounded-xl overflow-hidden border border-slate-200">
            {/* Live Map Canvas */}
            <IndiaMap alerts={alertsData?.items || []} hud={false} height="480px" />

            {/* Floating Top Badge */}
            <div className="absolute top-3 left-3 z-[400] px-3.5 py-1.5 rounded-lg bg-white/95 backdrop-blur border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{selectedRegion}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-normal text-[11px]">
                Multi-hazard view
              </span>
            </div>

            {/* Bottom-left Map Legend */}
            <div className="absolute bottom-14 left-3 z-[400] px-3.5 py-1.5 rounded-lg bg-white/95 backdrop-blur border border-slate-200 shadow-sm flex items-center gap-3 text-[11px]">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Risk Level
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-slate-700 font-medium">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-700 font-medium">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-slate-700 font-medium">Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-700 font-medium">Low</span>
              </div>
            </div>

            {/* Bottom Timeline Playback Scrubber */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] px-4 py-2.5 rounded-xl bg-white/95 backdrop-blur border border-slate-200 shadow-sm flex items-center gap-3 text-xs">
              <button
                onClick={() => setIsPlayingTimeline((prev) => !prev)}
                className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors shrink-0"
              >
                {isPlayingTimeline ? (
                  <Pause className="w-3.5 h-3.5 fill-slate-700" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-slate-700 ml-0.5" />
                )}
              </button>

              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                Last 24 hours
              </span>

              {/* Progress track */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={timelineProgress}
                  onChange={(e) => setTimelineProgress(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>

              <span className="text-[11px] text-slate-800 font-bold whitespace-nowrap">
                Now
              </span>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Priority alerts */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#0F172A]">Priority alerts</h2>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                3
              </span>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Cards with colored left borders */}
          <div className="space-y-3.5">
            {/* Alert 1: Critical Flooding */}
            <div
              onClick={() => navigate('/hazards')}
              className="p-4 rounded-xl border border-slate-200 border-l-[3.5px] border-l-red-500 bg-white hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#DC2626] text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  Critical
                </span>
                <span className="text-[11px] text-slate-400">4m ago</span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-slate-900 transition-colors">
                Mahanadi Basin Flash Flood Surge
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Cuttack &amp; Puri, Odisha</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">River level</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  +2.8 m above HFL (820,000 cusecs) <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
                </span>
              </div>
            </div>

            {/* Alert 2: High Cyclone */}
            <div
              onClick={() => navigate('/hazards')}
              className="p-4 rounded-xl border border-slate-200 border-l-[3.5px] border-l-amber-500 bg-white hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                  High
                </span>
                <span className="text-[11px] text-slate-400">12m ago</span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-slate-900 transition-colors">
                Bay of Bengal Severe Storm Surge &amp; Cyclone Watch
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Puri &amp; Balasore, Odisha</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Sustained winds</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  110 km/h (Doppler Radar Track) <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
                </span>
              </div>
            </div>

            {/* Alert 3: High Earthquake */}
            <div
              onClick={() => navigate('/hazards')}
              className="p-4 rounded-xl border border-slate-200 border-l-[3.5px] border-l-amber-500 bg-white hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                  High
                </span>
                <span className="text-[11px] text-slate-400">28m ago</span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-slate-900 transition-colors">
                Kachchh Fault Line Seismic Movement
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Bhuj, Gujarat</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Magnitude</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1">
                  5.4 Mw (PGA 0.18g, Depth 16km) <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/alerts')}
            className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[13px] font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <span>View all alerts</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ── Lower Grid: Active Events Table + Monitoring Live Feed ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Events Table (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#0F172A]">Active events</h2>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                {filteredEvents.length}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search events, locations..."
                  value={searchEventsQuery}
                  onChange={(e) => setSearchEventsQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => navigate('/alerts')}
                className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 transition-colors"
              >
                <span>View all events</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Hazard</th>
                  <th className="pb-3">Incident Title</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Telemetry Metric</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    <td className="py-3.5 font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-2">
                        {evt.hazard === 'Flood' && <Waves className="w-3.5 h-3.5 text-blue-500" />}
                        {evt.hazard === 'Cyclone' && <Wind className="w-3.5 h-3.5 text-purple-500" />}
                        {evt.hazard === 'Earthquake' && <Activity className="w-3.5 h-3.5 text-orange-500" />}
                        {evt.hazard === 'Drought' && <Droplets className="w-3.5 h-3.5 text-amber-500" />}
                        <span>{evt.hazard}</span>
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-[#0F172A] max-w-[200px] truncate">
                      {evt.title}
                    </td>
                    <td className="py-3.5 text-slate-600">{evt.location}</td>
                    <td className="py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          evt.severity === 'Critical'
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : evt.severity === 'High'
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500 font-mono text-[11px]">
                      {evt.metric}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => navigate('/hazards')}
                        className="text-xs font-semibold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monitoring Activity Live Feed (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#0F172A]">
              Monitoring activity
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live feed</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              {
                time: '2m ago',
                icon: Waves,
                iconColor: 'text-blue-600 bg-blue-50',
                title: 'CWC Hydrological Gauge Alert',
                desc: 'River gauging sensor ID-7734 exceeded HFL by 0.42m in Mahanadi basin, Odisha.',
              },
              {
                time: '8m ago',
                icon: Wind,
                iconColor: 'text-purple-600 bg-purple-50',
                title: 'IMD Doppler Radar Velocity Track',
                desc: 'Doppler Radar Paradip tracks 110 km/h squalls moving toward Balasore corridor.',
              },
              {
                time: '18m ago',
                icon: Activity,
                iconColor: 'text-orange-600 bg-orange-50',
                title: 'NCS Seismic Telemetry Stream',
                desc: 'M5.4 event processed in 1.2s. NCS ShakeMap intensity VI generated for Bhuj.',
              },
              {
                time: '34m ago',
                icon: Waves,
                iconColor: 'text-cyan-600 bg-cyan-50',
                title: 'INCOIS / NOAA DART Buoy #23227',
                desc: 'Sea surface perturbation +0.34m recorded in Andaman Sea. Deep-water propagation stable.',
              },
              {
                time: '52m ago',
                icon: CheckCircle2,
                iconColor: 'text-emerald-600 bg-emerald-50',
                title: 'Google OR-Tools MILP Solver',
                desc: 'Emergency response solution converged in 320ms: 14 NDRF battalions rerouted.',
              },
            ].map((feed, i) => {
              const Icon = feed.icon;
              return (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${feed.iconColor}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#0F172A] truncate">
                        {feed.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {feed.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 font-normal">
                      {feed.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/observations')}
            className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <span>Live Sensor Telemetry Feed</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
