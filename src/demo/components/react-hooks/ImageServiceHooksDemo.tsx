import React, { useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useImageService } from '../../../react';
import type { ImageServiceOptions } from '../../../types';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SOURCE_ID = 'hooks-image-source';
const LAYER_ID = 'hooks-image-layer';
const IMAGE_SERVICE_URL = 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer';

type RenderingRuleOption = {
  label: string;
  value: string | null;
};

const RENDERING_RULES: RenderingRuleOption[] = [
  { label: 'Natural Color', value: 'Natural Color' },
  { label: 'Color Infrared', value: 'Color Infrared' },
  { label: 'Short-wave Infrared', value: 'Short-wave Infrared' },
  { label: 'None (Server Default)', value: null },
];

const ImageServiceHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: 'https://demotiles.maplibre.org/style.json',
    center: [-110.0, 40.0],
    zoom: 5,
  });

  const [opacity, setOpacity] = useState(0.85);
  const [renderingRule, setRenderingRule] = useState<RenderingRuleOption>(RENDERING_RULES[0]);

  const imageOptions = useMemo<ImageServiceOptions>(
    () => ({
      url: IMAGE_SERVICE_URL,
      format: 'jpg',
      renderingRule: renderingRule.value
        ? {
            rasterFunction: renderingRule.value,
          }
        : undefined,
    }),
    [renderingRule]
  );

  const { service, loading, error } = useImageService({
    sourceId: SOURCE_ID,
    map: esriMap,
    options: imageOptions,
    sourceOptions: {
      tileSize: 256,
    },
  });

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    const eventedMap = map as unknown as {
      on?: (type: string, listener: (...args: unknown[]) => void) => void;
      off?: (type: string, listener: (...args: unknown[]) => void) => void;
      isStyleLoaded?: () => boolean;
      loaded?: () => boolean;
    };
    const layerApi = map as unknown as {
      getLayer?: (id: string) => unknown;
      addLayer?: (layer: unknown) => void;
      removeLayer?: (id: string) => void;
      setPaintProperty?: (layerId: string, name: string, value: unknown) => void;
    };

    // Guard against missing APIs
    if (
      typeof eventedMap.on !== 'function' ||
      typeof eventedMap.off !== 'function' ||
      typeof layerApi.getLayer !== 'function' ||
      typeof layerApi.addLayer !== 'function' ||
      typeof layerApi.removeLayer !== 'function' ||
      typeof layerApi.setPaintProperty !== 'function'
    ) {
      return;
    }

    // Bind methods to preserve context
    const mapOn = eventedMap.on.bind(eventedMap);
    const mapOff = eventedMap.off.bind(eventedMap);
    const getLayer = layerApi.getLayer.bind(layerApi);
    const addLayer = layerApi.addLayer.bind(layerApi);
    const removeLayer = layerApi.removeLayer.bind(layerApi);
    const setPaintProperty = layerApi.setPaintProperty.bind(layerApi);

    const ensureLayer = () => {
      try {
        const mapInstance = map as unknown as { getSource?: (id: string) => unknown };
        if (typeof mapInstance.getSource === 'function' && !mapInstance.getSource(SOURCE_ID)) {
          return; // Source not ready yet
        }
        if (!getLayer(LAYER_ID)) {
          addLayer({
            id: LAYER_ID,
            type: 'raster',
            source: SOURCE_ID,
            paint: {
              'raster-opacity': opacity,
            },
          });
        } else {
          setPaintProperty(LAYER_ID, 'raster-opacity', opacity);
        }
      } catch (error) {
        console.warn('Failed to ensure image layer', error);
      }
    };

    const onLoad = () => {
      ensureLayer();
      try {
        mapOff('load', onLoad);
      } catch {
        // Ignore cleanup errors
      }
    };

    // Always try to ensure layer immediately, and also on style events
    ensureLayer();
    try {
      mapOn('load', onLoad);
    } catch (error) {
      console.warn('Failed to bind load listener', error);
    }

    return () => {
      try {
        mapOff('load', onLoad);
      } catch {
        // Ignore cleanup errors
      }
      try {
        if (getLayer(LAYER_ID)) {
          removeLayer(LAYER_ID);
        }
      } catch {
        // Map may be disposed
      }
    };
  }, [mapReady, service, opacity]);

  const applyRenderingRule = (option: RenderingRuleOption) => {
    if (!service) return;
    setRenderingRule(option);
    if (!option.value) {
      service.setRenderingRule({});
      return;
    }
    service.setRenderingRule({
      rasterFunction: option.value,
    });
  };

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Image Service (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Landsat multispectral imagery delivered via <code>useImageService</code> with live
            rendering rule swaps.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Loading imagery…</span>}
          {error && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error.message}</span>
          )}
          {!loading && !error && service && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Image layer ready</span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Rendering Rules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RENDERING_RULES.map(option => (
              <button
                key={option.label}
                onClick={() => applyRenderingRule(option)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: renderingRule.label === option.label ? '#2563eb' : '#ffffff',
                  color: renderingRule.label === option.label ? '#ffffff' : '#1f2937',
                  cursor: 'pointer',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Opacity</h3>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.05}
            value={opacity}
            onChange={event => setOpacity(Number(event.target.value))}
            style={{ width: '100%' }}
          />
          <p style={{ margin: '6px 0 0', color: '#4b5563' }}>{(opacity * 100).toFixed(0)}%</p>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Compare different Landsat spectral composites instantly without tearing down the service.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default ImageServiceHooksDemo;
