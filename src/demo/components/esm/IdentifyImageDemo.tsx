import React, { useEffect, useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import { ImageService, IdentifyImage } from '../../../main';

interface PixelResult {
  value?: string | number;
  location?: {
    x: number;
    y: number;
  };
  attributes?: Record<string, unknown>;
}

interface IdentifyImageResults {
  results?: PixelResult[];
  error?: string;
}

const IdentifyImageDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [identifyResults, setIdentifyResults] = useState<IdentifyImageResults | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [clickLocation, setClickLocation] = useState<{ lng: number; lat: number } | null>(null);

  // Service selection
  const [selectedService, setSelectedService] = useState('elevation');

  const services = {
    elevation: {
      url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      name: 'World Elevation',
    },
    landcover: {
      url: 'https://landscape6.arcgis.com/arcgis/rest/services/WorldLandCover/ImageServer',
      name: 'World Land Cover',
    },
    temperature: {
      url: 'https://utility.arcgis.com/usrsvcs/servers/4462bf95dc4e4ad59b9ed542e47d6096/rest/services/LiveFeeds/WorldTemperatures/ImageServer',
      name: 'World Temperatures',
    },
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-120, 40], // California
      zoom: 6,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add current service
      loadImageService();
      setIsLoaded(true);
    });

    // Handle map clicks
    map.current.on('click', handleMapClick);

    return () => {
      map.current?.off('click', handleMapClick);
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (map.current && isLoaded) {
      loadImageService();
    }
  }, [selectedService, isLoaded]);

  const loadImageService = () => {
    if (!map.current) return;

    // Remove existing service
    if (map.current.getSource('image-service')) {
      if (map.current.getLayer('image-layer')) {
        map.current.removeLayer('image-layer');
      }
      map.current.removeSource('image-service');
    }

    // Add new service
    const serviceConfig = services[selectedService as keyof typeof services];
    new ImageService('image-service', map.current, {
      url: serviceConfig.url,
    });

    // Add layer
    map.current.addLayer({
      id: 'image-layer',
      type: 'raster',
      source: 'image-service',
    });
  };

  const handleMapClick = async (e: { lngLat: { lng: number; lat: number } }) => {
    const lngLat = e.lngLat;
    setClickLocation(lngLat);
    await executeIdentifyImage(lngLat);
  };

  const executeIdentifyImage = async (lngLat: { lng: number; lat: number }) => {
    if (!map.current) return;

    setIsIdentifying(true);
    setIdentifyResults(null);

    try {
      const serviceConfig = services[selectedService as keyof typeof services];
      const identifyTask = new IdentifyImage({
        url: serviceConfig.url,
      });

      // Use the at() method if available, otherwise construct parameters manually
      const results = await identifyTask.at({ lng: lngLat.lng, lat: lngLat.lat }).run();

      setIdentifyResults({ results: results.results || [] });

      // Add click marker
      if (map.current.getSource('click-marker')) {
        map.current.removeLayer('click-marker');
        map.current.removeSource('click-marker');
      }

      map.current.addSource('click-marker', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lngLat.lng, lngLat.lat],
          },
          properties: {},
        },
      });

      map.current.addLayer({
        id: 'click-marker',
        type: 'circle',
        source: 'click-marker',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF5722',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2,
        },
      });
    } catch (error) {
      console.error('Identify image failed:', error);
      setIdentifyResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsIdentifying(false);
    }
  };

  const clearResults = () => {
    setIdentifyResults(null);
    setClickLocation(null);
    if (map.current && map.current.getLayer('click-marker')) {
      map.current.removeLayer('click-marker');
      map.current.removeSource('click-marker');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>IdentifyImage Task Demo</h3>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Image Service:
          </label>
          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            style={{ width: '300px', padding: '5px' }}
          >
            {Object.entries(services).map(([key, service]) => (
              <option key={key} value={key}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            marginBottom: '10px',
            padding: '10px',
            background: '#e3f2fd',
            borderRadius: '4px',
          }}
        >
          <strong>Instructions:</strong> Click anywhere on the map to identify pixel values at that
          location.
          {clickLocation && (
            <div style={{ marginTop: '5px' }}>
              <strong>Last click:</strong> {clickLocation.lng.toFixed(4)},{' '}
              {clickLocation.lat.toFixed(4)}
            </div>
          )}
        </div>

        <div>
          <button
            onClick={clearResults}
            disabled={!identifyResults && !clickLocation}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: identifyResults || clickLocation ? 'pointer' : 'not-allowed',
            }}
          >
            Clear Results
          </button>
          {isIdentifying && (
            <span style={{ marginLeft: '10px', color: '#FF5722' }}>Identifying...</span>
          )}
        </div>

        {identifyResults && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px',
              background: 'white',
              borderRadius: '4px',
              maxHeight: '250px',
              overflowY: 'auto',
            }}
          >
            {identifyResults.error ? (
              <div style={{ color: '#dc3545' }}>
                <strong>Error:</strong> {identifyResults.error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Pixel Results:</strong> {identifyResults.results?.length || 0} values
                  found
                </div>
                {identifyResults.results?.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '10px',
                      padding: '8px',
                      background: '#f8f9fa',
                      borderRadius: '3px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Result {index + 1}:
                    </div>
                    {result.value !== undefined && (
                      <div>
                        <strong>Value:</strong> {result.value}
                        {selectedService === 'elevation' && ' meters'}
                        {selectedService === 'temperature' && '°C'}
                      </div>
                    )}
                    {result.location && (
                      <div>
                        <strong>Location:</strong> {result.location.x.toFixed(4)},{' '}
                        {result.location.y.toFixed(4)}
                      </div>
                    )}
                    {result.attributes && Object.keys(result.attributes).length > 0 && (
                      <div>
                        <strong>Attributes:</strong>
                        {Object.entries(result.attributes).map(([key, value]) => (
                          <div key={key} style={{ marginLeft: '10px' }}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!identifyResults.results?.length && (
                  <div style={{ fontStyle: 'italic', color: '#6c757d' }}>
                    No pixel values found at this location
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

export default IdentifyImageDemo;
