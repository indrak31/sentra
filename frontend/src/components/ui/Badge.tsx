import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'watch' | 'low' | 'info' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className,
}) => {
  const variants = {
    critical: 'bg-rose-50/70 text-rose-700 border-rose-200/80',
    warning: 'bg-amber-50/70 text-amber-800 border-amber-200/80',
    watch: 'bg-sky-50/70 text-sky-700 border-sky-200/80',
    low: 'bg-slate-50 text-slate-600 border-slate-200',
    info: 'bg-blue-50/70 text-blue-700 border-blue-200/80',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
    outline: 'border border-slate-200 text-slate-600 bg-white',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md border',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
};
