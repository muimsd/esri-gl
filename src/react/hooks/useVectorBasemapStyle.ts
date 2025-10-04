import { useState, useEffect, useCallback, useRef } from 'react';
import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';
import type { VectorBasemapStyleAuthOptions } from '@/Services/VectorBasemapStyle';
import type { UseVectorBasemapStyleOptions, UseEsriServiceResult } from '../types';

/**
 * Hook for managing VectorBasemapStyle lifecycle
 * Note: VectorBasemapStyle has a different constructor signature than other services
 */
export function useVectorBasemapStyle(
  params: Pick<UseVectorBasemapStyleOptions, 'options'> = {}
): UseEsriServiceResult<VectorBasemapStyle> {
  const { options } = params;
  const [service, setService] = useState<VectorBasemapStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const serviceRef = useRef<VectorBasemapStyle | null>(null);

  const cleanupService = useCallback(() => {
    const existing = serviceRef.current;
    if (existing) {
      try {
        existing.remove();
      } catch (cleanupError) {
        console.warn('Failed to remove VectorBasemapStyle service', cleanupError);
      }
    }
    serviceRef.current = null;
    setService(null);
  }, []);

  const basemapEnum = options?.basemapEnum ?? 'arcgis/streets';
  const token = options?.token;
  const apiKey = options?.apiKey;
  const language = options?.language;
  const worldview = options?.worldview;
  const hasCredential = Boolean(token || apiKey);

  const reload = useCallback(() => {
    if (!hasCredential) {
      cleanupService();
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      cleanupService();

      const authOptions: VectorBasemapStyleAuthOptions = {};
      if (token) authOptions.token = token;
      if (apiKey) authOptions.apiKey = apiKey;
      if (language) authOptions.language = language;
      if (worldview) authOptions.worldview = worldview;

      const newService = new VectorBasemapStyle(basemapEnum, authOptions);
      setService(newService);
      serviceRef.current = newService;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create service'));
    } finally {
      setLoading(false);
    }
  }, [hasCredential, cleanupService, token, apiKey, language, worldview, basemapEnum]);

  // Initialize service when options change
  useEffect(() => {
    if (!hasCredential) {
      cleanupService();
      return;
    }

    reload();

    // Cleanup on unmount or options change
    return () => {
      cleanupService();
    };
  }, [reload, cleanupService, hasCredential]);

  return {
    service,
    loading,
    error,
    reload,
  };
}
