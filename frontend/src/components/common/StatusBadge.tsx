import React from 'react';
import { AlertSeverityEnum, HazardType, OperationalStatusEnum } from '../../types';
import { HAZARD_CONFIG, SEVERITY_CONFIG } from '../../utils/constants';
import {
  Waves,
  Wind,
  Activity,
  Sun,
  Mountain,
  Anchor,
  Flame,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';

const HAZARD_ICON_MAP: Record<string, LucideIcon> = {
  FLOOD: Waves,
  CYCLONE: Wind,
  EARTHQUAKE: Activity,
  DROUGHT: Sun,
  LANDSLIDE: Mountain,
  TSUNAMI: Anchor,
  HEATWAVE: Flame,
};

interface SeverityBadgeProps {
  severity: AlertSeverityEnum | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const sevKey = (severity?.toUpperCase() || 'LOW') as AlertSeverityEnum;
  const config = SEVERITY_CONFIG[sevKey] || SEVERITY_CONFIG.LOW;

  const colorStyles: Record<AlertSeverityEnum, { bg: string; text: string; border: string; dot: string }> = {
    CRITICAL: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      dot: 'bg-rose-500',
    },
    HIGH: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-800',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
    },
    MODERATE: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-600',
    },
    LOW: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const style = colorStyles[sevKey] || colorStyles.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${style.bg} ${style.text} ${style.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

interface HazardBadgeProps {
  hazard: HazardType | string;
  size?: 'sm' | 'md';
  variant?: 'badge' | 'inline';
}

export const HazardBadge: React.FC<HazardBadgeProps> = ({
  hazard,
  size = 'sm',
  variant = 'badge',
}) => {
  const hazKey = (hazard?.toUpperCase() || 'FLOOD') as HazardType;
  const config = HAZARD_CONFIG[hazKey] || HAZARD_CONFIG.FLOOD;
  const Icon = HAZARD_ICON_MAP[hazKey] || AlertTriangle;

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium text-xs">
        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">{config.name}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-slate-200/90 bg-slate-50 text-slate-700 ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>{config.name}</span>
    </span>
  );
};

interface OperationalBadgeProps {
  status: OperationalStatusEnum | string;
}

export const OperationalBadge: React.FC<OperationalBadgeProps> = ({ status }) => {
  switch (status?.toUpperCase()) {
    case 'OPERATIONAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50/70 text-emerald-700 border border-emerald-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Operational
        </span>
      );
    case 'DEGRADED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50/70 text-amber-800 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Degraded
        </span>
      );
    case 'OFFLINE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50/70 text-rose-700 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Offline
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
          {status || 'Unknown'}
        </span>
      );
  }
};
