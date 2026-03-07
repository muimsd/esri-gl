import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { DynamicMapService, Query } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
} from '../shared/styles';

interface QueryResults {
  features?: Array<GeoJSON.Feature>;
  error?: string;
}

const inputStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  width: '100%',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  cursor: 'pointer',
  width: '100%',
};

const QueryDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MaplibreMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResults | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Query state
  const [whereClause, setWhereClause] = useState('pop2000 > 1000000');
  const [outFields, setOutFields] = useState('state_name,pop2000,state_abbr');
  const [returnGeometry, setReturnGeometry] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-98, 39.5],
      zoom: 4,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add sample dynamic map service
      new DynamicMapService('usa-service', map.current, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      });

      // Add layer to display the service
      map.current.addLayer({
        id: 'usa-layer',
        type: 'raster',
        source: 'usa-service',
      });

      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const executeQuery = async () => {
    if (!map.current) return;

    setIsQuerying(true);
    setQueryResults(null);

    try {
      // Create basic query - the task system will use default params
      const queryTask = new Query({
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2',
        where: whereClause,
        outFields: outFields,
        returnGeometry,
      });

      console.log('Executing query with options:', { whereClause, outFields, returnGeometry });

      const results = (await queryTask.run()) as GeoJSON.FeatureCollection;

      console.log('Query results:', results);

      // Ensure we have a proper FeatureCollection structure
      const queryResults: QueryResults = {
        features: results.features || [],
      };

      setQueryResults(queryResults);

      // Clear previous results layer
      if (map.current.getLayer('query-results')) {
        map.current.removeLayer('query-results');
        map.current.removeSource('query-results');
      }

      // Add results to map if geometry is returned
      if (queryResults.features && queryResults.features.length > 0 && returnGeometry) {
        map.current.addSource('query-results', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: queryResults.features.map((feature: GeoJSON.Feature) => ({
              type: 'Feature',
              geometry: feature.geometry,
              properties: feature.properties,
            })),
          },
        });

        map.current.addLayer({
          id: 'query-results',
          type: 'fill',
          source: 'query-results',
          paint: {
            'fill-color': '#ff6b6b',
            'fill-opacity': 0.5,
            'fill-outline-color': '#ff0000',
          },
        });

        // Fit map to results using proper bounds
        if (queryResults.features && queryResults.features.length > 0) {
          const allCoords: [number, number][] = [];

          queryResults.features.forEach((feature: GeoJSON.Feature) => {
            if (feature.geometry && feature.geometry.type === 'Polygon') {
              const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
              coords.forEach((coord: number[]) => {
                if (coord.length >= 2) {
                  allCoords.push([coord[0], coord[1]]);
                }
              });
            }
          });

          if (allCoords.length > 0) {
            const [firstLng, firstLat] = allCoords[0];
            let minLng = firstLng;
            let maxLng = firstLng;
            let minLat = firstLat;
            let maxLat = firstLat;

            for (let i = 1; i < allCoords.length; i += 1) {
              const [lng, lat] = allCoords[i];
              minLng = Math.min(minLng, lng);
              maxLng = Math.max(maxLng, lng);
              minLat = Math.min(minLat, lat);
              maxLat = Math.max(maxLat, lat);
            }

            const mapInstance = map.current as unknown as {
              fitBounds(
                bounds: [[number, number], [number, number]],
                options?: { padding?: number }
              ): void;
            };
            mapInstance.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              { padding: 50 }
            );
          }
        }
      }
    } catch (error) {
      console.error('Query failed:', error);
      setQueryResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsQuerying(false);
    }
  };

  const clearResults = () => {
    setQueryResults(null);
    if (map.current && map.current.getLayer('query-results')) {
      map.current.removeLayer('query-results');
      map.current.removeSource('query-results');
    }
  };

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Query Task (ESM)</h2>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Query Parameters</h3>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            WHERE Clause
          </label>
          <input
            type="text"
            value={whereClause}
            onChange={e => setWhereClause(e.target.value)}
            style={inputStyle}
            placeholder="pop2000 > 1000000"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
            Output Fields (comma-separated)
          </label>
          <input
            type="text"
            value={outFields}
            onChange={e => setOutFields(e.target.value)}
            style={inputStyle}
            placeholder="state_name,pop2000,state_abbr"
          />
        </div>

        <div>
          <label style={{ display: 'inline-flex', alignItems: 'center', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={returnGeometry}
              onChange={e => setReturnGeometry(e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            Return Geometry
          </label>
        </div>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Actions</h3>

        <button
          onClick={executeQuery}
          disabled={!isLoaded || isQuerying}
          style={{
            ...buttonStyle,
            backgroundColor: isQuerying ? '#ccc' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            cursor: !isLoaded || isQuerying ? 'not-allowed' : 'pointer',
          }}
        >
          {isQuerying ? 'Querying...' : 'Execute Query'}
        </button>

        <button
          onClick={clearResults}
          disabled={!queryResults}
          style={{
            ...buttonStyle,
            cursor: queryResults ? 'pointer' : 'not-allowed',
          }}
        >
          Clear Results
        </button>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Results</h3>

        {queryResults ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              maxHeight: '220px',
              overflowY: 'auto',
            }}
          >
            {queryResults.error ? (
              <div style={{ color: '#dc3545', fontSize: '13px' }}>
                <strong>Error:</strong> {queryResults.error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                  <strong>{queryResults.features?.length || 0}</strong> features found
                </div>
                {queryResults.features?.slice(0, 5).map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '6px',
                      padding: '6px',
                      background: '#ffffff',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <strong>Feature {index + 1}:</strong>
                    {Object.entries(feature.properties || {}).map(([key, value]) => (
                      <div key={key} style={{ marginLeft: '8px' }}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                ))}
                {(queryResults.features?.length || 0) > 5 && (
                  <div style={{ fontStyle: 'italic', color: '#6c757d', fontSize: '12px' }}>
                    ... and {(queryResults.features?.length || 0) - 5} more features
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#a1a1aa' }}>
            No results yet. Execute a query to see results.
          </div>
        )}

        <p style={DEMO_FOOTER_STYLE}>Query Task demo using ESM imports</p>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default QueryDemo;
