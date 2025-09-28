import { useEsriService } from './useEsriService';
import { TiledMapService } from '@/Services/TiledMapService';
import type { UseTiledMapServiceOptions, UseEsriServiceResult } from '../types';

/**
 * Hook for managing TiledMapService lifecycle
 */
export function useTiledMapService({
  sourceId,
  map,
  options,
  sourceOptions,
}: UseTiledMapServiceOptions): UseEsriServiceResult<TiledMapService> {
  return useEsriService(
    mapInstance => new TiledMapService(sourceId, mapInstance, options, sourceOptions),
    map
  );
}
