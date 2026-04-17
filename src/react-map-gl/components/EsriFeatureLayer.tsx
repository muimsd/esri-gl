import { useEffect, useRef, useState } from 'react';
import { FeatureService } from '@/Services/FeatureService';
import type { FeatureServiceOptions } from '@/types';
import type { EsriFeatureLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import { applyAuthOptions } from '../utils/buildServiceOptions';

/**
 * React Map GL component for Esri Feature Service
 */
export function EsriFeatureLayer(props: EsriFeatureLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-feature-${props.id}`;
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const serviceRef = useRef<FeatureService | null>(null);

  // Keep stable refs for object props to avoid effect re-runs on every render
  const paintRef = useRef(props.paint);
  paintRef.current = props.paint;
  const layoutRef = useRef(props.layout);
  layoutRef.current = props.layout;

  // Wait for map to be loaded before creating service
  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap?.();
    const mi = mapInstance as any;
    if (!mi || typeof mi.isStyleLoaded !== 'function') {
      return;
    }

    if (mi.isStyleLoaded()) {
      setIsMapLoaded(true);
      return;
    }

    const handleLoad = () => setIsMapLoaded(true);
    mi?.once?.('load', handleLoad);

    return () => {
      mi?.off?.('load', handleLoad);
    };
  }, [map]);

  // Create FeatureService, add layer, and clean up on unmount
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return;

    const mi = mapInstance as any;

    // Only include defined properties to avoid overriding defaults with undefined
    const options: Partial<FeatureServiceOptions> & { url: string } = { url: props.url };
    if (props.where !== undefined) options.where = props.where;
    if (props.outFields !== undefined) options.outFields = props.outFields;
    applyAuthOptions(options, props);

    const service = new FeatureService(
      sourceId,
      mapInstance as unknown as import('@/types').Map,
      options
    );
    serviceRef.current = service;

    // Add GeoJSON layer
    if (
      typeof mi.getLayer === 'function' &&
      typeof mi.addLayer === 'function' &&
      !mi.getLayer(props.id)
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
        mi.addLayer(layerConfig as any, props.beforeId as any);
      } else {
        mi.addLayer(layerConfig as any);
      }
    }

    return () => {
      if (mi.getStyle?.() && mi.getLayer?.(props.id)) {
        mi.removeLayer(props.id);
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
