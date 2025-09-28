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
  
  // Track the previous createService function to detect changes
  const prevCreateServiceRef = useRef(createService);
  const isCreatingService = useRef(false);

  const createNewService = () => {
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

  const reload = () => {
    createNewService();
  };

  // Effect for map changes
  useEffect(() => {
    if (!map) {
      if (service) {
        service.remove();
      }
      setService(null);
      return;
    }

    // Create service when map becomes available
    createNewService();
  }, [map]); // Only depend on map

  // Effect for createService function changes (options changes)
  useEffect(() => {
    // Check if createService function actually changed
    if (prevCreateServiceRef.current !== createService && map) {
      prevCreateServiceRef.current = createService;
      createNewService();
    }
  }, [createService]); // Only depend on createService function // Only depend on map and reload

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
