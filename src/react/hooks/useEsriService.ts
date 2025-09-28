import { useState, useEffect, useRef } from 'react';
import type { UseEsriServiceResult } from '../types';
import type { Map } from '@/types';

// Interface for services that can be removed
interface RemovableService {
  remove(): void;
}

/**
 * Base hook for managing Esri services lifecycle
 */
export function useEsriService<T extends RemovableService>(
  createService: (map: Map) => T,
  map: Map | null
): UseEsriServiceResult<T> {
  const [service, setService] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const isCreatingService = useRef(false);

  const reload = () => {
    if (!map || isCreatingService.current) return;

    isCreatingService.current = true;
    setLoading(true);
    setError(null);

    try {
      // Clean up existing service
      if (service) {
        service.remove();
      }

      // Create new service
      const newService = createService(map);
      setService(newService);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create service'));
    } finally {
      setLoading(false);
      isCreatingService.current = false;
    }
  };

  // Initialize service when map becomes available
  useEffect(() => {
    if (!map) {
      if (service) {
        service.remove();
      }
      setService(null);
      return;
    }

    reload();
  }, [map]); // Only depend on map

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // This cleanup function runs on unmount
      if (service) {
        service.remove();
      }
    };
  }, [service]); // Run cleanup when service changes // Only depend on map and reload

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setService(currentService => {
        if (currentService) {
          currentService.remove();
        }
        return null;
      });
    };
  }, []);

  return {
    service,
    loading,
    error,
    reload,
  };
}
