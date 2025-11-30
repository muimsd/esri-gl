import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriImageLayer } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type RenderingPreset = 'natural' | 'infrared' | 'default';

type RenderingRule = Record<string, unknown> | false;

const IMAGE_LAYER_ID = 'react-map-gl-image';
const IMAGE_SERVICE_URL = 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer';

const ImageServiceReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [preset, setPreset] = useState<RenderingPreset>('natural');
  const [opacity, setOpacity] = useState(0.8);

  const renderingRule = useMemo<RenderingRule>(() => {
    switch (preset) {
      case 'infrared':
        return { rasterFunction: 'Color Infrared' };
      case 'default':
        return false;
      default:
        return { rasterFunction: 'Natural Color' };
    }
  }, [preset]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current.getMap() as unknown as {
      getLayer: (id: string) => unknown;
      setPaintProperty: (layerId: string, name: string, value: unknown) => void;
      on: (type: string, listener: () => void) => void;
      off: (type: string, listener: () => void) => void;
    };

    const applyOpacity = () => {
      if (!map.getLayer(IMAGE_LAYER_ID)) return;
      map.setPaintProperty(IMAGE_LAYER_ID, 'raster-opacity', opacity);
    };

    applyOpacity();
    map.on('styledata', applyOpacity);

    return () => {
      map.off('styledata', applyOpacity);
    };
  }, [mapReady, opacity]);

  const statusChip = useMemo(() => {
    if (preset === 'infrared') return createBadgeStyle('#fecdd3', '#9f1239');
    if (preset === 'default') return createBadgeStyle('#e0f2fe', '#075985');
    return createBadgeStyle('#bbf7d0', '#065f46');
  }, [preset]);

  const presetSummary = useMemo(() => {
    if (preset === 'infrared') return 'Color Infrared rendering rule applied';
    if (preset === 'default') return 'Default service renderer (no rendering rule)';
    return 'Natural Color rendering rule applied';
  }, [preset]);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Image Service (react-map-gl)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Use <code>EsriImageLayer</code> to stream dynamic imagery and switch rendering rules on
            the fly without leaving the React tree.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          <span style={statusChip}>Landsat Multispectral</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563' }}>{presetSummary}</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Imagery updates instantly as rendering rules change thanks to MapLibre raster tiles.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Rendering Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setPreset('natural')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: preset === 'natural' ? '#2563eb' : '#ffffff',
                color: preset === 'natural' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Natural Color
            </button>
            <button
              type="button"
              onClick={() => setPreset('infrared')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: preset === 'infrared' ? '#2563eb' : '#ffffff',
                color: preset === 'infrared' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Color Infrared
            </button>
            <button
              type="button"
              onClick={() => setPreset('default')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: preset === 'default' ? '#2563eb' : '#ffffff',
                color: preset === 'default' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Default Renderer
            </button>
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Opacity</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={opacity}
              onChange={event => setOpacity(Number(event.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '13px', color: '#4b5563', width: '48px' }}>
              {(opacity * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Rendering rules are passed as props so the component recreates the Image Service when
          needed and updates MapLibre paint properties automatically.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -97, latitude: 36, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          <EsriImageLayer
            id={IMAGE_LAYER_ID}
            url={IMAGE_SERVICE_URL}
            renderingRule={renderingRule}
          />
        </Map>
      </div>
    </div>
  );
};

export default ImageServiceReactMapGLDemo;
