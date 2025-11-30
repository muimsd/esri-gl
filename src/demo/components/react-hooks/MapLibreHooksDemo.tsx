import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDynamicMapService, useIdentifyFeatures } from '../../../react';
import type { Map as EsriMap } from '../../../types';

type PopupLike = {
  setLngLat(lngLat: { lng: number; lat: number }): PopupLike;
  setHTML(html: string): PopupLike;
  addTo(target: unknown): PopupLike;
  remove(): void;
};

type IdentifyState =
  | { status: 'idle'; message: string }
  | { status: 'loading' }
  | { status: 'success'; html: string }
  | { status: 'error'; message: string };

const DYNAMIC_SERVICE_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';

const LAYER_ID = 'hooks-dynamic-layer';
const SOURCE_ID = 'hooks-dynamic-source';

const popupContentFromFeature = (feature: GeoJSON.Feature | undefined) => {
  if (!feature) {
    return '<div>No features found at this location.</div>';
  }
  const { properties } = feature;
  if (!properties) {
    return '<div>Feature has no attributes.</div>';
  }
  const entries = Object.entries(properties).filter(([, value]) =>
    ['string', 'number', 'boolean'].includes(typeof value)
  );
  if (!entries.length) {
    return '<div>Feature has no displayable attributes.</div>';
  }
  const rows = entries
    .slice(0, 8)
    .map(
      ([key, value]) =>
        `<div style="display:flex; justify-content:space-between; gap:12px;"><strong>${
          key ?? '—'
        }</strong><span>${value ?? '—'}</span></div>`
    )
    .join('');
  return `<div style="max-width:260px; font-size:13px; line-height:1.4;">${rows}</div>`;
};

const sidebarStyle: React.CSSProperties = {
  width: '320px',
  padding: '16px',
  borderRight: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const statusBadgeStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: color,
  color: color === '#1f2937' ? '#ffffff' : '#111827',
});

const MapLibreHooksDemo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const popupRef = useRef<PopupLike | null>(null);
  const [identifyState, setIdentifyState] = useState<IdentifyState>({
    status: 'idle',
    message: 'Click the map to identify features.',
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    const navControl = new maplibregl.NavigationControl({ showCompass: false });
    (
      mapInstance as unknown as { addControl(control: unknown, position?: string): void }
    ).addControl(navControl, 'top-left');

    mapRef.current = mapInstance;

    const handleLoad = () => {
      if (isMountedRef.current) {
        setIsMapReady(true);
      }
    };

    mapInstance.on('load', handleLoad);

    return () => {
      mapInstance.off('load', handleLoad);
      popupRef.current?.remove();
      mapInstance.remove();
      mapRef.current = null;
      if (isMountedRef.current) {
        setIsMapReady(false);
      }
    };
  }, []);

  const mapForService = useMemo(() => {
    if (!isMapReady || !mapRef.current) return null;
    return mapRef.current as unknown as EsriMap;
  }, [isMapReady]);

  const {
    service,
    loading: serviceLoading,
    error: serviceError,
    reload,
  } = useDynamicMapService({
    sourceId: SOURCE_ID,
    map: mapForService,
    options: {
      url: DYNAMIC_SERVICE_URL,
      layers: [2],
      format: 'png32',
      transparent: true,
    },
  });

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !service) return;

    const mapInstance = mapRef.current as unknown as {
      getLayer(id: string): unknown;
      removeLayer(id: string): void;
      addLayer(layer: unknown): void;
      once: (type: string, listener: () => void) => void;
      isStyleLoaded(): boolean;
    };

    const ensureLayer = () => {
      if (!mapInstance.getLayer(LAYER_ID)) {
        mapInstance.addLayer({
          id: LAYER_ID,
          type: 'raster',
          source: SOURCE_ID,
          layout: { visibility: 'visible' },
        });
      }
    };

    if (mapInstance.isStyleLoaded()) {
      ensureLayer();
    } else {
      mapInstance.once('load', ensureLayer);
    }

    return () => {
      if (mapInstance.getLayer(LAYER_ID)) {
        mapInstance.removeLayer(LAYER_ID);
      }
    };
  }, [isMapReady, service]);

  const {
    identify,
    loading: identifyLoading,
    error: identifyError,
  } = useIdentifyFeatures({
    url: DYNAMIC_SERVICE_URL,
    tolerance: 5,
    returnGeometry: false,
  });

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !service) return;

    const mapInstance = mapRef.current as unknown as {
      on: (type: string, listener: (event: unknown) => void) => void;
      off: (type: string, listener: (event: unknown) => void) => void;
    };

    const handleClick = async (event: unknown) => {
      const e = event as { lngLat: { lng: number; lat: number } };
      popupRef.current?.remove();
      setIdentifyState({ status: 'loading' });

      try {
        const result = await identify(
          { lng: e.lngLat.lng, lat: e.lngLat.lat },
          { layers: 'visible:2', returnGeometry: false }
        );
        const feature = result?.features?.[0];
        const html = popupContentFromFeature(feature);
        const popup = new maplibregl.Popup({ closeOnMove: true }) as unknown as PopupLike;
        popup.setLngLat(e.lngLat).setHTML(html).addTo(mapRef.current);
        popupRef.current = popup;
        setIdentifyState({
          status: feature ? 'success' : 'idle',
          message: 'Feature identified.',
          html,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Identify failed';
        setIdentifyState({ status: 'error', message });
      }
    };

    mapInstance.on('click', handleClick);
    return () => {
      mapInstance.off('click', handleClick);
    };
  }, [isMapReady, service, identify]);

  const renderStatus = () => {
    if (serviceLoading) {
      return <span style={statusBadgeStyle('#fde68a')}>Loading dynamic service…</span>;
    }
    if (serviceError) {
      return <span style={statusBadgeStyle('#fecaca')}>Service error: {serviceError.message}</span>;
    }
    if (service) {
      return <span style={statusBadgeStyle('#bbf7d0')}>Dynamic service active</span>;
    }
    return <span style={statusBadgeStyle('#e5e7eb')}>Waiting for map…</span>;
  };

  const renderIdentify = () => {
    switch (identifyState.status) {
      case 'idle':
        return <p style={{ margin: 0, color: '#4b5563' }}>{identifyState.message}</p>;
      case 'loading':
        return <p style={{ margin: 0, color: '#2563eb' }}>Identifying feature…</p>;
      case 'success':
        return (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
            }}
            dangerouslySetInnerHTML={{ __html: identifyState.html }}
          />
        );
      case 'error':
        return (
          <p style={{ margin: 0, color: '#b91c1c' }}>Identify failed: {identifyState.message}</p>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <aside style={sidebarStyle}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>React Hooks Demo</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Lifecycle-managed Dynamic Map Service with identify workflow powered by esri-gl React
            hooks.
          </p>
        </div>

        <div>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#6b7280',
            }}
          >
            Service Status
          </h3>
          {renderStatus()}
          <button
            onClick={reload}
            disabled={serviceLoading}
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              cursor: serviceLoading ? 'not-allowed' : 'pointer',
            }}
          >
            Reload Service
          </button>
        </div>

        <div>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#6b7280',
            }}
          >
            Identify Result
          </h3>
          {identifyLoading && <span style={statusBadgeStyle('#fef3c7')}>Locating features…</span>}
          {identifyError && (
            <span style={statusBadgeStyle('#fecaca')}>Identify error: {identifyError.message}</span>
          )}
          {renderIdentify()}
        </div>

        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: 'auto' }}>
          Dynamic service layers: Cities &amp; States (USA MapServer, layers 0 &amp; 2)
        </div>
      </aside>

      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default MapLibreHooksDemo;
