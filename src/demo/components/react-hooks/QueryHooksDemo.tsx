import React, { useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDynamicMapService, useQuery } from '../../../react';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SERVICE_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
const SOURCE_ID = 'hooks-query-service';
const LAYER_ID = 'hooks-query-layer';
const RESULTS_SOURCE_ID = 'hooks-query-results';
const RESULTS_LAYER_ID = 'hooks-query-results-layer';

const QueryHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-98, 39.5],
    zoom: 4,
  });

  const [whereClause, setWhereClause] = useState('pop2000 > 1000000');
  const [outFields, setOutFields] = useState('state_name,pop2000,state_abbr');
  const [returnGeometry, setReturnGeometry] = useState(true);
  const [results, setResults] = useState<GeoJSON.FeatureCollection | null>(null);

  const dynamicOptions = useMemo(
    () => ({
      url: SERVICE_URL,
      transparent: true,
    }),
    []
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

  const queryOptions = useMemo(
    () => ({
      url: `${SERVICE_URL}/2`,
      where: whereClause || '1=1',
      outFields: outFields || '*',
      returnGeometry,
    }),
    [whereClause, outFields, returnGeometry]
  );

  const { query, loading: queryLoading, error: queryError } = useQuery(queryOptions);

  const executeQuery = async () => {
    try {
      const data = (await query()) as GeoJSON.FeatureCollection;
      setResults(data);
    } catch (error) {
      console.warn('Query failed', error);
      setResults(null);
    }
  };

  const clearResults = () => {
    setResults(null);
  };

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current as maplibregl.Map;

    if (map.getLayer(RESULTS_LAYER_ID)) {
      map.removeLayer(RESULTS_LAYER_ID);
    }
    if (map.getSource(RESULTS_SOURCE_ID)) {
      map.removeSource(RESULTS_SOURCE_ID);
    }

    if (!results || !returnGeometry || !results.features?.length) {
      return;
    }

    map.addSource(RESULTS_SOURCE_ID, {
      type: 'geojson',
      data: results,
    });

    map.addLayer({
      id: RESULTS_LAYER_ID,
      type: 'fill',
      source: RESULTS_SOURCE_ID,
      paint: {
        'fill-color': '#f97316',
        'fill-opacity': 0.45,
        'fill-outline-color': '#c2410c',
      },
    });

    const coords: [number, number][] = [];
    results.features.forEach(feature => {
      if (feature.geometry?.type === 'Polygon') {
        const polygon = feature.geometry as GeoJSON.Polygon;
        polygon.coordinates[0]?.forEach(coord => {
          if (coord.length >= 2) {
            coords.push([coord[0], coord[1]]);
          }
        });
      } else if (feature.geometry?.type === 'MultiPolygon') {
        const multi = feature.geometry as GeoJSON.MultiPolygon;
        multi.coordinates.forEach(ring => {
          ring[0]?.forEach(coord => {
            if (coord.length >= 2) {
              coords.push([coord[0], coord[1]]);
            }
          });
        });
      }
    });

    if (coords.length) {
      let [minLng, minLat] = coords[0];
      let [maxLng, maxLat] = coords[0];
      coords.slice(1).forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });

      const fitBounds = map as unknown as {
        fitBounds(
          bounds: [[number, number], [number, number]],
          options?: { padding?: number }
        ): void;
      };
      fitBounds.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 40 }
      );
    }

    return () => {
      if (map.getLayer(RESULTS_LAYER_ID)) {
        map.removeLayer(RESULTS_LAYER_ID);
      }
      if (map.getSource(RESULTS_SOURCE_ID)) {
        map.removeSource(RESULTS_SOURCE_ID);
      }
    };
  }, [mapReady, results, returnGeometry]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Query Task (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
            Build ad-hoc queries against layer 2 (states) using the <code>useQuery</code> hook.
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
          {queryLoading && <span style={createBadgeStyle('#fef3c7', '#92400e')}>Querying…</span>}
          {queryError && (
            <span style={createBadgeStyle('#fee2e2', '#7f1d1d')}>
              Query error: {queryError.message}
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
          <h3 style={DEMO_SECTION_TITLE_STYLE}>WHERE Clause</h3>
          <input
            type="text"
            value={whereClause}
            onChange={event => setWhereClause(event.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            placeholder="pop2000 > 1000000"
          />
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Output Fields</h3>
          <input
            type="text"
            value={outFields}
            onChange={event => setOutFields(event.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            placeholder="state_name,pop2000,state_abbr"
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={returnGeometry}
              onChange={event => setReturnGeometry(event.target.checked)}
            />
            Return geometry
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={executeQuery}
            disabled={queryLoading}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #2563eb',
              backgroundColor: queryLoading ? '#bfdbfe' : '#2563eb',
              color: '#ffffff',
              cursor: queryLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {queryLoading ? 'Querying…' : 'Execute Query'}
          </button>
          <button
            onClick={clearResults}
            disabled={!results}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              cursor: results ? 'pointer' : 'not-allowed',
            }}
          >
            Clear Results
          </button>
        </div>

        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <strong>Results:</strong> {results?.features?.length ?? 0}
          {results?.features?.slice(0, 4).map((feature, index) => (
            <div key={index} style={{ marginTop: '8px', fontSize: '13px' }}>
              <strong>Feature {index + 1}</strong>
              {Object.entries(feature.properties || {}).map(([key, value]) => (
                <div key={key} style={{ marginLeft: '10px' }}>
                  <strong>{key}:</strong> {String(value)}
                </div>
              ))}
            </div>
          ))}
          {(results?.features?.length ?? 0) > 4 && (
            <div style={{ fontStyle: 'italic', marginTop: '6px', color: '#6b7280' }}>
              …and {(results?.features?.length ?? 0) - 4} more features
            </div>
          )}
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Queries run against states layer (2) with full geometry when requested.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default QueryHooksDemo;
