import React, { useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useFeatureService } from '../../../react';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SOURCE_ID = 'hooks-feature-source';
const LAYER_ID = 'hooks-feature-layer';
const FEATURE_SERVICE_URL =
  'https://services6.arcgis.com/drBkxhK7nF7o7hKT/arcgis/rest/services/TN_Bridges/FeatureServer/0';

const FeatureServiceHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-86.5804, 36.1627],
    zoom: 8,
  });

  const [featureCount, setFeatureCount] = useState<string>('Not queried yet');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const featureOptions = useMemo(
    () => ({
      url: FEATURE_SERVICE_URL,
      outFields: '*',
      where: '1=1',
      useVectorTiles: true,
      useBoundingBox: true,
    }),
    []
  );

  const { service, loading, error, reload } = useFeatureService({
    sourceId: SOURCE_ID,
    map: esriMap,
    options: featureOptions,
  });

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    const eventedMap = map as unknown as {
      on: (type: string, listener: (...args: unknown[]) => void) => void;
      off: (type: string, listener: (...args: unknown[]) => void) => void;
    };

    let cancelled = false;

    const applyStyle = async () => {
      if (cancelled || !map.getSource(SOURCE_ID)) return;
      try {
        const style = await service.getStyle();
        if (cancelled) return;

        const rawLayerType = (style as { type?: string })?.type ?? 'circle';
        const typedLayerType: 'circle' | 'fill' | 'line' | 'symbol' | 'heatmap' =
          rawLayerType === 'fill' ||
          rawLayerType === 'line' ||
          rawLayerType === 'symbol' ||
          rawLayerType === 'heatmap'
            ? (rawLayerType as 'fill' | 'line' | 'symbol' | 'heatmap')
            : 'circle';
        const layout = ((style as { layout?: Record<string, unknown> })?.layout ?? {}) as Record<
          string,
          unknown
        >;
        const paint = ((style as { paint?: Record<string, unknown> })?.paint ?? {}) as Record<
          string,
          unknown
        >;

        if (map.getLayer(LAYER_ID)) {
          map.removeLayer(LAYER_ID);
        }

        map.addLayer({
          id: LAYER_ID,
          type: typedLayerType,
          source: SOURCE_ID,
          layout,
          paint,
        });
      } catch (err) {
        console.warn('Failed to apply feature style, using fallback.', err);
        if (map.getLayer(LAYER_ID)) {
          map.removeLayer(LAYER_ID);
        }
        map.addLayer({
          id: LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
            'circle-radius': 5,
            'circle-color': '#3b82f6',
            'circle-stroke-color': '#1f2937',
            'circle-stroke-width': 1,
          },
        });
      }
    };

    const handleSourceData = (event: unknown) => {
      const e = event as { sourceId?: string };
      if (e?.sourceId === SOURCE_ID) {
        applyStyle();
      }
    };

    eventedMap.on('sourcedata', handleSourceData);
    const interval = window.setInterval(() => {
      if (cancelled || map.getLayer(LAYER_ID)) {
        window.clearInterval(interval);
        return;
      }
      applyStyle();
    }, 150);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      eventedMap.off('sourcedata', handleSourceData);
      //@ts-ignore
      if (map.getStyle() && map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
    };
  }, [mapReady, service]);

  const runQuery = async () => {
    if (!service) return;
    setQueryLoading(true);
    setQueryError(null);
    try {
      const features = await service.queryFeatures({
        returnGeometry: false,
        outFields: 'OBJECTID',
      });
      setFeatureCount(`${features.features?.length ?? 0} features returned`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query failed';
      setQueryError(message);
      setFeatureCount('Query failed');
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Feature Service (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Loads live Tennessee bridge features using <code>useFeatureService</code> with automatic
            vector tile support and GeoJSON fallback. and get default style from the service.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Fetching data…</span>}
          {error && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error.message}</span>
          )}
          {!loading && !error && service && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Feature layer ready</span>
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
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Query Features</h3>
          <button
            onClick={runQuery}
            disabled={queryLoading}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              cursor: queryLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {queryLoading ? 'Running Query…' : 'Fetch Feature Count'}
          </button>
          <p style={{ margin: '8px 0 0', color: '#4b5563' }}>{featureCount}</p>
          {queryError && <p style={{ margin: 0, color: '#b91c1c' }}>{queryError}</p>}
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Demonstrates vector tile detection, custom styling, and server-side queries with Esri
          Feature Services.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default FeatureServiceHooksDemo;
