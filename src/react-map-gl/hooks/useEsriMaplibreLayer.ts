import { useMap } from 'react-map-gl/maplibre';
import { createEsriLayerHooks } from './createEsriLayerHooks';

/**
 * Hook for using Esri services with MapLibre GL JS (via react-map-gl/maplibre)
 */
export function useEsriMaplibreLayer() {
  const collection = useMap();
  return createEsriLayerHooks(collection);
}
