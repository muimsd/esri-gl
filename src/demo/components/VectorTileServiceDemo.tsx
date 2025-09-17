import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VectorTileService } from '../../main';

type VTLStyleLayer = {
  type: 'fill' | 'line' | 'symbol' | 'circle' | string;
  source?: string;
  'source-layer': string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
};

const VectorTileServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<VectorTileService | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [layerAdded, setLayerAdded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    try {
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
        zoom: 12, // starting zoom
        center: [-118.805, 34.027], // starting location [longitude, latitude]
      });

      map.current.on('load', () => {
        try {
          // Example Vector Tile Service URL
          const serviceUrl =
            'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer';

          service.current = new VectorTileService('vector-tiles-demo', map.current!, {
            url: serviceUrl,
          });

          setLoading(false);
        } catch (err) {
          setError('Failed to load Vector Tile Service: ' + (err as Error).message);
          setLoading(false);
        }
      });
    } catch (err) {
      setError('Failed to initialize map: ' + (err as Error).message);
      setLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const addLayer = async (): Promise<void> => {
    if (service.current && map.current && !layerAdded) {
      try {
        const style = await service.current.getStyle();
        console.log('Fetched style:', style);
        if (!style) {
          throw new Error('Style data is empty or invalid.');
        }
        const styleLayer = style as VTLStyleLayer;
        // Add layer with dynamic type checking
        const layerConfig = {
          id: 'vector-tiles-layer',
          // Use the service-mapped source id to ensure it matches the added source
          source: styleLayer.source || 'vector-tiles-demo',
          'source-layer': styleLayer['source-layer'],
          layout: styleLayer.layout || {},
          paint: styleLayer.paint || {},
        } as const;

        if (style.type === 'fill') {
          map.current.addLayer({ ...layerConfig, type: 'fill' });
        } else if (style.type === 'line') {
          map.current.addLayer({ ...layerConfig, type: 'line' });
        } else if (style.type === 'symbol') {
          map.current.addLayer({ ...layerConfig, type: 'symbol' });
        } else if (style.type === 'circle') {
          map.current.addLayer({ ...layerConfig, type: 'circle' });
        } else {
          // Default to fill
          map.current.addLayer({ ...layerConfig, type: 'fill' });
        }

        setLayerAdded(true);
      } catch (error) {
        console.error('Error adding vector tile layer:', error);
        // Fallback style
        map.current.addLayer({
          id: 'vector-tiles-layer',
          type: 'fill',
          source: 'vector-tiles-demo',
          // Known source-layer for Santa Monica Parcels dataset
          'source-layer': 'Santa_Monica_Mountains_Parcels',
          paint: {
            'fill-color': '#088',
            'fill-opacity': 0.8,
          },
        });
        setLayerAdded(true);
      }
    }
  };

  const removeLayer = (): void => {
    if (map.current && layerAdded) {
      map.current.removeLayer('vector-tiles-layer');
      setLayerAdded(false);
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="map-container" style={{ position: 'relative', height: '100%' }}>
      <div ref={mapContainer} className="map" style={{ flex: 1, width: '100%', height: '100%' }} />

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Vector Tile Layer</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={addLayer}
              disabled={layerAdded || loading || !!error}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: layerAdded ? '#ccc' : '#fff',
                cursor: layerAdded || loading ? 'not-allowed' : 'pointer',
              }}
            >
              Add Layer
            </button>
            <button
              onClick={removeLayer}
              disabled={!layerAdded || loading || !!error}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: !layerAdded ? '#ccc' : '#fff',
                cursor: !layerAdded || loading ? 'not-allowed' : 'pointer',
              }}
            >
              Remove Layer
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading" style={{}}>
          Loading Vector Tile Service...
        </div>
      )}

      {!loading && (
        <div
          className="info-panel"
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'white',
            padding: '8px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          <h3 style={{ margin: '0 0 6px 0' }}>Vector Tile Service</h3>
          <p style={{ margin: 0 }}>
            Vector tiles from ArcGIS Server for scalable, interactive mapping with dynamic styling.
          </p>
          <div className="url" style={{ fontSize: 12, marginTop: 6 }}>
            https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorTileServiceDemo;
