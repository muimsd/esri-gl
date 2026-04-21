import { useCallback, useState } from 'react';

export interface UseAsyncOperationResult {
  loading: boolean;
  error: Error | null;
  /**
   * Wrap an async callback with the loading/error state machine shared by
   * every task-style hook. Rethrows after setting error state so callers
   * can still `await` and handle failures at the call site.
   */
  run: <T>(fn: () => Promise<T>, failureMessage?: string) => Promise<T>;
}

/**
 * Shared state + wrapper used by task/editing hooks. Collapses the
 * repetitive `setLoading(true); try { ... } catch { setError(...) }
 * finally { setLoading(false) }` dance into one call site.
 */
export function useAsyncOperation(): UseAsyncOperationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async <T>(fn: () => Promise<T>, failureMessage = 'Operation failed'): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        return await fn();
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(failureMessage);
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, run };
}
