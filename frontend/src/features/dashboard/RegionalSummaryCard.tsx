import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { SEED_DISTRICTS } from '../../utils/constants';
import { formatNumber } from '../../utils/formatters';
import { MapPin, Users, Maximize, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RegionalSummaryCardProps {
  alertsCount: number;
  resourcesCount: number;
}

export const RegionalSummaryCard: React.FC<RegionalSummaryCardProps> = ({
  alertsCount,
  resourcesCount,
}) => {
  const { user, assignedDistrictName, assignedStateName } = useAuthStore();

  const districtKey = user?.district_id || 'dist-mh-pu';
  const districtMeta = SEED_DISTRICTS[districtKey] || {
    name: assignedDistrictName || 'Pune',
    state: assignedStateName || 'Maharashtra',
    population: 9429408,
    area_sq_km: 15643,
  };

  return (
    <Card className="relative overflow-hidden border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500" />
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Assigned Region Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-200">
                <MapPin className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-sky-700 uppercase tracking-widest font-mono">
                Primary Assigned Operational Sector
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {districtMeta.name}, <span className="text-slate-500 font-normal">{districtMeta.state}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Administrative focus region configured via authenticated role permissions
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Census Population</span>
              </div>
              <span className="text-base font-bold text-slate-900">
                {formatNumber(districtMeta.population)}
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <Maximize className="w-3.5 h-3.5 text-slate-700" />
                <span>Area Coverage</span>
              </div>
              <span className="text-base font-bold text-slate-900">
                {formatNumber(15643)} km²
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Sector Alerts</span>
              </div>
              <span className="text-base font-bold text-rose-600">
                {alertsCount} Active
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fleet Standby</span>
              </div>
              <span className="text-base font-bold text-emerald-600">
                {resourcesCount} Units
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
