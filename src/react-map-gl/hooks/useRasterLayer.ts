import { useEffect, useMemo } from 'react';
import type { Map } from '@/types';
import type { ReactMapGLMapRef } from '../utils/useReactMapGL';
import { useMapLoaded } from './useMapLoaded';

type RasterService = { remove: () => void };

type MapLayerApi = {
  getStyle?: () => unknown;
  getLayer?: (id: string) => unknown;
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
 * service. Waits for the map style to load, constructs the service, and
 * adds/removes a raster layer bound to its source.
 */
export function useRasterLayer<TService extends RasterService>(
  options: UseRasterLayerOptions<TService>
): TService | null {
  const { map, layerId, sourceId, beforeId, visible, serviceDeps, createService } = options;
  const isMapLoaded = useMapLoaded(map);

  const service = useMemo<TService | null>(() => {
    if (!map || !isMapLoaded) return null;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return null;

    return createService(mapInstance as unknown as Map, sourceId);
  }, [map, isMapLoaded, sourceId, ...serviceDeps]);

  useEffect(() => {
    if (!map || !service) return;

    const mapInstance = map.getMap?.() as MapLayerApi | undefined;
    if (
      !mapInstance ||
      typeof mapInstance.getLayer !== 'function' ||
      typeof mapInstance.addLayer !== 'function'
    ) {
      return () => {
        service.remove();
      };
    }

    if (!mapInstance.getLayer(layerId)) {
      const layerConfig = {
        id: layerId,
        type: 'raster' as const,
        source: sourceId,
        layout: {
          visibility: (visible !== false ? 'visible' : 'none') as 'visible' | 'none',
        },
      };

      if (beforeId) {
        mapInstance.addLayer(layerConfig, beforeId);
      } else {
        mapInstance.addLayer(layerConfig);
      }
    }

    return () => {
      if (mapInstance.getStyle?.() && mapInstance.getLayer?.(layerId)) {
        mapInstance.removeLayer?.(layerId);
      }
      service.remove();
    };
  }, [map, service, layerId, beforeId, visible, sourceId]);

  return service;
}
