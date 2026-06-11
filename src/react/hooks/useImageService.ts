import { useEffect, useRef } from 'react';
import { useEsriService } from './useEsriService';
import { ImageService } from '@/Services/ImageService';
import type { UseImageServiceOptions, UseEsriServiceResult } from '../types';

/**
 * Hook for managing ImageService lifecycle.
 *
 * `useEsriService` only rebuilds when the `map` changes, so this hook reacts to
 * service-defining option changes itself: a different `url`/`format` rebuilds
 * the service (and its source), while `renderingRule`/`mosaicRule` changes are
 * applied in place. (Pass a memoized `options` object.)
 */
export function useImageService({
  sourceId,
  map,
  options,
  sourceOptions,
}: UseImageServiceOptions): UseEsriServiceResult<ImageService> {
  const result = useEsriService(
    mapInstance => new ImageService(sourceId, mapInstance, options, sourceOptions),
    map
  );

  const { service, reload } = result;
  const optionsRef = useRef(options);

  useEffect(() => {
    const prev = optionsRef.current;
    if (prev === options) return;
    optionsRef.current = options;

    if (options.url !== prev.url || options.format !== prev.format) {
      // A different service / format needs a fresh source.
      reload();
      return;
    }

    if (!service) return;
    if (options.renderingRule !== prev.renderingRule) {
      service.setRenderingRule((options.renderingRule || {}) as Record<string, unknown>);
    }
    if (options.mosaicRule !== prev.mosaicRule) {
      service.setMosaicRule((options.mosaicRule || {}) as Record<string, unknown>);
    }
  }, [options, service, reload]);

  return result;
}
