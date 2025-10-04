import React, { useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDynamicMapService, useFind } from '../../../react';
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
const SOURCE_ID = 'hooks-find-service';
const LAYER_ID = 'hooks-find-layer';
const RESULTS_SOURCE_ID = 'hooks-find-results';
const RESULTS_POLYGON_LAYER_ID = 'hooks-find-polygons';
const RESULTS_POINT_LAYER_ID = 'hooks-find-points';

type SearchMode = 'contains' | 'startsWith';

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry | null>;

const splitCommaSeparated = (value: string) =>
  value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

const FindHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-98, 39.5],
    zoom: 4,
  });

  const [searchText, setSearchText] = useState('CA');
  const [searchFields, setSearchFields] = useState('STATE_ABBR');
  const [layerInput, setLayerInput] = useState('2');
  const [searchMode, setSearchMode] = useState<SearchMode>('contains');
  const [results, setResults] = useState<FeatureCollection | null>(null);

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

  const findOptions = useMemo(() => {
    const parsedLayers =
      layerInput.trim().toLowerCase() === 'all'
        ? 'all'
        : splitCommaSeparated(layerInput)
            .map(entry => Number(entry))
            .filter(value => !Number.isNaN(value));

    const fields = splitCommaSeparated(searchFields);

    return {
      url: SERVICE_URL,
      searchText: searchText.trim(),
      searchFields: fields.length ? fields : undefined,
      layers: parsedLayers === 'all' ? 'all' : parsedLayers.length ? parsedLayers : undefined,
      returnGeometry: true,
    } as const;
  }, [layerInput, searchFields, searchText]);

  const { find, loading: findLoading, error: findError } = useFind(findOptions);

  const executeFind = async () => {
    if (!searchText.trim()) return;
    try {
      const data = (await find({ contains: searchMode === 'contains' })) as FeatureCollection;
      setResults(data);
    } catch (error) {
      console.warn('Find failed', error);
      setResults(null);
    }
  };

  const clearResults = () => {
    setResults(null);
  };

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current as maplibregl.Map;

    if (map.getLayer(RESULTS_POLYGON_LAYER_ID)) {
      map.removeLayer(RESULTS_POLYGON_LAYER_ID);
    }
    if (map.getLayer(RESULTS_POINT_LAYER_ID)) {
      map.removeLayer(RESULTS_POINT_LAYER_ID);
    }
    if (map.getSource(RESULTS_SOURCE_ID)) {
      map.removeSource(RESULTS_SOURCE_ID);
    }

    if (!results || !results.features?.length) {
      return;
    }

    map.addSource(RESULTS_SOURCE_ID, {
      type: 'geojson',
      data: results,
    });

    map.addLayer({
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

    map.addLayer({
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

    const coords: [number, number][] = [];
    results.features.forEach(feature => {
      if (feature.geometry?.type === 'Polygon') {
        const polygon = feature.geometry as GeoJSON.Polygon;
        polygon.coordinates[0]?.forEach(coord => {
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
      if (map.getLayer(RESULTS_POLYGON_LAYER_ID)) {
        map.removeLayer(RESULTS_POLYGON_LAYER_ID);
      }
      if (map.getLayer(RESULTS_POINT_LAYER_ID)) {
        map.removeLayer(RESULTS_POINT_LAYER_ID);
      }
      if (map.getSource(RESULTS_SOURCE_ID)) {
        map.removeSource(RESULTS_SOURCE_ID);
      }
    };
  }, [mapReady, results]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Find Task (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>
            Search MapServer layers using <code>useFind</code> with partial or prefix matches.
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
          {findLoading && <span style={createBadgeStyle('#dcfce7', '#166534')}>Searching…</span>}
          {findError && (
            <span style={createBadgeStyle('#fee2e2', '#7f1d1d')}>
              Find error: {findError.message}
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
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Search Text</h3>
          <input
            type="text"
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            placeholder="Try CA, TX, NY"
          />
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Search Fields</h3>
          <input
            type="text"
            value={searchFields}
            onChange={event => setSearchFields(event.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            placeholder="STATE_ABBR,STATE_NAME"
          />
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Layers</h3>
          <input
            type="text"
            value={layerInput}
            onChange={event => setLayerInput(event.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
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
            {findLoading ? 'Searching…' : 'Find Features'}
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
          Searches the USA MapServer for matching records with geometry visualization.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default FindHooksDemo;
