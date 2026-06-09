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
    // Forward all the auth/locale options VectorBasemapStyle supports (token or
    // apiKey, plus language/worldview), only including the ones provided.
    const auth: { token?: string; apiKey?: string; language?: string; worldview?: string } = {};
    if (props.token !== undefined) auth.token = props.token;
    if (props.apiKey !== undefined) auth.apiKey = props.apiKey;
    if (props.language !== undefined) auth.language = props.language;
    if (props.worldview !== undefined) auth.worldview = props.worldview;
    return new VectorBasemapStyle(props.basemapEnum, auth);
  }, [props.basemapEnum, props.token, props.apiKey, props.language, props.worldview]);

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
