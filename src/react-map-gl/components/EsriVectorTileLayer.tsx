import { useEffect, useRef, useState } from 'react';
import { VectorTileService } from '@/Services/VectorTileService';
import type { EsriVectorTileLayerProps } from '../types';
import { useReactMapGL } from '../utils/useReactMapGL';
import type { Map } from '@/types';

/**
 * React Map GL component for Esri Vector Tile Service
 */
export function EsriVectorTileLayer(props: EsriVectorTileLayerProps) {
  const { current: map } = useReactMapGL();
  const sourceId = props.sourceId || `esri-vector-tile-${props.id}`;
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const serviceRef = useRef<VectorTileService | null>(null);
  const layerIdsRef = useRef<string[]>([]);

  // Wait for map to be loaded before creating service
  useEffect(() => {
    if (!map) return;

    const mapInstance = map.getMap?.();
    const mi = mapInstance as any;
    if (!mi || typeof mi.isStyleLoaded !== 'function') return;

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

  // Create VectorTileService, fetch style, add layers, and clean up on unmount
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    const mapInstance = map.getMap?.();
    if (!mapInstance) return;

    const mi = mapInstance as any;
    let cancelled = false;

    const service = new VectorTileService(sourceId, mapInstance as unknown as Map, {
      url: props.url,
    });
    serviceRef.current = service;

    // Fetch the full style and add all layers from it
    service
      .getStyle()
      .then(() => {
        if (cancelled) return;

        // Fetch the full style document to get all layers
        const styleUrl = `${props.url}/resources/styles/root.json`;
        return fetch(styleUrl);
      })
      .then(response => {
        if (cancelled || !response) return;
        if (!response.ok) throw new Error(`Failed to fetch style: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (cancelled || !data?.layers) return;

        const addedIds: string[] = [];
        for (const layer of data.layers) {
          if (!layer['source-layer']) continue;
          const layerId = `${props.id}-${layer.id}`;

          if (mi.getLayer?.(layerId)) continue;

          const layerConfig: any = {
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

          // Apply visibility from props
          if (props.visible === false) {
            layerConfig.layout = { ...layerConfig.layout, visibility: 'none' };
          }

          if (props.beforeId) {
            mi.addLayer(layerConfig, props.beforeId);
          } else {
            mi.addLayer(layerConfig);
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
      // Remove layers we added
      if (mi.getStyle?.()) {
        for (const id of layerIdsRef.current) {
          try {
            if (mi.getLayer?.(id)) mi.removeLayer(id);
          } catch {
            // layer may already be gone
          }
        }
      }
      layerIdsRef.current = [];
      service.remove();
      serviceRef.current = null;
    };
  }, [map, isMapLoaded, sourceId, props.url, props.id, props.beforeId, props.visible]);

  return null;
}
