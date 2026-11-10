import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200/80 mb-6 ${className}`}>
      <div className="space-y-1.5">
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {eyebrow}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-[-0.03em] leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
          {actions}
        </div>
      )}
    </div>
  );
};
