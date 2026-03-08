import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriDynamicLayer, Find } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type SearchMode = 'contains' | 'startsWith';
type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry | null>;

const SERVICE_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
const RESULTS_SOURCE_ID = 'react-map-gl-find-results';
const RESULTS_POLYGON_LAYER_ID = 'react-map-gl-find-polygons';
const RESULTS_POINT_LAYER_ID = 'react-map-gl-find-points';

const splitCommaSeparated = (value: string) =>
  value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

const FindReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [searchText, setSearchText] = useState('CA');
  const [searchFields, setSearchFields] = useState('STATE_ABBR');
  const [layerInput, setLayerInput] = useState('2');
  const [searchMode, setSearchMode] = useState<SearchMode>('contains');
  const [results, setResults] = useState<FeatureCollection | null>(null);
  const [findLoading, setFindLoading] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  const executeFind = useCallback(async () => {
    if (!searchText.trim()) return;
    setFindLoading(true);
    setFindError(null);
    try {
      const fields = splitCommaSeparated(searchFields);
      const parsedLayers =
        layerInput.trim().toLowerCase() === 'all'
          ? 'all'
          : splitCommaSeparated(layerInput)
              .map(entry => Number(entry))
              .filter(value => !Number.isNaN(value));

      const findTask = new Find({
        url: SERVICE_URL,
        searchText: searchText.trim(),
        searchFields: fields.length ? fields : undefined,
        layers: parsedLayers === 'all' ? 'all' : parsedLayers.length ? parsedLayers : undefined,
        contains: searchMode === 'contains',
        returnGeometry: true,
      });
      const data = await findTask.run();
      setResults(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Find failed';
      setFindError(message);
      setResults(null);
    } finally {
      setFindLoading(false);
    }
  }, [searchText, searchFields, layerInput, searchMode]);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  // Visualize find results on the map
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const mi = mapRef.current.getMap() as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!mi) return;

    if (mi.getLayer?.(RESULTS_POLYGON_LAYER_ID)) mi.removeLayer(RESULTS_POLYGON_LAYER_ID);
    if (mi.getLayer?.(RESULTS_POINT_LAYER_ID)) mi.removeLayer(RESULTS_POINT_LAYER_ID);
    if (mi.getSource?.(RESULTS_SOURCE_ID)) mi.removeSource(RESULTS_SOURCE_ID);

    if (!results || !results.features?.length) return;

    mi.addSource(RESULTS_SOURCE_ID, { type: 'geojson', data: results });

    mi.addLayer({
      id: RESULTS_POLYGON_LAYER_ID,
      type: 'fill',
      source: RESULTS_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': '#22c55e',
        'fill-opacity': 0.45,
        'fill-outline-color': '#15803d',
      },
    });

    mi.addLayer({
      id: RESULTS_POINT_LAYER_ID,
      type: 'circle',
      source: RESULTS_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': '#22c55e',
        'circle-stroke-color': '#14532d',
        'circle-stroke-width': 1.5,
      },
    });

    // Fit bounds to results
    const coords: [number, number][] = [];
    results.features.forEach(feature => {
      if (feature.geometry?.type === 'Polygon') {
        (feature.geometry as GeoJSON.Polygon).coordinates[0]?.forEach(coord => {
          if (coord.length >= 2) coords.push([coord[0], coord[1]]);
        });
      }
      if (feature.geometry?.type === 'Point') {
        const point = feature.geometry as GeoJSON.Point;
        if (point.coordinates.length >= 2) {
          coords.push([point.coordinates[0], point.coordinates[1]]);
        }
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
      if (mi.getLayer?.(RESULTS_POLYGON_LAYER_ID)) mi.removeLayer(RESULTS_POLYGON_LAYER_ID);
      if (mi.getLayer?.(RESULTS_POINT_LAYER_ID)) mi.removeLayer(RESULTS_POINT_LAYER_ID);
      if (mi.getSource?.(RESULTS_SOURCE_ID)) mi.removeSource(RESULTS_SOURCE_ID);
    };
  }, [mapReady, results]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Find Task (react-map-gl)</h2>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
            Search MapServer layers by text using the <code>Find</code> task with an{' '}
            <code>EsriDynamicLayer</code> backdrop.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>USA MapServer</span>
          {findLoading && (
            <span style={{ ...createBadgeStyle('#dcfce7', '#166534'), marginLeft: '6px' }}>
              Searching...
            </span>
          )}
          {findError && (
            <span
              style={{
                ...createBadgeStyle('#fee2e2', '#7f1d1d'),
                marginTop: '6px',
                display: 'block',
              }}
            >
              {findError}
            </span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Search Text</h3>
          <input
            type="text"
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
              boxSizing: 'border-box',
            }}
            placeholder="Try CA, TX, NY"
          />
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Search Fields</h3>
          <input
            type="text"
            value={searchFields}
            onChange={event => setSearchFields(event.target.value)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
              boxSizing: 'border-box',
            }}
            placeholder="STATE_ABBR,STATE_NAME"
          />
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Layers</h3>
          <input
            type="text"
            value={layerInput}
            onChange={event => setLayerInput(event.target.value)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
              boxSizing: 'border-box',
            }}
            placeholder="all or comma-separated IDs"
          />
        </div>

        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            Match Mode
            <select
              value={searchMode}
              onChange={event => setSearchMode(event.target.value as SearchMode)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="contains">Contains</option>
              <option value="startsWith">Starts With</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={executeFind}
            disabled={findLoading || !searchText.trim()}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #16a34a',
              backgroundColor: findLoading ? '#bbf7d0' : '#16a34a',
              color: '#ffffff',
              cursor: findLoading || !searchText.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {findLoading ? 'Searching...' : 'Find Features'}
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
          Searches the USA MapServer for matching records with geometry visualization.
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

          <EsriDynamicLayer id="react-map-gl-find-dynamic" url={SERVICE_URL} layers={[2]} />
        </Map>
      </div>
    </div>
  );
};

export default FindReactMapGLDemo;
