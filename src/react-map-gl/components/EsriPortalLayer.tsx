import { useEffect, useRef } from 'react';
import { serviceFromPortalItem } from '@/Portal';
import type { PortalResolvedService, PortalItemServiceOptions } from '@/Portal';
import type { Map } from '@/types';
import type { EsriPortalLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import { applyAuthOptions } from '../utils/buildServiceOptions';
import { useMapLoaded } from '../hooks/useMapLoaded';

type MapLayerApi = {
  getLayer?: (id: string) => unknown;
  addLayer?: (layer: unknown, beforeId?: string) => void;
  removeLayer?: (id: string) => void;
  getSource?: (id: string) => unknown;
  removeSource?: (id: string) => void;
};

/**
 * React Map GL component that resolves an ArcGIS portal item id to the matching
 * esri-gl service and adds a renderer-appropriate layer for it.
 */
export function EsriPortalLayer(props: EsriPortalLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-portal-${props.id}`;
  const isMapLoaded = useMapLoaded(map);
  const serviceRef = useRef<PortalResolvedService | null>(null);

  useEffect(() => {
    if (!map || !isMapLoaded || !props.itemId) return;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return;

    const layerApi = mapInstance as unknown as MapLayerApi;
    const layerId = props.id;
    let cancelled = false;

    const options: PortalItemServiceOptions = {};
    applyAuthOptions(options, props);
    if (props.layerId !== undefined) options.layerId = props.layerId;
    if (props.portal !== undefined) options.portal = props.portal;

    serviceFromPortalItem(sourceId, mapInstance as unknown as Map, props.itemId, options)
      .then(async result => {
        if (cancelled) {
          try {
            result.service.remove();
          } catch {
            /* ignore */
          }
          return;
        }
        serviceRef.current = result.service;

        if (layerApi.getLayer?.(layerId)) {
          props.onResolve?.(result);
          return;
        }

        let layerConfig: Record<string, unknown>;
        if (result.kind === 'feature' || result.kind === 'vector-tile') {
          // These services expose a default style (source already set to sourceId).
          const styled = result.service as unknown as {
            getStyle: () => Promise<Record<string, unknown>>;
          };
          const style = await styled.getStyle();
          if (cancelled || layerApi.getLayer?.(layerId)) return;
          layerConfig = { ...style, id: layerId, source: sourceId };
        } else {
          // dynamic / tiled / image → raster
          layerConfig = { id: layerId, type: 'raster', source: sourceId };
        }

        if (props.visible === false) {
          layerConfig.layout = {
            ...((layerConfig.layout as Record<string, unknown>) || {}),
            visibility: 'none',
          };
        }

        layerApi.addLayer?.(layerConfig, props.beforeId);
        props.onResolve?.(result);
      })
      .catch(err => {
        if (!cancelled) console.warn('EsriPortalLayer: failed to resolve portal item', err);
      });

    return () => {
      cancelled = true;
      try {
        if (layerApi.getLayer?.(layerId)) layerApi.removeLayer?.(layerId);
      } catch {
        /* layer may already be gone */
      }
      if (serviceRef.current) {
        try {
          serviceRef.current.remove();
        } catch {
          /* ignore */
        }
        serviceRef.current = null;
      }
    };
    // Note: onResolve is intentionally excluded from deps to avoid re-resolving
    // when an inline callback identity changes.
  }, [
    map,
    isMapLoaded,
    sourceId,
    props.id,
    props.itemId,
    props.layerId,
    props.portal,
    props.beforeId,
    props.visible,
    props.token,
    props.apiKey,
    props.authentication,
  ]);

  return null;
}
