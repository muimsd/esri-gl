import { useCallback } from 'react';
import { Query } from '@/Tasks/Query';
import type { UseQueryOptions } from '../types';
import { useAsyncOperation } from './useAsyncOperation';

/**
 * Hook for using Query task
 */
export function useQuery(options: UseQueryOptions) {
  const { loading, error, run } = useAsyncOperation();
  const { url, where, outFields, returnGeometry } = options;

  const query = useCallback(
    (additionalOptions?: Record<string, unknown>) =>
      run(async () => {
        const queryTask = new Query({
          ...options,
          ...additionalOptions,
        });
        return queryTask.run();
      }, 'Query failed'),
    [url, where, outFields, returnGeometry, run]
  );

  const queryAll = useCallback(
    (additionalOptions?: Record<string, unknown> & { maxPages?: number }) =>
      run(async () => {
        const { maxPages, ...rest } = additionalOptions || {};
        const queryTask = new Query({
          ...options,
          ...rest,
        });
        return queryTask.runAll({ maxPages });
      }, 'Query failed'),
    [url, where, outFields, returnGeometry, run]
  );

  return {
    query,
    queryAll,
    loading,
    error,
  };
}
