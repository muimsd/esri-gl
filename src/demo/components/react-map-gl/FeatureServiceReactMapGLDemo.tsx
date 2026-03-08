import React, { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
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
import { MapLoader } from '../shared/MapLoader';

type AttributeEntry = [string, unknown];

interface PopupHandle {
  remove: () => void;
  setLngLat: (lngLat: { lng: number; lat: number }) => PopupHandle;
  setHTML: (html: string) => PopupHandle;
  addTo: (target: unknown) => PopupHandle;
}

const FEATURE_LAYER_ID = 'react-map-gl-feature';
const FEATURE_SOURCE_URL =
  'https://services6.arcgis.com/drBkxhK7nF7o7hKT/arcgis/rest/services/TN_Bridges/FeatureServer/0';

const FeatureServiceReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const popupRef = useRef<PopupHandle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<AttributeEntry[]>([]);
  const [featureLoading, setFeatureLoading] = useState(true);

  useEffect(
    () => () => {
      popupRef.current?.remove();
      popupRef.current = null;
    },
    []
  );

  // Detect when the feature source has loaded data
  useEffect(() => {
    if (!mapReady) return;
    const mi = mapRef.current?.getMap?.() as any;
    if (!mi) return;

    setFeatureLoading(true);

    const sourceId = `esri-feature-${FEATURE_LAYER_ID}`;
    const onSourceData = (e: any) => {
      if (e?.sourceId === sourceId && e?.isSourceLoaded) {
        setFeatureLoading(false);
        mi.off('sourcedata', onSourceData);
      }
    };
    mi.on('sourcedata', onSourceData);

    // Fallback timeout
    const timer = window.setTimeout(() => {
      setFeatureLoading(false);
      mi.off('sourcedata', onSourceData);
    }, 15000);

    return () => {
      window.clearTimeout(timer);
      mi.off('sourcedata', onSourceData);
    };
  }, [mapReady]);

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
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            Feature Service (react-map-gl + PBF)
          </h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Tennessee Bridges loaded via ArcGIS FeatureServer using the{' '}
            <code>EsriFeatureLayer</code> bridge component with tile-based PBF loading. Click
            features for details.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {featureLoading ? (
            <span style={createBadgeStyle('#fde68a', '#78350f')}>Loading features...</span>
          ) : (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>TN Bridges ready</span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Selected Feature</h3>
          {selectedAttributes.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>
              Click on a bridge to inspect its attributes.
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
          The feature layer uses tile-based PBF loading for efficient data transfer, with automatic
          GeoJSON fallback for older servers.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        {featureLoading && <MapLoader message="Loading feature data..." />}
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -86.5804, latitude: 36.1627, zoom: 8 }}
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
            where="1=1"
            outFields="*"
            type="circle"
            paint={{
              'circle-radius': 4,
              'circle-color': '#3b82f6',
              'circle-stroke-color': '#1e40af',
              'circle-stroke-width': 1,
            }}
          />
        </Map>
      </div>
    </div>
  );
};

export default FeatureServiceReactMapGLDemo;
