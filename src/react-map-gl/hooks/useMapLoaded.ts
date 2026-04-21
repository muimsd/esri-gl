import { useEffect, useState } from 'react';
import type { ReactMapGLMapRef } from '../utils/useReactMapGL';

type MapWithLoadApi = {
  isStyleLoaded?: () => boolean;
  once?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
};

/**
 * Returns true once the underlying map's style has finished loading.
 * Returns false when there is no map yet, the map does not expose the
 * expected lifecycle API, or the style has not finished loading.
 */
export function useMapLoaded(map: ReactMapGLMapRef | null | undefined): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!map) {
      setIsLoaded(false);
      return;
    }

    const mapInstance = map.getMap?.() as MapWithLoadApi | undefined;
    if (!mapInstance || typeof mapInstance.isStyleLoaded !== 'function') {
      setIsLoaded(false);
      return;
    }

    if (mapInstance.isStyleLoaded()) {
      setIsLoaded(true);
      return;
    }

    const handleLoad = () => setIsLoaded(true);
    mapInstance.once?.('load', handleLoad);

    return () => {
      mapInstance.off?.('load', handleLoad);
    };
  }, [map]);

  return isLoaded;
}
