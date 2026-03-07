import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { DynamicMapService, Find } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
} from '../shared/styles';

interface FindResults {
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

const selectStyle: React.CSSProperties = {
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
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Find Task (ESM)</h2>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Search Parameters</h3>

        <div>
          <label
            style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#374151' }}
          >
            Search Text
          </label>
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={inputStyle}
            placeholder="e.g. CA, TX, NY"
          />
        </div>

        <div>
          <label
            style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#374151' }}
          >
            Search Fields (comma-separated)
          </label>
          <input
            type="text"
            value={searchFields}
            onChange={e => setSearchFields(e.target.value)}
            style={inputStyle}
            placeholder="STATE_ABBR,STATE_NAME"
          />
        </div>

        <div>
          <label
            style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#374151' }}
          >
            Layers
          </label>
          <input
            type="text"
            value={layers}
            onChange={e => setLayers(e.target.value)}
            style={inputStyle}
            placeholder="all or layer IDs (e.g., 0,1,2)"
          />
        </div>

        <div>
          <label
            style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#374151' }}
          >
            Search Type
          </label>
          <select
            value={searchType}
            onChange={e => setSearchType(e.target.value)}
            style={selectStyle}
          >
            <option value="startsWith">Starts With</option>
            <option value="contains">Contains</option>
          </select>
        </div>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Actions</h3>

        <button
          onClick={executeFind}
          disabled={!isLoaded || isSearching || !searchText.trim()}
          style={{
            ...buttonStyle,
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: '1px solid #2563eb',
            cursor: !isLoaded || isSearching || !searchText.trim() ? 'not-allowed' : 'pointer',
            opacity: !isLoaded || isSearching || !searchText.trim() ? 0.5 : 1,
          }}
        >
          {isSearching ? 'Searching...' : 'Find Features'}
        </button>

        <button
          onClick={clearResults}
          disabled={!findResults}
          style={{
            ...buttonStyle,
            cursor: findResults ? 'pointer' : 'not-allowed',
            opacity: findResults ? 1 : 0.5,
          }}
        >
          Clear Results
        </button>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Results</h3>

        {findResults ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              maxHeight: '220px',
              overflowY: 'auto' as const,
            }}
          >
            {findResults.error ? (
              <div style={{ color: '#dc3545', fontSize: '13px' }}>
                <strong>Error:</strong> {findResults.error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                  <strong>{findResults.features?.length || 0}</strong> features found
                </div>
                {findResults.features
                  ?.slice(0, 5)
                  .map((feature: GeoJSON.Feature, index: number) => (
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
                {(findResults.features?.length || 0) > 5 && (
                  <div style={{ fontStyle: 'italic', color: '#6c757d', fontSize: '12px' }}>
                    ... and {(findResults.features?.length || 0) - 5} more features
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
            No results yet. Execute a find to see results.
          </div>
        )}

        <div style={DEMO_FOOTER_STYLE}>Find task using USA MapServer</div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default FindDemo;
