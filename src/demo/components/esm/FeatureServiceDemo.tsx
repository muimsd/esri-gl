import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
// @ts-ignore - CSS type declarations not provided
import 'maplibre-gl/dist/maplibre-gl.css';
import { FeatureService } from '../../../main';

type PopupLike = {
  setLngLat(lngLat: { lng: number; lat: number }): PopupLike;
  setHTML(html: string): PopupLike;
  addTo(target: unknown): PopupLike;
};

const FeatureServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

      // Create a Feature Service using GeoJSON (more reliable for demo)
      const sourceId = 'tn-bridges-source';
      const layerId = 'tn-bridges-layer';
      const featureService = new FeatureService(sourceId, map.current, {
        // Test with Santa Monica Parcels which has both FeatureServer and VectorTileServer
        url: 'https://services2.arcgis.com/nf3p7v7Zy4fTOh6M/ArcGIS/rest/services/Road_Segment/FeatureServer/0',
        // url: 'https://services6.arcgis.com/drBkxhK7nF7o7hKT/arcgis/rest/services/TN_Bridges/FeatureServer/0',
        useVectorTiles: true, // Try vector tiles first, will fallback to GeoJSON if not available
        useBoundingBox: true, // Enable screen bounding box filtering for performance
        where: '1=1',
        outFields: '*',
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

          setLoadingMessage('Loading complete!');
          setTimeout(() => setIsLoading(false), 500);
        } catch (error) {
          console.error('Error adding layer with style:', error);
          setLoadingMessage('Adding fallback layer...');

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

          setLoadingMessage('Loading complete!');
          setTimeout(() => setIsLoading(false), 500);
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
            setLoadingMessage('Loading timeout - layer may not be visible');
            setTimeout(() => setIsLoading(false), 1000);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div
        style={{
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          fontSize: '14px',
        }}
      >
        <strong>Feature Service Demo</strong> - Road Segments from ArcGIS FeatureServer with vector
        tile detection and dynamic bounding box filtering. Auto-detects vector tile support and
        falls back to GeoJSON. Features automatically update when you pan/zoom. Click features for
        details.
      </div>
      <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px',
            }}
          />
          <div
            style={{
              fontSize: '16px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            {loadingMessage}
          </div>
        </div>
      )}

      {/* CSS Animation for Spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FeatureServiceDemo;
