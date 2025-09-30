import { useEsriService } from './useEsriService';
import { ImageService } from '@/Services/ImageService';
import type { UseImageServiceOptions, UseEsriServiceResult } from '../types';

/**
 * Hook for managing ImageService lifecycle
 */
export function useImageService({
  sourceId,
  map,
  options,
  sourceOptions,
}: UseImageServiceOptions): UseEsriServiceResult<ImageService> {
  return useEsriService(
    mapInstance => new ImageService(sourceId, mapInstance, options, sourceOptions),
    map
  );
}
