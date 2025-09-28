import { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useIdentifyFeatures } from 'esri-gl/react';

export default function IdentifyExample() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [clickPoint, setClickPoint] = useState<{ lng: number; lat: number } | null>(null);
  const [results, setResults] = useState<any>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      },
      center: [-95.7129, 37.0902],
      zoom: 4,
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
    });

    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  const { identify, loading, error } = useIdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 3,
    returnGeometry: true
  });

  // Handle map clicks
  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      const point = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      setClickPoint(point);
      setResults(null);

      try {
        const identifyResults = await identify(point);
        setResults(identifyResults);
      } catch (err) {
        console.error('Identify failed:', err);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, identify]);

  return (
    <div className="example-section">
      <h2>Identify Features Example</h2>
      <p>
        This example demonstrates using the <code>useIdentifyFeatures</code> hook to query 
        map features at clicked locations. Click anywhere on the map to identify features.
      </p>

      {loading && (
        <div className="status loading">
          Identifying features at clicked location...
        </div>
      )}

      {error && (
        <div className="status error">
          Error identifying features: {error.message}
        </div>
      )}

      <div className="map-container" ref={mapContainer} />

      {clickPoint && (
        <div style={{ marginTop: '20px' }}>
          <h4>Last Click Location:</h4>
          <p>
            Longitude: {clickPoint.lng.toFixed(6)}, 
            Latitude: {clickPoint.lat.toFixed(6)}
          </p>
        </div>
      )}

      {results && (
        <div style={{ marginTop: '20px' }}>
          <h4>Identify Results:</h4>
          {results.features && results.features.length > 0 ? (
            <div>
              <p>Found {results.features.length} feature(s):</p>
              <div style={{ 
                maxHeight: '200px', 
                overflow: 'auto', 
                border: '1px solid #ddd', 
                padding: '10px',
                background: '#f9f9f9'
              }}>
                {results.features.map((feature: any, index: number) => (
                  <div key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>Feature {index + 1}:</strong>
                    {feature.properties && (
                      <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                        {Object.entries(feature.properties).slice(0, 5).map(([key, value]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>No features found at this location.</p>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Hook Configuration:</h4>
        <ul>
          <li><strong>Service URL:</strong> USA MapServer (sampleserver6)</li>
          <li><strong>Tolerance:</strong> 3 pixels</li>
          <li><strong>Return Geometry:</strong> Yes</li>
          <li><strong>Auto-cleanup:</strong> Managed by React hook</li>
        </ul>

        <h4>Instructions:</h4>
        <p>Click anywhere on the map to identify features at that location. The hook will automatically manage the identify request and return results.</p>
      </div>
    </div>
  );
}