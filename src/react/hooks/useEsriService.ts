import { useState, useEffect, useRef, useCallback } from 'react';
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

  // Track if a service creation is in progress to prevent race conditions
  const isCreatingService = useRef(false);
  // Store the current service in a ref to avoid stale closure issues in cleanup
  const serviceRef = useRef<T | null>(null);
  // Track the createService function to detect changes
  const createServiceRef = useRef(createService);
  createServiceRef.current = createService;

  // Memoized reload function
  const reload = useCallback(() => {
    if (!map || isCreatingService.current) return;

    isCreatingService.current = true;
    setLoading(true);
    setError(null);

    try {
      // Clean up existing service using ref to avoid stale closure
      if (serviceRef.current) {
        try {
          serviceRef.current.remove();
        } catch (err) {
          // Log error but don't fail the reload
          if (process.env?.NODE_ENV !== 'test') {
            console.warn('Error removing existing service:', err);
          }
        }
      }

      // Create new service using the ref to get the latest createService
      const newService = createServiceRef.current(map);
      serviceRef.current = newService;
      setService(newService);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create service'));
      serviceRef.current = null;
    } finally {
      setLoading(false);
      isCreatingService.current = false;
    }
  }, [map]);

  // Initialize service when map becomes available
  useEffect(() => {
    if (!map) {
      // Clean up service when map is removed
      if (serviceRef.current) {
        try {
          serviceRef.current.remove();
        } catch (err) {
          if (process.env?.NODE_ENV !== 'test') {
            console.warn('Error removing service during cleanup:', err);
          }
        }
        serviceRef.current = null;
      }
      setService(null);
      return;
    }

    // Add a small delay to ensure map is fully initialized
    const timeoutId = setTimeout(() => {
      // Check if map is still valid
      if (map && typeof map.addSource === 'function') {
        reload();
      } else {
        // If map is not ready, try again after a short delay
        const retryTimeoutId = setTimeout(() => {
          if (map && typeof map.addSource === 'function') {
            reload();
          }
        }, 100);

        return () => clearTimeout(retryTimeoutId);
      }
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [map, reload]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // This cleanup function runs on unmount
      if (serviceRef.current) {
        try {
          serviceRef.current.remove();
        } catch (err) {
          if (process.env?.NODE_ENV !== 'test') {
            console.warn('Error removing service during cleanup:', err);
          }
        }
        serviceRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run cleanup on unmount

  return {
    service,
    loading,
    error,
    reload,
  };
}
