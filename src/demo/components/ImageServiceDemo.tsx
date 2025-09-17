import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
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
        style:
          '{ version: 8, sources: { "osm": { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm" }] }',
        center: [-95, 40],
        zoom: 4,
      });

      map.current.on('load', () => {
        try {
          service.current = new ImageService('landsat-image', map.current!, {
            url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
            format: 'jpg',
            renderingRule: false,
          });

          map.current!.addLayer({
            id: 'landsat-layer',
            type: 'raster',
            source: 'landsat-image',
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

  if (loading) {
    return <div className="loading">Loading Image Service...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="map-container">
      <div ref={mapContainer} className="map" />
      <div className="info-panel">
        <h3>Image Service</h3>
        <p>Dynamic raster imagery from ArcGIS Image Server with rendering rules and analysis.</p>
        <div className="url">
          https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer
        </div>
      </div>
      <div className="controls">
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Rendering Rules</h4>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={applyNaturalColorRule}>Natural Color</button>
          <button onClick={applyColorInfraredRule}>Color Infrared</button>
          <button onClick={clearRenderingRule}>Default</button>
        </div>
      </div>
    </div>
  );
};

export default ImageServiceDemo;
