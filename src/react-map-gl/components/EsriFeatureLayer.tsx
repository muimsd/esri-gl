import { useEffect, useMemo, useState } from 'react';
import { FeatureService } from '@/Services/FeatureService';
import type { FeatureServiceOptions } from '@/types';
import type { EsriFeatureLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';

/**
 * React Map GL component for Esri Feature Service
 */
export function EsriFeatureLayer(props: EsriFeatureLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-feature-${props.id}`;
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Wait for map to be loaded before creating service
  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap?.();
    if (!mapInstance || typeof mapInstance.isStyleLoaded !== 'function') {
      return;
    }

    if (mapInstance.isStyleLoaded()) {
      setIsMapLoaded(true);
      return;
    }

    const handleLoad = () => setIsMapLoaded(true);
    mapInstance.once?.('load', handleLoad);

    return () => {
      mapInstance.off?.('load', handleLoad);
    };
  }, [map]);

  const service = useMemo(() => {
    if (!map || !isMapLoaded) return null;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return null;

    // Only include defined properties to avoid overriding defaults with undefined
    const options: Partial<FeatureServiceOptions> & { url: string } = { url: props.url };
    if (props.where !== undefined) options.where = props.where;
    if (props.outFields !== undefined) options.outFields = props.outFields;

    return new FeatureService(sourceId, mapInstance as unknown as import('@/types').Map, options);
  }, [map, isMapLoaded, sourceId, props.url, props.where, props.outFields]);

  useEffect(() => {
    if (!map || !service) return;

    const mapInstance = map.getMap?.();
    if (
      !mapInstance ||
      typeof mapInstance.getLayer !== 'function' ||
      typeof mapInstance.addLayer !== 'function'
    ) {
      return () => {
        service.remove();
      };
    }

    // Add GeoJSON layer
    if (!mapInstance.getLayer(props.id)) {
      const layerConfig = {
        id: props.id,
        type: 'fill' as const, // Default to fill, can be customized
        source: sourceId,
        paint: props.paint || {
          'fill-color': '#888888',
          'fill-opacity': 0.5,
        },
        layout: {
          ...props.layout,
          visibility: (props.visible !== false ? 'visible' : 'none') as 'visible' | 'none',
        },
      } as Parameters<typeof mapInstance.addLayer>[0];

      if (props.beforeId) {
        mapInstance.addLayer(layerConfig, props.beforeId);
      } else {
        mapInstance.addLayer(layerConfig);
      }
    }

    // Cleanup function
    return () => {
      if (mapInstance.getStyle() && mapInstance.getLayer?.(props.id)) {
        mapInstance.removeLayer(props.id);
      }
      if (service) {
        service.remove();
      }
    };
  }, [map, service, props.id, props.beforeId, props.visible, props.paint, props.layout, sourceId]);

  return null;
}
