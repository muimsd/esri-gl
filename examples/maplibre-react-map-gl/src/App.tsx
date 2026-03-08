import { useState, useCallback, useRef } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import {
  EsriDynamicLayer,
  EsriTiledLayer,
  EsriImageLayer,
  EsriFeatureLayer,
  EsriVectorTileLayer,
  Query,
  Find,
  IdentifyFeatures,
  IdentifyImage,
} from 'esri-gl/react-map-gl';

// ---------------------------------------------------------------------------
// ArcGIS sample-server URLs
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

// ---------------------------------------------------------------------------
// Layer toggle state
// ---------------------------------------------------------------------------
interface LayerVisibility {
  dynamic: boolean;
  tiled: boolean;
  image: boolean;
  feature: boolean;
  vectorTile: boolean;
}

const INITIAL_VISIBILITY: LayerVisibility = {
  dynamic: true,
  tiled: false,
  image: false,
  feature: true,
  vectorTile: false,
};

// ---------------------------------------------------------------------------
// Log entry
// ---------------------------------------------------------------------------
interface LogEntry {
  id: number;
  time: string;
  label: string;
  detail: string;
}

let logId = 0;

function timestamp(): string {
  return new Date().toLocaleTimeString();
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  const mapRef = useRef<MapRef>(null);
  const [visibility, setVisibility] = useState<LayerVisibility>(INITIAL_VISIBILITY);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  // ------ helpers -----------------------------------------------------------
  const addLog = useCallback((label: string, detail: string) => {
    setLogs((prev) => [
      { id: ++logId, time: timestamp(), label, detail },
      ...prev.slice(0, 99),
    ]);
  }, []);

  const toggle = (key: keyof LayerVisibility) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  // ------ tasks -------------------------------------------------------------
  const runQuery = useCallback(async () => {
    setRunning('Query');
    try {
      const q = new Query({
        url: `${USA_MAP_SERVER}/2`,
        where: 'pop2000 > 1000000',
        outFields: 'state_name,pop2000',
        returnGeometry: false,
      });
      const results = await q.run();
      const features = results?.features ?? results ?? [];
      const count = Array.isArray(features) ? features.length : 0;
      const names = Array.isArray(features)
        ? features
            .slice(0, 5)
            .map((f: any) => {
              const attrs = f.attributes ?? f.properties ?? {};
              return `${attrs.state_name ?? attrs.STATE_NAME ?? '?'} (${attrs.pop2000 ?? attrs.POP2000 ?? '?'})`;
            })
            .join(', ')
        : JSON.stringify(features).slice(0, 200);
      addLog('Query', `${count} feature(s): ${names}${count > 5 ? ' ...' : ''}`);
    } catch (err: any) {
      addLog('Query ERROR', String(err?.message ?? err));
    } finally {
      setRunning(null);
    }
  }, [addLog]);

  const runFind = useCallback(async () => {
    setRunning('Find');
    try {
      const f = new Find({
        url: USA_MAP_SERVER,
        searchText: 'California',
        layers: '2',
        searchFields: 'state_name',
        returnGeometry: false,
      });
      const results = await f.run();
      const features = results?.features ?? [];
      const count = features.length;
      const names = features
        .slice(0, 5)
        .map((feat: any) => {
          const attrs = feat.properties ?? {};
          return attrs.STATE_NAME ?? attrs.state_name ?? '?';
        })
        .join(', ');
      addLog('Find', `${count} result(s): ${names}`);
    } catch (err: any) {
      addLog('Find ERROR', String(err?.message ?? err));
    } finally {
      setRunning(null);
    }
  }, [addLog]);

  const runIdentifyFeatures = useCallback(async () => {
    setRunning('IdentifyFeatures');
    try {
      const map = mapRef.current?.getMap();
      if (!map) {
        addLog('IdentifyFeatures', 'Map not ready');
        setRunning(null);
        return;
      }
      const center = map.getCenter();
      const identify = new IdentifyFeatures(USA_MAP_SERVER);
      const results = await identify
        .at({ lng: center.lng, lat: center.lat })
        .on(map as any)
        .layers('all')
        .tolerance(10)
        .returnGeometry(false)
        .run();
      const count = results.features.length;
      const layers = results.features
        .slice(0, 5)
        .map((f: any) => f.properties?.layerName ?? '?')
        .join(', ');
      addLog('IdentifyFeatures', `${count} feature(s) at center: ${layers}`);
    } catch (err: any) {
      addLog('IdentifyFeatures ERROR', String(err?.message ?? err));
    } finally {
      setRunning(null);
    }
  }, [addLog]);

  const runIdentifyImage = useCallback(async () => {
    setRunning('IdentifyImage');
    try {
      const map = mapRef.current?.getMap();
      if (!map) {
        addLog('IdentifyImage', 'Map not ready');
        setRunning(null);
        return;
      }
      const center = map.getCenter();
      const identify = new IdentifyImage(IMAGE_SERVER);
      const results = await identify
        .at({ lng: center.lng, lat: center.lat })
        .returnGeometry(false)
        .run();
      const value = results.results?.[0]?.value ?? 'N/A';
      addLog('IdentifyImage', `Pixel value: ${value}`);
    } catch (err: any) {
      addLog('IdentifyImage ERROR', String(err?.message ?? err));
    } finally {
      setRunning(null);
    }
  }, [addLog]);

  // ------ render ------------------------------------------------------------
  return (
    <div style={styles.root}>
      {/* ---- Sidebar ---- */}
      <aside style={styles.sidebar}>
        <h2 style={styles.heading}>esri-gl + react-map-gl</h2>
        <p style={styles.subtitle}>MapLibre adapter - all components</p>

        {/* Layer toggles */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Layers</h3>
          {(
            [
              ['dynamic', 'Dynamic (USA)'],
              ['tiled', 'Tiled (World Topo)'],
              ['image', 'Image (NLCD Land Cover)'],
              ['feature', 'Feature (TN Bridges)'],
              ['vectorTile', 'Vector Tile (Basemap v2)'],
            ] as [keyof LayerVisibility, string][]
          ).map(([key, label]) => (
            <label key={key} style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={visibility[key]}
                onChange={() => toggle(key)}
                style={styles.checkbox}
              />
              {label}
            </label>
          ))}
        </section>

        {/* Task buttons */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Tasks</h3>
          <button
            style={styles.button}
            disabled={running !== null}
            onClick={runQuery}
          >
            {running === 'Query' ? 'Running...' : 'Query (states pop > 1M)'}
          </button>
          <button
            style={styles.button}
            disabled={running !== null}
            onClick={runFind}
          >
            {running === 'Find' ? 'Running...' : 'Find "California"'}
          </button>
          <button
            style={styles.button}
            disabled={running !== null}
            onClick={runIdentifyFeatures}
          >
            {running === 'IdentifyFeatures' ? 'Running...' : 'Identify Features (center)'}
          </button>
          <button
            style={styles.button}
            disabled={running !== null}
            onClick={runIdentifyImage}
          >
            {running === 'IdentifyImage' ? 'Running...' : 'Identify Image (center)'}
          </button>
        </section>

        {/* Event log */}
        <section style={{ ...styles.section, flex: 1, minHeight: 0 }}>
          <h3 style={styles.sectionTitle}>
            Event Log{' '}
            {logs.length > 0 && (
              <button
                style={styles.clearBtn}
                onClick={() => setLogs([])}
              >
                clear
              </button>
            )}
          </h3>
          <div style={styles.logPanel}>
            {logs.length === 0 && (
              <p style={styles.logEmpty}>Run a task to see results here.</p>
            )}
            {logs.map((entry) => (
              <div key={entry.id} style={styles.logEntry}>
                <span style={styles.logTime}>{entry.time}</span>{' '}
                <strong>{entry.label}</strong>
                <div style={styles.logDetail}>{entry.detail}</div>
              </div>
            ))}
          </div>
        </section>
      </aside>

      {/* ---- Map ---- */}
      <div style={styles.mapWrap}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: -86.7,
            latitude: 36.1,
            zoom: 6,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://demotiles.maplibre.org/style.json"
        >
          {visibility.dynamic && (
            <EsriDynamicLayer
              id="dynamic"
              url={USA_MAP_SERVER}
              layers={[2]}
              transparent
            />
          )}

          {visibility.tiled && (
            <EsriTiledLayer id="tiled" url={TILED_MAP_SERVER} />
          )}

          {visibility.image && (
            <EsriImageLayer id="image" url={IMAGE_SERVER} />
          )}

          {visibility.feature && (
            <EsriFeatureLayer
              id="feature"
              url={FEATURE_SERVER}
              where="1=1"
              outFields="*"
              type="circle"
              paint={{
                'circle-radius': 4,
                'circle-color': '#3b82f6',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#1e3a5f',
              }}
            />
          )}

          {visibility.vectorTile && (
            <EsriVectorTileLayer id="vector-tile" url={VECTOR_TILE_SERVER} />
          )}
        </Map>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    margin: 0,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  sidebar: {
    width: 320,
    minWidth: 320,
    display: 'flex',
    flexDirection: 'column',
    background: '#1e1e2e',
    color: '#cdd6f4',
    padding: 16,
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  heading: {
    margin: '0 0 4px',
    fontSize: 18,
    color: '#cba6f7',
  },
  subtitle: {
    margin: '0 0 16px',
    fontSize: 12,
    color: '#6c7086',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: '0 0 8px',
    fontSize: 13,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: '#89b4fa',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
    fontSize: 14,
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#89b4fa',
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    marginBottom: 8,
    border: '1px solid #45475a',
    borderRadius: 6,
    background: '#313244',
    color: '#cdd6f4',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  clearBtn: {
    marginLeft: 8,
    padding: '2px 8px',
    border: '1px solid #45475a',
    borderRadius: 4,
    background: 'transparent',
    color: '#6c7086',
    fontSize: 11,
    cursor: 'pointer',
  },
  logPanel: {
    flex: 1,
    overflowY: 'auto' as const,
    background: '#11111b',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    lineHeight: 1.5,
    maxHeight: 300,
  },
  logEmpty: {
    margin: 0,
    color: '#6c7086',
    fontStyle: 'italic' as const,
  },
  logEntry: {
    padding: '4px 0',
    borderBottom: '1px solid #1e1e2e',
  },
  logTime: {
    color: '#6c7086',
  },
  logDetail: {
    color: '#a6adc8',
    wordBreak: 'break-all' as const,
  },
  mapWrap: {
    flex: 1,
    position: 'relative' as const,
  },
};
