import { create } from 'zustand';
import { INDIA_CENTER, INDIA_DEFAULT_ZOOM } from '../utils/constants';

export type MapViewMode = 'REGION' | 'INDIA';

interface MapState {
  viewMode: MapViewMode;
  center: [number, number];
  zoom: number;
  flyToTarget: [number, number, number] | null; // [lat, lng, zoom]
  selectedDistrictId: string | null;
  selectedStateIso: string | null;
  selectedStateName: string | null;
  selectedStateCenter: [number, number] | null;
  selectedIncident: any | null;
  activeLayers: {
    flood: boolean;
    cyclone: boolean;
    earthquake: boolean;
    heatwave: boolean;
    landslide: boolean;
    drought: boolean;
    tsunami: boolean;
    rainfall: boolean;
    resources: boolean;
    shelters: boolean;
  };

  setViewMode: (mode: MapViewMode, regionalCoords?: [number, number] | null, zoom?: number) => void;
  setFlyTo: (lat: number, lng: number, zoom: number) => void;
  clearFlyTo: () => void;
  toggleLayer: (layerKey: keyof MapState['activeLayers']) => void;
  setSelectedDistrictId: (districtId: string | null) => void;
  setSelectedState: (
    iso: string | null,
    name: string | null,
    center?: [number, number] | null
  ) => void;
  setSelectedIncident: (incident: any | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewMode: 'INDIA',
  center: INDIA_CENTER,
  zoom: INDIA_DEFAULT_ZOOM,
  flyToTarget: null,
  selectedDistrictId: null,
  selectedStateIso: null,
  selectedStateName: null,
  selectedStateCenter: null,
  selectedIncident: null,
  activeLayers: {
    flood: true,
    cyclone: true,
    earthquake: true,
    heatwave: true,
    landslide: true,
    drought: false,
    tsunami: false,
    rainfall: true,
    resources: true,
    shelters: true,
  },

  setViewMode: (mode: MapViewMode, regionalCoords?: [number, number] | null, zoom?: number) => {
    if (mode === 'REGION') {
      const targetCoords = regionalCoords || [18.5204, 73.8567];
      const targetZoom = zoom ?? 8.5;
      set({
        viewMode: 'REGION',
        center: targetCoords,
        zoom: targetZoom,
        flyToTarget: [targetCoords[0], targetCoords[1], targetZoom],
      });
    } else {
      set({
        viewMode: 'INDIA',
        center: INDIA_CENTER,
        zoom: INDIA_DEFAULT_ZOOM,
        flyToTarget: [INDIA_CENTER[0], INDIA_CENTER[1], INDIA_DEFAULT_ZOOM],
      });
    }
  },

  setFlyTo: (lat: number, lng: number, zoom: number) => {
    set({ flyToTarget: [lat, lng, zoom] });
  },

  clearFlyTo: () => {
    set({ flyToTarget: null });
  },

  toggleLayer: (layerKey) => {
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layerKey]: !state.activeLayers[layerKey],
      },
    }));
  },

  setSelectedDistrictId: (selectedDistrictId) => {
    set({ selectedDistrictId });
  },

  setSelectedState: (selectedStateIso, selectedStateName, center = null) => {
    set({
      selectedStateIso,
      selectedStateName,
      selectedStateCenter: center,
    });
  },

  setSelectedIncident: (selectedIncident) => {
    set({ selectedIncident });
  },
}));
