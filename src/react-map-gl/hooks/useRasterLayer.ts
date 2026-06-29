import { useEffect, useRef, useState } from 'react';
import type { Map } from '@/types';
import type { ReactMapGLMapRef } from '../utils/useReactMapGL';
import { useMapLoaded } from './useMapLoaded';

type RasterService = {
  remove: () => void;
  /** Resolves once the service's source exists (deferred for portal item id urls). */
  sourceReady?: Promise<void>;
};

type MapLayerApi = {
  getStyle?: () => unknown;
  getLayer?: (id: string) => unknown;
  getSource?: (id: string) => unknown;
  addLayer?: (layer: unknown, beforeId?: string) => void;
  removeLayer?: (id: string) => void;
};

export interface UseRasterLayerOptions<TService extends RasterService> {
  map: ReactMapGLMapRef | null | undefined;
  layerId: string;
  sourceId: string;
  beforeId?: string;
  visible?: boolean;
  /**
   * Dependencies that determine when the service should be rebuilt. The
   * hook already tracks `map`, the load state, and `sourceId` — callers
   * should pass any props that affect service construction.
   */
  serviceDeps: ReadonlyArray<unknown>;
  createService: (map: Map, sourceId: string) => TService;
}

/**
 * Shared lifecycle for react-map-gl components that wrap an Esri raster
 * service. Waits for the map style to load, then (re)builds the service and its
 * raster layer in a single effect so that when `serviceDeps` change the old
 * source is torn down *before* the new service recreates it — otherwise the
 * service constructor would see the stale source and skip re-adding it.
 */
export function useRasterLayer<TService extends RasterService>(
  options: UseRasterLayerOptions<TService>
): TService | null {
  const { map, layerId, sourceId, beforeId, visible, serviceDeps, createService } = options;
  const isMapLoaded = useMapLoaded(map);
  const [service, setService] = useState<TService | null>(null);

  // Keep the latest createService without making it a dependency (callers pass
  // a fresh closure each render; serviceDeps captures what actually matters).
  const createServiceRef = useRef(createService);
  createServiceRef.current = createService;

  useEffect(() => {
    if (!map || !isMapLoaded) {
      setService(null);
      return;
    }

    const mapInstance = map.getMap?.() as MapLayerApi | undefined;
    if (!mapInstance || typeof mapInstance.addLayer !== 'function') {
      return;
    }

    const svc = createServiceRef.current(mapInstance as unknown as Map, sourceId);
    setService(svc);
    let cancelled = false;

    // Add the raster layer once its source exists. When `url` is a portal item
    // id the source is created asynchronously, so wait for `sourceReady`.
    const addRasterLayer = () => {
      if (cancelled) return;
      const sourceReady =
        typeof mapInstance.getSource !== 'function' || Boolean(mapInstance.getSource(sourceId));
      if (mapInstance.getLayer?.(layerId) || !sourceReady) return;

      const layerConfig = {
        id: layerId,
        type: 'raster' as const,
        source: sourceId,
        layout: {
          visibility: (visible !== false ? 'visible' : 'none') as 'visible' | 'none',
        },
      };
      try {
        if (beforeId) {
          mapInstance.addLayer?.(layerConfig, beforeId);
        } else {
          mapInstance.addLayer?.(layerConfig);
        }
      } catch (err) {
        if (process.env?.NODE_ENV !== 'test') {
          console.warn(`useRasterLayer: skipped adding layer "${layerId}"`, err);
        }
      }
    };

    if (svc.sourceReady && typeof svc.sourceReady.then === 'function') {
      svc.sourceReady.then(addRasterLayer).catch(() => undefined);
    } else {
      addRasterLayer();
    }

    return () => {
      cancelled = true;
      // Remove the layer first, then the service (which removes its source), so
      // a subsequent rebuild gets a clean slate for the same sourceId.
      try {
        if (mapInstance.getStyle?.() && mapInstance.getLayer?.(layerId)) {
          mapInstance.removeLayer?.(layerId);
        }
      } catch {
        // layer may already be gone
      }
      svc.remove();
    };
    // serviceDeps is spread so any change rebuilds the layer + source.
  }, [map, isMapLoaded, sourceId, layerId, beforeId, visible, ...serviceDeps]);

  return service;
}
