import React, { useCallback, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriVectorBasemapLayer, VectorBasemapStyle } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type AuthMode = 'apiKey' | 'token';

type BasemapOption = {
  id: string;
  label: string;
};

const BASEMAP_OPTIONS: BasemapOption[] = [
  { id: 'arcgis/streets', label: 'Streets' },
  { id: 'arcgis/topographic', label: 'Topographic' },
  { id: 'arcgis/navigation', label: 'Navigation' },
  { id: 'arcgis/light-gray', label: 'Light Gray Canvas' },
  { id: 'arcgis/dark-gray', label: 'Dark Gray Canvas' },
  { id: 'arcgis/imagery', label: 'Imagery' },
];

const VectorBasemapStyleReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('apiKey');
  const [credential, setCredential] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('arcgis/streets');
  const [status, setStatus] = useState('Provide an Esri API key or token to load vector basemaps.');

  const statusChip = useMemo(() => {
    return credential.trim()
      ? createBadgeStyle('#bbf7d0', '#064e3b')
      : createBadgeStyle('#fee2e2', '#991b1b');
  }, [credential]);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  const applyBasemap = useCallback(() => {
    const trimmed = credential.trim();
    if (!mapReady || !mapRef.current) {
      setStatus('Map is still loading.');
      return;
    }

    if (!trimmed) {
      setStatus('Enter an API key or token before applying the style.');
      return;
    }

    const map = mapRef.current.getMap() as unknown as { setStyle: (style: string) => void };

    try {
      if (authMode === 'apiKey') {
        VectorBasemapStyle.applyStyle(map, selectedStyle, { apiKey: trimmed, version: 'v1' });
        setStatus(`Applied ${selectedStyle} using API key credentials.`);
      } else {
        VectorBasemapStyle.applyStyle(map, selectedStyle, { token: trimmed, version: 'v2' });
        setStatus(`Applied ${selectedStyle} using OAuth token credentials.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error applying style';
      setStatus(`Failed to apply basemap: ${message}`);
    }
  }, [authMode, credential, mapReady, selectedStyle]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            Vector Basemap Style (react-map-gl)
          </h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Use <code>VectorBasemapStyle.applyStyle</code> to swap Esri basemap styles on a live
            MapLibre instance. Supply either an API key or user token depending on your deployment.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Credential Mode</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setAuthMode('apiKey')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: authMode === 'apiKey' ? '#2563eb' : '#ffffff',
                color: authMode === 'apiKey' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              API Key
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('token')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: authMode === 'token' ? '#2563eb' : '#ffffff',
                color: authMode === 'token' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Token
            </button>
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Credentials</h3>
          <input
            type="text"
            value={credential}
            onChange={event => setCredential(event.target.value)}
            placeholder={authMode === 'apiKey' ? 'Esri API key' : 'OAuth token'}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
            }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
            Keys and tokens are never persisted; they stay in-memory for demo purposes only.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Basemap Style</h3>
          <select
            value={selectedStyle}
            onChange={event => setSelectedStyle(event.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
            }}
          >
            {BASEMAP_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <button
            type="button"
            onClick={applyBasemap}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Apply Basemap Style
          </button>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Status</h3>
          <span style={statusChip}>
            {credential.trim() ? 'Credential detected' : 'Credential missing'}
          </span>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563' }}>{status}</p>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Tokens require the v2 Basemap Styles API. API keys target the v1 endpoint. Switching modes
          will reapply the style using the appropriate host.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -98, latitude: 39, zoom: 3.7 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          {authMode === 'token' && credential.trim() && (
            <EsriVectorBasemapLayer
              id="react-map-gl-vector-basemap"
              basemapEnum={selectedStyle}
              token={credential.trim()}
            />
          )}
        </Map>
      </div>
    </div>
  );
};

export default VectorBasemapStyleReactMapGLDemo;
