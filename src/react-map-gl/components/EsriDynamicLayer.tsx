import { DynamicMapService } from '@/Services/DynamicMapService';
import type { EsriServiceOptions } from '@/types';
import type { EsriDynamicLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import { applyAuthOptions } from '../utils/buildServiceOptions';
import { useRasterLayer } from '../hooks/useRasterLayer';

/**
 * React Map GL component for Esri Dynamic Map Service
 */
export function EsriDynamicLayer(props: EsriDynamicLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-dynamic-${props.id}`;

  useRasterLayer({
    map,
    layerId: props.id,
    sourceId,
    beforeId: props.beforeId,
    visible: props.visible,
    serviceDeps: [
      props.url,
      props.layers,
      props.layerDefs,
      props.format,
      props.dpi,
      props.transparent,
      props.token,
      props.apiKey,
      props.proxy,
      props.getAttributionFromService,
      props.requestParams,
      props.fetchOptions,
    ],
    createService: (mapInstance, resolvedSourceId) => {
      const options: EsriServiceOptions & { url: string } = { url: props.url };
      if (props.layers !== undefined) options.layers = props.layers;
      if (props.layerDefs !== undefined) options.layerDefs = props.layerDefs;
      if (props.format !== undefined) options.format = props.format;
      if (props.dpi !== undefined) options.dpi = props.dpi;
      if (props.transparent !== undefined) options.transparent = props.transparent;
      applyAuthOptions(options, props);

      return new DynamicMapService(resolvedSourceId, mapInstance, options);
    },
  });

  return null;
}
