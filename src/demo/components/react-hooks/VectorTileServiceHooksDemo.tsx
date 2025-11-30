import React, { useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useVectorTileService } from '../../../react';
import type {
  LayerSpecification,
  LineLayerSpecification,
  FillLayerSpecification,
  SymbolLayerSpecification,
} from '@maplibre/maplibre-gl-style-spec';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SOURCE_ID = 'hooks-vector-tile-source';
const LAYER_ID = 'hooks-vector-tile-layer';
const VECTOR_TILE_SERVICE_URL =
  'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer';

const VectorTileServiceHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-100, 38],
    zoom: 4,
  });

  const [lineColor, setLineColor] = useState('#1f2937');
  const [lineWidth, setLineWidth] = useState(1.5);

  const vectorOptions = useMemo(
    () => ({
      url: VECTOR_TILE_SERVICE_URL,
    }),
    []
  );

  const { service, loading, error, reload } = useVectorTileService({
    sourceId: SOURCE_ID,
    map: esriMap,
    options: vectorOptions,
  });

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    const layerApi = map as unknown as {
      getLayer?: (id: string) => unknown;
      addLayer?: (layer: LayerSpecification) => void;
      removeLayer?: (id: string) => void;
    };
    const sourceApi = map as unknown as {
      getSource?: (id: string) => unknown;
    };
    const eventsApi = map as unknown as {
      on?: (type: string, listener: (...args: unknown[]) => void) => void;
      off?: (type: string, listener: (...args: unknown[]) => void) => void;
    };

    if (
      typeof layerApi.addLayer !== 'function' ||
      typeof layerApi.removeLayer !== 'function' ||
      typeof layerApi.getLayer !== 'function' ||
      typeof sourceApi.getSource !== 'function'
    ) {
      return;
    }

    // Bind methods to preserve context
    const addLayer = layerApi.addLayer.bind(layerApi);
    const removeLayer = layerApi.removeLayer.bind(layerApi);
    const getLayer = layerApi.getLayer.bind(layerApi);
    const getSource = sourceApi.getSource.bind(sourceApi);
    const on = typeof eventsApi.on === 'function' ? eventsApi.on.bind(eventsApi) : undefined;
    const off = typeof eventsApi.off === 'function' ? eventsApi.off.bind(eventsApi) : undefined;

    const safeHasSource = () => {
      try {
        return Boolean(getSource(SOURCE_ID));
      } catch {
        return false;
      }
    };

    const safeHasLayer = () => {
      try {
        return Boolean(getLayer(LAYER_ID));
      } catch {
        return false;
      }
    };

    const safeRemoveLayer = () => {
      if (!safeHasLayer()) return;
      try {
        removeLayer(LAYER_ID);
      } catch (error) {
        console.warn('Vector tile demo failed to remove layer', error);
      }
    };

    const safeAddLayer = (layerConfig: LayerSpecification) => {
      try {
        addLayer(layerConfig);
      } catch (error) {
        console.warn('Vector tile demo failed to add layer', error);
      }
    };

    let cancelled = false;
    let sourcedataBound = false;

    const applyStyle = async () => {
      if (cancelled || !safeHasSource()) return;
      try {
        const baseStyle = await service.getStyle();
        if (cancelled) return;

        safeRemoveLayer();

        let layerConfig: LayerSpecification;

        if (baseStyle.type === 'line') {
          layerConfig = {
            id: LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            'source-layer': baseStyle['source-layer'],
            layout: baseStyle.layout as LineLayerSpecification['layout'],
            paint: {
              ...(baseStyle.paint as LineLayerSpecification['paint']),
              'line-color': lineColor,
              'line-width': lineWidth,
            },
          } satisfies LineLayerSpecification;
        } else if (baseStyle.type === 'fill') {
          layerConfig = {
            id: LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            'source-layer': baseStyle['source-layer'],
            layout: baseStyle.layout as FillLayerSpecification['layout'],
            paint: baseStyle.paint as FillLayerSpecification['paint'],
          } satisfies FillLayerSpecification;
        } else {
          layerConfig = {
            id: LAYER_ID,
            type: 'symbol',
            source: SOURCE_ID,
            'source-layer': baseStyle['source-layer'],
            layout: baseStyle.layout as SymbolLayerSpecification['layout'],
            paint: baseStyle.paint as SymbolLayerSpecification['paint'],
          } satisfies SymbolLayerSpecification;
        }

        safeAddLayer(layerConfig);
      } catch (err) {
        console.warn('Failed to build vector tile layer', err);
      }
    };

    const handleSourceData = (event: unknown) => {
      const e = event as { sourceId?: string };
      if (e?.sourceId === SOURCE_ID) {
        applyStyle();
      }
    };

    if (typeof on === 'function') {
      try {
        on('sourcedata', handleSourceData);
        sourcedataBound = true;
      } catch (error) {
        console.warn('Vector tile demo failed to bind sourcedata listener', error);
      }
    }

    const interval = window.setInterval(() => {
      if (cancelled || safeHasLayer()) {
        window.clearInterval(interval);
        return;
      }
      applyStyle();
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (sourcedataBound && typeof off === 'function') {
        try {
          off('sourcedata', handleSourceData);
        } catch (error) {
          console.warn('Vector tile demo failed to unbind sourcedata listener', error);
        }
      }
      safeRemoveLayer();
    };
  }, [mapReady, service, lineColor, lineWidth]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Vector Tile Service (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Streamline Esri vector tiles and restyle them live using{' '}
            <code>useVectorTileService</code>.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Requesting tiles…</span>}
          {error && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error.message}</span>
          )}
          {!loading && !error && service && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Vector tiles ready</span>
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
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Line Styling</h3>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            Width
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.25}
              value={lineWidth}
              onChange={event => setLineWidth(Number(event.target.value))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            Color
            <input
              type="color"
              value={lineColor}
              onChange={event => setLineColor(event.target.value)}
              style={{ width: '100%', height: '32px', padding: 0, border: 'none' }}
            />
          </label>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Adjust line symbology for the default layer returned by the ArcGIS Vector Tile Service.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default VectorTileServiceHooksDemo;
