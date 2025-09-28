import { useState, useEffect, useCallback } from 'react';
import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';
import type { UseVectorBasemapStyleOptions, UseEsriServiceResult } from '../types';

/**
 * Hook for managing VectorBasemapStyle lifecycle
 * Note: VectorBasemapStyle has a different constructor signature than other services
 */
export function useVectorBasemapStyle({
  options,
}: Pick<UseVectorBasemapStyleOptions, 'options'>): UseEsriServiceResult<VectorBasemapStyle> {
  const [service, setService] = useState<VectorBasemapStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // Clean up existing service if it exists
      if (service) {
        service.remove();
      }

      // Create new service
      const newService = new VectorBasemapStyle(options.basemapEnum, {
        token: options.token,
        language: options.language,
        worldview: options.worldview,
      });
      setService(newService);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create service'));
    } finally {
      setLoading(false);
    }
  }, [options, service]);

  // Initialize service when dependencies change
  useEffect(() => {
    reload();

    // Cleanup on unmount or dependency change
    return () => {
      if (service) {
        service.remove();
      }
    };
  }, [reload]);

  return {
    service,
    loading,
    error,
    reload,
  };
}
