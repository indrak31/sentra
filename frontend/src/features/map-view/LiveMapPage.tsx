import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../../api/alerts.api';
import { resourcesApi } from '../../api/resources.api';
import { IndiaMap } from '../../components/map/IndiaMap';
import { PageHeader } from '../../components/common/PageHeader';
import { Select } from '../../components/ui/Select';
import { SEED_DISTRICTS, REGION_DEFAULT_ZOOM } from '../../utils/constants';
import { useMapStore } from '../../stores/mapStore';
import { MapPin, Globe2, Database, Layers3, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export const LiveMapPage: React.FC = () => {
  const {
    viewMode,
    selectedDistrictId,
    setViewMode,
    setSelectedDistrictId,
    setSelectedState,
  } = useMapStore();

  const { data: alertsData } = useQuery({
    queryKey: ['live-map-alerts'],
    queryFn: () => alertsApi.getAlerts({ page_size: 100 }),
    refetchInterval: 15000,
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['live-map-resources'],
    queryFn: () => resourcesApi.getResources({ page_size: 100 }),
    refetchInterval: 30000,
  });

  const alerts = alertsData?.items || [];
  const resources = resourcesData?.items || [];

  const selectedDistrict = selectedDistrictId ? SEED_DISTRICTS[selectedDistrictId] : null;
  const districtAlerts = selectedDistrictId
    ? alerts.filter((alert) => alert.district_id === selectedDistrictId)
    : [];
  const districtResources = selectedDistrictId
    ? resources.filter((resource) => resource.district_id === selectedDistrictId)
    : [];

  const handleDistrictChange = (districtId: string) => {
    if (districtId === 'all') {
      setSelectedDistrictId(null);
      setSelectedState(null, null, null);
      setViewMode('INDIA');
      return;
    }

    const district = SEED_DISTRICTS[districtId];
    if (!district) return;

    setSelectedDistrictId(districtId);
    setSelectedState(district.stateIso, district.state);
    setViewMode('REGION', [district.lat, district.lng], REGION_DEFAULT_ZOOM);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="GEOSPATIAL SITUATIONAL AWARENESS"
        title="Geospatial Command Center"
        subtitle="Interactive unified multi-layer GIS vector canvas with real-time district telemetry overlays and vulnerability envelopes."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('INDIA')}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  viewMode === 'INDIA'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <Globe2 className="w-3.5 h-3.5" />
                India
              </button>
              <button
                type="button"
                onClick={() =>
                  selectedDistrict
                    ? setViewMode(
                        'REGION',
                        [selectedDistrict.lat, selectedDistrict.lng],
                        REGION_DEFAULT_ZOOM
                      )
                    : handleDistrictChange('dist-od-pu')
                }
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  viewMode === 'REGION'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                Region
              </button>
            </div>

            <div className="w-64">
              <Select
                value={selectedDistrictId || 'all'}
                onChange={(event) => handleDistrictChange(event.target.value)}
              >
                <option value="all">All India Overview</option>
                <optgroup label="Odisha">
                  <option value="dist-od-pu">Puri (Active Coastal Arc)</option>
                  <option value="dist-od-ba">Balasore</option>
                </optgroup>
                <optgroup label="Maharashtra">
                  <option value="dist-mh-pu">Pune (Assigned Sector)</option>
                  <option value="dist-mh-mc">Mumbai City</option>
                  <option value="dist-mh-rg">Raigad</option>
                </optgroup>
                <optgroup label="Assam">
                  <option value="dist-as-km">Kamrup Metropolitan</option>
                  <option value="dist-as-dh">Dhubri</option>
                  <option value="dist-as-ca">Cachar</option>
                </optgroup>
                <optgroup label="Kerala">
                  <option value="dist-kl-er">Ernakulam</option>
                  <option value="dist-kl-wa">Wayanad</option>
                </optgroup>
                <optgroup label="Rajasthan">
                  <option value="dist-rj-jp">Jaipur</option>
                  <option value="dist-rj-js">Jaisalmer</option>
                </optgroup>
                <optgroup label="Uttarakhand">
                  <option value="dist-uk-ch">Chamoli</option>
                  <option value="dist-uk-dd">Dehradun</option>
                </optgroup>
              </Select>
            </div>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-2xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-slate-900">
            <Layers3 className="w-4 h-4 text-sky-600" />
            {selectedDistrict
              ? `${selectedDistrict.name}, ${selectedDistrict.state}`
              : viewMode === 'REGION'
              ? 'Assigned Regional Sector'
              : 'National Overview'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Database className="w-3.5 h-3.5 text-sky-500" />
            {viewMode === 'REGION'
              ? `${districtAlerts.length} active alerts · ${districtResources.length} registered resources`
              : `${alerts.length} active alerts · ${resources.length} registered resources`}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          {viewMode === 'REGION'
            ? 'OpenFreeMap Vector Tiles · geoBoundaries ADM2'
            : 'EOX Sentinel-2 Mosaic · geoBoundaries ADM1'}
        </div>
      </div>

      <div className="relative rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-[#e2ecf5]">
        <IndiaMap
          alerts={alerts}
          resources={resources}
          height="calc(100vh - 16.5rem)"
          className="min-h-[580px]"
        />
      </div>
    </div>
  );
};

export default LiveMapPage;
