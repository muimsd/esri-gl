import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { ImageService } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type RenderingRuleOption = {
  label: string;
  value: string | null;
};

const RENDERING_RULES: RenderingRuleOption[] = [
  { label: 'Natural Color', value: 'Natural Color' },
  { label: 'Color Infrared', value: 'Color Infrared' },
  { label: 'Default', value: null },
];

const ImageServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<ImageService | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.8);
  const [activeRule, setActiveRule] = useState<RenderingRuleOption>(RENDERING_RULES[2]);

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
          service.current = new ImageService('image-source', map.current!, {
            url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
            format: 'jpg',
            renderingRule: false,
          });

          map.current!.addLayer({
            id: 'image-layer',
            type: 'raster',
            source: 'image-source',
            paint: {
              'raster-opacity': opacity,
            },
          });

          setLoading(false);
        } catch (err) {
          setError('Failed to load Image Service: ' + (err as Error).message);
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
    if (map.current && map.current.getLayer('image-layer')) {
      map.current.setPaintProperty('image-layer', 'raster-opacity', opacity);
    }
  }, [opacity]);

  const applyRenderingRule = (option: RenderingRuleOption): void => {
    if (!service.current) return;
    setActiveRule(option);
    if (!option.value) {
      service.current.setRenderingRule({});
    } else {
      service.current.setRenderingRule({
        rasterFunction: option.value,
      });
    }
  };

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Image Service (ESM)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Landsat multispectral imagery delivered via <code>ImageService</code> with live
            rendering rule swaps.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Loading imagery…</span>}
          {error && <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error}</span>}
          {!loading && !error && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Image layer ready</span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Rendering Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RENDERING_RULES.map(option => (
              <button
                key={option.label}
                onClick={() => applyRenderingRule(option)}
                disabled={loading || !!error}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: activeRule.label === option.label ? '#2563eb' : '#ffffff',
                  color: activeRule.label === option.label ? '#ffffff' : '#1f2937',
                  cursor: loading || error ? 'not-allowed' : 'pointer',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Opacity</h3>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={opacity}
            onChange={event => setOpacity(Number(event.target.value))}
            style={{ width: '100%' }}
          />
          <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{(opacity * 100).toFixed(0)}%</p>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Compare different Landsat spectral composites instantly without tearing down the service.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default ImageServiceDemo;
