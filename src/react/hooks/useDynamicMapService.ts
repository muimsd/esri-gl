import { useCallback, useEffect, useRef } from 'react';
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
  const optionsRef = useRef(options);

  const createService = useCallback(
    (mapInstance: Map) => new DynamicMapService(sourceId, mapInstance, options, sourceOptions),
    // url/token/apiKey changes need a fresh closure + rebuild (below); layers /
    // layerDefs are applied in place by the effect, so they stay out of here.
    [sourceId, sourceOptions, options.url, options.token, options.apiKey]
  );

  // Rebuild the service when the url / auth changes.
  const result = useEsriService(createService, map, [
    sourceId,
    options.url,
    options.token,
    options.apiKey,
  ]);

  // Update service options when they change
  useEffect(() => {
    if (result.service && options !== optionsRef.current && map) {
      // Add a small delay to ensure the service is fully initialized
      const timeoutId = setTimeout(() => {
        if (!result.service || !map) return;

        // Check for specific option changes that we can handle without recreation
        if (options.layers !== optionsRef.current.layers) {
          const layers = options.layers || [];
          if (Array.isArray(layers) || typeof layers === 'number') {
            try {
              result.service.setLayers(layers);
            } catch (error) {
              console.warn('useDynamicMapService: Error setting layers:', error);
            }
          }
        }

        if (options.layerDefs !== optionsRef.current.layerDefs) {
          const layerDefs = options.layerDefs || {};
          try {
            result.service.setLayerDefs(layerDefs);
          } catch (error) {
            console.warn('useDynamicMapService: Error setting layer definitions:', error);
          }
        }

        // Update the ref to track current options
        optionsRef.current = options;
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [result.service, options, map]);

  return result;
}
