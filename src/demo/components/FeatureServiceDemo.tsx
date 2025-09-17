import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
// @ts-ignore - CSS type declarations not provided
import 'maplibre-gl/dist/maplibre-gl.css';
import { FeatureService } from '../../main';

const FeatureServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

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

    map.current.on('load', () => {
      if (!map.current) return;

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
        if (map.current.getLayer(layerId)) return; // already added
        if (!map.current.getSource(sourceId)) return; // source not yet registered

        try {
          // Use getStyle() to get the appropriate layer configuration
          const style = await featureService.getStyle();
          console.log('Using FeatureService style:', style);

          // Add layer using the style configuration
          // @ts-ignore - Dynamic layer type and source from service metadata
          map.current.addLayer({
            id: layerId,
            type: style.type as unknown as maplibregl.LayerType,
            source: sourceId,
            layout: style.layout || {},
            paint: style.paint || {},
          });
        } catch (error) {
          console.error('Error adding layer with style:', error);
          // Fallback to basic circle layer
          map.current.addLayer({
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
        }
      };

      // Add layer when the source is available using sourcedata event
      const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
        if (e?.sourceId === sourceId) {
          addLayerIfNeeded();
          map.current?.off('sourcedata', onSourceData);
        }
      };
      map.current.on('sourcedata', onSourceData);

      // Fallback: try a few times in case sourcedata timing differs
      let attempts = 0;
      const interval = window.setInterval(() => {
        attempts += 1;
        addLayerIfNeeded();
        if (!map.current || map.current.getLayer(layerId) || attempts > 50) {
          window.clearInterval(interval);
          map.current?.off('sourcedata', onSourceData);
        }
      }, 100);

      // Add click handler for feature identification
      map.current.on('click', layerId, async e => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const props = feature.properties || {};
        const keys = Object.keys(props);
        const info = keys
          .slice(0, 5)
          .map(k => `<div><strong>${k}</strong>: ${String(props[k])}</div>`) // safe stringification
          .join('');

        new maplibregl.Popup().setLngLat(e.lngLat).setHTML(`<div>${info}</div>`).addTo(map.current!);
      });

      // Change cursor to pointer when hovering over counties
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          fontSize: '14px',
        }}
      >
        <strong>Feature Service Demo</strong> - Road Segments from ArcGIS FeatureServer with vector tile detection and dynamic bounding box filtering. Auto-detects vector tile support and falls back to GeoJSON. Features automatically update when you pan/zoom. Click features for details.
      </div>
      <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />
    </div>
  );
};

export default FeatureServiceDemo;
