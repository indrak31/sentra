import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AlertRead } from '../../types';
import { SEED_DISTRICTS } from '../../utils/constants';
import { formatTimeAgo } from '../../utils/formatters';
import { SeverityBadge, HazardBadge } from '../../components/common/StatusBadge';
import { AlertCircle, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LiveIncidentFeedProps {
  alerts: AlertRead[];
  isLoading?: boolean;
}

export const LiveIncidentFeed: React.FC<LiveIncidentFeedProps> = ({ alerts, isLoading }) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>
          <AlertCircle className="w-4 h-4 text-slate-800" />
          <span>Active Incident Stream</span>
        </CardTitle>
        <Link
          to="/alerts"
          className="text-xs text-slate-800 hover:text-slate-900 font-semibold flex items-center gap-1"
        >
          <span>All Alerts</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-100">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Polling active telemetry alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active incident records reported by the backend.
          </div>
        ) : (
          alerts.slice(0, 8).map((alert) => {
            const district = SEED_DISTRICTS[alert.district_id];
            const locName = district ? `${district.name}, ${district.state}` : alert.district_id;

            return (
              <div
                key={alert.id}
                className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={alert.severity} size="sm" />
                    <HazardBadge hazard={alert.hazard_type} size="sm" variant="inline" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{locName}</span>
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(alert.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
