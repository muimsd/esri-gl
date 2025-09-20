import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
//@ts-ignore
import 'maplibre-gl/dist/maplibre-gl.css';
import { DynamicMapService, IdentifyFeatures } from '../../main';

const IdentifyFeaturesDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<DynamicMapService | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre GL JS map
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
      if (!map.current) return;

      // Create Dynamic Map Service
      service.current = new DynamicMapService('dynamic-source', map.current, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: selectedLayers,
        format: 'png32',
        transparent: true,
      });

      // Add layer to display the dynamic service
      map.current.addLayer({
        id: 'dynamic-layer',
        type: 'raster',
        source: 'dynamic-source',
      });

      // Add click handler for identify using IdentifyFeatures task
      map.current.on('click', async e => {
        if (!service.current || !map.current) return;

        try {
          const url: string = service.current.esriServiceOptions.url;
          const identify = new IdentifyFeatures(url);

          // Build layers parameter for Identify API (visible:<ids>)
          const layersParam =
            selectedLayers.length > 0 ? `visible:${selectedLayers.join(',')}` : 'all';

          const fc = await identify
            .at({ lng: e.lngLat.lng, lat: e.lngLat.lat })
            .on(map.current)
            .layers(layersParam)
            .tolerance(5)
            .run();

          const feature = fc.features[0];
          if (feature) {
            const props = feature.properties || {};
            let content = '<div style="max-width: 220px;">';
            Object.keys(props).forEach(key => {
              const val = (props as Record<string, unknown>)[key];
              if (val !== null && val !== '' && typeof val !== 'object') {
                content += `<div><strong>${key}:</strong> ${val}</div>`;
              }
            });
            content += '</div>';

            new maplibregl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(map.current);
          }
        } catch (error) {
          console.error('Identify (task) error:', error);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'dynamic-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'dynamic-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [selectedLayers]);

  const handleLayerToggle = (layerId: number) => {
    setSelectedLayers(prev => {
      const newLayers = prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId].sort((a, b) => a - b);

      // Update the service layers
      if (service.current && map.current) {
        service.current.setLayers(newLayers);
      }

      return newLayers;
    });
  };

  const layerOptions = [
    { id: 0, name: 'Cities' },
    { id: 1, name: 'Highways' },
    { id: 2, name: 'States' },
    { id: 3, name: 'Counties' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          fontSize: '14px',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <strong>Dynamic Map Service Demo</strong> - USA MapServer with layer controls and identify
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {layerOptions.map(layer => (
            <label key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={() => handleLayerToggle(layer.id)}
              />
              {layer.name}
            </label>
          ))}
        </div>
        <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          Click on the map to identify features
        </div>
      </div>
      <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />
    </div>
  );
};

export default IdentifyFeaturesDemo;
