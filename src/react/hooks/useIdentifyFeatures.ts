import { useCallback } from 'react';
import { IdentifyFeatures } from '@/Tasks/IdentifyFeatures';
import type { Map } from '@/types';
import type { UseIdentifyFeaturesOptions } from '../types';
import { useAsyncOperation } from './useAsyncOperation';

/**
 * Hook for using IdentifyFeatures task
 */
export function useIdentifyFeatures({
  url,
  tolerance,
  returnGeometry,
}: UseIdentifyFeaturesOptions) {
  const { loading, error, run } = useAsyncOperation();

  const identify = useCallback(
    (
      point: { lng: number; lat: number },
      additionalOptions?: Record<string, unknown> & { map?: Map }
    ) =>
      run(async () => {
        const { map, ...rest } = additionalOptions ?? {};

        const identifyTask = new IdentifyFeatures({
          url,
          tolerance,
          returnGeometry,
          ...rest,
        });

        identifyTask.at(point);
        if (map) identifyTask.on(map);

        return identifyTask.run();
      }, 'Identify failed'),
    [url, tolerance, returnGeometry, run]
  );

  return {
    identify,
    loading,
    error,
  };
}
