import { useCallback } from 'react';
import { Find } from '@/Tasks/Find';
import type { UseFindOptions } from '../types';
import { useAsyncOperation } from './useAsyncOperation';

/**
 * Hook for using Find task
 */
export function useFind({ url, searchText, layers, searchFields }: UseFindOptions) {
  const { loading, error, run } = useAsyncOperation();

  const find = useCallback(
    (additionalOptions?: Record<string, unknown>) =>
      run(async () => {
        const findTask = new Find({
          url,
          searchText,
          layers,
          searchFields,
          ...additionalOptions,
        });
        return findTask.run();
      }, 'Find failed'),
    [url, searchText, layers, searchFields, run]
  );

  return {
    find,
    loading,
    error,
  };
}
