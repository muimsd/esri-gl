import { useState, useCallback } from 'react';
import { IdentifyImage } from '@/Tasks/IdentifyImage';
import type { UseIdentifyImageOptions } from '../types';

export interface UseIdentifyImageResult {
  identifyImage: (
    point: { lng: number; lat: number } | [number, number],
    additionalOptions?: Partial<UseIdentifyImageOptions> & Record<string, unknown>
  ) => Promise<Awaited<ReturnType<IdentifyImage['run']>>>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for using IdentifyImage task
 */
export function useIdentifyImage(options: UseIdentifyImageOptions): UseIdentifyImageResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const identifyImage = useCallback<UseIdentifyImageResult['identifyImage']>(
    async (point, additionalOptions) => {
      setLoading(true);
      setError(null);

      try {
        const identifyTask = new IdentifyImage({
          ...options,
          ...additionalOptions,
        });

        identifyTask.at(point);

        const results = await identifyTask.run();
        return results;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Identify image failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    identifyImage,
    loading,
    error,
  };
}
