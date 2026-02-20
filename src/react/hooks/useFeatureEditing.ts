import { useState, useCallback } from 'react';
import type { FeatureService } from '@/Services/FeatureService';
import type { EditResult, ApplyEditsResult } from '@/types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<EditResult[] | ApplyEditsResult | null>(null);

  const addFeatures = useCallback(
    async (features: GeoJSON.Feature[], options?: { gdbVersion?: string }) => {
      if (!service) throw new Error('FeatureService not available');
      setLoading(true);
      setError(null);
      try {
        const result = await service.addFeatures(features, options);
        setLastResult(result);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Add features failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const updateFeatures = useCallback(
    async (features: GeoJSON.Feature[], options?: { gdbVersion?: string }) => {
      if (!service) throw new Error('FeatureService not available');
      setLoading(true);
      setError(null);
      try {
        const result = await service.updateFeatures(features, options);
        setLastResult(result);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Update features failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const deleteFeatures = useCallback(
    async (params: { objectIds?: number[]; where?: string }) => {
      if (!service) throw new Error('FeatureService not available');
      setLoading(true);
      setError(null);
      try {
        const result = await service.deleteFeatures(params);
        setLastResult(result);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Delete features failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  const applyEdits = useCallback(
    async (
      edits: { adds?: GeoJSON.Feature[]; updates?: GeoJSON.Feature[]; deletes?: number[] },
      options?: { gdbVersion?: string }
    ) => {
      if (!service) throw new Error('FeatureService not available');
      setLoading(true);
      setError(null);
      try {
        const result = await service.applyEdits(edits, options);
        setLastResult(result);
        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Apply edits failed');
        setError(errorObj);
        throw errorObj;
      } finally {
        setLoading(false);
      }
    },
    [service]
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
