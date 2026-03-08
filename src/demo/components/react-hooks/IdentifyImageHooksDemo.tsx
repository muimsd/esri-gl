import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useImageService, useIdentifyImage } from '../../../react';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SOURCE_ID = 'hooks-identify-image-source';
const LAYER_ID = 'hooks-identify-image-layer';

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

type ServiceKey = keyof typeof services;

const selectStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  width: '100%',
};

const IdentifyImageHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-120, 40],
    zoom: 6,
  });

  const [selectedService, setSelectedService] = useState<ServiceKey>('elevation');
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [, setLastResult] = useState<string | null>(null);

  const imageOptions = useMemo(() => ({ url: services[selectedService].url }), [selectedService]);

  const { service, loading: serviceLoading } = useImageService({
    sourceId: SOURCE_ID,
    map: esriMap,
    options: imageOptions,
  });

  const {
    identifyImage,
    loading: identifyLoading,
    error: identifyError,
  } = useIdentifyImage({
    url: services[selectedService].url,
  });

  // Add raster layer once the service + map are ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);

    // Wait for source to be available
    const tryAdd = () => {
      if (!map.getSource(SOURCE_ID)) return false;
      map.addLayer({ id: LAYER_ID, type: 'raster', source: SOURCE_ID });
      return true;
    };

    if (tryAdd()) return;

    const onSourceData = (e: unknown) => {
      if ((e as { sourceId?: string })?.sourceId === SOURCE_ID && tryAdd()) {
        (map as any).off('sourcedata', onSourceData);
        clearInterval(interval);
      }
    };
    (map as any).on('sourcedata', onSourceData);
    const interval = window.setInterval(() => {
      if (tryAdd()) {
        (map as any).off('sourcedata', onSourceData);
        clearInterval(interval);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      (map as any).off('sourcedata', onSourceData);
      if (map.getStyle?.() && map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
    };
  }, [mapReady, service]);

  // Set crosshair cursor
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = 'crosshair';
  }, [mapReady]);

  // Click handler for identify
  const handleClick = useCallback(
    async (e: maplibregl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      const { lng, lat } = e.lngLat;

      popupRef.current?.remove();
      popupRef.current = new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML('<div style="padding:4px">Querying...</div>')
        .addTo(map);

      try {
        const result = await identifyImage({ lng, lat });
        const first = result.results?.[0];
        let html: string;

        if (first?.value !== undefined && first.value !== null) {
          const svcName = services[selectedService].name;
          html = `<div style="max-width:220px">
            <strong>${svcName}</strong><br><br>
            <strong>Value:</strong> ${first.value}<br>
            <strong>Location:</strong><br>
            Lng: ${lng.toFixed(4)}&deg;<br>
            Lat: ${lat.toFixed(4)}&deg;
            ${
              first.attributes && Object.keys(first.attributes).length > 0
                ? '<br><br><strong>Attributes:</strong><br>' +
                  Object.entries(first.attributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('<br>')
                : ''
            }
          </div>`;
        } else {
          html = '<div>No data available at this location</div>';
        }

        setLastResult(html);
        popupRef.current?.setHTML(html);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        const errHtml = `<div style="color:red">Error: ${msg}</div>`;
        setLastResult(errHtml);
        popupRef.current?.setHTML(errHtml);
      }
    },
    [identifyImage, selectedService]
  );

  // Register/unregister click handler
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mapReady, handleClick]);

  // Clean up popup on unmount
  useEffect(
    () => () => {
      popupRef.current?.remove();
      popupRef.current = null;
    },
    []
  );

  // Clear popup & result when switching services
  useEffect(() => {
    popupRef.current?.remove();
    setLastResult(null);
  }, [selectedService]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Identify Image (Hooks)</h2>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Image Service</h3>
          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value as ServiceKey)}
            style={selectStyle}
          >
            {Object.entries(services).map(([key, svc]) => (
              <option key={key} value={key}>
                {svc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Status</h3>
          {serviceLoading && (
            <span style={createBadgeStyle('#fde68a', '#78350f')}>Loading service...</span>
          )}
          {identifyLoading && (
            <span style={createBadgeStyle('#fde68a', '#78350f')}>Identifying...</span>
          )}
          {identifyError && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>
              Error: {identifyError.message}
            </span>
          )}
          {!serviceLoading && !identifyLoading && !identifyError && service && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Ready</span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Instructions</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#52525b', lineHeight: 1.5 }}>
            Click anywhere on the map to identify pixel values using the{' '}
            <code>useIdentifyImage</code> hook. A popup will appear with the result.
          </p>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Demonstrates <code>useImageService</code> for rendering and <code>useIdentifyImage</code>{' '}
          for pixel identification.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default IdentifyImageHooksDemo;
