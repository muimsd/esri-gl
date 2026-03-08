import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriDynamicLayer, Query } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

const SERVICE_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
const QUERY_LAYER_URL = `${SERVICE_URL}/2`;
const RESULTS_SOURCE_ID = 'react-map-gl-query-results';
const RESULTS_LAYER_ID = 'react-map-gl-query-results-layer';

const QueryReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [whereClause, setWhereClause] = useState('pop2000 > 1000000');
  const [outFields, setOutFields] = useState('state_name,pop2000,state_abbr');
  const [returnGeometry, setReturnGeometry] = useState(true);
  const [results, setResults] = useState<GeoJSON.FeatureCollection | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const layersParam = useMemo(() => [2], []);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  const executeQuery = useCallback(async () => {
    setQueryLoading(true);
    setQueryError(null);
    try {
      const queryTask = new Query({
        url: QUERY_LAYER_URL,
        where: whereClause || '1=1',
        outFields: outFields || '*',
        returnGeometry,
      });
      const data = await queryTask.run();
      setResults(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Query failed';
      setQueryError(message);
      setResults(null);
    } finally {
      setQueryLoading(false);
    }
  }, [whereClause, outFields, returnGeometry]);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  // Visualize query results on the map
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const mi = mapRef.current.getMap() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!mi) return;

    if (mi.getLayer?.(RESULTS_LAYER_ID)) mi.removeLayer(RESULTS_LAYER_ID);
    if (mi.getSource?.(RESULTS_SOURCE_ID)) mi.removeSource(RESULTS_SOURCE_ID);

    if (!results || !returnGeometry || !results.features?.length) return;

    mi.addSource(RESULTS_SOURCE_ID, { type: 'geojson', data: results });
    mi.addLayer({
      id: RESULTS_LAYER_ID,
      type: 'fill',
      source: RESULTS_SOURCE_ID,
      paint: {
        'fill-color': '#f97316',
        'fill-opacity': 0.45,
        'fill-outline-color': '#c2410c',
      },
    });

    // Fit bounds to results
    const coords: [number, number][] = [];
    results.features.forEach(feature => {
      if (feature.geometry?.type === 'Polygon') {
        (feature.geometry as GeoJSON.Polygon).coordinates[0]?.forEach(coord => {
          if (coord.length >= 2) coords.push([coord[0], coord[1]]);
        });
      } else if (feature.geometry?.type === 'MultiPolygon') {
        (feature.geometry as GeoJSON.MultiPolygon).coordinates.forEach(ring => {
          ring[0]?.forEach(coord => {
            if (coord.length >= 2) coords.push([coord[0], coord[1]]);
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
      mi.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 40 }
      );
    }

    return () => {
      if (!mi.getStyle?.()) return;
      if (mi.getLayer?.(RESULTS_LAYER_ID)) mi.removeLayer(RESULTS_LAYER_ID);
      if (mi.getSource?.(RESULTS_SOURCE_ID)) mi.removeSource(RESULTS_SOURCE_ID);
    };
  }, [mapReady, results, returnGeometry]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Query Task (react-map-gl)</h2>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
            Run attribute queries against layer 2 (states) of the USA MapServer using the{' '}
            <code>Query</code> task with an <code>EsriDynamicLayer</code> backdrop.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>USA MapServer</span>
          {queryLoading && (
            <span style={{ ...createBadgeStyle('#fef3c7', '#92400e'), marginLeft: '6px' }}>
              Querying...
            </span>
          )}
          {queryError && (
            <span
              style={{
                ...createBadgeStyle('#fee2e2', '#7f1d1d'),
                marginTop: '6px',
                display: 'block',
              }}
            >
              {queryError}
            </span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>WHERE Clause</h3>
          <input
            type="text"
            value={whereClause}
            onChange={event => setWhereClause(event.target.value)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
              boxSizing: 'border-box',
            }}
            placeholder="pop2000 > 1000000"
          />
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Output Fields</h3>
          <input
            type="text"
            value={outFields}
            onChange={event => setOutFields(event.target.value)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
              boxSizing: 'border-box',
            }}
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
            {queryLoading ? 'Querying...' : 'Execute Query'}
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
              ...and {(results?.features?.length ?? 0) - 4} more features
            </div>
          )}
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Queries run against the states layer (2) with geometry highlighted on the map.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -98, latitude: 39.5, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          <EsriDynamicLayer
            id="react-map-gl-query-dynamic"
            url={SERVICE_URL}
            layers={layersParam}
          />
        </Map>
      </div>
    </div>
  );
};

export default QueryReactMapGLDemo;
