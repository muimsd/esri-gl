import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriTiledLayer } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

const TILED_SERVICE_URL =
  'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer';

const TiledMapServiceReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [blendMode, setBlendMode] = useState<'multiply' | 'normal'>('multiply');

  useEffect(() => {
    const mapInstance = mapRef.current?.getMap();
    if (!mapInstance) return;

    const layerId = 'react-map-gl-tiled';

    const applyOpacity = () => {
      if (!mapInstance.getLayer(layerId)) return;
      mapInstance.setPaintProperty(layerId, 'raster-opacity', opacity);
      mapInstance.setPaintProperty(
        layerId,
        'raster-fade-duration',
        blendMode === 'multiply' ? 0 : 300
      );
    };

    applyOpacity();
    mapInstance.on('styledata', applyOpacity);

    return () => {
      mapInstance.off('styledata', applyOpacity);
    };
  }, [opacity, blendMode]);

  const statusBadge = useMemo(() => {
    if (!visible) {
      return createBadgeStyle('#fcd34d', '#78350f');
    }
    return createBadgeStyle('#bbf7d0', '#064e3b');
  }, [visible]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            Tiled Map Service (react-map-gl)
          </h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Wrap Esri tiled map services in <code>EsriTiledLayer</code> and let{' '}
            <code>react-map-gl</code>
            manage the MapLibre lifecycle.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          <span style={statusBadge}>{visible ? 'Esri World Imagery active' : 'Layer hidden'}</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563' }}>
            Imagery blends with the basemap for contextual visualization.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Layer Controls</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={visible}
              onChange={event => setVisible(event.target.checked)}
            />
            Show World Imagery
          </label>

          <div style={{ marginTop: '12px' }}>
            <span
              style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#4b5563' }}
            >
              Opacity: {(opacity * 100).toFixed(0)}%
            </span>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={opacity}
              onChange={event => setOpacity(Number(event.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setBlendMode('multiply')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: blendMode === 'multiply' ? '#2563eb' : '#ffffff',
                color: blendMode === 'multiply' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Multiply Blend
            </button>
            <button
              type="button"
              onClick={() => setBlendMode('normal')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: blendMode === 'normal' ? '#2563eb' : '#ffffff',
                color: blendMode === 'normal' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Fade Blend
            </button>
          </div>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Toggle imagery on and off while keeping the vector basemap for labels and reference.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -118.2437, latitude: 34.0522, zoom: 9 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          {visible && <EsriTiledLayer id="react-map-gl-tiled" url={TILED_SERVICE_URL} />}
        </Map>
      </div>
    </div>
  );
};

export default TiledMapServiceReactMapGLDemo;
