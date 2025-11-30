import maplibregl from 'maplibre-gl';
import type { MapProps } from '@vis.gl/react-maplibre';

type MapLibType = NonNullable<MapProps['mapLib']>;

export const MAPLIBRE_MAP_LIB = maplibregl as unknown as MapLibType;
