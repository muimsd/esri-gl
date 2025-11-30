import { useEffect, useMemo } from 'react';
import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';
import type { EsriVectorBasemapLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';

/**
 * React Map GL component for Esri Vector Basemap Style
 */
export function EsriVectorBasemapLayer(props: EsriVectorBasemapLayerProps) {
  const { current: map } = useReactMapGL();

  const service = useMemo(() => {
    return new VectorBasemapStyle(props.basemapEnum, { token: props.token });
  }, [props.basemapEnum, props.token]);

  useEffect(() => {
    if (!map || !service) return;

    // Vector basemap styles replace the entire map style
    // This is typically handled differently in react-map-gl
    // For now, we'll just ensure cleanup

    // Cleanup function
    return () => {
      if (service) {
        service.remove();
      }
    };
  }, [map, service]);

  return null;
}
