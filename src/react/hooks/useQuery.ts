import { useState, useCallback } from 'react';
import { Query } from '@/Tasks/Query';
import type { UseQueryOptions } from '../types';

/**
 * Hook for using Query task
 */
export function useQuery(options: UseQueryOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
    [options]
  );

  return {
    query,
    loading,
    error,
  };
}
