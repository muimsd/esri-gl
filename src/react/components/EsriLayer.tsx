import { useEffect } from 'react';
import { useEsriMap } from './EsriServiceProvider';
import type { EsriLayerProps } from '../types';

/**
 * Generic Esri layer component that adds a layer to the map
 */
export function EsriLayer({
  sourceId,
  layerId,
  type,
  paint = {},
  layout = {},
  beforeId,
}: EsriLayerProps) {
  const map = useEsriMap();

  useEffect(() => {
    if (!map) return;

    // Check if layer already exists
    if (map.getLayer(layerId)) {
      return;
    }

    // Add layer to map
    const layerSpec = {
      id: layerId,
      type,
      source: sourceId,
      paint,
      layout,
    } as Parameters<typeof map.addLayer>[0]; // Type assertion for layer specification

    if (beforeId) {
      map.addLayer(layerSpec, beforeId);
    } else {
      map.addLayer(layerSpec);
    }

    // Cleanup function
    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    };
  }, [map, sourceId, layerId, type, paint, layout, beforeId]);

  return null;
}
