import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { TiledMapService } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

const TiledMapServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<TiledMapService | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTiled, setShowTiled] = useState<boolean>(true);
  const [opacity, setOpacity] = useState<number>(0.7);

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
        center: [-95.7129, 37.0902],
        zoom: 4,
      });

      map.current.on('load', () => {
        try {
          service.current = new TiledMapService('tiled-source', map.current!, {
            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
          });

          map.current!.addLayer({
            id: 'tiled-layer',
            type: 'raster',
            source: 'tiled-source',
            paint: {
              'raster-opacity': opacity,
            },
            layout: {
              visibility: showTiled ? 'visible' : 'none',
            },
          });

          setLoading(false);
        } catch (err) {
          setError('Failed to load Tiled Map Service: ' + (err as Error).message);
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

  useEffect(() => {
    if (!map.current || !map.current.getLayer('tiled-layer')) return;
    map.current.setPaintProperty('tiled-layer', 'raster-opacity', opacity);
  }, [opacity]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Tiled Map Service (ESM)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Pre-rendered cached map tiles from ArcGIS Server overlaid using direct ESM imports with{' '}
            <code>maplibre-gl</code>.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Loading tiles...</span>}
          {error && <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error}</span>}
          {!loading && !error && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Tiled layer ready</span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Visibility</h3>
          <button
            onClick={() => {
              setShowTiled(prev => {
                const next = !prev;
                if (map.current && map.current.getLayer('tiled-layer')) {
                  map.current.setLayoutProperty(
                    'tiled-layer',
                    'visibility',
                    next ? 'visible' : 'none'
                  );
                }
                return next;
              });
            }}
            disabled={loading || !!error}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              cursor: loading || !!error ? 'not-allowed' : 'pointer',
            }}
          >
            {showTiled ? 'Hide Tiled Layer' : 'Show Tiled Layer'}
          </button>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Opacity</h3>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            disabled={loading || !!error}
            style={{ width: '100%' }}
          />
          <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{(opacity * 100).toFixed(0)}%</p>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Esri World Topo Map served as tiled raster overlay. Adjust opacity to compare with the
          underlying OpenStreetMap basemap.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default TiledMapServiceDemo;
