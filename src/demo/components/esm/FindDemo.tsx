import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { DynamicMapService, Find } from '../../../main';

interface FindResults {
  features?: Array<GeoJSON.Feature>;
  error?: string;
}

const FindDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [findResults, setFindResults] = useState<FindResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Find state
  const [searchText, setSearchText] = useState('CA');
  const [searchFields, setSearchFields] = useState('STATE_ABBR');
  const [layers, setLayers] = useState('2');
  const [searchType, setSearchType] = useState('contains');

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

  const executeFind = async () => {
    if (!map.current || !searchText.trim()) return;

    setIsSearching(true);
    setFindResults(null);

    try {
      // The ArcGIS Find API accepts "all" or comma-separated layer IDs
      const layersParam = layers === 'all' ? 'all' : layers;

      const findTask = new Find({
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        searchText: searchText,
        searchFields: searchFields || undefined, // Only set if provided
        layers: layersParam,
        contains: searchType === 'contains',
      });

      const results = (await findTask.run()) as GeoJSON.FeatureCollection;
      setFindResults({ features: results.features });

      // Clear previous results layer
      if (map.current.getLayer('find-results')) {
        map.current.removeLayer('find-results');
        map.current.removeSource('find-results');
      }

      // Add results to map
      if (results.features && results.features.length > 0) {
        map.current.addSource('find-results', {
          type: 'geojson',
          data: results,
        });

        (map.current as unknown as { addLayer(layer: unknown): void }).addLayer({
          id: 'find-results',
          type: 'fill',
          source: 'find-results',
          paint: {
            'fill-color': '#4CAF50',
            'fill-opacity': 0.6,
            'fill-outline-color': '#2E7D32',
          },
        });

        // Fit map to results
        if (results.features.length > 0) {
          const allCoords: [number, number][] = [];

          results.features.forEach((feature: GeoJSON.Feature) => {
            if (feature.geometry && feature.geometry.type === 'Polygon') {
              const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
              coords.forEach((coord: number[]) => {
                if (coord.length >= 2) {
                  allCoords.push([coord[0], coord[1]]);
                }
              });
            } else if (feature.geometry && feature.geometry.type === 'Point') {
              const coords = (feature.geometry as GeoJSON.Point).coordinates;
              if (coords.length >= 2) {
                allCoords.push([coords[0], coords[1]]);
              }
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

            const fitBounds = map.current as unknown as {
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
              { padding: 50 }
            );
          }
        }
      }
    } catch (error) {
      console.error('Find failed:', error);
      setFindResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setFindResults(null);
    if (map.current && map.current.getLayer('find-results')) {
      const mapInstance = map.current as unknown as {
        removeLayer(layerId: string): void;
        removeSource(sourceId: string): void;
      };
      mapInstance.removeLayer('find-results');
      mapInstance.removeSource('find-results');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Find Task Demo</h3>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search Text:
          </label>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
            placeholder="Try: CA, TX, NY (state codes work better)"
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            Tip: Try state abbreviations like "CA", "TX", "NY" instead of full names
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search Fields (comma-separated):
          </label>
          <input
            type="text"
            value={searchFields}
            onChange={e => setSearchFields(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
            placeholder="STATE_ABBR,STATE_NAME"
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            Common fields: STATE_ABBR, STATE_NAME, CITY_NAME
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Layers:
          </label>
          <input
            type="text"
            value={layers}
            onChange={e => setLayers(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
            placeholder="all or layer IDs (e.g., 0,1,2)"
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search Type:
          </label>
          <select
            value={searchType}
            onChange={e => setSearchType(e.target.value)}
            style={{ width: '200px', padding: '5px' }}
          >
            <option value="startsWith">Starts With</option>
            <option value="contains">Contains</option>
          </select>
        </div>

        <div>
          <button
            onClick={executeFind}
            disabled={!isLoaded || isSearching || !searchText.trim()}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: isSearching ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSearching || !searchText.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {isSearching ? 'Searching...' : 'Find Features'}
          </button>
          <button
            onClick={clearResults}
            disabled={!findResults}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: findResults ? 'pointer' : 'not-allowed',
            }}
          >
            Clear Results
          </button>
        </div>

        {findResults && (
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
            {findResults.error ? (
              <div style={{ color: '#dc3545' }}>
                <strong>Error:</strong> {findResults.error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Results:</strong> {findResults.features?.length || 0} features found
                </div>
                {findResults.features
                  ?.slice(0, 5)
                  .map((feature: GeoJSON.Feature, index: number) => (
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
                {(findResults.features?.length || 0) > 5 && (
                  <div style={{ fontStyle: 'italic', color: '#6c757d' }}>
                    ... and {(findResults.features?.length || 0) - 5} more features
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

export default FindDemo;
