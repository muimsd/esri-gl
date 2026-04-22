import { useMap } from 'react-map-gl/mapbox';
import { createEsriLayerHooks } from './createEsriLayerHooks';

/**
 * Hook for using Esri services with Mapbox GL JS (via react-map-gl)
 */
export function useEsriMapboxLayer() {
  const collection = useMap();
  return createEsriLayerHooks(collection);
}
