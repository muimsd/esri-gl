import { useEffect, useRef } from 'react';
import { VectorTileService } from '@/Services/VectorTileService';
import { esriRequest } from '@/request';
import type { EsriVectorTileLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import type { Map, VectorTileServiceOptions } from '@/types';
import { applyAuthOptions } from '../utils/buildServiceOptions';
import { useMapLoaded } from '../hooks/useMapLoaded';

type MapLayerApi = {
  getStyle?: () => unknown;
  getLayer?: (id: string) => unknown;
  addLayer?: (layer: unknown, beforeId?: string) => void;
  removeLayer?: (id: string) => void;
};

type VectorStyleLayer = {
  id: string;
  type: string;
  'source-layer'?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  filter?: unknown;
  minzoom?: number;
  maxzoom?: number;
};

/**
 * React Map GL component for Esri Vector Tile Service
 */
export function EsriVectorTileLayer(props: EsriVectorTileLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-vector-tile-${props.id}`;
  const isMapLoaded = useMapLoaded(map);
  const serviceRef = useRef<VectorTileService | null>(null);
  const layerIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!map || !isMapLoaded) return;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return;

    const layerApi = mapInstance as unknown as MapLayerApi;
    let cancelled = false;

    const options: VectorTileServiceOptions & { url: string } = { url: props.url };
    applyAuthOptions(options, props);

    const service = new VectorTileService(sourceId, mapInstance as unknown as Map, options);
    serviceRef.current = service;

    service
      .getStyle()
      .then(() => {
        if (cancelled) return undefined;

        // Fetch the full style document through the shared request layer so
        // auth (token / apiKey / authentication) is handled consistently.
        return esriRequest<{ layers?: VectorStyleLayer[] }>(
          `${props.url}/resources/styles/root.json`,
          {
            httpMethod: 'GET',
            token: props.token,
            apiKey: props.apiKey,
            authentication: props.authentication,
          }
        );
      })
      .then(data => {
        if (cancelled || !data?.layers) return;

        const addedIds: string[] = [];
        for (const layer of data.layers as VectorStyleLayer[]) {
          if (!layer['source-layer']) continue;
          const layerId = `${props.id}-${layer.id}`;

          if (layerApi.getLayer?.(layerId)) continue;

          const layerConfig: Record<string, unknown> = {
            id: layerId,
            type: layer.type,
            source: sourceId,
            'source-layer': layer['source-layer'],
          };
          if (layer.layout) layerConfig.layout = layer.layout;
          if (layer.paint) layerConfig.paint = layer.paint;
          if (layer.filter) layerConfig.filter = layer.filter;
          if (layer.minzoom !== undefined) layerConfig.minzoom = layer.minzoom;
          if (layer.maxzoom !== undefined) layerConfig.maxzoom = layer.maxzoom;

          if (props.visible === false) {
            layerConfig.layout = {
              ...((layerConfig.layout as Record<string, unknown>) || {}),
              visibility: 'none',
            };
          }

          if (props.beforeId) {
            layerApi.addLayer?.(layerConfig, props.beforeId);
          } else {
            layerApi.addLayer?.(layerConfig);
          }
          addedIds.push(layerId);
        }
        layerIdsRef.current = addedIds;
      })
      .catch(err => {
        console.warn('EsriVectorTileLayer: failed to load style layers', err);
      });

    return () => {
      cancelled = true;
      if (layerApi.getStyle?.()) {
        for (const id of layerIdsRef.current) {
          try {
            if (layerApi.getLayer?.(id)) layerApi.removeLayer?.(id);
          } catch {
            // layer may already be gone
          }
        }
      }
      layerIdsRef.current = [];
      service.remove();
      serviceRef.current = null;
    };
  }, [
    map,
    isMapLoaded,
    sourceId,
    props.url,
    props.id,
    props.beforeId,
    props.visible,
    props.token,
    props.apiKey,
    props.authentication,
    props.proxy,
    props.getAttributionFromService,
    props.requestParams,
    props.fetchOptions,
  ]);

  return null;
}
