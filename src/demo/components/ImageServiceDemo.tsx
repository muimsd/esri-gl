import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ImageService } from '../../main';

const ImageServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<ImageService | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    try {
      map.current = new maplibregl.Map({
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

      map.current.on('load', () => {
        try {
          service.current = new ImageService('image-source', map.current!, {
            url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
            format: 'jpg',
            renderingRule: false,
          });

          map.current!.addLayer({
            id: 'image-layer',
            type: 'raster',
            source: 'image-source',
            paint: {
              'raster-opacity': 0.8,
            },
          });

          setLoading(false);
        } catch (err) {
          setError('Failed to load Image Service: ' + (err as Error).message);
          setLoading(false);
        }
      });
    } catch (err) {
      setError('Failed to initialize map: ' + (err as Error).message);
      setLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const applyColorInfraredRule = (): void => {
    if (service.current) {
      service.current.setRenderingRule({
        rasterFunction: 'Color Infrared',
      });
    }
  };

  const applyNaturalColorRule = (): void => {
    if (service.current) {
      service.current.setRenderingRule({
        rasterFunction: 'Natural Color',
      });
    }
  };

  const clearRenderingRule = (): void => {
    if (service.current) {
      service.current.setRenderingRule({});
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="map-container" style={{ position: 'relative', height: '100%' }}>
      <div ref={mapContainer} className="map" style={{ flex: 1, width: '100%', height: '100%' }} />

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Rendering Rules</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={applyNaturalColorRule}
              disabled={loading || !!error}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Natural Color
            </button>
            <button
              onClick={applyColorInfraredRule}
              disabled={loading || !!error}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Color Infrared
            </button>
            <button
              onClick={clearRenderingRule}
              disabled={loading || !!error}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Default
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading" style={{}}>
          Loading Image Service...
        </div>
      )}

      {!loading && (
        <div
          className="info-panel"
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'white',
            padding: '8px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          <h3 style={{ margin: '0 0 6px 0' }}>Image Service</h3>
          <p style={{ margin: 0 }}>
            Dynamic raster imagery from ArcGIS Image Server with rendering rules and analysis.
          </p>
          <div className="url" style={{ fontSize: 12, marginTop: 6 }}>
            https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageServiceDemo;
