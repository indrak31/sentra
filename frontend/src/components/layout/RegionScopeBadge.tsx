import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useMapStore } from '../../stores/mapStore';
import { MapPin, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import {
  REGION_DEFAULT_ZOOM,
  SEED_DISTRICTS,
  STATE_DEFAULT_ZOOM,
} from '../../utils/constants';

export const RegionScopeBadge: React.FC = () => {
  const { user, assignedDistrictName, assignedStateName, assignedCoordinates } = useAuthStore();
  const {
    viewMode,
    selectedDistrictId,
    selectedStateName,
    selectedStateCenter,
    setViewMode,
    setSelectedDistrictId,
    setSelectedState,
  } = useMapStore();

  const selectedDistrict = selectedDistrictId ? SEED_DISTRICTS[selectedDistrictId] : null;
  const districtLabel = selectedDistrict
    ? `${selectedDistrict.name}, ${selectedDistrict.state}`
    : assignedDistrictName
    ? `${assignedDistrictName}, ${assignedStateName || 'India'}`
    : null;
  const regionLabel = selectedDistrict
    ? `${selectedDistrict.name}, ${selectedDistrict.state}`
    : selectedStateName
    ? `${selectedStateName} (State scope)`
    : districtLabel
    ? districtLabel
    : assignedStateName
    ? `${assignedStateName} (State scope)`
    : 'National clearance (All India)';

  const openRegionView = () => {
    if (selectedDistrict) {
      setViewMode('REGION', [selectedDistrict.lat, selectedDistrict.lng], REGION_DEFAULT_ZOOM);
    } else if (selectedStateCenter) {
      setViewMode('REGION', selectedStateCenter, STATE_DEFAULT_ZOOM);
    } else if (assignedCoordinates) {
      setViewMode('REGION', assignedCoordinates, REGION_DEFAULT_ZOOM);
    } else {
      const fallback = SEED_DISTRICTS['dist-mh-pu'];
      setSelectedDistrictId('dist-mh-pu');
      setSelectedState(fallback.stateIso, fallback.state);
      setViewMode('REGION', [fallback.lat, fallback.lng], REGION_DEFAULT_ZOOM);
    }
  };

  const isNational = !user?.district_id && !user?.state_id;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs text-xs">
        <MapPin className="w-3.5 h-3.5 text-slate-800 shrink-0" />
        <span className="text-slate-400 font-medium hidden md:inline">
          {selectedDistrict || selectedStateName
            ? 'Selected:'
            : isNational
            ? 'Scope:'
            : 'Assigned:'}
        </span>
        <span className="text-slate-800 font-bold tracking-tight truncate max-w-[180px]">
          {regionLabel}
        </span>
      </div>

      <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold">
        <button
          type="button"
          onClick={openRegionView}
          className={clsx(
            'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5',
            viewMode === 'REGION'
              ? 'bg-white text-sky-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
          title="Focus on the selected or assigned administrative region"
        >
          <MapPin className="w-3 h-3" />
          <span className="hidden sm:inline">Region View</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('INDIA')}
          className={clsx(
            'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5',
            viewMode === 'INDIA'
              ? 'bg-white text-sky-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          )}
          title="Expand view to nationwide India"
        >
          <Globe className="w-3 h-3" />
          <span className="hidden sm:inline">India View</span>
        </button>
      </div>
    </div>
  );
};
