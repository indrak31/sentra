import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';
import { HAZARD_CONFIG } from '../../utils/constants';
import type { MapViewMode } from '../../stores/mapStore';

interface MapLegendProps {
  viewMode?: MapViewMode;
}

const LEGEND_HAZARDS = [
  { key: 'FLOOD', label: 'Flood' },
  { key: 'CYCLONE', label: 'Cyclone' },
  { key: 'EARTHQUAKE', label: 'Seismic' },
  { key: 'HEATWAVE', label: 'Heat' },
  { key: 'LANDSLIDE', label: 'Landslide' },
] as const;

export const MapLegend: React.FC<MapLegendProps> = ({ viewMode = 'INDIA' }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-lg text-xs overflow-hidden transition-all">
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-3 py-1.5 bg-slate-50/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100 text-slate-600 border-b border-slate-100"
      >
        <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-800">
          <Info className="w-3.5 h-3.5 text-slate-800" />
          <span>Map Legend &amp; Sources</span>
        </div>
        {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2.5 w-[230px]">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Hazard layers
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {LEGEND_HAZARDS.map((hazard) => (
                <div key={hazard.key} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: HAZARD_CONFIG[hazard.key].color }}
                  />
                  <span className="text-slate-700 font-medium truncate">{hazard.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Severity Halo
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Critical</span>
              <span className="w-2 h-2 rounded-full bg-orange-500 ml-1" />
              <span>High</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" />
              <span>Moderate</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Active Basemap
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {viewMode === 'REGION'
                ? 'OpenFreeMap Vector Tiles · OpenStreetMap © Contributors'
                : 'EOX Sentinel-2 Cloudless · geoBoundaries ADM1'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
