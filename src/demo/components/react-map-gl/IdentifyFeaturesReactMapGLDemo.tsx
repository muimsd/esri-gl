import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { MapLayerMouseEvent, MapRef } from '@vis.gl/react-maplibre';
import { Map, NavigationControl, ScaleControl, Popup } from 'react-map-gl/maplibre';
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

type LngLat = { lng: number; lat: number };

type IdentifyState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; attributes: AttributeEntry[] }
  | { status: 'empty'; message: string }
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
  const [identifyState, setIdentifyState] = useState<IdentifyState>({ status: 'idle' });
  const [popupLocation, setPopupLocation] = useState<LngLat | null>(null);

  const layersParam = useMemo(() => {
    return selectedLayers.length ? selectedLayers : false;
  }, [selectedLayers]);

  const statusChip = useMemo(() => createBadgeStyle('#bbf7d0', '#064e3b'), []);

  const handleMapLoad = useCallback(() => setMapReady(true), []);

  const closePopup = useCallback(() => {
    setPopupLocation(null);
    setIdentifyState({ status: 'idle' });
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

      setPopupLocation({ lng: event.lngLat.lng, lat: event.lngLat.lat });
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
            status: 'empty',
            message: 'No features here. Try enabling more sublayers or another spot.',
          });
          return;
        }

        const entries = Object.entries(feature.properties).slice(0, 10) as AttributeEntry[];
        setIdentifyState({ status: 'success', attributes: entries });
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

        <div style={DEMO_FOOTER_STYLE}>
          Click anywhere on the map to identify visible dynamic layers — results appear in a popup
          at the clicked point. Identify requests respect sublayer visibility.
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
                  maxHeight: '220px',
                  overflow: 'auto',
                  minWidth: '180px',
                }}
              >
                <div style={{ color: '#4b5563', marginBottom: '6px' }}>
                  {popupLocation.lng.toFixed(4)}, {popupLocation.lat.toFixed(4)}
                </div>
                {identifyState.status === 'loading' && <div>Running identify…</div>}
                {identifyState.status === 'empty' && (
                  <div style={{ color: '#6b7280' }}>{identifyState.message}</div>
                )}
                {identifyState.status === 'error' && (
                  <div style={{ color: '#991b1b' }}>{identifyState.message}</div>
                )}
                {identifyState.status === 'success' &&
                  identifyState.attributes.map(([key, value]) => (
                    <div
                      key={key}
                      style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}
                    >
                      <strong style={{ color: '#374151' }}>{key}</strong>
                      <span style={{ color: '#1f2937' }}>{String(value ?? '—')}</span>
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

export default IdentifyFeaturesReactMapGLDemo;
