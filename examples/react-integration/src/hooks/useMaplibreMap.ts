import { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';

export interface UseMaplibreMapOptions {
  container: React.RefObject<HTMLDivElement | null>;
  center?: [number, number];
  zoom?: number;
}

/**
 * Shared hook that initialises a MapLibre GL map and returns the instance
 * once the `load` event has fired.  Cleans up on unmount.
 */
export function useMaplibreMap({
  container,
  center = [-95.7129, 37.0902],
  zoom = 4,
}: UseMaplibreMapOptions): maplibregl.Map | null {
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!container.current) return;

    const instance = new maplibregl.Map({
      container: container.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center,
      zoom,
    });

    instance.on('load', () => setMap(instance));

    return () => {
      instance.remove();
      setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  return map;
}
