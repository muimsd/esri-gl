import { useState, useCallback } from 'react';
import { Query } from '@/Tasks/Query';
import type { UseQueryOptions } from '../types';

/**
 * Hook for using Query task
 */
export function useQuery(options: UseQueryOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { url, where, outFields, returnGeometry } = options;

  const query = useCallback(
    async (additionalOptions?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const queryTask = new Query({
          ...options,
          ...additionalOptions,
        });

        const results = await queryTask.run();
        return results;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Query failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [url, where, outFields, returnGeometry]
  );

  const queryAll = useCallback(
    async (additionalOptions?: Record<string, unknown> & { maxPages?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const { maxPages, ...rest } = additionalOptions || {};
        const queryTask = new Query({
          ...options,
          ...rest,
        });

        const results = await queryTask.runAll({ maxPages });
        return results;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Query failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [url, where, outFields, returnGeometry]
  );

  return {
    query,
    queryAll,
    loading,
    error,
  };
}
