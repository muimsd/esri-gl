import React, { useCallback, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapLayerMouseEvent, MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
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

type PixelSummary = {
  id: string;
  title: string;
  value: string;
  attributes: AttributeEntry[];
};

type IdentifyState =
  | { status: 'idle'; message: string }
  | { status: 'loading' }
  | { status: 'success'; pixels: PixelSummary[]; location: { lng: number; lat: number } }
  | { status: 'error'; message: string };

const IMAGE_LAYER_ID = 'react-map-gl-identify-image';
const IMAGE_SERVICE_URL = 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer';

const IdentifyImageReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [preset, setPreset] = useState<RenderingPreset>('natural');
  const [identifyState, setIdentifyState] = useState<IdentifyState>({
    status: 'idle',
    message: 'Click the map to sample pixel values from the Landsat image service.',
  });

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

  const handleMapClick = useCallback(
    async (event: MapLayerMouseEvent) => {
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
            status: 'idle',
            message: 'No pixel values were returned for that location. Try another spot.',
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

        setIdentifyState({
          status: 'success',
          pixels,
          location: { lng: event.lngLat.lng, lat: event.lngLat.lat },
        });
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
            <button
              type="button"
              onClick={() => setPreset('natural')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: preset === 'natural' ? '#2563eb' : '#ffffff',
                color: preset === 'natural' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Natural Color
            </button>
            <button
              type="button"
              onClick={() => setPreset('infrared')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: preset === 'infrared' ? '#2563eb' : '#ffffff',
                color: preset === 'infrared' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Color Infrared
            </button>
            <button
              type="button"
              onClick={() => setPreset('default')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: preset === 'default' ? '#2563eb' : '#ffffff',
                color: preset === 'default' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Default Renderer
            </button>
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Identify Result</h3>
          {identifyState.status === 'idle' && (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>{identifyState.message}</p>
          )}
          {identifyState.status === 'loading' && (
            <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>Fetching pixel values…</p>
          )}
          {identifyState.status === 'error' && (
            <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>{identifyState.message}</p>
          )}
          {identifyState.status === 'success' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '12px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
                maxHeight: '220px',
                overflow: 'auto',
              }}
            >
              <div style={{ color: '#4b5563', marginBottom: '4px' }}>
                Location: {identifyState.location.lng.toFixed(4)},{' '}
                {identifyState.location.lat.toFixed(4)}
              </div>
              {identifyState.pixels.map(pixel => (
                <div
                  key={pixel.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', color: '#1f2937' }}
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
          )}
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Rendering rules are shared between the imagery layer and identify task so pixel values
          stay in sync with the view.
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
        </Map>
      </div>
    </div>
  );
};

export default IdentifyImageReactMapGLDemo;
