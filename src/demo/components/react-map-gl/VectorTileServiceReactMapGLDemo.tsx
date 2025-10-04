import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriVectorTileLayer } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

interface VectorTileMetadata {
  name?: string;
  description?: string;
  capabilities?: string;
  maxLOD?: number;
  minLOD?: number;
}

const VECTOR_TILE_URL =
  'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer';

const VectorTileServiceReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [visible, setVisible] = useState(true);
  const [metadata, setMetadata] = useState<VectorTileMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingMetadata(true);

    fetch(`${VECTOR_TILE_URL}?f=pjson`, { signal: controller.signal })
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        if (data) {
          setMetadata({
            name: data?.name,
            description: data?.description,
            capabilities: data?.capabilities,
            maxLOD: data?.maxLOD,
            minLOD: data?.minLOD,
          });
        }
      })
      .catch(() => {
        setMetadata(null);
      })
      .finally(() => setLoadingMetadata(false));

    return () => {
      controller.abort();
    };
  }, []);

  const statusChip = useMemo(() => {
    if (!visible) return createBadgeStyle('#fde68a', '#92400e');
    return createBadgeStyle('#bbf7d0', '#064e3b');
  }, [visible]);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            Vector Tile Service (react-map-gl)
          </h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Drop ArcGIS VectorTileServer content into MapLibre via the{' '}
            <code>EsriVectorTileLayer</code>
            bridge component. Lifecycle cleanup happens automatically when the component unmounts.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          <span style={statusChip}>{visible ? 'World Basemap Active' : 'Layer Hidden'}</span>
          {metadata ? (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563' }}>
              {metadata.description || 'Global basemap tiles with labels and boundaries.'}
            </p>
          ) : (
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563' }}>
              {loadingMetadata ? 'Loading service metadata…' : 'Metadata unavailable (offline?)'}
            </p>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Layer Controls</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={visible}
              onChange={event => setVisible(event.target.checked)}
            />
            Show Vector Basemap
          </label>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Toggle the component to test automatic teardown of vector layers and sources.
          </p>
        </div>

        {metadata && (
          <div>
            <h3 style={DEMO_SECTION_TITLE_STYLE}>Capabilities</h3>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '12px',
                color: '#1f2937',
              }}
            >
              <div>
                <strong>Min / Max Zoom:</strong> {metadata.minLOD ?? '—'} / {metadata.maxLOD ?? '—'}
              </div>
              <div>
                <strong>Capabilities:</strong> {metadata.capabilities || 'Not reported'}
              </div>
            </div>
          </div>
        )}

        <div style={DEMO_FOOTER_STYLE}>
          Vector tiles are added directly to the map style—no extra Mapbox GL boilerplate required.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -98, latitude: 39, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          {mapReady && visible && (
            <EsriVectorTileLayer id="react-map-gl-vector-basemap" url={VECTOR_TILE_URL} />
          )}
        </Map>
      </div>
    </div>
  );
};

export default VectorTileServiceReactMapGLDemo;
