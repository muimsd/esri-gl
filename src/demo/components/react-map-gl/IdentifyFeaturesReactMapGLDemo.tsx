import React, { useCallback, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapLayerMouseEvent, MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriDynamicLayer, IdentifyFeatures } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type LayerOption = {
  id: number;
  name: string;
};

type AttributeEntry = [string, unknown];

type IdentifyState =
  | { status: 'idle'; message: string }
  | { status: 'loading' }
  | { status: 'success'; attributes: AttributeEntry[]; location: { lng: number; lat: number } }
  | { status: 'error'; message: string };

const SERVICE_URL = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';

const LAYER_OPTIONS: LayerOption[] = [
  { id: 0, name: 'Cities' },
  { id: 1, name: 'Highways' },
  { id: 2, name: 'States' },
  { id: 3, name: 'Counties' },
];

const IdentifyFeaturesReactMapGLDemo: React.FC = () => {
  const mapRef = useRef<MapRef | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);
  const [identifyState, setIdentifyState] = useState<IdentifyState>({
    status: 'idle',
    message: 'Click anywhere on the map to identify visible dynamic layers.',
  });

  const layersParam = useMemo(() => {
    return selectedLayers.length ? selectedLayers : false;
  }, [selectedLayers]);

  const statusChip = useMemo(() => {
    return createBadgeStyle('#bbf7d0', '#064e3b');
  }, []);

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
  }, []);

  const toggleLayer = useCallback((layerId: number) => {
    setSelectedLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      }
      return [...prev, layerId].sort((a, b) => a - b);
    });
  }, []);

  const handleIdentify = useCallback(
    async (event: MapLayerMouseEvent) => {
      if (!mapReady || !mapRef.current) return;

      setIdentifyState({ status: 'loading' });

      try {
        const map = mapRef.current.getMap();
        const identifyTask = new IdentifyFeatures(SERVICE_URL);
        const layersDirective = selectedLayers.length
          ? `visible:${selectedLayers.join(',')}`
          : 'all';

        const featureCollection = await identifyTask
          .at({ lng: event.lngLat.lng, lat: event.lngLat.lat })
          .on(map as unknown as import('@/types').Map)
          .layers(layersDirective)
          .tolerance(5)
          .run();

        const feature = featureCollection.features?.[0];
        if (!feature || !feature.properties) {
          setIdentifyState({
            status: 'idle',
            message: 'No features returned for that location. Try enabling additional sublayers.',
          });
          return;
        }

        const entries = Object.entries(feature.properties).slice(0, 10) as AttributeEntry[];
        setIdentifyState({
          status: 'success',
          attributes: entries,
          location: { lng: event.lngLat.lng, lat: event.lngLat.lat },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown identify error';
        setIdentifyState({ status: 'error', message });
      }
    },
    [mapReady, selectedLayers]
  );

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            Identify Features (react-map-gl)
          </h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Combine <code>EsriDynamicLayer</code> with the <code>IdentifyFeatures</code> task to
            query server-rendered map services from a MapLibre canvas.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Dynamic Sublayers</h3>
          <span style={statusChip}>USA MapServer</span>
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {LAYER_OPTIONS.map(option => (
              <label key={option.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedLayers.includes(option.id)}
                  onChange={() => toggleLayer(option.id)}
                />
                {option.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Identify Result</h3>
          {identifyState.status === 'idle' && (
            <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>{identifyState.message}</p>
          )}
          {identifyState.status === 'loading' && (
            <p style={{ margin: 0, color: '#4b5563', fontSize: '13px' }}>Running identify…</p>
          )}
          {identifyState.status === 'error' && (
            <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>{identifyState.message}</p>
          )}
          {identifyState.status === 'success' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '12px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
                maxHeight: '180px',
                overflow: 'auto',
              }}
            >
              <div style={{ color: '#4b5563', marginBottom: '4px' }}>
                Location: {identifyState.location.lng.toFixed(4)},{' '}
                {identifyState.location.lat.toFixed(4)}
              </div>
              {identifyState.attributes.map(([key, value]) => (
                <div
                  key={key}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}
                >
                  <strong>{key}</strong>
                  <span>{String(value ?? '—')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Identify requests respect dynamic sublayer visibility, mirroring the MapServer behaviour
          in ArcGIS web maps.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          ref={mapRef}
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -98, latitude: 39.5, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onClick={handleIdentify}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          <EsriDynamicLayer id="react-map-gl-identify" url={SERVICE_URL} layers={layersParam} />
        </Map>
      </div>
    </div>
  );
};

export default IdentifyFeaturesReactMapGLDemo;
