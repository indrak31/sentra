import React, { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapContainer,
  Marker,
  Popup,
  Circle,
  GeoJSON,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L, { Layer, PathOptions } from 'leaflet';
import type { Feature, Geometry } from 'geojson';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../stores/mapStore';
import { useAuthStore } from '../../stores/authStore';
import { AlertRead, ResourceRead, ObservationRead, HistoricalEvent } from '../../types';
import { hazardsApi } from '../../api/hazards.api';
import {
  HAZARD_CONFIG,
  HAZARD_LAYER_KEYS,
  INDIA_BOUNDS,
  REGION_DEFAULT_ZOOM,
  RESOURCE_CONFIG,
  SEED_DISTRICTS,
  STATE_DEFAULT_ZOOM,
} from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { SeverityBadge, HazardBadge, OperationalBadge } from '../common/StatusBadge';
import { MapLegend } from './MapLegend';
import { LayerControlPanel } from './LayerControlPanel';
import {
  LocateFixed,
  Maximize2,
  Globe2,
  MapPin,
  Plus,
  Minus,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  IndiaDistrictProperties,
  IndiaStateProperties,
  useIndiaDistricts,
  useIndiaStates,
} from '../../hooks/useGeoBoundaries';

const SATELLITE_TILES =
  'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg';
const MAPLIBRE_DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';

const SEVERITY_RADIUS_KM: Record<string, number> = {
  CRITICAL: 42,
  HIGH: 30,
  MODERATE: 20,
  LOW: 12,
};

const MapViewController: React.FC = () => {
  const map = useMap();
  const { flyToTarget, clearFlyTo } = useMapStore();

  useEffect(() => {
    if (flyToTarget) {
      const [lat, lng, zoom] = flyToTarget;
      map.flyTo([lat, lng], zoom, {
        duration: 1.15,
        easeLinearity: 0.3,
      });
      clearFlyTo();
    }
  }, [flyToTarget, map, clearFlyTo]);

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
};

const FitIndiaController: React.FC<{
  padding: { top: number; right: number; bottom: number; left: number };
}> = ({ padding }) => {
  const map = useMap();
  const { viewMode, clearFlyTo } = useMapStore();
  const { top, right, bottom, left } = padding;
  const paddingKey = `${top}:${right}:${bottom}:${left}`;
  const previousMode = useRef(viewMode);
  const previousPaddingKey = useRef(paddingKey);
  const initialized = useRef(false);

  useEffect(() => {
    if (viewMode !== 'INDIA') {
      previousMode.current = viewMode;
      previousPaddingKey.current = paddingKey;
      return;
    }

    const paddingChanged = previousPaddingKey.current !== paddingKey;
    const shouldFit = !initialized.current || previousMode.current !== 'INDIA' || paddingChanged;
    previousMode.current = viewMode;
    previousPaddingKey.current = paddingKey;
    if (!shouldFit) return;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(INDIA_BOUNDS, {
        paddingTopLeft: [left, top],
        paddingBottomRight: [right, bottom],
        animate: initialized.current,
        duration: 0.9,
        maxZoom: 6,
      });
      clearFlyTo();
      initialized.current = true;
    }, 320);

    return () => window.clearTimeout(timer);
  }, [viewMode, map, top, right, bottom, left, paddingKey, clearFlyTo]);

  return null;
};

const SatelliteBasemap: React.FC = () => (
  <TileLayer
    url={SATELLITE_TILES}
    className="sentra-satellite-tiles"
    maxNativeZoom={12}
    maxZoom={18}
    detectRetina
  />
);

const SatelliteShade: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const pane = map.createPane('sentraSatelliteShade');
    pane.style.zIndex = '250';
    pane.style.pointerEvents = 'none';
    pane.classList.add('sentra-satellite-shade');

    return () => {
      pane.remove();
    };
  }, [map]);

  return null;
};

const OpenFreeMapBasemap: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const basemap = maplibreGL({
      style: MAPLIBRE_DARK_STYLE,
      attributionControl: false,
    } as any);

    basemap.addTo(map);

    return () => {
      map.removeLayer(basemap);
    };
  }, [map]);

  return null;
};

const MapZoomControls: React.FC = () => {
  const map = useMap();

  return (
    <div className="sentra-map-controls">
      <button type="button" onClick={() => map.zoomIn(0.5)} title="Zoom in" aria-label="Zoom in">
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={() => map.zoomOut(0.5)} title="Zoom out" aria-label="Zoom out">
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() =>
          map.fitBounds(INDIA_BOUNDS, { padding: [24, 24], animate: true, maxZoom: 6 })
        }
        title="Fit India"
        aria-label="Fit India"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const RESOURCE_GLYPHS: Record<string, string> = {
  AMBULANCE:
    '<path d="M12 4v16M4 12h16" stroke-width="2.2" stroke-linecap="round"/><rect x="3" y="3" width="18" height="18" rx="4" stroke-width="1.2" opacity="0.55" fill="none"/>',
  HOSPITAL_BED:
    '<path d="M4 17V9m0 4h12a4 4 0 0 1 4 4v3M4 20v-3m16 3v-6" stroke-width="1.8" stroke-linecap="round"/><circle cx="8.5" cy="10" r="1.5" stroke-width="1.4" fill="none"/>',
  MEDICAL_TEAM:
    '<path d="M8 4v5a4 4 0 0 0 8 0V4M8 4h2m4 0h2M12 13v3a4 4 0 0 0 4 4h1" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
  TEMPORARY_SHELTER:
    '<path d="M4 19h16L12 5 4 19Z" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M12 12v7" stroke-width="1.4" stroke-linecap="round"/>',
  RESCUE_TEAM:
    '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" stroke-width="1.7" fill="none"/><path d="M9 12h6M12 9v6" stroke-width="1.5" stroke-linecap="round"/>',
  RELIEF_SUPPLY_PACK:
    '<path d="M4 8h16v12H4V8Zm0 0 8-4 8 4M12 4v16" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
};

const createIncidentIcon = (hazardType: string, severity: string) => {
  const color = HAZARD_CONFIG[hazardType as keyof typeof HAZARD_CONFIG]?.color || '#EF4444';
  const isCritical = severity?.toUpperCase() === 'CRITICAL';

  return L.divIcon({
    className: 'custom-radar-marker',
    html: `
      <div class="sentra-incident-marker" style="--hazard-color:${color}">
        ${isCritical ? '<span class="sentra-incident-ping"></span>' : ''}
        <span class="sentra-incident-core"></span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createResourceIcon = (resourceType: string) => {
  const config = RESOURCE_CONFIG[resourceType] || {
    color: '#38BDF8',
    short: 'RES',
    pixelOffset: [0, 0] as [number, number],
  };
  const glyph = RESOURCE_GLYPHS[resourceType] || RESOURCE_GLYPHS.RELIEF_SUPPLY_PACK;
  const [dx, dy] = config.pixelOffset;
  const anchor: [number, number] = [11 - dx, 11 - dy];

  return L.divIcon({
    className: 'custom-resource-marker',
    html: `
      <div class="sentra-resource-marker" style="--resource-color:${config.color}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">${glyph}</svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: anchor,
  });
};

const createRegionPin = (label: string, tone: 'amber' | 'sky' = 'amber') =>
  L.divIcon({
    className: 'sentra-region-marker',
    html: `
      <div class="sentra-region-pin sentra-region-pin--${tone}">
        <span class="sentra-region-pin-dot"></span>
        <span class="sentra-region-pin-label">${label}</span>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });

const HISTORICAL_EVENT_COORDS: Record<string, [number, number]> = {
  'FL-HIST-2023-AS': [26.1445, 91.7362],
  'FL-HIST-2018-KL': [9.9816, 76.2999],
  'FL-HIST-2005-MH': [18.9388, 72.8354],
  'EQ-HIST-2001-GJ': [23.2420, 69.6669],
  'EQ-HIST-1999-UK': [30.4231, 79.3283],
  'EQ-HIST-2011-SK': [27.5330, 88.5122],
  'DR-HIST-2015-MH': [18.4088, 76.5604],
  'DR-HIST-2018-RJ': [26.9157, 70.9083],
  'TS-HIST-2004-IO': [10.7656, 79.8424],
  'TS-HIST-1945-MK': [22.8000, 69.0000],
};

const createHistoricalEventIcon = (hazardType: string) => {
  const color = HAZARD_CONFIG[hazardType as keyof typeof HAZARD_CONFIG]?.color || '#F59E0B';
  return L.divIcon({
    className: 'custom-historical-marker',
    html: `
      <div class="sentra-historical-marker" style="width:24px; height:24px; border-radius:6px; background:#0f172a; border:2px solid ${color}; display:flex; align-items:center; justify-content:center; box-shadow:0 0 8px ${color}80;">
        <span style="font-size:10px; font-weight:800; color:#fff; font-family:monospace;">H</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface IndiaMapProps {
  alerts?: AlertRead[];
  resources?: ResourceRead[];
  observations?: ObservationRead[];
  height?: string;
  className?: string;
  hud?: boolean;
  fitPadding?: { top: number; right: number; bottom: number; left: number };
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  alerts = [],
  resources = [],
  height = '500px',
  className = '',
  hud = true,
  fitPadding = { top: 24, right: 24, bottom: 24, left: 24 },
}) => {
  const {
    center,
    zoom,
    viewMode,
    activeLayers,
    selectedDistrictId,
    selectedStateIso,
    selectedStateName,
    selectedStateCenter,
    setViewMode,
    setSelectedDistrictId,
    setSelectedState,
  } = useMapStore();
  const { assignedCoordinates, assignedDistrictName, assignedStateName } = useAuthStore();

  const statesQuery = useIndiaStates();
  const districtsQuery = useIndiaDistricts();

  const { data: historicalData = [] } = useQuery<HistoricalEvent[]>({
    queryKey: ['historical-events'],
    queryFn: () => hazardsApi.getHistoricalEvents(),
    staleTime: 1000 * 60 * 15,
  });

  const selectedDistrict = selectedDistrictId ? SEED_DISTRICTS[selectedDistrictId] : null;

  const regionCenter: [number, number] | null = selectedDistrict
    ? [selectedDistrict.lat, selectedDistrict.lng]
    : selectedStateCenter || (viewMode === 'REGION' ? assignedCoordinates : null);

  const switchToRegion = () => {
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

  const stateStyle = useMemo(() => {
    return (feature?: Feature<Geometry, IndiaStateProperties>): PathOptions => {
      const name = feature?.properties?.name;
      const isAssigned = !!name && name === assignedStateName;
      const isSelected = !!name && name === selectedStateName;

      if (viewMode === 'REGION') {
        if (isSelected) {
          return {
            color: '#F59E0B',
            weight: 1.5,
            opacity: 0.8,
            fillColor: '#F59E0B',
            fillOpacity: 0.035,
          };
        }
        return {
          color: '#64748B',
          weight: 0.7,
          opacity: 0.25,
          fillColor: '#0F172A',
          fillOpacity: 0.12,
        };
      }

      if (isAssigned) {
        return {
          color: '#F59E0B',
          weight: 1.4,
          opacity: 0.8,
          fillColor: '#F59E0B',
          fillOpacity: 0.06,
        };
      }

      return {
        color: '#B9C9DA',
        weight: 1,
        opacity: 0.62,
        fillColor: '#16212D',
        fillOpacity: 0.035,
      };
    };
  }, [viewMode, assignedStateName, selectedStateName]);

  const handleEachState = (feature: Feature<Geometry, IndiaStateProperties>, layer: Layer) => {
    const props = feature.properties;
    layer.bindTooltip(props.name, {
      sticky: true,
      className: 'sentra-geo-tooltip',
      direction: 'top',
      opacity: 1,
    });

    layer.on({
      mouseover: (event) => {
        const target = event.target as L.Path;
        target.setStyle({ color: '#FBBF24', weight: 1.6, fillOpacity: 0.12 });
        target.bringToFront();
      },
      mouseout: (event) => {
        const target = event.target as L.Path;
        target.setStyle(stateStyle(feature));
      },
      click: () => {
        setSelectedState(props.iso, props.name, props.centroid);
        setSelectedDistrictId(null);
        setViewMode('REGION', props.centroid, STATE_DEFAULT_ZOOM);
      },
    });
  };

  const visibleDistricts = useMemo(() => {
    if (!districtsQuery.data || viewMode !== 'REGION') return null;
    const features = districtsQuery.data.features.filter(
      (feature) => !selectedStateIso || feature.properties.stateIso === selectedStateIso
    );
    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [districtsQuery.data, viewMode, selectedStateIso]);

  const districtStyle = useMemo(() => {
    return (feature?: Feature<Geometry, IndiaDistrictProperties>): PathOptions => {
      const isSelected = feature?.properties.districtId === selectedDistrictId;
      if (isSelected) {
        return {
          color: '#F59E0B',
          weight: 2.2,
          opacity: 0.95,
          fillColor: '#F59E0B',
          fillOpacity: 0.1,
          dashArray: undefined,
        };
      }
      return {
        color: '#94A3B8',
        weight: 0.9,
        opacity: 0.45,
        fillColor: '#111C27',
        fillOpacity: 0.03,
        dashArray: '2 4',
      };
    };
  }, [selectedDistrictId]);

  const handleEachDistrict = (
    feature: Feature<Geometry, IndiaDistrictProperties>,
    layer: Layer
  ) => {
    const props = feature.properties;
    const district = SEED_DISTRICTS[props.districtId];

    layer.bindTooltip(props.name, {
      sticky: true,
      direction: 'top',
      className: 'sentra-geo-tooltip',
      opacity: 1,
    });

    layer.on({
      mouseover: (event) => {
        (event.target as L.Path).setStyle({
          color: '#FBBF24',
          weight: 1.8,
          fillOpacity: 0.1,
        });
      },
      mouseout: (event) => {
        (event.target as L.Path).setStyle(districtStyle(feature));
      },
      click: () => {
        if (!district) return;
        setSelectedState(props.stateIso, props.stateName);
        setSelectedDistrictId(props.districtId);
        setViewMode('REGION', [district.lat, district.lng], REGION_DEFAULT_ZOOM);
      },
    });
  };

  const showAssignedPin =
    !!assignedCoordinates &&
    (!selectedDistrict ||
      assignedCoordinates[0] !== selectedDistrict.lat ||
      assignedCoordinates[1] !== selectedDistrict.lng);

  const sourceLabel =
    viewMode === 'INDIA'
      ? 'Sentinel-2 cloudless 2023 © EOX (CC BY 4.0) · state boundaries © geoBoundaries ADM1 (CC BY 2.5 IN)'
      : 'Basemap © OpenFreeMap / OpenStreetMap · boundaries © geoBoundaries ADM1 (CC BY 2.5 IN) / ADM2 (ODbL 1.0)';

  return (
    <div
      className={`relative w-full overflow-hidden border border-[#243342] shadow-2xl bg-[#05080C] ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3.5}
        maxZoom={18}
        zoomSnap={0.25}
        zoomDelta={0.5}
        scrollWheelZoom
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0 bg-[#05080C]"
      >
        <MapViewController />
        <FitIndiaController padding={fitPadding} />

        {viewMode === 'INDIA' ? <SatelliteBasemap /> : <OpenFreeMapBasemap />}
        {viewMode === 'INDIA' && <SatelliteShade />}

        {statesQuery.data && (
          <GeoJSON
            key={`states-${viewMode}-${selectedStateIso || 'none'}-${assignedStateName || 'none'}`}
            data={statesQuery.data as any}
            style={stateStyle as any}
            onEachFeature={handleEachState as any}
          />
        )}

        {visibleDistricts && (
          <GeoJSON
            key={`districts-${selectedStateIso || 'all'}-${selectedDistrictId || 'none'}`}
            data={visibleDistricts as any}
            style={districtStyle as any}
            onEachFeature={handleEachDistrict as any}
          />
        )}

        {alerts.map((alert) => {
          const district = SEED_DISTRICTS[alert.district_id];
          if (!district) return null;

          const layerKey = HAZARD_LAYER_KEYS[alert.hazard_type];
          if (layerKey && activeLayers[layerKey as keyof typeof activeLayers] === false) {
            return null;
          }

          const hazardColor =
            HAZARD_CONFIG[alert.hazard_type]?.color || HAZARD_CONFIG.FLOOD.color;
          const radiusKm = SEVERITY_RADIUS_KM[alert.severity?.toUpperCase()] || 16;

          return (
            <React.Fragment key={alert.id}>
              <Circle
                center={[district.lat, district.lng]}
                radius={radiusKm * 1000}
                interactive={false}
                className="sentra-hazard-halo"
                pathOptions={{
                  color: hazardColor,
                  fillColor: hazardColor,
                  fillOpacity: 0.16,
                  opacity: 0.4,
                  weight: 1,
                }}
              />
              <Marker
                position={[district.lat, district.lng]}
                icon={createIncidentIcon(alert.hazard_type, alert.severity)}
                zIndexOffset={800}
              >
                <Popup className="sentra-map-popup">
                  <div className="sentra-popup-card">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <HazardBadge hazard={alert.hazard_type} size="sm" />
                      <SeverityBadge severity={alert.severity} size="sm" />
                    </div>
                    <h4 className="text-xs font-bold text-[#E8EEF5] mb-1">{alert.title}</h4>
                    <p className="text-[11px] text-[#91A0B3] line-clamp-3 mb-2">
                      {alert.description}
                    </p>
                    <div className="pt-2 border-t border-[#243342] text-[10px] text-[#5A6E85] flex items-center justify-between gap-2">
                      <span>
                        {district.name}, {district.state}
                      </span>
                      <span>{formatDate(alert.created_at)}</span>
                    </div>
                    <p className="mt-2 text-[9px] leading-relaxed text-[#5A6E85]">
                      Alert location is plotted at the district reference centroid. The halo is a
                      schematic severity indicator, not a modeled hazard extent.
                    </p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {historicalData.map((ev) => {
          const coords = HISTORICAL_EVENT_COORDS[ev.event_id];
          if (!coords) return null;
          const layerKey = HAZARD_LAYER_KEYS[ev.hazard_type];
          if (layerKey && activeLayers[layerKey as keyof typeof activeLayers] === false) {
            return null;
          }

          return (
            <Marker
              key={ev.event_id}
              position={coords}
              icon={createHistoricalEventIcon(ev.hazard_type)}
              zIndexOffset={750}
            >
              <Popup className="sentra-map-popup">
                <div className="sentra-popup-card">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-wider">
                      HISTORICAL BENCHMARK
                    </span>
                    <span className="text-[10px] text-[#91A0B3] font-mono">{ev.event_year}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#E8EEF5] mb-1">{ev.event_name}</h4>
                  <p className="text-[10px] text-[#91A0B3] mb-2">{ev.district_name}, {ev.state_name}</p>
                  <div className="bg-[#090D12] p-2 rounded border border-[#1F2C3A] text-[10px] mb-2">
                    <div className="text-amber-300 font-semibold">
                      {ev.peak_metric_name}: {ev.peak_metric_value} {ev.peak_metric_unit}
                    </div>
                    <div className="text-[#5A6E85] text-[9px] mt-0.5">{ev.data_source}</div>
                  </div>
                  <p className="text-[9px] text-[#5A6E85] italic leading-relaxed">{ev.description}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {resources.map((resource) => {
          const district = SEED_DISTRICTS[resource.district_id];
          if (!district) return null;

          const isShelter = resource.resource_type === 'TEMPORARY_SHELTER';
          if (isShelter && !activeLayers.shelters) return null;
          if (!isShelter && !activeLayers.resources) return null;

          const config = RESOURCE_CONFIG[resource.resource_type] || {
            label: resource.resource_type.replace(/_/g, ' '),
            color: '#38BDF8',
            pixelOffset: [0, 0] as [number, number],
          };

          return (
            <Marker
              key={resource.id}
              position={[district.lat, district.lng]}
              icon={createResourceIcon(resource.resource_type)}
              zIndexOffset={isShelter ? 400 : 500}
            >
              <Popup className="sentra-map-popup">
                <div className="sentra-popup-card">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] text-sky-400 font-mono uppercase font-semibold tracking-wider">
                      {config.label}
                    </span>
                    <OperationalBadge status={resource.operational_status} />
                  </div>
                  <h4 className="text-xs font-semibold text-[#E8EEF5]">{resource.name}</h4>
                  <div className="mt-2 text-xs flex items-center justify-between bg-[#0D151E] p-2 rounded border border-[#243342]">
                    <span className="text-[#91A0B3]">Available / Total</span>
                    <span className="font-mono font-bold text-amber-400">
                      {resource.available_capacity} / {resource.total_capacity}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-[#5A6E85] flex items-center justify-between gap-2">
                    <span>
                      {district.name}, {district.state}
                    </span>
                    <span className="font-mono">{district.code}</span>
                  </div>
                  <p className="mt-2 text-[9px] leading-relaxed text-[#5A6E85]">
                    Facility coordinates are not supplied by the API; the marker is visually
                    offset from the district reference centroid to avoid overlap.
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {viewMode === 'REGION' && selectedDistrict && (
          <Circle
            center={[selectedDistrict.lat, selectedDistrict.lng]}
            radius={9000}
            interactive={false}
            pathOptions={{
              color: '#F59E0B',
              fillColor: '#F59E0B',
              fillOpacity: 0.04,
              weight: 1,
              dashArray: '2 6',
            }}
          />
        )}

        {regionCenter && (viewMode === 'REGION' || selectedDistrictId) && (
          <Marker
            position={regionCenter}
            icon={createRegionPin(
              selectedDistrict
                ? `${selectedDistrict.name.toUpperCase()} · REGION`
                : selectedStateName
                ? `${selectedStateName.toUpperCase()} · STATE`
                : `${(assignedDistrictName || 'REGION').toUpperCase()} · SECTOR`
            )}
            zIndexOffset={1000}
            interactive={false}
          />
        )}

        {showAssignedPin && assignedCoordinates && (
          <Marker
            position={assignedCoordinates}
            icon={createRegionPin(
              `${(assignedDistrictName || 'ASSIGNED').toUpperCase()} · SECTOR`,
              'sky'
            )}
            zIndexOffset={900}
            interactive={false}
          />
        )}

        {hud && (
          <>
            <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
              <div className="sentra-view-switch">
                <button
                  type="button"
                  onClick={() => setViewMode('INDIA')}
                  className={clsx('sentra-view-switch__btn', viewMode === 'INDIA' && 'is-active')}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>India View</span>
                </button>
                <button
                  type="button"
                  onClick={switchToRegion}
                  className={clsx('sentra-view-switch__btn', viewMode === 'REGION' && 'is-active')}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Region View</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  assignedCoordinates
                    ? setViewMode('REGION', assignedCoordinates, REGION_DEFAULT_ZOOM)
                    : switchToRegion()
                }
                className="sentra-map-pill"
                title={`Center on assigned region (${assignedDistrictName || 'Pune'})`}
              >
                <LocateFixed className="w-3.5 h-3.5 text-amber-500" />
                <span>Center {assignedDistrictName || 'Region'}</span>
              </button>
            </div>

            <div className="absolute top-3 right-3 z-[1000]">
              <LayerControlPanel />
            </div>

            <div className="absolute bottom-3 left-3 z-[1000]">
              <MapLegend viewMode={viewMode} />
            </div>

            <div className="absolute bottom-8 right-3 z-[1000]">
              <MapZoomControls />
            </div>
          </>
        )}

        {!hud && (
          <div className="absolute bottom-8 right-3 z-[1000]">
            <MapZoomControls />
          </div>
        )}

        {hud && (
          <div className="sentra-map-source" aria-hidden="true">
            {sourceLabel}
            {viewMode === 'INDIA' && ' · static mosaic, not live imagery'}
          </div>
        )}

        {statesQuery.isError && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1001] rounded border border-amber-500/30 bg-[#0D151E]/95 px-3 py-1.5 text-[10px] text-amber-300">
            State boundary layer unavailable
          </div>
        )}
      </MapContainer>
    </div>
  );
};
