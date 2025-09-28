import { useState, useCallback } from 'react';
import { Find } from '@/Tasks/Find';
import type { UseFindOptions } from '../types';

/**
 * Hook for using Find task
 */
export function useFind({ url, searchText, layers, searchFields }: UseFindOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const find = useCallback(
    async (additionalOptions?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const findTask = new Find({
          url,
          searchText,
          layers,
          searchFields,
          ...additionalOptions,
        });

        const results = await findTask.run();
        return results;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Find failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [url, searchText, layers, searchFields]
  );

  return {
    find,
    loading,
    error,
  };
}
