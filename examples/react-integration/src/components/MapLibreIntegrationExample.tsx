import { useState, useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DynamicMapService, TiledMapService, IdentifyFeatures } from 'esri-gl';

interface IdentifyResult {
  layerId: number;
  layerName?: string;
  attributes?: Record<string, unknown>;
  geometry?: unknown;
}

export default function MapLibreIntegrationExample() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [services, setServices] = useState<{
    dynamic?: DynamicMapService;
    tiled?: TiledMapService;
  }>({});
  const [visibleLayers, setVisibleLayers] = useState({
    dynamic: false,
    tiled: false
  });
  const [identifyResults, setIdentifyResults] = useState<IdentifyResult[]>([]);

  const initializeMap = useCallback(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add click handler for identify
    map.current.on('click', async (e) => {
      if (services.dynamic && visibleLayers.dynamic) {
        try {
          const identifyService = new IdentifyFeatures({
            url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
          });
          
          const results = await identifyService.at(
            { lng: e.lngLat.lng, lat: e.lngLat.lat }
          );
          
          setIdentifyResults(Array.isArray(results) ? results : []);
        } catch (error) {
          console.error('Identify failed:', error);
          setIdentifyResults([]);
        }
      }
    });
  }, [services.dynamic, visibleLayers.dynamic]);

  const toggleDynamicLayer = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    if (visibleLayers.dynamic && services.dynamic) {
      // Remove layer
      if (map.current.getLayer('usa-dynamic')) {
        map.current.removeLayer('usa-dynamic');
      }
      services.dynamic.remove();
      setServices(prev => ({ ...prev, dynamic: undefined }));
      setVisibleLayers(prev => ({ ...prev, dynamic: false }));
    } else {
      // Add layer
      const dynamicService = new DynamicMapService(
        'usa-dynamic-source',
        map.current as unknown as import('esri-gl').Map,
        {
          url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
          layers: [0, 1, 2],
          transparent: true
        }
      );

      map.current.addLayer({
        id: 'usa-dynamic',
        type: 'raster',
        source: 'usa-dynamic-source'
      });

      setServices(prev => ({ ...prev, dynamic: dynamicService }));
      setVisibleLayers(prev => ({ ...prev, dynamic: true }));
    }
  }, [mapLoaded, visibleLayers.dynamic, services.dynamic]);

  const toggleTiledLayer = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    if (visibleLayers.tiled && services.tiled) {
      // Remove layer
      if (map.current.getLayer('world-topo')) {
        map.current.removeLayer('world-topo');
      }
      services.tiled.remove();
      setServices(prev => ({ ...prev, tiled: undefined }));
      setVisibleLayers(prev => ({ ...prev, tiled: false }));
    } else {
      // Add layer
      const tiledService = new TiledMapService(
        'world-topo-source',
        map.current as unknown as import('esri-gl').Map,
        {
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
        }
      );

      map.current.addLayer({
        id: 'world-topo',
        type: 'raster',
        source: 'world-topo-source'
      }, 'usa-dynamic'); // Add below dynamic layer if it exists

      setServices(prev => ({ ...prev, tiled: tiledService }));
      setVisibleLayers(prev => ({ ...prev, tiled: true }));
    }
  }, [mapLoaded, visibleLayers.tiled, services.tiled]);

  // Initialize map on mount
  useState(() => {
    initializeMap();
  });

  return (
    <div className="example-section">
      <h2>MapLibre GL Integration</h2>
      <p>
        This example shows direct integration with MapLibre GL JS using esri-gl services.
        No external map service tokens required! Click on the map when dynamic layer is visible to identify features.
      </p>

      <div className="controls">
        <button 
          onClick={toggleDynamicLayer}
          disabled={!mapLoaded}
          style={{ 
            background: visibleLayers.dynamic ? '#007ACC' : '#f0f0f0',
            color: visibleLayers.dynamic ? 'white' : '#333'
          }}
        >
          {visibleLayers.dynamic ? 'Hide' : 'Show'} USA Dynamic Layer
        </button>
        <button 
          onClick={toggleTiledLayer}
          disabled={!mapLoaded}
          style={{ 
            background: visibleLayers.tiled ? '#007ACC' : '#f0f0f0',
            color: visibleLayers.tiled ? 'white' : '#333'
          }}
        >
          {visibleLayers.tiled ? 'Hide' : 'Show'} World Topo Layer
        </button>
      </div>

      <div className="map-container" style={{ position: 'relative' }}>
        <div
          ref={mapContainer}
          style={{ 
            width: '100%', 
            height: '500px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        
        {!mapLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            Loading MapLibre GL map...
          </div>
        )}
      </div>

      {/* Identify Results */}
      {identifyResults.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f8f9fa', 
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <h4>Identify Results ({identifyResults.length} found):</h4>
          {identifyResults.slice(0, 3).map((result, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '2px' }}>
              <strong>{result.layerName || `Layer ${result.layerId}`}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {Object.entries(result.attributes || {}).slice(0, 3).map(([key, value]) => (
                  <div key={key}>{key}: {String(value)}</div>
                ))}
              </div>
            </div>
          ))}
          {identifyResults.length > 3 && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              ... and {identifyResults.length - 3} more results
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4>Current State:</h4>
            <ul>
              <li><strong>Map:</strong> {mapLoaded ? 'Loaded' : 'Loading...'}</li>
              <li><strong>Dynamic Layer:</strong> {visibleLayers.dynamic ? 'Active' : 'Inactive'}</li>
              <li><strong>Tiled Layer:</strong> {visibleLayers.tiled ? 'Active' : 'Inactive'}</li>
              <li><strong>Identify:</strong> {visibleLayers.dynamic ? 'Click map to identify' : 'Enable dynamic layer first'}</li>
            </ul>
          </div>
          
          <div>
            <h4>MapLibre Features:</h4>
            <ul>
              <li>✅ No external map tokens required</li>
              <li>✅ Direct service integration</li>
              <li>✅ Interactive identify functionality</li>
              <li>✅ Layer management</li>
              <li>✅ OpenStreetMap base layer</li>
              <li>✅ Real-time layer toggling</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', background: '#e8f5e8', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 5px 0' }}>🗺️ Pure MapLibre Integration</h4>
          <p style={{ margin: 0 }}>
            This example demonstrates how to use esri-gl services directly with MapLibre GL JS without any wrapper components.
            Perfect for cases where you need full control over the map instance or don't want to depend on react-map-gl.
            The identify functionality shows how to programmatically query Esri services based on map interactions.
          </p>
        </div>
      </div>
    </div>
  );
}