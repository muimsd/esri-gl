import { ImageService } from '@/Services/ImageService';
import type { ImageServiceOptions } from '@/types';
import type { EsriImageLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import { applyAuthOptions } from '../utils/buildServiceOptions';
import { useRasterLayer } from '../hooks/useRasterLayer';

/**
 * React Map GL component for Esri Image Service
 */
export function EsriImageLayer(props: EsriImageLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-image-${props.id}`;

  useRasterLayer({
    map,
    layerId: props.id,
    sourceId,
    beforeId: props.beforeId,
    visible: props.visible,
    serviceDeps: [
      props.url,
      props.renderingRule,
      props.mosaicRule,
      props.format,
      props.token,
      props.apiKey,
      props.proxy,
      props.getAttributionFromService,
      props.requestParams,
      props.fetchOptions,
    ],
    createService: (mapInstance, resolvedSourceId) => {
      const options: Partial<ImageServiceOptions> & { url: string } = { url: props.url };
      if (props.renderingRule !== undefined) options.renderingRule = props.renderingRule;
      if (props.mosaicRule !== undefined) options.mosaicRule = props.mosaicRule;
      if (props.format !== undefined)
        options.format = props.format as ImageServiceOptions['format'];
      applyAuthOptions(options, props);

      return new ImageService(resolvedSourceId, mapInstance, options);
    },
  });

  return null;
}
