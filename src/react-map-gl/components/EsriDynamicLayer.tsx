import { useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-map-gl';
import { DynamicMapService } from '@/Services/DynamicMapService';
import type { EsriServiceOptions } from '@/types';
import type { EsriDynamicLayerProps } from '../types';

/**
 * React Map GL component for Esri Dynamic Map Service
 */
export function EsriDynamicLayer(props: EsriDynamicLayerProps) {
  const { current: map } = useMap();
  const sourceId = props.sourceId || `esri-dynamic-${props.id}`;
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Wait for map to be loaded before creating service
  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap();

    const checkLoaded = () => {
      if (mapInstance.isStyleLoaded()) {
        setIsMapLoaded(true);
      } else {
        mapInstance.once('load', () => setIsMapLoaded(true));
      }
    };

    checkLoaded();
  }, [map]);

  const service = useMemo(() => {
    if (!map || !isMapLoaded) return null;

    // Only include defined properties to avoid overriding defaults with undefined
    const options: EsriServiceOptions & { url: string } = { url: props.url };
    if (props.layers !== undefined) options.layers = props.layers;
    if (props.layerDefs !== undefined) options.layerDefs = props.layerDefs;
    if (props.format !== undefined) options.format = props.format;
    if (props.dpi !== undefined) options.dpi = props.dpi;
    if (props.transparent !== undefined) options.transparent = props.transparent;

    return new DynamicMapService(
      sourceId,
      map.getMap() as unknown as import('@/types').Map, // Type assertion for map compatibility
      options
    );
  }, [
    map,
    isMapLoaded,
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
      if (mapInstance && mapInstance.getLayer(props.id)) {
        mapInstance.removeLayer(props.id);
      }
      if (service) {
        service.remove();
      }
    };
  }, [map, service, props.id, props.beforeId, props.visible, sourceId]);

  return null;
}
