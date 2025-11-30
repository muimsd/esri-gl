import { useMap as useMapMapbox } from 'react-map-gl/mapbox';
import { useMap as useMapMaplibre } from 'react-map-gl/maplibre';
import type { MapRef as MapboxMapRef } from 'react-map-gl/mapbox';
import type { MapRef as MaplibreMapRef } from 'react-map-gl/maplibre';

export type ReactMapGLMapRef = MapboxMapRef | MaplibreMapRef;

export type ReactMapGLMapCollection = {
  current: ReactMapGLMapRef | null;
  [id: string]: ReactMapGLMapRef | null | undefined;
};

const EMPTY_COLLECTION: ReactMapGLMapCollection = { current: null };

function withFallback<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    // The hook will throw if the corresponding provider is not present.
    return null;
  }
}

function normalizeCollection(
  collection: ReturnType<typeof useMapMapbox> | ReturnType<typeof useMapMaplibre> | null
): ReactMapGLMapCollection | null {
  if (!collection) {
    return null;
  }

  const current = ((collection as { current?: ReactMapGLMapRef }).current ??
    null) as ReactMapGLMapRef | null;

  return {
    current,
    ...collection,
  } as ReactMapGLMapCollection;
}

export function useReactMapGL(): ReactMapGLMapCollection {
  const mapboxCollection = normalizeCollection(withFallback(useMapMapbox));
  const maplibreCollection = normalizeCollection(withFallback(useMapMaplibre));

  if (mapboxCollection?.current) {
    return mapboxCollection;
  }

  if (maplibreCollection?.current) {
    return maplibreCollection;
  }

  return mapboxCollection ?? maplibreCollection ?? EMPTY_COLLECTION;
}
