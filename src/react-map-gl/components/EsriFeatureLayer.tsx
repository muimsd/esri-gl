import { useEffect, useRef } from 'react';
import { FeatureService } from '@/Services/FeatureService';
import type { FeatureServiceOptions, Map } from '@/types';
import type { EsriFeatureLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import { applyAuthOptions } from '../utils/buildServiceOptions';
import { useMapLoaded } from '../hooks/useMapLoaded';

type MapLayerApi = {
  getStyle?: () => unknown;
  getLayer?: (id: string) => unknown;
  addLayer?: (layer: unknown, beforeId?: string) => void;
  removeLayer?: (id: string) => void;
};

/**
 * React Map GL component for Esri Feature Service
 */
export function EsriFeatureLayer(props: EsriFeatureLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-feature-${props.id}`;
  const isMapLoaded = useMapLoaded(map);
  const serviceRef = useRef<FeatureService | null>(null);

  // Keep stable refs for object props to avoid effect re-runs on every render
  const paintRef = useRef(props.paint);
  paintRef.current = props.paint;
  const layoutRef = useRef(props.layout);
  layoutRef.current = props.layout;

  useEffect(() => {
    if (!map || !isMapLoaded) return;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return;

    const layerApi = mapInstance as unknown as MapLayerApi;

    const options: Partial<FeatureServiceOptions> & { url: string } = { url: props.url };
    if (props.where !== undefined) options.where = props.where;
    if (props.outFields !== undefined) options.outFields = props.outFields;
    applyAuthOptions(options, props);

    const service = new FeatureService(sourceId, mapInstance as unknown as Map, options);
    serviceRef.current = service;

    if (
      typeof layerApi.getLayer === 'function' &&
      typeof layerApi.addLayer === 'function' &&
      !layerApi.getLayer(props.id)
    ) {
      const layerType = props.type || 'fill';
      const defaultPaint =
        layerType === 'circle'
          ? { 'circle-radius': 4, 'circle-color': '#888888' }
          : { 'fill-color': '#888888', 'fill-opacity': 0.5 };
      const layerConfig = {
        id: props.id,
        type: layerType,
        source: sourceId,
        paint: paintRef.current || defaultPaint,
        layout: {
          ...layoutRef.current,
          visibility: (props.visible !== false ? 'visible' : 'none') as 'visible' | 'none',
        },
      };

      if (props.beforeId) {
        layerApi.addLayer(layerConfig, props.beforeId);
      } else {
        layerApi.addLayer(layerConfig);
      }
    }

    return () => {
      if (layerApi.getStyle?.() && layerApi.getLayer?.(props.id)) {
        layerApi.removeLayer?.(props.id);
      }
      service.remove();
      serviceRef.current = null;
    };
  }, [
    map,
    isMapLoaded,
    sourceId,
    props.url,
    props.where,
    props.outFields,
    props.id,
    props.beforeId,
    props.visible,
    props.type,
    props.token,
    props.apiKey,
    props.proxy,
    props.getAttributionFromService,
    props.requestParams,
    props.fetchOptions,
  ]);

  return null;
}
