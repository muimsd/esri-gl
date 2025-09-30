import { useEffect, useMemo } from 'react';
import { useMap } from 'react-map-gl';
import { ImageService } from '@/Services/ImageService';
import type { EsriImageLayerProps } from '../types';

/**
 * React Map GL component for Esri Image Service
 */
export function EsriImageLayer(props: EsriImageLayerProps) {
  const { current: map } = useMap();
  const sourceId = props.sourceId || `esri-image-${props.id}`;

  const service = useMemo(() => {
    if (!map) return null;

    return new ImageService(sourceId, map.getMap() as unknown as import('@/types').Map, {
      url: props.url,
      renderingRule: props.renderingRule,
      mosaicRule: props.mosaicRule,
      format: props.format as import('@/types').ImageServiceOptions['format'],
    });
  }, [map, sourceId, props.url, props.renderingRule, props.mosaicRule, props.format]);

  useEffect(() => {
    if (!map || !service) return;

    const mapInstance = map.getMap();

    // Add raster layer
    if (!mapInstance.getLayer(props.id)) {
      const layerConfig = {
        id: props.id,
        type: 'raster' as const,
        source: sourceId,
        layout: {
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
      if (mapInstance.getLayer(props.id)) {
        mapInstance.removeLayer(props.id);
      }
      if (service) {
        service.remove();
      }
    };
  }, [map, service, props.id, props.beforeId, props.visible, sourceId]);

  return null;
}
