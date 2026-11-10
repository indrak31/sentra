import React, { useState } from 'react';
import { Layers, Check } from 'lucide-react';
import { useMapStore } from '../../stores/mapStore';
import { clsx } from 'clsx';

const LAYERS_LIST: Array<{ key: 'flood' | 'cyclone' | 'earthquake' | 'heatwave' | 'landslide' | 'resources' | 'shelters'; label: string; color: string }> = [
  { key: 'flood', label: 'Floods & Inundation', color: '#0284c7' },
  { key: 'cyclone', label: 'Tropical Cyclones', color: '#0d9488' },
  { key: 'earthquake', label: 'Seismic Activity', color: '#e11d48' },
  { key: 'heatwave', label: 'Extreme Heat', color: '#ea580c' },
  { key: 'landslide', label: 'Landslides', color: '#b45309' },
  { key: 'resources', label: 'Emergency Fleet', color: '#16a34a' },
  { key: 'shelters', label: 'Relief Shelters', color: '#7c3aed' },
];

interface LayerControlPanelProps {
  inline?: boolean;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({ inline = false }) => {
  const [isOpen, setIsOpen] = useState(inline);
  const { activeLayers, toggleLayer } = useMapStore();

  const content = (
    <div
      className={clsx(
        inline
          ? 'space-y-0.5'
          : 'absolute right-0 top-10 w-60 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg p-2.5 z-50 space-y-0.5'
      )}
    >
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1">
        Hazard & operational layers
      </div>
      {LAYERS_LIST.map((layer) => {
        const isActive = activeLayers[layer.key];
        return (
          <button
            key={layer.key}
            type="button"
            onClick={() => toggleLayer(layer.key)}
            className={clsx(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left',
              isActive
                ? 'bg-sky-50 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: layer.color,
                  boxShadow: isActive ? `0 0 6px ${layer.color}66` : 'none',
                  opacity: isActive ? 1 : 0.4,
                }}
              />
              <span>{layer.label}</span>
            </span>
            <span
              className={clsx(
                'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                isActive
                  ? 'border-sky-500 bg-sky-500 text-white'
                  : 'border-slate-300 bg-white text-transparent'
              )}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          </button>
        );
      })}
    </div>
  );

  if (inline) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        {content}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all',
          isOpen
            ? 'bg-[#0F172A] text-white border-[#0F172A]'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        )}
      >
        <Layers className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-slate-700'}`} />
        <span>Map Layers</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {content}
        </>
      )}
    </div>
  );
};
