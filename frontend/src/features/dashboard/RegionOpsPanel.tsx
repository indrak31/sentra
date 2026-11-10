import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Truck,
  AlertTriangle,
  Crosshair,
  ArrowLeft,
  ArrowUpRight,
  Database,
  ShieldAlert,
  Layers3,
} from 'lucide-react';
import { AlertRead, HazardModelStatus, ResourceRead } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useMapStore } from '../../stores/mapStore';
import {
  REGION_DEFAULT_ZOOM,
  SEED_DISTRICTS,
  STATE_DEFAULT_ZOOM,
} from '../../utils/constants';
import { formatNumber } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { HazardBadge, SeverityBadge } from '../../components/common/StatusBadge';
import { clsx } from 'clsx';

interface RegionOpsPanelProps {
  alerts: AlertRead[];
  resources: ResourceRead[];
  modelStatuses?: HazardModelStatus[];
}

const DISTRICT_GROUPS = [
  {
    state: 'Maharashtra',
    ids: ['dist-mh-pu', 'dist-mh-mc', 'dist-mh-rg'],
  },
  {
    state: 'Assam',
    ids: ['dist-as-km', 'dist-as-dh', 'dist-as-ca'],
  },
  {
    state: 'Odisha',
    ids: ['dist-od-pu', 'dist-od-ba'],
  },
  {
    state: 'Kerala',
    ids: ['dist-kl-er', 'dist-kl-wa'],
  },
  {
    state: 'Rajasthan',
    ids: ['dist-rj-jp', 'dist-rj-js'],
  },
  {
    state: 'Uttarakhand',
    ids: ['dist-uk-ch', 'dist-uk-dd'],
  },
];

export const RegionOpsPanel: React.FC<RegionOpsPanelProps> = ({
  alerts,
  resources,
  modelStatuses,
}) => {
  const { user, assignedDistrictName, assignedStateName, assignedCoordinates } = useAuthStore();
  const {
    viewMode,
    selectedDistrictId,
    selectedStateIso,
    selectedStateName,
    selectedStateCenter,
    setViewMode,
    setSelectedDistrictId,
    setSelectedState,
  } = useMapStore();

  const fallbackId =
    user?.district_id && SEED_DISTRICTS[user.district_id] ? user.district_id : 'dist-mh-pu';
  const activeDistrictId = selectedDistrictId || (!selectedStateName ? fallbackId : null);
  const district = activeDistrictId ? SEED_DISTRICTS[activeDistrictId] : null;
  const stateScopeOnly = viewMode === 'REGION' && !!selectedStateName && !activeDistrictId;

  const districtAlerts = useMemo(
    () => (activeDistrictId ? alerts.filter((alert) => alert.district_id === activeDistrictId) : []),
    [alerts, activeDistrictId]
  );
  const districtResources = useMemo(
    () =>
      activeDistrictId
        ? resources.filter((resource) => resource.district_id === activeDistrictId)
        : [],
    [resources, activeDistrictId]
  );

  const untrainedCount = modelStatuses?.filter(
    (status) => !status.is_available || status.readiness_status === 'NOT_TRAINED'
  ).length;
  const allUntrained =
    !!modelStatuses && modelStatuses.length > 0 && untrainedCount === modelStatuses.length;

  const availableResources = districtResources.reduce(
    (total, resource) => total + resource.available_capacity,
    0
  );
  const totalResources = districtResources.reduce(
    (total, resource) => total + resource.total_capacity,
    0
  );

  const openRegion = () => {
    if (district && activeDistrictId) {
      setSelectedDistrictId(activeDistrictId);
      setSelectedState(selectedStateIso || district.stateIso, selectedStateName || district.state);
      setViewMode('REGION', [district.lat, district.lng], REGION_DEFAULT_ZOOM);
    } else if (selectedStateCenter) {
      setViewMode('REGION', selectedStateCenter, STATE_DEFAULT_ZOOM);
    } else {
      setViewMode('REGION', assignedCoordinates, REGION_DEFAULT_ZOOM);
    }
  };

  const handleDistrictChange = (districtId: string) => {
    if (!districtId) {
      setSelectedDistrictId(null);
      return;
    }
    const next = SEED_DISTRICTS[districtId];
    if (!next) return;
    setSelectedDistrictId(districtId);
    setSelectedState(next.stateIso, next.state);
    setViewMode('REGION', [next.lat, next.lng], REGION_DEFAULT_ZOOM);
  };

  const title = district
    ? `${district.name}, ${district.state}`
    : selectedStateName || assignedDistrictName || 'Assigned region';
  const subtitle = district
    ? selectedDistrictId
      ? 'Selected operational district'
      : user?.district_id
      ? 'Assigned sector'
      : 'Default focus district'
    : stateScopeOnly
    ? 'State scope'
    : 'National overview';

  return (
    <div className="sentra-panel sentra-panel-accent overflow-hidden">
      <div className="border-b border-slate-100 px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50">
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
            </span>
            <div>
              <h2 className="text-sm font-bold leading-tight text-slate-900">{title}</h2>
              <p className="text-[10px] text-slate-400">{subtitle}</p>
            </div>
          </div>
          <Badge variant={viewMode === 'REGION' ? 'watch' : 'neutral'} size="sm">
            {viewMode === 'REGION' ? 'REGION' : 'INDIA'}
          </Badge>
        </div>
      </div>

      <div className="space-y-2.5 p-3">
        <select
          value={activeDistrictId || ''}
          onChange={(event) => handleDistrictChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-medium text-slate-700 outline-none transition-colors focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20"
        >
          <option value="">State scope — select a district</option>
          {DISTRICT_GROUPS.map((group) => (
            <optgroup key={group.state} label={group.state}>
              {group.ids.map((id) => {
                const item = SEED_DISTRICTS[id];
                if (!item) return null;
                return (
                  <option key={id} value={id}>
                    {item.name}
                  </option>
                );
              })}
            </optgroup>
          ))}
        </select>

        {district ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-400">
                  <Users className="h-3 w-3 text-amber-600" />
                  Reference population
                </div>
                <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                  {formatNumber(district.population)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-400">
                  <Truck className="h-3 w-3 text-emerald-600" />
                  Registered fleet
                </div>
                <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                  {districtResources.length}
                  <span className="ml-1 text-[10px] font-normal text-slate-400">units</span>
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-400">
                  <AlertTriangle className="h-3 w-3 text-rose-600" />
                  Active alerts
                </div>
                <p
                  className={clsx(
                    'mt-1 font-mono text-sm font-bold',
                    districtAlerts.length > 0 ? 'text-rose-600' : 'text-emerald-600'
                  )}
                >
                  {districtAlerts.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-400">
                  <Crosshair className="h-3 w-3 text-slate-700" />
                  Reference point
                </div>
                <p className="mt-1 font-mono text-[10px] font-semibold text-slate-800">
                  {district.lat.toFixed(3)}, {district.lng.toFixed(3)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Layers3 className="h-3 w-3 text-violet-600" />
                District boundary
              </span>
              <span className="font-medium text-emerald-600">ADM2 bundled</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px]">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Database className="h-3 w-3 text-amber-600" />
                Standby capacity
              </span>
              <span className="font-mono text-slate-600">
                {availableResources} / {totalResources}
              </span>
            </div>

            {districtAlerts.length > 0 ? (
              <div className="space-y-1.5">
                {districtAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-medium text-slate-900">
                        {alert.title}
                      </span>
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </div>
                    <div className="mt-1">
                      <HazardBadge hazard={alert.hazard_type} size="sm" variant="inline" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-0.5 text-[9px] text-slate-400">
                No active alert records for this district.
              </p>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] leading-relaxed text-slate-500">
            A state is selected. District boundary geometry is bundled for 14 reference districts
            across {DISTRICT_GROUPS.length} states. Select a supported district for local detail.
          </div>
        )}

        <div
          className={clsx(
            'flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[10px] leading-relaxed',
            allUntrained
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          )}
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {allUntrained
              ? 'Predictive models are NOT_TRAINED. No AI risk score or forecast is presented.'
              : 'Only active backend alerts and registered resources are shown.'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {viewMode === 'REGION' ? (
            <button
              type="button"
              onClick={() => setViewMode('INDIA')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="h-3 w-3" />
              India View
            </button>
          ) : (
            <button
              type="button"
              onClick={openRegion}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-[10px] font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              <Crosshair className="h-3 w-3" />
              Region View
            </button>
          )}
          <Link
            to="/map"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            Full map
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <p className="px-0.5 text-[8px] leading-relaxed text-slate-400">
          Reference coordinates from the SENTRA district dataset. Boundaries © geoBoundaries
          ADM1 (CC BY 2.5 IN) / ADM2 (ODbL 1.0). Population figures are reference values, not live
          census telemetry.
        </p>
      </div>
    </div>
  );
};
