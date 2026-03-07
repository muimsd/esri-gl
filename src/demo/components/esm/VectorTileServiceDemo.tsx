import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { VectorTileService } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

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
  const [layerLoading, setLayerLoading] = useState<boolean>(false);

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
        zoom: 12,
        center: [-118.805, 34.027],
      });

      map.current.on('load', async () => {
        try {
          const serviceUrl =
            'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer';

          service.current = new VectorTileService('vector-tiles-demo', map.current!, {
            url: serviceUrl,
          });

          setLoading(false);

          // Automatically add the vector tile layer when the map loads
          await addVectorTileLayer();
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

  const addVectorTileLayer = async (): Promise<void> => {
    if (service.current && map.current && !layerAdded && !layerLoading) {
      setLayerLoading(true);
      try {
        const style = await service.current.getStyle();
        console.log('Fetched style:', style);
        if (!style) {
          throw new Error('Style data is empty or invalid.');
        }
        const styleLayer = style as VTLStyleLayer;
        const layerConfig = {
          id: 'vector-tiles-layer',
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
          map.current.addLayer({ ...layerConfig, type: 'fill' });
        }

        setLayerAdded(true);
      } catch (error) {
        console.error('Error adding vector tile layer:', error);
        map.current.addLayer({
          id: 'vector-tiles-layer',
          type: 'fill',
          source: 'vector-tiles-demo',
          'source-layer': 'Santa_Monica_Mountains_Parcels',
          paint: {
            'fill-color': '#088',
            'fill-opacity': 0.8,
          },
        });
        setLayerAdded(true);
      } finally {
        setLayerLoading(false);
      }
    }
  };

  const addLayer = async (): Promise<void> => {
    await addVectorTileLayer();
  };

  const removeLayer = (): void => {
    if (map.current && layerAdded) {
      map.current.removeLayer('vector-tiles-layer');
      setLayerAdded(false);
    }
  };

  const getStatusBadge = () => {
    if (error) return <span style={createBadgeStyle('#ef4444', '#ef4444')}>Error</span>;
    if (loading) return <span style={createBadgeStyle('#f59e0b', '#92400e')}>Loading...</span>;
    if (layerLoading)
      return <span style={createBadgeStyle('#f59e0b', '#92400e')}>Adding Layer...</span>;
    if (layerAdded) return <span style={createBadgeStyle('#059669', '#065f46')}>Layer Active</span>;
    return <span style={createBadgeStyle('#71717a')}>Ready</span>;
  };

  const buttonStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: disabled ? '#f3f4f6' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px',
  });

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Vector Tile Service (ESM)</h2>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
        {getStatusBadge()}
        {error && (
          <span style={{ fontSize: '12px', color: '#ef4444', wordBreak: 'break-word' }}>
            {error}
          </span>
        )}

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Layer Control</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={addLayer}
            disabled={layerAdded || loading || layerLoading || !!error}
            style={buttonStyle(layerAdded || loading || layerLoading || !!error)}
          >
            {layerLoading ? 'Adding Layer...' : layerAdded ? 'Layer Added' : 'Add Layer'}
          </button>
          <button
            onClick={removeLayer}
            disabled={!layerAdded || loading || layerLoading || !!error}
            style={buttonStyle(!layerAdded || loading || layerLoading || !!error)}
          >
            Remove Layer
          </button>
        </div>

        <p style={DEMO_FOOTER_STYLE}>
          Vector tiles from ArcGIS Server load automatically on map initialization for scalable,
          interactive mapping with dynamic styling.
        </p>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default VectorTileServiceDemo;
