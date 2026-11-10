import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={clsx(
        'group relative overflow-hidden transition-all duration-200 bg-white border border-slate-200/90 shadow-2xs rounded-xl',
        onClick && 'cursor-pointer hover:border-sky-300 hover:shadow-xs'
      )}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {value}
              </span>
              {trend && (
                <span
                  className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded',
                    trend.isPositive
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  )}
                >
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 transition-colors group-hover:bg-slate-100 group-hover:text-slate-900 group-hover:border-slate-200">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
