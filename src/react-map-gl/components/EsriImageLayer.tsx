import { useEffect, useMemo, useState } from 'react';
import { useReactMapGL } from '../utils/useReactMapGL';
import { ImageService } from '@/Services/ImageService';
import type { ImageServiceOptions } from '@/types';
import type { EsriImageLayerProps } from '../types';

/**
 * React Map GL component for Esri Image Service
 */
export function EsriImageLayer(props: EsriImageLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-image-${props.id}`;
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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

  const service = useMemo(() => {
    if (!map || !isMapLoaded) return null;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return null;

    // Only include defined properties to avoid overriding defaults with undefined
    const options: Partial<ImageServiceOptions> & { url: string } = { url: props.url };
    if (props.renderingRule !== undefined) options.renderingRule = props.renderingRule;
    if (props.mosaicRule !== undefined) options.mosaicRule = props.mosaicRule;
    if (props.format !== undefined) options.format = props.format as ImageServiceOptions['format'];

    return new ImageService(sourceId, mapInstance as unknown as import('@/types').Map, options);
  }, [map, isMapLoaded, sourceId, props.url, props.renderingRule, props.mosaicRule, props.format]);

  useEffect(() => {
    if (!map || !service) return;

    const mapInstance = map.getMap?.() as any;
    if (
      !mapInstance ||
      typeof mapInstance.getLayer !== 'function' ||
      typeof mapInstance.addLayer !== 'function'
    ) {
      return () => {
        service.remove();
      };
    }

    // Add raster layer
    if (!mapInstance.getLayer(props.id)) {
      const layerConfig = {
        id: props.id,
        type: 'raster' as const,
        source: sourceId,
        layout: {
          visibility: (props.visible !== false ? 'visible' : 'none') as 'visible' | 'none',
        },
      };

      if (props.beforeId) {
        (mapInstance as any).addLayer(layerConfig as any, props.beforeId as any);
      } else {
        (mapInstance as any).addLayer(layerConfig as any);
      }
    }

    // Cleanup function
    return () => {
      if ((mapInstance as any).getStyle?.() && (mapInstance as any).getLayer?.(props.id)) {
        (mapInstance as any).removeLayer(props.id);
      }
      if (service) {
        service.remove();
      }
    };
  }, [map, service, props.id, props.beforeId, props.visible, sourceId]);

  return null;
}
