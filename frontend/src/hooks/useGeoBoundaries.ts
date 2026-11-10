import { useQuery } from '@tanstack/react-query';
import type { FeatureCollection, Geometry } from 'geojson';

export interface IndiaStateProperties {
  name: string;
  iso: string;
  centroid: [number, number];
}

export interface IndiaDistrictProperties {
  districtId: string;
  name: string;
  stateIso: string;
  stateName: string;
}

export type IndiaStateCollection = FeatureCollection<Geometry, IndiaStateProperties>;
export type IndiaDistrictCollection = FeatureCollection<Geometry, IndiaDistrictProperties>;

async function fetchGeoJson<T>(file: string): Promise<T> {
  const base = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${base}data/${file}`);
  if (!response.ok) {
    throw new Error(`Unable to load ${file} (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

export const useIndiaStates = () =>
  useQuery({
    queryKey: ['geo', 'india-states'],
    queryFn: () => fetchGeoJson<IndiaStateCollection>('india-states.geojson'),
    staleTime: Infinity,
    retry: 1,
  });

export const useIndiaDistricts = () =>
  useQuery({
    queryKey: ['geo', 'india-districts'],
    queryFn: () => fetchGeoJson<IndiaDistrictCollection>('india-districts.geojson'),
    staleTime: Infinity,
    retry: 1,
  });
