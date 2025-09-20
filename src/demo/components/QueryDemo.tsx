import React, { useEffect, useRef, useState } from 'react';
import { Map, LngLatBounds } from 'maplibre-gl';
import { DynamicMapService, Query } from '../../main';

interface QueryResults {
  features?: Array<GeoJSON.Feature>;
  error?: string;
}

const QueryDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
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
    map.current = new Map({
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
            const bounds = allCoords.reduce((bounds, coord) => {
              return bounds.extend(coord);
            }, new LngLatBounds());

            map.current.fitBounds(bounds, { padding: 50 });
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Query Task Demo</h3>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            WHERE Clause:
          </label>
          <input
            type="text"
            value={whereClause}
            onChange={e => setWhereClause(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
            placeholder="pop2000 > 1000000"
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Output Fields (comma-separated):
          </label>
          <input
            type="text"
            value={outFields}
            onChange={e => setOutFields(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
            placeholder="state_name,pop2000,state_abbr"
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={returnGeometry}
              onChange={e => setReturnGeometry(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Return Geometry
          </label>
        </div>

        <div>
          <button
            onClick={executeQuery}
            disabled={!isLoaded || isQuerying}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: isQuerying ? '#ccc' : '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isQuerying ? 'not-allowed' : 'pointer',
            }}
          >
            {isQuerying ? 'Querying...' : 'Execute Query'}
          </button>
          <button
            onClick={clearResults}
            disabled={!queryResults}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: queryResults ? 'pointer' : 'not-allowed',
            }}
          >
            Clear Results
          </button>
        </div>

        {queryResults && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px',
              background: 'white',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {queryResults.error ? (
              <div style={{ color: '#dc3545' }}>
                <strong>Error:</strong> {queryResults.error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Results:</strong> {queryResults.features?.length || 0} features found
                </div>
                {queryResults.features?.slice(0, 5).map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '5px',
                      padding: '5px',
                      background: '#f8f9fa',
                      borderRadius: '3px',
                    }}
                  >
                    <strong>Feature {index + 1}:</strong>
                    {Object.entries(feature.properties || {}).map(([key, value]) => (
                      <div key={key} style={{ marginLeft: '10px' }}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                ))}
                {(queryResults.features?.length || 0) > 5 && (
                  <div style={{ fontStyle: 'italic', color: '#6c757d' }}>
                    ... and {(queryResults.features?.length || 0) - 5} more features
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div ref={mapContainer} style={{ flex: 1 }} />
    </div>
  );
};

export default QueryDemo;
