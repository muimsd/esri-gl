import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map, Popup } from 'maplibre-gl';
import { ImageService, IdentifyImage } from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
} from '../shared/styles';

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

const selectStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  width: '100%',
};

const IdentifyImageDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const popup = useRef<Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedService, setSelectedService] = useState('elevation');
  const selectedServiceRef = useRef(selectedService);

  // Keep ref in sync with state so the click handler always uses the latest value
  useEffect(() => {
    selectedServiceRef.current = selectedService;
  }, [selectedService]);

  const handleMapClick = useCallback(async (e: maplibregl.MapMouseEvent) => {
    const m = map.current;
    if (!m) return;

    const lngLat = e.lngLat;
    const serviceKey = selectedServiceRef.current as keyof typeof services;
    const serviceConfig = services[serviceKey];

    // Show loading popup
    popup.current?.remove();
    popup.current = new maplibregl.Popup()
      .setLngLat(lngLat)
      .setHTML('<div style="padding:4px">Querying…</div>')
      .addTo(m);

    try {
      const identifyTask = new IdentifyImage({ url: serviceConfig.url });
      const result = await identifyTask.at({ lng: lngLat.lng, lat: lngLat.lat }).run();

      const firstResult = result.results?.[0];
      let html: string;

      if (firstResult?.value !== undefined && firstResult.value !== null) {
        html = `<div style="max-width:220px">
          <strong>${serviceConfig.name}</strong><br><br>
          <strong>Value:</strong> ${firstResult.value}<br>
          <strong>Location:</strong><br>
          Lng: ${lngLat.lng.toFixed(4)}°<br>
          Lat: ${lngLat.lat.toFixed(4)}°
          ${
            firstResult.attributes && Object.keys(firstResult.attributes).length > 0
              ? '<br><br><strong>Attributes:</strong><br>' +
                Object.entries(firstResult.attributes)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('<br>')
              : ''
          }
        </div>`;
      } else {
        html = '<div>No data available at this location</div>';
      }

      popup.current?.setHTML(html);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      popup.current?.setHTML(`<div style="color:red">Error: ${msg}</div>`);
    }
  }, []);

  const loadImageService = useCallback((serviceKey: string) => {
    const m = map.current;
    if (!m) return;

    if (m.getSource('image-service')) {
      if (m.getLayer('image-layer')) m.removeLayer('image-layer');
      m.removeSource('image-service');
    }

    const serviceConfig = services[serviceKey as keyof typeof services];
    new ImageService('image-service', m, { url: serviceConfig.url });

    m.addLayer({
      id: 'image-layer',
      type: 'raster',
      source: 'image-service',
    });
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-120, 40],
      zoom: 6,
    });

    map.current.getCanvas().style.cursor = 'crosshair';

    map.current.on('load', () => {
      loadImageService(selectedServiceRef.current);
      setIsLoaded(true);
    });

    map.current.on('click', handleMapClick);

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [handleMapClick, loadImageService]);

  useEffect(() => {
    if (isLoaded) {
      popup.current?.remove();
      loadImageService(selectedService);
    }
  }, [selectedService, isLoaded, loadImageService]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Identify Image (ESM)</h2>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Image Service</h3>
        <select
          value={selectedService}
          onChange={e => setSelectedService(e.target.value)}
          style={selectStyle}
        >
          {Object.entries(services).map(([key, svc]) => (
            <option key={key} value={key}>
              {svc.name}
            </option>
          ))}
        </select>

        <h3 style={DEMO_SECTION_TITLE_STYLE}>Instructions</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#52525b', lineHeight: 1.5 }}>
          Click anywhere on the map to identify pixel values. A popup will appear with the result.
        </p>

        <div style={DEMO_FOOTER_STYLE}>esri-gl</div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default IdentifyImageDemo;
