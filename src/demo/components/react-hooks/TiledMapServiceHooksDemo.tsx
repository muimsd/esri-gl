import React, { useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTiledMapService } from '../../../react';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SOURCE_ID = 'hooks-tiled-source';
const LAYER_ID = 'hooks-tiled-layer';
const TILED_SERVICE_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';

const TiledMapServiceHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-98.5795, 39.8283],
    zoom: 3,
  });

  const [opacity, setOpacity] = useState(1);
  const tiledOptions = useMemo(
    () => ({
      url: TILED_SERVICE_URL,
    }),
    []
  );

  const { service, loading, error, reload } = useTiledMapService({
    sourceId: SOURCE_ID,
    map: esriMap,
    options: tiledOptions,
    sourceOptions: {
      tileSize: 256,
      attribution: 'Esri World Imagery',
    },
  });

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    const eventedMap = map as unknown as {
      on?: (type: string, listener: (...args: unknown[]) => void) => void;
      off?: (type: string, listener: (...args: unknown[]) => void) => void;
      isStyleLoaded?: () => boolean;
      loaded?: () => boolean;
    };
    const layerApi = map as unknown as {
      getLayer?: (id: string) => unknown;
      addLayer?: (layer: unknown) => void;
      removeLayer?: (id: string) => void;
      setPaintProperty?: (layerId: string, name: string, value: unknown) => void;
    };

    // Guard against missing APIs
    if (
      typeof eventedMap.on !== 'function' ||
      typeof eventedMap.off !== 'function' ||
      typeof layerApi.getLayer !== 'function' ||
      typeof layerApi.addLayer !== 'function' ||
      typeof layerApi.removeLayer !== 'function' ||
      typeof layerApi.setPaintProperty !== 'function'
    ) {
      return;
    }

    // Bind methods to preserve context
    const mapOn = eventedMap.on.bind(eventedMap);
    const mapOff = eventedMap.off.bind(eventedMap);
    const getLayer = layerApi.getLayer.bind(layerApi);
    const addLayer = layerApi.addLayer.bind(layerApi);
    const removeLayer = layerApi.removeLayer.bind(layerApi);
    const setPaintProperty = layerApi.setPaintProperty.bind(layerApi);

    const ensureLayer = () => {
      try {
        const mapInstance = map as unknown as { getSource?: (id: string) => unknown };
        if (typeof mapInstance.getSource === 'function' && !mapInstance.getSource(SOURCE_ID)) {
          return; // Source not ready yet
        }
        if (!getLayer(LAYER_ID)) {
          addLayer({
            id: LAYER_ID,
            type: 'raster',
            source: SOURCE_ID,
            layout: {
              visibility: 'visible',
            },
            paint: {
              'raster-opacity': opacity,
            },
          });
          // Ensure opacity is set
          setPaintProperty(LAYER_ID, 'raster-opacity', opacity);
        } else {
          setPaintProperty(LAYER_ID, 'raster-opacity', opacity);
        }
      } catch (error) {
        console.warn('Failed to ensure tiled layer', error);
      }
    };

    const onLoad = () => {
      ensureLayer();
      try {
        mapOff('load', onLoad);
      } catch {
        // Ignore cleanup errors
      }
    };

    // Always try to ensure layer immediately, and also on style events
    ensureLayer();
    try {
      mapOn('load', onLoad);
    } catch (error) {
      console.warn('Failed to bind load listener', error);
    }

    return () => {
      try {
        mapOff('load', onLoad);
      } catch {
        // Ignore cleanup errors
      }
      try {
        if (getLayer(LAYER_ID)) {
          removeLayer(LAYER_ID);
        }
      } catch {
        // Map may be disposed
      }
    };
  }, [mapReady, service, opacity]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Tiled Map Service (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Seamlessly overlay Esri World Imagery tiles on top of an open basemap using the
            <code>useTiledMapService</code> hook.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Requesting tiles…</span>}
          {error && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error.message}</span>
          )}
          {!loading && !error && service && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Imagery tiles ready</span>
          )}
          <button
            onClick={reload}
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Reload Service
          </button>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Opacity</h3>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={event => setOpacity(Number(event.target.value))}
            style={{ width: '100%' }}
          />
          <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{(opacity * 100).toFixed(0)}%</p>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Esri World Imagery served as tiled raster overlay. Adjust opacity to compare with the
          underlying MapLibre basemap.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default TiledMapServiceHooksDemo;
