import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Radio,
  Truck,
  Cpu,
  PlusCircle,
  Activity,
  ShieldAlert,
  Clock3,
} from 'lucide-react';
import { SystemSummaryReport, HazardModelStatus, AlertRead, ResourceRead } from '../../types';
import { formatDate, formatNumber } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';

interface NationalOverviewPanelProps {
  summary?: SystemSummaryReport;
  alerts: AlertRead[];
  resources: ResourceRead[];
  modelStatuses?: HazardModelStatus[];
  isLoading?: boolean;
}

const StatRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: string;
}> = ({ icon, label, value, hint, tone = 'text-slate-900' }) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2">
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-slate-500">{label}</p>
        {hint && <p className="truncate text-[9px] text-slate-400">{hint}</p>}
      </div>
    </div>
    <span className={`shrink-0 font-mono text-sm font-bold ${tone}`}>{value}</span>
  </div>
);

export const NationalOverviewPanel: React.FC<NationalOverviewPanelProps> = ({
  summary,
  alerts,
  resources,
  modelStatuses,
  isLoading,
}) => {
  const activeAlerts = summary?.total_active_alerts ?? alerts.length;
  const districts = summary?.total_districts ?? 14;
  const observations = summary?.total_observations ?? 0;
  const registeredResources = summary?.total_registered_resources ?? resources.length;
  const states = summary?.total_states ?? 6;
  const assessments = summary?.total_risk_assessments ?? 0;

  const untrainedCount = modelStatuses?.filter(
    (status) => !status.is_available || status.readiness_status === 'NOT_TRAINED'
  ).length;
  const modelsKnown = !!modelStatuses && modelStatuses.length > 0;
  const allUntrained = modelsKnown && untrainedCount === modelStatuses.length;
  const syncClock = summary?.generated_at
    ? new Date(summary.generated_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '—';

  return (
    <div className="sentra-panel sentra-panel-accent overflow-hidden">
      <div className="border-b border-slate-100 px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50">
                <Activity className="h-3.5 w-3.5 text-amber-600" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-wide text-slate-900">India Overview</h2>
                <p className="text-[10px] text-slate-400">National summary</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={isLoading ? 'neutral' : 'info'} size="sm">
              {isLoading ? 'SYNCING' : 'API SYNC'}
            </Badge>
            <span
              className="flex items-center gap-1 font-mono text-[9px] text-slate-400"
              title={formatDate(summary?.generated_at)}
            >
              <Clock3 className="h-2.5 w-2.5" />
              {syncClock}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="grid grid-cols-2 gap-2">
          <StatRow
            icon={<AlertTriangle className="h-3.5 w-3.5 text-rose-600" />}
            label="Active alerts"
            value={activeAlerts}
            tone={activeAlerts > 0 ? 'text-rose-600' : 'text-emerald-600'}
            hint="Backend records"
          />
          <StatRow
            icon={<Building2 className="h-3.5 w-3.5 text-amber-600" />}
            label="Districts"
            value={districts}
            hint={`${states} states / UTs`}
          />
          <StatRow
            icon={<Truck className="h-3.5 w-3.5 text-emerald-600" />}
            label="Resources"
            value={formatNumber(registeredResources)}
            hint="Registered units"
          />
          <StatRow
            icon={<Radio className="h-3.5 w-3.5 text-slate-700" />}
            label="Sensors"
            value={formatNumber(observations)}
            hint="Ingested readings"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-400">
          <span>Risk assessments</span>
          <span className="font-mono text-slate-600">{assessments}</span>
        </div>

        <div
          className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[10px] leading-relaxed ${
            allUntrained
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {modelsKnown
              ? allUntrained
                ? `All ${modelStatuses.length} hazard models are NOT_TRAINED. Model-derived risk is not displayed.`
                : `${modelStatuses.length - (untrainedCount || 0)} of ${modelStatuses.length} hazard models available.`
              : 'Checking hazard model readiness...'}
          </span>
        </div>

        {activeAlerts === 0 && (
          <p className="px-0.5 text-[9px] leading-relaxed text-slate-400">
            No active alerts are currently reported by the backend. Hazard layers remain empty
            rather than displaying illustrative incidents.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            to="/alerts"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-800 transition-colors hover:bg-amber-100"
          >
            <PlusCircle className="h-3 w-3" />
            Broadcast alert
          </Link>
          <Link
            to="/optimization"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-600 transition-colors hover:text-slate-900 hover:bg-slate-50"
          >
            <Cpu className="h-3 w-3 text-amber-600" />
            Run solver
          </Link>
        </div>
      </div>
    </div>
  );
};
