import { useEffect, useMemo } from 'react';
import { VectorTileService } from '@/Services/VectorTileService';
import type { EsriVectorTileLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import type { Map } from '@/types';
/**
 * React Map GL component for Esri Vector Tile Service
 */
export function EsriVectorTileLayer(props: EsriVectorTileLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-vector-tile-${props.id}`;

  const service = useMemo(() => {
    if (!map) return null;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return null;

    return new VectorTileService(sourceId, mapInstance as unknown as Map, {
      url: props.url,
    });
  }, [map, sourceId, props.url]);

  useEffect(() => {
    if (!map || !service) return;

    // Vector tile layers are added by the service itself
    // We just need to manage cleanup

    // Cleanup function
    return () => {
      if (service) {
        service.remove();
      }
    };
  }, [map, service, sourceId]);

  return null;
}
