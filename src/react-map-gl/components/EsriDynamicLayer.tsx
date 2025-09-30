import { useEffect, useMemo } from 'react';
import { useMap } from 'react-map-gl';
import { DynamicMapService } from '@/Services/DynamicMapService';
import type { EsriDynamicLayerProps } from '../types';

/**
 * React Map GL component for Esri Dynamic Map Service
 */
export function EsriDynamicLayer(props: EsriDynamicLayerProps) {
  const { current: map } = useMap();
  const sourceId = props.sourceId || `esri-dynamic-${props.id}`;

  const service = useMemo(() => {
    if (!map) return null;

    return new DynamicMapService(
      sourceId,
      map.getMap() as unknown as import('@/types').Map, // Type assertion for map compatibility
      {
        url: props.url,
        layers: props.layers,
        layerDefs: props.layerDefs,
        format: props.format,
        dpi: props.dpi,
        transparent: props.transparent,
      }
    );
  }, [
    map,
    sourceId,
    props.url,
    props.layers,
    props.layerDefs,
    props.format,
    props.dpi,
    props.transparent,
  ]);

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
