import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { DynamicMapService, IdentifyFeatures } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type PopupLike = {
  setLngLat(lngLat: { lng: number; lat: number }): PopupLike;
  setHTML(html: string): PopupLike;
  addTo(target: unknown): PopupLike;
};

interface IdentifyResult {
  layerName: string;
  attributes: Record<string, unknown>;
}

const IdentifyFeaturesDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<DynamicMapService | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);
  const [identifyStatus, setIdentifyStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle'
  );
  const [identifyResults, setIdentifyResults] = useState<IdentifyResult[]>([]);

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
      const mapInstance = map.current as unknown as {
        on: (...args: unknown[]) => maplibregl.Map;
        getCanvas: () => HTMLCanvasElement;
      };

      mapInstance.on('click', async (event: unknown) => {
        const e = event as { lngLat: { lng: number; lat: number } };
        if (!service.current || !map.current) return;

        setIdentifyStatus('loading');
        setIdentifyResults([]);

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

          const results: IdentifyResult[] = fc.features.map(feature => ({
            layerName:
              ((feature.properties as Record<string, unknown>)?.layerName as string) || 'Unknown',
            attributes: (feature.properties as Record<string, unknown>) || {},
          }));

          setIdentifyResults(results);
          setIdentifyStatus('done');

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

            const popup = new maplibregl.Popup() as unknown as PopupLike;
            popup.setLngLat(e.lngLat).setHTML(content).addTo(map.current);
          }
        } catch (error) {
          console.error('Identify (task) error:', error);
          setIdentifyStatus('error');
        }
      });

      // Change cursor on hover
      mapInstance.on('mouseenter', 'dynamic-layer', () => {
        if (map.current) mapInstance.getCanvas().style.cursor = 'pointer';
      });

      mapInstance.on('mouseleave', 'dynamic-layer', () => {
        if (map.current) mapInstance.getCanvas().style.cursor = '';
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
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Identify Features (ESM)</h2>

        {/* Visible Sublayers section */}
        <h3 style={DEMO_SECTION_TITLE_STYLE}>Visible Sublayers</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {layerOptions.map(layer => (
            <label
              key={layer.id}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <input
                type="checkbox"
                checked={selectedLayers.includes(layer.id)}
                onChange={() => handleLayerToggle(layer.id)}
              />
              {layer.name}
            </label>
          ))}
        </div>

        {/* Identify section */}
        <h3 style={DEMO_SECTION_TITLE_STYLE}>Identify</h3>
        <div>
          {identifyStatus === 'idle' && (
            <span style={createBadgeStyle('#a1a1aa')}>Waiting for click</span>
          )}
          {identifyStatus === 'loading' && (
            <span style={createBadgeStyle('#f59e0b', '#92400e')}>Identifying...</span>
          )}
          {identifyStatus === 'error' && (
            <span style={createBadgeStyle('#ef4444', '#991b1b')}>Identify failed</span>
          )}
          {identifyStatus === 'done' && identifyResults.length === 0 && (
            <span style={createBadgeStyle('#a1a1aa')}>No features found</span>
          )}
          {identifyStatus === 'done' && identifyResults.length > 0 && (
            <>
              <span style={createBadgeStyle('#059669', '#065f46')}>
                {identifyResults.length} feature{identifyResults.length !== 1 ? 's' : ''} found
              </span>
              <div
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {identifyResults.map((result, idx) => (
                  <div
                    key={idx}
                    style={{ marginBottom: idx < identifyResults.length - 1 ? '8px' : 0 }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#1e40af',
                        marginBottom: '2px',
                      }}
                    >
                      {result.layerName}
                    </div>
                    {Object.entries(result.attributes).map(([key, val]) => {
                      if (val === null || val === '' || typeof val === 'object') return null;
                      return (
                        <div key={key} style={{ fontSize: '11px', color: '#374151' }}>
                          <strong>{key}:</strong> {String(val)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p style={DEMO_FOOTER_STYLE}>Click the map to identify features from visible sublayers.</p>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default IdentifyFeaturesDemo;
