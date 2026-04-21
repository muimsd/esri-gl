import { useCallback, useState } from 'react';
import type { FeatureService } from '@/Services/FeatureService';
import type { EditResult, ApplyEditsResult } from '@/types';
import { useAsyncOperation } from './useAsyncOperation';

export interface UseFeatureEditingResult {
  addFeatures: (
    features: GeoJSON.Feature[],
    options?: { gdbVersion?: string }
  ) => Promise<EditResult[]>;
  updateFeatures: (
    features: GeoJSON.Feature[],
    options?: { gdbVersion?: string }
  ) => Promise<EditResult[]>;
  deleteFeatures: (params: { objectIds?: number[]; where?: string }) => Promise<EditResult[]>;
  applyEdits: (
    edits: {
      adds?: GeoJSON.Feature[];
      updates?: GeoJSON.Feature[];
      deletes?: number[];
    },
    options?: { gdbVersion?: string }
  ) => Promise<ApplyEditsResult>;
  loading: boolean;
  error: Error | null;
  lastResult: EditResult[] | ApplyEditsResult | null;
}

/**
 * Hook for feature editing operations on a FeatureService
 */
export function useFeatureEditing(service: FeatureService | null): UseFeatureEditingResult {
  const { loading, error, run } = useAsyncOperation();
  const [lastResult, setLastResult] = useState<EditResult[] | ApplyEditsResult | null>(null);

  const runEdit = useCallback(
    async <T extends EditResult[] | ApplyEditsResult>(
      op: () => Promise<T>,
      failureMessage: string
    ): Promise<T> => {
      if (!service) throw new Error('FeatureService not available');
      const result = await run(op, failureMessage);
      setLastResult(result);
      return result;
    },
    [service, run]
  );

  const addFeatures = useCallback(
    (features: GeoJSON.Feature[], options?: { gdbVersion?: string }) =>
      runEdit(() => service!.addFeatures(features, options), 'Add features failed'),
    [service, runEdit]
  );

  const updateFeatures = useCallback(
    (features: GeoJSON.Feature[], options?: { gdbVersion?: string }) =>
      runEdit(() => service!.updateFeatures(features, options), 'Update features failed'),
    [service, runEdit]
  );

  const deleteFeatures = useCallback(
    (params: { objectIds?: number[]; where?: string }) =>
      runEdit(() => service!.deleteFeatures(params), 'Delete features failed'),
    [service, runEdit]
  );

  const applyEdits = useCallback(
    (
      edits: { adds?: GeoJSON.Feature[]; updates?: GeoJSON.Feature[]; deletes?: number[] },
      options?: { gdbVersion?: string }
    ) => runEdit(() => service!.applyEdits(edits, options), 'Apply edits failed'),
    [service, runEdit]
  );

  return {
    addFeatures,
    updateFeatures,
    deleteFeatures,
    applyEdits,
    loading,
    error,
    lastResult,
  };
}
