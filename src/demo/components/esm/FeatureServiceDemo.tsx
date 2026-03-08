import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { FeatureService } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { MapLoader } from '../shared/MapLoader';

type PopupLike = {
  setLngLat(lngLat: { lng: number; lat: number }): PopupLike;
  setHTML(html: string): PopupLike;
  addTo(target: unknown): PopupLike;
};

const FeatureServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing map...');

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre GL JS map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      },
      center: [-86.5804, 36.1627], // Tennessee
      zoom: 8,
    });

    const mapInstance = map.current as unknown as {
      on: (...args: unknown[]) => maplibregl.Map;
      off: (...args: unknown[]) => maplibregl.Map;
      getLayer(id: string): unknown;
      getSource(id: string): unknown;
      addLayer(layer: unknown): void;
      removeLayer(id: string): void;
      removeSource(id: string): void;
      getCanvas(): HTMLCanvasElement;
    };

    mapInstance.on('load', () => {
      if (!map.current) return;

      setLoadingMessage('Creating Feature Service...');

      // Create a Feature Service with PBF support (tile-based loading)
      const sourceId = 'tn-bridges-source';
      const layerId = 'tn-bridges-layer';
      const featureService = new FeatureService(sourceId, map.current, {
        // Tennessee Bridges - demonstrates PBF format when supported
        url: 'https://services6.arcgis.com/drBkxhK7nF7o7hKT/arcgis/rest/services/TN_Bridges/FeatureServer/0',
        where: '1=1',
        outFields: '*',
        // PBF options - service automatically uses PBF if supported, falls back to GeoJSON
        minZoom: 7, // Minimum zoom level for tile requests
        useServiceBounds: true, // Use service extent to limit requests
      });

      // Helper to add layer safely using getStyle() for proper layer configuration
      const addLayerIfNeeded = async () => {
        if (!map.current) return;
        if (mapInstance.getLayer(layerId)) return; // already added
        if (!mapInstance.getSource(sourceId)) return; // source not yet registered

        setLoadingMessage('Loading layer style...');

        try {
          // Use getStyle() to get the appropriate layer configuration
          const style = (await featureService.getStyle()) as unknown as Record<string, unknown>;
          console.log('Using FeatureService style:', style);

          setLoadingMessage('Adding layer to map...');

          // Add layer using the style configuration
          mapInstance.addLayer({
            id: layerId,
            type: (typeof style.type === 'string' ? style.type : 'circle') as string,
            source: sourceId,
            layout: (style.layout as Record<string, unknown>) || {},
            paint: (style.paint as Record<string, unknown>) || {},
          });

          setLoadingMessage('Ready');
          setIsLoading(false);
        } catch (error) {
          console.error('Error adding layer with style:', error);
          setLoadingMessage('Fallback style applied');

          // Fallback to basic circle layer
          mapInstance.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': 4,
              'circle-color': '#3b82f6',
              'circle-stroke-color': '#1e40af',
              'circle-stroke-width': 1,
            },
          });

          setIsLoading(false);
        }
      };

      // Add layer when the source is available using sourcedata event
      const onSourceData = (event: unknown) => {
        const e = event as { sourceId?: string };
        if (e?.sourceId === sourceId) {
          setLoadingMessage('Processing source data...');
          addLayerIfNeeded();
          mapInstance.off('sourcedata', onSourceData);
        }
      };
      mapInstance.on('sourcedata', onSourceData);

      // Fallback: try a few times in case sourcedata timing differs
      let attempts = 0;
      const interval = window.setInterval(() => {
        attempts += 1;
        addLayerIfNeeded();
        if (!map.current || mapInstance.getLayer(layerId) || attempts > 50) {
          window.clearInterval(interval);
          mapInstance.off('sourcedata', onSourceData);
          // Ensure loading is disabled if we timeout
          if (attempts > 50) {
            setLoadingMessage('Loading timeout');
            setHasError(true);
            setIsLoading(false);
          }
        }
      }, 100);

      // Add click handler for feature identification
      mapInstance.on('click', layerId, async (event: unknown) => {
        const e = event as {
          features?: Array<{ properties?: Record<string, unknown> }>;
          lngLat: { lng: number; lat: number };
        };
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const props = feature.properties || {};
        const keys = Object.keys(props);
        const info = keys
          .slice(0, 5)
          .map(k => `<div><strong>${k}</strong>: ${String(props[k])}</div>`) // safe stringification
          .join('');

        const popup = new maplibregl.Popup() as unknown as PopupLike;
        popup.setLngLat(e.lngLat).setHTML(`<div>${info}</div>`).addTo(map.current);
      });

      // Change cursor to pointer when hovering over counties
      mapInstance.on('mouseenter', layerId, () => {
        if (map.current) mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', layerId, () => {
        if (map.current) mapInstance.getCanvas().style.cursor = '';
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const statusBadge = () => {
    if (hasError) {
      return <span style={createBadgeStyle('#ef4444', '#ef4444')}>Error: {loadingMessage}</span>;
    }
    if (isLoading) {
      return <span style={createBadgeStyle('#f59e0b', '#92400e')}>{loadingMessage}</span>;
    }
    return <span style={createBadgeStyle('#059669', '#065f46')}>Ready</span>;
  };

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Feature Service (ESM)</h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#52525b', lineHeight: 1.5 }}>
          Tennessee Bridges loaded via ArcGIS FeatureServer using tile-based PBF format.
          Automatically uses Protocol Buffer Format for efficient data transfer when supported
          (ArcGIS Server 10.7+), falls back to GeoJSON otherwise. Click features for details.
        </p>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {statusBadge()}
        </div>

        <p style={DEMO_FOOTER_STYLE}>esri-gl &middot; FeatureService with PBF</p>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
        {isLoading && <MapLoader message={loadingMessage} />}
      </div>
    </div>
  );
};

export default FeatureServiceDemo;
