import { TiledMapService } from '@/Services/TiledMapService';
import type { EsriServiceOptions } from '@/types';
import type { EsriTiledLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import { applyAuthOptions } from '../utils/buildServiceOptions';
import { useRasterLayer } from '../hooks/useRasterLayer';

/**
 * React Map GL component for Esri Tiled Map Service
 */
export function EsriTiledLayer(props: EsriTiledLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-tiled-${props.id}`;

  useRasterLayer({
    map,
    layerId: props.id,
    sourceId,
    beforeId: props.beforeId,
    visible: props.visible,
    serviceDeps: [
      props.url,
      props.token,
      props.apiKey,
      props.proxy,
      props.getAttributionFromService,
      props.requestParams,
      props.fetchOptions,
    ],
    createService: (mapInstance, resolvedSourceId) => {
      const options: EsriServiceOptions & { url: string } = { url: props.url };
      applyAuthOptions(options, props);
      return new TiledMapService(resolvedSourceId, mapInstance, options);
    },
  });

  return null;
}
