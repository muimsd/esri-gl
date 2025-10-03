import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDynamicMapService, useTiledMapService, useImageService } from 'esri-gl/react';

export default function HooksExample() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [activeService, setActiveService] = useState<'dynamic' | 'tiled' | 'image'>('dynamic');
  const [switching, setSwitching] = useState(false);

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
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4,
    });

    mapInstance.on('load', () => {
      // Resize map to fit container properly
      setTimeout(() => {
        mapInstance.resize();
      }, 100);
      setMap(mapInstance);
    });

    // Handle window resize
    const handleResize = () => {
      mapInstance.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Set map to null first to trigger service cleanup
      setMap(null);
      // Then remove the map instance after a brief delay
      setTimeout(() => {
        mapInstance.remove();
      }, 10);
    };
  }, []);

  // Dynamic Map Service Hook
  const { 
    service: dynamicService, 
    loading: dynamicLoading, 
    error: dynamicError 
  } = useDynamicMapService({
    sourceId: 'usa-dynamic',
    map: activeService === 'dynamic' && map ? (map as unknown as import('esri-gl').Map) : null,
    options: {
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      layers: [0, 1, 2],
      transparent: true
    }
  });

  // Tiled Map Service Hook
  const { 
    service: tiledService, 
    loading: tiledLoading, 
    error: tiledError 
  } = useTiledMapService({
    sourceId: 'world-tiled',
    map: activeService === 'tiled' && map ? (map as unknown as import('esri-gl').Map) : null,
    options: {
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    }
  });

  // Image Service Hook
  const { 
    service: imageService, 
    loading: imageLoading, 
    error: imageError 
  } = useImageService({
    sourceId: 'elevation-image',
    map: activeService === 'image' && map ? (map as unknown as import('esri-gl').Map) : null,
    options: {
      url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      format: 'jpgpng'
    }
  });

  // Add layers when services are ready
  useEffect(() => {
    if (!map) return;

    // Remove existing layers
    ['usa-layer', 'world-layer', 'elevation-layer'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    // Add appropriate layer based on active service
    if (activeService === 'dynamic' && dynamicService) {
      map.addLayer({
        id: 'usa-layer',
        type: 'raster',
        source: 'usa-dynamic'
      });
    } else if (activeService === 'tiled' && tiledService) {
      map.addLayer({
        id: 'world-layer',
        type: 'raster',
        source: 'world-tiled'
      });
    } else if (activeService === 'image' && imageService) {
      map.addLayer({
        id: 'elevation-layer',
        type: 'raster',
        source: 'elevation-image'
      });
    }

    // Cleanup function to remove layers before component unmounts or service changes
    return () => {
      ['usa-layer', 'world-layer', 'elevation-layer'].forEach(layerId => {
        if (map.getLayer && map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
    };
  }, [map, activeService, dynamicService, tiledService, imageService]);

  const getCurrentStatus = () => {
    switch (activeService) {
      case 'dynamic':
        return { loading: dynamicLoading, error: dynamicError, service: dynamicService };
      case 'tiled':
        return { loading: tiledLoading, error: tiledError, service: tiledService };
      case 'image':
        return { loading: imageLoading, error: imageError, service: imageService };
    }
  };

  const status = getCurrentStatus();

  return (
    <div className="example-section">
      <h2>React Hooks Example</h2>
      <p>
        This example demonstrates using esri-gl React hooks to manage different types of Esri services.
        Switch between services to see how hooks handle lifecycle management automatically.
      </p>

      <div className="controls">
        <button 
          onClick={() => {
            if (!switching) {
              setSwitching(true);
              setActiveService('dynamic');
              setTimeout(() => setSwitching(false), 500);
            }
          }}
          disabled={switching}
          style={{ 
            background: activeService === 'dynamic' ? '#007ACC' : '#f0f0f0',
            color: activeService === 'dynamic' ? 'white' : '#333',
            opacity: switching ? 0.6 : 1
          }}
        >
          Dynamic Map Service
        </button>
        <button 
          onClick={() => {
            if (!switching) {
              setSwitching(true);
              setActiveService('tiled');
              setTimeout(() => setSwitching(false), 500);
            }
          }}
          disabled={switching}
          style={{ 
            background: activeService === 'tiled' ? '#007ACC' : '#f0f0f0',
            color: activeService === 'tiled' ? 'white' : '#333',
            opacity: switching ? 0.6 : 1
          }}
        >
          Tiled Map Service
        </button>
        <button 
          onClick={() => {
            if (!switching) {
              setSwitching(true);
              setActiveService('image');
              setTimeout(() => setSwitching(false), 500);
            }
          }}
          disabled={switching}
          style={{ 
            background: activeService === 'image' ? '#007ACC' : '#f0f0f0',
            color: activeService === 'image' ? 'white' : '#333',
            opacity: switching ? 0.6 : 1
          }}
        >
          Image Service
        </button>
      </div>

      {status.loading && (
        <div className="status loading">
          Loading {activeService} service...
        </div>
      )}

      {status.error && (
        <div className="status error">
          Error loading {activeService} service: {status.error.message}
        </div>
      )}

      {status.service && !status.loading && (
        <div className="status success">
          {activeService} service loaded successfully!
        </div>
      )}

      <div className="map-container" ref={mapContainer} />

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Current Configuration:</h4>
        <ul>
          <li><strong>Active Service:</strong> {activeService}</li>
          <li><strong>Map Instance:</strong> {map ? 'Ready' : 'Initializing...'}</li>
          <li><strong>Service Status:</strong> {status.loading ? 'Loading' : status.service ? 'Ready' : 'Waiting'}</li>
        </ul>
      </div>
    </div>
  );
}