import { useCallback } from 'react';
import { IdentifyImage } from '@/Tasks/IdentifyImage';
import type { UseIdentifyImageOptions } from '../types';
import { useAsyncOperation } from './useAsyncOperation';

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
  const { loading, error, run } = useAsyncOperation();
  const { url, token, returnGeometry } = options;

  const identifyImage = useCallback<UseIdentifyImageResult['identifyImage']>(
    (point, additionalOptions) =>
      run(async () => {
        const identifyTask = new IdentifyImage({
          ...options,
          ...additionalOptions,
        });

        identifyTask.at(point);

        return identifyTask.run();
      }, 'Identify image failed'),
    [url, token, returnGeometry, run]
  );

  return {
    identifyImage,
    loading,
    error,
  };
}
