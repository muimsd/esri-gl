import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { VectorTileService } from '../../main';

const VectorTileServiceDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<VectorTileService | null>(null);
  const [layerAdded, setLayerAdded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
      center: [-118.2437, 34.0522],
      zoom: 9,
    });

    map.current.on('load', () => {
      // Example Vector Tile Service URL
      const serviceUrl =
        'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized_Boundaries/VectorTileServer';

      service.current = new VectorTileService('vector-tiles-demo', map.current!, {
        url: serviceUrl,
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const addLayer = async (): Promise<void> => {
    if (service.current && map.current && !layerAdded) {
      try {
        const style = await service.current.getStyle();
        // Add layer with dynamic type checking
        const layerConfig = {
          id: 'vector-tiles-layer',
          source: 'vector-tiles-demo',
          'source-layer': style['source-layer'],
          layout: style.layout || {},
          paint: style.paint || {},
        };

        if (style.type === 'fill') {
          map.current.addLayer({ ...layerConfig, type: 'fill' });
        } else if (style.type === 'line') {
          map.current.addLayer({ ...layerConfig, type: 'line' });
        } else if (style.type === 'symbol') {
          map.current.addLayer({ ...layerConfig, type: 'symbol' });
        } else if (style.type === 'circle') {
          map.current.addLayer({ ...layerConfig, type: 'circle' });
        } else {
          // Default to fill
          map.current.addLayer({ ...layerConfig, type: 'fill' });
        }

        setLayerAdded(true);
      } catch (error) {
        console.error('Error adding vector tile layer:', error);
        // Fallback style
        map.current.addLayer({
          id: 'vector-tiles-layer',
          type: 'fill',
          source: 'vector-tiles-demo',
          'source-layer': 'County',
          paint: {
            'fill-color': '#088',
            'fill-opacity': 0.8,
          },
        });
        setLayerAdded(true);
      }
    }
  };

  const removeLayer = (): void => {
    if (map.current && layerAdded) {
      map.current.removeLayer('vector-tiles-layer');
      setLayerAdded(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <h3>Vector Tile Service Demo</h3>
        <p>Displays vector tiles from an ArcGIS Vector Tile Service</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={addLayer}
            disabled={layerAdded}
            style={{
              padding: '5px 10px',
              backgroundColor: layerAdded ? '#ccc' : '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: layerAdded ? 'not-allowed' : 'pointer',
            }}
          >
            Add Layer
          </button>
          <button
            onClick={removeLayer}
            disabled={!layerAdded}
            style={{
              padding: '5px 10px',
              backgroundColor: !layerAdded ? '#ccc' : '#d9534f',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: !layerAdded ? 'not-allowed' : 'pointer',
            }}
          >
            Remove Layer
          </button>
        </div>
      </div>
      <div ref={mapContainer} style={{ width: '100%', height: 'calc(100% - 100px)' }} />
    </div>
  );
};

export default VectorTileServiceDemo;
