import { useEsriService } from './useEsriService';
import { VectorTileService } from '@/Services/VectorTileService';
import type { UseVectorTileServiceOptions, UseEsriServiceResult } from '../types';

/**
 * Hook for managing VectorTileService lifecycle
 */
export function useVectorTileService({
  sourceId,
  map,
  options,
  sourceOptions,
}: UseVectorTileServiceOptions): UseEsriServiceResult<VectorTileService> {
  return useEsriService(
    mapInstance => new VectorTileService(sourceId, mapInstance, options, sourceOptions),
    map
  );
}
