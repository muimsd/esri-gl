import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapLayerMouseEvent, MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriFeatureLayer } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type FilterMode = 'all' | 'population' | 'west';

type AttributeEntry = [string, unknown];

interface PopupHandle {
  remove: () => void;
  setLngLat: (lngLat: { lng: number; lat: number }) => PopupHandle;
  setHTML: (html: string) => PopupHandle;
  addTo: (target: unknown) => PopupHandle;
}

const FEATURE_LAYER_ID = 'react-map-gl-feature';
const FEATURE_SOURCE_URL =
  'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/USA_State_Boundaries/FeatureServer/0';

const FeatureServiceReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const popupRef = useRef<PopupHandle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedAttributes, setSelectedAttributes] = useState<AttributeEntry[]>([]);

  useEffect(
    () => () => {
      popupRef.current?.remove();
      popupRef.current = null;
    },
    []
  );

  const whereClause = useMemo(() => {
    if (filterMode === 'population') {
      return 'pop2000 > 5000000';
    }
    if (filterMode === 'west') {
      return "region = 'West'";
    }
    return '1=1';
  }, [filterMode]);

  const statusChip = useMemo(() => {
    switch (filterMode) {
      case 'population':
        return createBadgeStyle('#e0f2fe', '#075985');
      case 'west':
        return createBadgeStyle('#fef3c7', '#92400e');
      default:
        return createBadgeStyle('#bbf7d0', '#064e3b');
    }
  }, [filterMode]);

  const filterSummary = useMemo(() => {
    if (filterMode === 'population') return 'Showing states with population > 5M';
    if (filterMode === 'west') return 'Showing only western U.S. states';
    return 'Displaying all state boundaries';
  }, [filterMode]);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!mapReady) return;

      const feature = event.features?.[0];
      if (!feature) {
        setSelectedAttributes([]);
        popupRef.current?.remove();
        popupRef.current = null;
        return;
      }

      const entries = Object.entries(feature.properties || {}).slice(0, 8) as AttributeEntry[];
      setSelectedAttributes(entries);

      const html = `<div style="max-width:220px;font-size:13px;line-height:1.4;">${entries
        .map(([key, value]) => `<div><strong>${key}</strong>: ${value ?? '—'}</div>`)
        .join('')}</div>`;

      if (!popupRef.current) {
        popupRef.current = new maplibregl.Popup({ offset: 8 }) as unknown as PopupHandle;
      }

      popupRef.current
        .setLngLat({ lng: event.lngLat.lng, lat: event.lngLat.lat })
        .setHTML(html)
        .addTo(event.target);
    },
    [mapReady]
  );

  const handleMouseEnter = useCallback((event: MapLayerMouseEvent) => {
    event.target.getCanvas().style.cursor = 'pointer';
  }, []);

  const handleMouseLeave = useCallback((event: MapLayerMouseEvent) => {
    event.target.getCanvas().style.cursor = '';
  }, []);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Feature Service (react-map-gl)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Render ArcGIS FeatureServer data through the <code>EsriFeatureLayer</code> bridge
            component and inspect attributes directly from MapLibre.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          <span style={statusChip}>USA State Boundaries</span>
          <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '13px' }}>{filterSummary}</p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
            Click a state to view attributes from the live FeatureServer response.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Filters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: filterMode === 'all' ? '#2563eb' : '#ffffff',
                color: filterMode === 'all' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              All States
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('population')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: filterMode === 'population' ? '#2563eb' : '#ffffff',
                color: filterMode === 'population' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Population &gt; 5M
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('west')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: filterMode === 'west' ? '#2563eb' : '#ffffff',
                color: filterMode === 'west' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Western Region
            </button>
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Selected Feature</h3>
          {selectedAttributes.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
              Click on a state to inspect its attributes.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '12px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
                maxHeight: '160px',
                overflow: 'auto',
              }}
            >
              {selectedAttributes.map(([key, value]) => (
                <div
                  key={key}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}
                >
                  <strong>{key}</strong>
                  <span style={{ color: '#1f2937' }}>{String(value ?? '—')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          The feature layer automatically switches between GeoJSON and vector tile delivery based on
          service capabilities.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -98, latitude: 38, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          interactiveLayerIds={[FEATURE_LAYER_ID]}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          <EsriFeatureLayer
            id={FEATURE_LAYER_ID}
            url={FEATURE_SOURCE_URL}
            where={whereClause}
            paint={{
              'fill-color': '#2563eb',
              'fill-opacity': 0.35,
              'fill-outline-color': '#1d4ed8',
            }}
          />
        </Map>
      </div>
    </div>
  );
};

export default FeatureServiceReactMapGLDemo;
