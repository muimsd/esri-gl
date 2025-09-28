import { useState, useCallback } from 'react';
import { IdentifyFeatures } from '@/Tasks/IdentifyFeatures';
import type { UseIdentifyFeaturesOptions } from '../types';

/**
 * Hook for using IdentifyFeatures task
 */
export function useIdentifyFeatures({
  url,
  tolerance,
  returnGeometry,
}: UseIdentifyFeaturesOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const identify = useCallback(
    async (point: { lng: number; lat: number }, additionalOptions?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const identifyTask = new IdentifyFeatures({
          url,
          tolerance,
          returnGeometry,
          ...additionalOptions,
        });

        const results = await identifyTask.at(point).run();
        return results;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Identify failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [url, tolerance, returnGeometry]
  );

  return {
    identify,
    loading,
    error,
  };
}
