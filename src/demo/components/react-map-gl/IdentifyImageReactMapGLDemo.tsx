import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { MapLayerMouseEvent, MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl, Popup } from 'react-map-gl/maplibre';
import { EsriImageLayer, IdentifyImage } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type RenderingPreset = 'natural' | 'infrared' | 'default';

type RenderingRule = Record<string, unknown> | false;

type AttributeEntry = [string, unknown];

type LngLat = { lng: number; lat: number };

type PixelSummary = {
  id: string;
  title: string;
  value: string;
  attributes: AttributeEntry[];
};

type IdentifyState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; pixels: PixelSummary[] }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string };

const IMAGE_LAYER_ID = 'react-map-gl-identify-image';
const IMAGE_SERVICE_URL = 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer';

const IdentifyImageReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [preset, setPreset] = useState<RenderingPreset>('natural');
  const [identifyState, setIdentifyState] = useState<IdentifyState>({ status: 'idle' });
  const [popupLocation, setPopupLocation] = useState<LngLat | null>(null);

  const renderingRule = useMemo<RenderingRule>(() => {
    switch (preset) {
      case 'infrared':
        return { rasterFunction: 'Color Infrared' };
      case 'default':
        return false;
      default:
        return { rasterFunction: 'Natural Color' };
    }
  }, [preset]);

  const statusChip = useMemo(() => {
    if (preset === 'infrared') return createBadgeStyle('#fecdd3', '#9f1239');
    if (preset === 'default') return createBadgeStyle('#e0f2fe', '#075985');
    return createBadgeStyle('#bbf7d0', '#065f46');
  }, [preset]);

  const presetSummary = useMemo(() => {
    if (preset === 'infrared') return 'Color Infrared rendering rule applied';
    if (preset === 'default') return 'Default service renderer sampled';
    return 'Natural Color rendering rule applied';
  }, [preset]);

  const closePopup = useCallback(() => {
    setPopupLocation(null);
    setIdentifyState({ status: 'idle' });
  }, []);

  const handleMapClick = useCallback(
    async (event: MapLayerMouseEvent) => {
      setPopupLocation({ lng: event.lngLat.lng, lat: event.lngLat.lat });
      setIdentifyState({ status: 'loading' });

      try {
        const identifyTask = new IdentifyImage({ url: IMAGE_SERVICE_URL });
        identifyTask.at({ lng: event.lngLat.lng, lat: event.lngLat.lat });

        if (renderingRule && typeof renderingRule === 'object') {
          identifyTask.renderingRule(renderingRule);
        }

        const response = await identifyTask.run();
        const { results } = response;

        if (!results || results.length === 0) {
          setIdentifyState({
            status: 'empty',
            message: 'No pixel values for that location. Try another spot.',
          });
          return;
        }

        const pixels: PixelSummary[] = results.slice(0, 3).map((result, index) => {
          const entries = Object.entries(result.attributes ?? {}) as AttributeEntry[];
          return {
            id: String(result.objectId ?? result.name ?? index),
            title: result.name || `Pixel ${index + 1}`,
            value: result.value ?? '—',
            attributes: entries.slice(0, 8),
          };
        });

        setIdentifyState({ status: 'success', pixels });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown identify error';
        setIdentifyState({ status: 'error', message });
      }
    },
    [renderingRule]
  );

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Identify Image (react-map-gl)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Sample pixel values from an ArcGIS Image Service using the <code>IdentifyImage</code>{' '}
            task while keeping imagery in sync with the currently selected rendering rule.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Rendering Preset</h3>
          <span style={statusChip}>Landsat Multispectral</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563' }}>{presetSummary}</p>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(
              [
                ['natural', 'Natural Color'],
                ['infrared', 'Color Infrared'],
                ['default', 'Default Renderer'],
              ] as [RenderingPreset, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPreset(value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: preset === value ? '#2563eb' : '#ffffff',
                  color: preset === value ? '#ffffff' : '#1f2937',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Click the map to sample pixel values — results appear in a popup at the clicked point.
          Rendering rules stay in sync between the imagery layer and the identify task.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -97, latitude: 36, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          onClick={handleMapClick}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          <EsriImageLayer
            id={IMAGE_LAYER_ID}
            url={IMAGE_SERVICE_URL}
            renderingRule={renderingRule}
          />

          {popupLocation && identifyState.status !== 'idle' && (
            <Popup
              longitude={popupLocation.lng}
              latitude={popupLocation.lat}
              anchor="top"
              maxWidth="300px"
              closeOnClick={false}
              onClose={closePopup}
            >
              <div
                style={{
                  fontSize: '12px',
                  maxHeight: '240px',
                  overflow: 'auto',
                  minWidth: '180px',
                }}
              >
                <div style={{ color: '#4b5563', marginBottom: '6px' }}>
                  {popupLocation.lng.toFixed(4)}, {popupLocation.lat.toFixed(4)}
                </div>
                {identifyState.status === 'loading' && <div>Fetching pixel values…</div>}
                {identifyState.status === 'empty' && (
                  <div style={{ color: '#6b7280' }}>{identifyState.message}</div>
                )}
                {identifyState.status === 'error' && (
                  <div style={{ color: '#991b1b' }}>{identifyState.message}</div>
                )}
                {identifyState.status === 'success' &&
                  identifyState.pixels.map(pixel => (
                    <div
                      key={pixel.id}
                      style={{
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '4px',
                        marginTop: '4px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#1f2937',
                        }}
                      >
                        <strong>{pixel.title}</strong>
                        <span>{pixel.value}</span>
                      </div>
                      {pixel.attributes.map(([key, value]) => (
                        <div
                          key={key}
                          style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}
                        >
                          <span style={{ color: '#6b7280' }}>{key}</span>
                          <span style={{ color: '#1f2937' }}>{String(value ?? '—')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
};

export default IdentifyImageReactMapGLDemo;
