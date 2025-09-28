import { useCallback } from 'react';
import { useEsriService } from './useEsriService';
import { DynamicMapService } from '@/Services/DynamicMapService';
import type { UseDynamicMapServiceOptions, UseEsriServiceResult } from '../types';
import type { Map } from '@/types';

/**
 * Hook for managing DynamicMapService lifecycle
 */
export function useDynamicMapService({
  sourceId,
  map,
  options,
  sourceOptions,
}: UseDynamicMapServiceOptions): UseEsriServiceResult<DynamicMapService> {
  const createService = useCallback(
    (mapInstance: Map) => new DynamicMapService(sourceId, mapInstance, options, sourceOptions),
    [sourceId, options, sourceOptions]
  );

  return useEsriService(createService, map);
}
