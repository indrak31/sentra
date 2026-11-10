import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, children, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-[11px] font-bold text-slate-500 tracking-wider uppercase">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={clsx(
            'w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-lg px-3 py-2 transition-all shadow-2xs',
            'focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20',
            'disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
