import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  useDynamicMapService,
  useTiledMapService,
  useImageService,
  useFeatureService,
  useVectorTileService,
  useVectorBasemapStyle,
  useIdentifyFeatures,
  useIdentifyImage,
  useQuery,
  useFind,
} from 'esri-gl/react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USA_MAP_SERVER =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
const TILED_MAP_SERVER =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer';
const IMAGE_SERVER =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer';
const FEATURE_SERVER =
  'https://services6.arcgis.com/drBkxhK7nF7o7hKT/arcgis/rest/services/TN_Bridges/FeatureServer/0';
const VECTOR_TILE_SERVER =
  'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer';

type EsriMap = Parameters<typeof useDynamicMapService>[0]['map'];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SIDEBAR: React.CSSProperties = {
  width: 320,
  minWidth: 320,
  height: '100%',
  overflowY: 'auto',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  borderRight: '1px solid #e5e7eb',
  background: '#fafafa',
  fontSize: 13,
};

const SECTION: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
};

const SECTION_TITLE: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 14,
  fontWeight: 600,
};

const BTN: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
};

const BADGE_OK: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 9999,
  fontSize: 11,
  background: '#bbf7d0',
  color: '#064e3b',
};

const BADGE_WARN: React.CSSProperties = {
  ...BADGE_OK,
  background: '#fde68a',
  color: '#78350f',
};

const BADGE_ERR: React.CSSProperties = {
  ...BADGE_OK,
  background: '#fecaca',
  color: '#7f1d1d',
};

const LOG_PANEL: React.CSSProperties = {
  maxHeight: 160,
  overflowY: 'auto',
  background: '#111827',
  color: '#a5f3fc',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: 8,
  borderRadius: 6,
  lineHeight: 1.5,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useMapLibre() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm-tiles' }],
      },
      center: [-86.5, 36.2],
      zoom: 5,
    });

    mapRef.current = map;
    map.on('load', () => setMapReady(true));

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const esriMap = useMemo<EsriMap>(
    () => (mapReady && mapRef.current ? (mapRef.current as unknown as EsriMap) : null),
    [mapReady],
  );

  return { containerRef, mapRef, mapReady, esriMap };
}

function ts() {
  return new Date().toLocaleTimeString();
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibre();
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const log = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${ts()}] ${msg}`]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ---- Layer toggles ----
  const [dynamicOn, setDynamicOn] = useState(true);
  const [tiledOn, setTiledOn] = useState(false);
  const [imageOn, setImageOn] = useState(false);
  const [featureOn, setFeatureOn] = useState(true);
  const [vectorTileOn, setVectorTileOn] = useState(false);

  // -----------------------------------------------------------------------
  // 1. useDynamicMapService
  // -----------------------------------------------------------------------
  const dynamicOptions = useMemo(
    () => ({ url: USA_MAP_SERVER, layers: [2], transparent: true, format: 'png32' }),
    [],
  );
  const {
    service: dynamicSvc,
    loading: dynamicLoading,
    error: dynamicError,
  } = useDynamicMapService({
    sourceId: 'dynamic-src',
    map: dynamicOn ? esriMap : null,
    options: dynamicOptions,
  });

  useEffect(() => {
    if (dynamicSvc) log('DynamicMapService ready');
  }, [dynamicSvc, log]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !dynamicSvc) return;
    const map = mapRef.current;
    const LAYER = 'dynamic-lyr';
    const tryAdd = () => {
      if (map.getLayer(LAYER) || !map.getSource('dynamic-src')) return;
      map.addLayer({ id: LAYER, type: 'raster', source: 'dynamic-src' });
    };
    tryAdd();
    const iv = setInterval(tryAdd, 200);
    return () => {
      clearInterval(iv);
      try { if (map.getStyle?.() && map.getLayer(LAYER)) map.removeLayer(LAYER); } catch { /* */ }
    };
  }, [mapReady, dynamicSvc]);

  // -----------------------------------------------------------------------
  // 2. useTiledMapService
  // -----------------------------------------------------------------------
  const tiledOptions = useMemo(() => ({ url: TILED_MAP_SERVER }), []);
  const {
    service: tiledSvc,
    loading: tiledLoading,
    error: tiledError,
  } = useTiledMapService({
    sourceId: 'tiled-src',
    map: tiledOn ? esriMap : null,
    options: tiledOptions,
  });

  useEffect(() => {
    if (tiledSvc) log('TiledMapService ready');
  }, [tiledSvc, log]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !tiledSvc) return;
    const map = mapRef.current;
    const LAYER = 'tiled-lyr';
    const tryAdd = () => {
      if (map.getLayer(LAYER) || !map.getSource('tiled-src')) return;
      map.addLayer({ id: LAYER, type: 'raster', source: 'tiled-src' });
    };
    tryAdd();
    const iv = setInterval(tryAdd, 200);
    return () => {
      clearInterval(iv);
      try { if (map.getStyle?.() && map.getLayer(LAYER)) map.removeLayer(LAYER); } catch { /* */ }
    };
  }, [mapReady, tiledSvc]);

  // -----------------------------------------------------------------------
  // 3. useImageService
  // -----------------------------------------------------------------------
  const imageOptions = useMemo(() => ({ url: IMAGE_SERVER }), []);
  const {
    service: imageSvc,
    loading: imageLoading,
    error: imageError,
  } = useImageService({
    sourceId: 'image-src',
    map: imageOn ? esriMap : null,
    options: imageOptions,
  });

  useEffect(() => {
    if (imageSvc) log('ImageService ready');
  }, [imageSvc, log]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !imageSvc) return;
    const map = mapRef.current;
    const LAYER = 'image-lyr';
    const tryAdd = () => {
      if (map.getLayer(LAYER) || !map.getSource('image-src')) return;
      map.addLayer({ id: LAYER, type: 'raster', source: 'image-src' });
    };
    tryAdd();
    const iv = setInterval(tryAdd, 200);
    return () => {
      clearInterval(iv);
      try { if (map.getStyle?.() && map.getLayer(LAYER)) map.removeLayer(LAYER); } catch { /* */ }
    };
  }, [mapReady, imageSvc]);

  // -----------------------------------------------------------------------
  // 4. useFeatureService
  // -----------------------------------------------------------------------
  const featureOptions = useMemo(
    () => ({ url: FEATURE_SERVER, outFields: '*', where: '1=1', minZoom: 7, useServiceBounds: true }),
    [],
  );
  const {
    service: featureSvc,
    loading: featureLoading,
    error: featureError,
  } = useFeatureService({
    sourceId: 'feature-src',
    map: featureOn ? esriMap : null,
    options: featureOptions,
  });

  useEffect(() => {
    if (featureSvc) log('FeatureService ready');
  }, [featureSvc, log]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !featureSvc) return;
    const map = mapRef.current;
    const LAYER = 'feature-lyr';
    const tryAdd = () => {
      if (map.getLayer(LAYER) || !map.getSource('feature-src')) return;
      map.addLayer({
        id: LAYER,
        type: 'circle',
        source: 'feature-src',
        paint: {
          'circle-radius': 4,
          'circle-color': '#3b82f6',
          'circle-stroke-color': '#1e3a5f',
          'circle-stroke-width': 1,
        },
      });
    };
    tryAdd();
    const iv = setInterval(tryAdd, 200);
    return () => {
      clearInterval(iv);
      try { if (map.getStyle?.() && map.getLayer(LAYER)) map.removeLayer(LAYER); } catch { /* */ }
    };
  }, [mapReady, featureSvc]);

  // -----------------------------------------------------------------------
  // 5. useVectorTileService
  // -----------------------------------------------------------------------
  const vectorTileOptions = useMemo(() => ({ url: VECTOR_TILE_SERVER }), []);
  const {
    service: vectorTileSvc,
    loading: vectorTileLoading,
    error: vectorTileError,
  } = useVectorTileService({
    sourceId: 'vector-tile-src',
    map: vectorTileOn ? esriMap : null,
    options: vectorTileOptions,
  });

  useEffect(() => {
    if (vectorTileSvc) log('VectorTileService ready');
  }, [vectorTileSvc, log]);

  // Vector tile service adds its own layers via the style, so no manual addLayer needed

  // -----------------------------------------------------------------------
  // 6. useVectorBasemapStyle (needs an API key / token -- demo without credential)
  // -----------------------------------------------------------------------
  const {
    service: basemapSvc,
    loading: basemapLoading,
    error: basemapError,
  } = useVectorBasemapStyle({
    options: { url: VECTOR_TILE_SERVER },
  });

  useEffect(() => {
    if (basemapSvc) log('VectorBasemapStyle ready');
  }, [basemapSvc, log]);

  // -----------------------------------------------------------------------
  // 7. useIdentifyFeatures
  // -----------------------------------------------------------------------
  const {
    identify,
    loading: identifyLoading,
    error: identifyError,
  } = useIdentifyFeatures({
    url: USA_MAP_SERVER,
    tolerance: 5,
    returnGeometry: false,
  });

  const popupRef = useRef<maplibregl.Popup | null>(null);

  const runIdentifyFeatures = useCallback(async () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const center = map.getCenter();
    log(`IdentifyFeatures at ${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}...`);
    try {
      const results = await identify(
        { lng: center.lng, lat: center.lat },
        { layers: 'all', map: esriMap as unknown as EsriMap },
      );
      const count = results?.features?.length ?? 0;
      log(`IdentifyFeatures returned ${count} feature(s)`);

      popupRef.current?.remove();
      if (count > 0) {
        const props = results.features![0].properties ?? {};
        const entries = Object.entries(props).slice(0, 6);
        const html = entries
          .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
          .join('<br/>');
        popupRef.current = new maplibregl.Popup()
          .setLngLat(center)
          .setHTML(`<div style="font-size:12px;max-width:240px">${html}</div>`)
          .addTo(map);
      }
    } catch (err) {
      log(`IdentifyFeatures error: ${err instanceof Error ? err.message : err}`);
    }
  }, [identify, esriMap, log]);

  // -----------------------------------------------------------------------
  // 8. useIdentifyImage
  // -----------------------------------------------------------------------
  const {
    identifyImage,
    loading: identifyImageLoading,
    error: identifyImageError,
  } = useIdentifyImage({ url: IMAGE_SERVER });

  const runIdentifyImage = useCallback(async () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    log(`IdentifyImage at ${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}...`);
    try {
      const results = await identifyImage({ lng: center.lng, lat: center.lat });
      const val = results?.results?.[0]?.value;
      log(`IdentifyImage value: ${val ?? 'none'}`);
    } catch (err) {
      log(`IdentifyImage error: ${err instanceof Error ? err.message : err}`);
    }
  }, [identifyImage, log]);

  // -----------------------------------------------------------------------
  // 9. useQuery
  // -----------------------------------------------------------------------
  const {
    query,
    loading: queryLoading,
    error: queryError,
  } = useQuery({
    url: FEATURE_SERVER,
    where: '1=1',
    outFields: 'OBJECTID',
    returnGeometry: false,
  });

  const runQuery = useCallback(async () => {
    log('Query: fetching feature count...');
    try {
      const results = await query();
      const count = results?.features?.length ?? 0;
      log(`Query returned ${count} feature(s)`);
    } catch (err) {
      log(`Query error: ${err instanceof Error ? err.message : err}`);
    }
  }, [query, log]);

  // -----------------------------------------------------------------------
  // 10. useFind
  // -----------------------------------------------------------------------
  const {
    find,
    loading: findLoading,
    error: findError,
  } = useFind({
    url: USA_MAP_SERVER,
    searchText: 'California',
    layers: [2],
    searchFields: 'state_name',
  });

  const runFind = useCallback(async () => {
    log('Find: searching for "California"...');
    try {
      const results = await find();
      const count = results?.features?.length ?? 0;
      log(`Find returned ${count} result(s)`);
    } catch (err) {
      log(`Find error: ${err instanceof Error ? err.message : err}`);
    }
  }, [find, log]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const serviceStatus = (
    label: string,
    svc: unknown,
    loading: boolean,
    error: Error | null,
  ) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ fontWeight: 500, minWidth: 90 }}>{label}</span>
      {loading && <span style={BADGE_WARN}>loading</span>}
      {error && <span style={BADGE_ERR} title={error.message}>error</span>}
      {!loading && !error && svc && <span style={BADGE_OK}>ready</span>}
      {!loading && !error && !svc && <span style={{ color: '#9ca3af', fontSize: 11 }}>off</span>}
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Sidebar */}
      <aside style={SIDEBAR}>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
          esri-gl React Hooks
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
          All hooks from <code>esri-gl/react</code>
        </p>

        {/* Service Status */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}>Service Hooks</h3>
          {serviceStatus('Dynamic', dynamicSvc, dynamicLoading, dynamicError)}
          {serviceStatus('Tiled', tiledSvc, tiledLoading, tiledError)}
          {serviceStatus('Image', imageSvc, imageLoading, imageError)}
          {serviceStatus('Feature', featureSvc, featureLoading, featureError)}
          {serviceStatus('VectorTile', vectorTileSvc, vectorTileLoading, vectorTileError)}
          {serviceStatus('Basemap', basemapSvc, basemapLoading, basemapError)}
        </div>

        {/* Layer Toggles */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}>Layer Toggles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Dynamic (USA States)', checked: dynamicOn, set: setDynamicOn },
              { label: 'Tiled (World Topo)', checked: tiledOn, set: setTiledOn },
              { label: 'Image (Land Cover)', checked: imageOn, set: setImageOn },
              { label: 'Feature (TN Bridges)', checked: featureOn, set: setFeatureOn },
              { label: 'Vector Tile', checked: vectorTileOn, set: setVectorTileOn },
            ].map(({ label, checked, set }) => (
              <label key={label} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    set(v => !v);
                    log(`${label}: ${checked ? 'OFF' : 'ON'}`);
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Task Hooks */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}>Task Hooks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              style={{ ...BTN, opacity: identifyLoading ? 0.6 : 1 }}
              disabled={identifyLoading}
              onClick={runIdentifyFeatures}
            >
              {identifyLoading ? 'Identifying...' : 'Identify Features (map center)'}
            </button>
            {identifyError && (
              <span style={BADGE_ERR}>Error: {identifyError.message}</span>
            )}

            <button
              style={{ ...BTN, opacity: identifyImageLoading ? 0.6 : 1 }}
              disabled={identifyImageLoading}
              onClick={runIdentifyImage}
            >
              {identifyImageLoading ? 'Identifying...' : 'Identify Image (map center)'}
            </button>
            {identifyImageError && (
              <span style={BADGE_ERR}>Error: {identifyImageError.message}</span>
            )}

            <button
              style={{ ...BTN, opacity: queryLoading ? 0.6 : 1 }}
              disabled={queryLoading}
              onClick={runQuery}
            >
              {queryLoading ? 'Querying...' : 'Query Feature Count'}
            </button>
            {queryError && (
              <span style={BADGE_ERR}>Error: {queryError.message}</span>
            )}

            <button
              style={{ ...BTN, opacity: findLoading ? 0.6 : 1 }}
              disabled={findLoading}
              onClick={runFind}
            >
              {findLoading ? 'Searching...' : 'Find "California"'}
            </button>
            {findError && (
              <span style={BADGE_ERR}>Error: {findError.message}</span>
            )}
          </div>
        </div>

        {/* VectorBasemapStyle note */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}>useVectorBasemapStyle</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
            Requires an ArcGIS API key or token. The hook is initialized above
            but will remain inactive without credentials. Pass{' '}
            <code>{'{ options: { token: "..." } }'}</code> to activate.
          </p>
        </div>

        {/* Event Log */}
        <div style={SECTION}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ ...SECTION_TITLE, margin: 0 }}>Event Log</h3>
            <button style={{ ...BTN, fontSize: 11, padding: '3px 8px' }} onClick={() => setLogs([])}>
              Clear
            </button>
          </div>
          <div style={LOG_PANEL}>
            {logs.length === 0 && <span style={{ color: '#6b7280' }}>No events yet.</span>}
            {logs.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </aside>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
        {!mapReady && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.8)', zIndex: 10,
          }}>
            Loading map...
          </div>
        )}
      </div>
    </div>
  );
}
