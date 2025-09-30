import { useEsriService } from './useEsriService';
import { FeatureService } from '@/Services/FeatureService';
import type { UseFeatureServiceOptions, UseEsriServiceResult } from '../types';

/**
 * Hook for managing FeatureService lifecycle
 */
export function useFeatureService({
  sourceId,
  map,
  options,
  sourceOptions,
}: UseFeatureServiceOptions): UseEsriServiceResult<FeatureService> {
  return useEsriService(
    mapInstance => new FeatureService(sourceId, mapInstance, options, sourceOptions),
    map
  );
}
