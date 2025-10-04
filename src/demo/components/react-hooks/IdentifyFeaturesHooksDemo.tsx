import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDynamicMapService, useIdentifyFeatures } from '../../../react';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SOURCE_ID = 'hooks-identify-source';
const LAYER_ID = 'hooks-identify-layer';
const SERVICE_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';

const layerOptions = [
  { id: 0, name: 'Cities' },
  { id: 1, name: 'Highways' },
  { id: 2, name: 'States' },
  { id: 3, name: 'Counties' },
];

type PopupLike = {
  setLngLat(lngLat: { lng: number; lat: number }): PopupLike;
  setHTML(html: string): PopupLike;
  addTo(target: maplibregl.Map): PopupLike;
  remove?: () => void;
};

type IdentifyState =
  | { status: 'idle'; message: string }
  | { status: 'loading' }
  | { status: 'success'; html: string }
  | { status: 'error'; message: string };

const IdentifyFeaturesHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
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

  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);
  const [identifyState, setIdentifyState] = useState<IdentifyState>({
    status: 'idle',
    message: 'Click the map to identify visible features.',
  });

  const popupRef = useRef<PopupLike | null>(null);

  const dynamicOptions = useMemo(
    () => ({
      url: SERVICE_URL,
      layers: selectedLayers,
      transparent: true,
      format: 'png32',
    }),
    [selectedLayers]
  );

  const {
    service,
    loading: serviceLoading,
    error: serviceError,
    reload,
  } = useDynamicMapService({
    sourceId: SOURCE_ID,
    map: esriMap,
    options: dynamicOptions,
  });

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    const eventedMap = map as unknown as {
      isStyleLoaded?: () => boolean;
      loaded?: () => boolean;
      on: (type: string, listener: (...args: unknown[]) => void) => void;
      off: (type: string, listener: (...args: unknown[]) => void) => void;
    };

    const ensureLayer = () => {
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id: LAYER_ID,
          type: 'raster',
          source: SOURCE_ID,
        });
      }
    };

    const isLoaded = eventedMap.isStyleLoaded?.() ?? eventedMap.loaded?.() ?? false;
    const onLoad = () => {
      ensureLayer();
      eventedMap.off('load', onLoad);
    };

    if (isLoaded) {
      ensureLayer();
    } else {
      eventedMap.on('load', onLoad);
    }

    return () => {
      eventedMap.off('load', onLoad);
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
    };
  }, [mapReady, service]);

  useEffect(() => {
    if (!service) return;
    try {
      service.setLayers(selectedLayers);
    } catch (error) {
      console.warn('Failed to update dynamic layers', error);
    }
  }, [service, selectedLayers]);

  const {
    identify,
    loading: identifyLoading,
    error: identifyError,
  } = useIdentifyFeatures({
    url: SERVICE_URL,
    tolerance: 5,
    returnGeometry: false,
  });

  const handleIdentifyResult = useCallback((feature: GeoJSON.Feature | undefined) => {
    if (!feature || !feature.properties) {
      setIdentifyState({
        status: 'idle',
        message: 'No features found at that location. Try another spot.',
      });
      return null;
    }

    const entries = Object.entries(feature.properties).filter(([, value]) =>
      ['string', 'number', 'boolean'].includes(typeof value)
    );

    const content = entries
      .slice(0, 8)
      .map(
        ([key, value]) =>
          `<div style="display:flex; justify-content:space-between; gap:10px;"><strong>${
            key ?? '—'
          }</strong><span>${value ?? '—'}</span></div>`
      )
      .join('');

    const html = `<div style="max-width:240px; font-size:13px; line-height:1.4;">${
      content || 'No attributes available.'
    }</div>`;

    setIdentifyState({
      status: 'success',
      html,
    });

    return html;
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;

    const handleClick = async (evt: unknown) => {
      const event = evt as { lngLat: { lng: number; lat: number } };

      if (popupRef.current) {
        popupRef.current.remove?.();
        popupRef.current = null;
      }

      setIdentifyState({ status: 'loading' });

      const layerParam = selectedLayers.length ? `visible:${selectedLayers.join(',')}` : 'all';

      try {
        const results = await identify(
          {
            lng: event.lngLat.lng,
            lat: event.lngLat.lat,
          },
          {
            layers: layerParam,
          }
        );

        const feature = results?.features?.[0];
        const html = handleIdentifyResult(feature);

        const popup = new maplibregl.Popup({ closeOnMove: true }) as unknown as PopupLike;
        popup.setLngLat(event.lngLat);
        popup.setHTML(
          html ?? '<div style="font-size:13px;">No feature attributes available.</div>'
        );
        popup.addTo(map);
        popupRef.current = popup;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Identify failed';
        setIdentifyState({ status: 'error', message });
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
      if (popupRef.current) {
        popupRef.current.remove?.();
        popupRef.current = null;
      }
    };
  }, [mapReady, mapRef, service, identify, selectedLayers, handleIdentifyResult]);

  const toggleLayer = (layerId: number) => {
    setSelectedLayers(prev => {
      const exists = prev.includes(layerId);
      if (exists) {
        return prev.filter(id => id !== layerId);
      }
      return [...prev, layerId].sort((a, b) => a - b);
    });
  };

  const renderIdentifyState = () => {
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
              maxHeight: '200px',
              overflowY: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: identifyState.html }}
          />
        );
      case 'error':
        return <p style={{ margin: 0, color: '#b91c1c' }}>{identifyState.message}</p>;
      default:
        return null;
    }
  };

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Identify Features (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
            Click the map to run <code>useIdentifyFeatures</code> against the live USA MapServer.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {serviceLoading && (
            <span style={createBadgeStyle('#fde68a', '#78350f')}>Loading service…</span>
          )}
          {serviceError && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>
              Error: {serviceError.message}
            </span>
          )}
          {!serviceLoading && !serviceError && service && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Dynamic service ready</span>
          )}
          {identifyLoading && (
            <span style={createBadgeStyle('#fef3c7', '#92400e')}>Identifying…</span>
          )}
          {identifyError && (
            <span style={createBadgeStyle('#fee2e2', '#7f1d1d')}>
              Identify error: {identifyError.message}
            </span>
          )}
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
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Visible Sublayers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {layerOptions.map(layer => (
              <label key={layer.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedLayers.includes(layer.id)}
                  onChange={() => toggleLayer(layer.id)}
                />
                {layer.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Identify Result</h3>
          {renderIdentifyState()}
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Powered by USA MapServer layers 0-3 with identify tolerance of 5 screen pixels.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default IdentifyFeaturesHooksDemo;
