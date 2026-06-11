import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import {
  serviceFromPortalItem,
  searchPortalItems,
  type PortalResolvedService,
  type PortalServiceKind,
} from '@/index';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

type Preset = { label: string; itemId: string };

// Stable, well-known public ArcGIS Online items (verified live).
const PRESETS: Preset[] = [
  { label: 'World Imagery (Map Service)', itemId: '10df2279f9684e4a9f6a7f08febac2a9' },
  { label: 'World Hillshade (Map Service)', itemId: '1b243539f4514b6ba35e7d995890db1d' },
  { label: 'USA Population Density (Vector Tile)', itemId: 'f38794b3ff4d4382849eb6ccaf0564b1' },
  { label: 'Content Nomination (Feature Service)', itemId: '3e3723471e3c44dfb0101573aca17557' },
];

const SOURCE_ID = 'portal-source';
const LAYER_ID = 'portal-layer';

// Restrict search results to item types serviceFromPortalItem can resolve.
const SUPPORTED_TYPES =
  '(type:"Feature Service" OR type:"Map Service" OR type:"Image Service" OR type:"Vector Tile Service")';

interface SearchHit {
  id: string;
  title: string;
  type: string;
}

interface Resolved {
  kind: PortalServiceKind;
  title?: string;
  url: string;
}

const PortalDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const service = useRef<PortalResolvedService | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [itemId, setItemId] = useState(PRESETS[0].itemId);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);

  const runSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const { results } = await searchPortalItems({
        q: `${searchText.trim()} AND ${SUPPORTED_TYPES} AND access:public`,
        num: 8,
      });
      setSearchHits(results.map(({ id, title, type }) => ({ id, title, type })));
    } catch (err) {
      setSearchError((err as Error).message);
      setSearchHits([]);
    } finally {
      setSearching(false);
    }
  }, [searchText]);

  const clearCurrent = useCallback((m: maplibregl.Map) => {
    if (m.getLayer(LAYER_ID)) m.removeLayer(LAYER_ID);
    if (service.current) {
      try {
        service.current.remove();
      } catch {
        /* ignore */
      }
      service.current = null;
    }
    if (m.getSource(SOURCE_ID)) {
      try {
        m.removeSource(SOURCE_ID);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const loadItem = useCallback(
    async (id: string) => {
      const m = map.current;
      if (!m) return;
      setLoading(true);
      setError(null);
      setResolved(null);
      clearCurrent(m);

      try {
        const result = await serviceFromPortalItem(SOURCE_ID, m, id);
        service.current = result.service;
        setResolved({ kind: result.kind, title: result.title, url: result.url });

        // Add a renderer-appropriate layer for the resolved service kind.
        if (result.kind === 'feature' || result.kind === 'vector-tile') {
          const styled = result.service as unknown as {
            getStyle: () => Promise<Record<string, unknown>>;
          };
          const style = await styled.getStyle();
          m.addLayer({ id: LAYER_ID, ...(style as object), source: SOURCE_ID } as never);
        } else {
          // dynamic / tiled / image → raster
          m.addLayer({ id: LAYER_ID, type: 'raster', source: SOURCE_ID });
        }
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    },
    [clearCurrent]
  );

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
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
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm-tiles' }],
      },
      center: [-95.7129, 37.0902],
      zoom: 3,
    });

    map.current.on('load', () => {
      setReady(true);
      void loadItem(PRESETS[0].itemId);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [loadItem]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Portal Item (ESM)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Resolve an ArcGIS portal item id directly to a service with{' '}
            <code>serviceFromPortalItem</code> — no service URL required. The item type
            automatically selects the right esri-gl service.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Resolving item…</span>}
          {error && <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error}</span>}
          {!loading && !error && resolved && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>
              {resolved.title} → {resolved.kind}
            </span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Presets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PRESETS.map(preset => (
              <button
                key={preset.itemId}
                onClick={() => {
                  setItemId(preset.itemId);
                  void loadItem(preset.itemId);
                }}
                disabled={!ready || loading}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: itemId === preset.itemId ? '#2563eb' : '#ffffff',
                  color: itemId === preset.itemId ? '#ffffff' : '#1f2937',
                  cursor: !ready || loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Custom Item Id</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={itemId}
              onChange={e => setItemId(e.target.value.trim())}
              placeholder="ArcGIS item id"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            />
            <button
              onClick={() => void loadItem(itemId)}
              disabled={!ready || loading || !itemId}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                cursor: !ready || loading || !itemId ? 'not-allowed' : 'pointer',
              }}
            >
              Load
            </button>
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Search ArcGIS Online</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void runSearch()}
              placeholder="e.g. wildfire, census, elevation"
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '12px',
              }}
            />
            <button
              onClick={() => void runSearch()}
              disabled={searching || !searchText.trim()}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                cursor: searching || !searchText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {searching ? '…' : 'Search'}
            </button>
          </div>
          {searchError && (
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#7f1d1d' }}>{searchError}</p>
          )}
          {searchHits.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
              {searchHits.map(hit => (
                <button
                  key={hit.id}
                  onClick={() => {
                    setItemId(hit.id);
                    void loadItem(hit.id);
                  }}
                  disabled={!ready || loading}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    backgroundColor: itemId === hit.id ? '#2563eb' : '#f9fafb',
                    color: itemId === hit.id ? '#ffffff' : '#1f2937',
                    cursor: !ready || loading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontSize: '12px',
                  }}
                  title={hit.id}
                >
                  {hit.title} <span style={{ opacity: 0.7, fontSize: '11px' }}>({hit.type})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {resolved && (
          <div>
            <h3 style={DEMO_SECTION_TITLE_STYLE}>Resolved URL</h3>
            <code style={{ fontSize: '11px', color: '#4b5563', wordBreak: 'break-all' }}>
              {resolved.url}
            </code>
          </div>
        )}

        <div style={DEMO_FOOTER_STYLE}>
          Search powered by <code>searchPortalItems</code>. Also available:{' '}
          <code>servicesFromWebMap</code> (a service per operational layer).
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default PortalDemo;
