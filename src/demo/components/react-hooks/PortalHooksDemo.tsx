import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { usePortalItem } from '@/react';
import type { Map as EsriMap } from '@/types';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

const PRESETS = [
  { label: 'World Imagery (Map Service)', itemId: '10df2279f9684e4a9f6a7f08febac2a9' },
  { label: 'World Hillshade (Map Service)', itemId: '1b243539f4514b6ba35e7d995890db1d' },
  { label: 'USA Population Density (Vector Tile)', itemId: 'f38794b3ff4d4382849eb6ccaf0564b1' },
];

const SOURCE_ID = 'portal-hook-source';
const LAYER_ID = 'portal-hook-layer';

const PortalHooksDemo: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapState, setMapState] = useState<EsriMap | null>(null);
  const [itemId, setItemId] = useState(PRESETS[0].itemId);

  const { service, kind, url, title, loading, error } = usePortalItem({
    sourceId: SOURCE_ID,
    map: mapState,
    itemId,
  });

  // Initialize the MapLibre map once.
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    const map = new maplibregl.Map({
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
    mapRef.current = map;
    map.on('load', () => setMapState(map as unknown as EsriMap));

    return () => {
      map.remove();
      mapRef.current = null;
      setMapState(null);
    };
  }, []);

  // Add a renderer-appropriate layer whenever the hook resolves a new service.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !service || !kind) return;
    let cancelled = false;

    const addLayer = async () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (kind === 'feature' || kind === 'vector-tile') {
        const styled = service as unknown as { getStyle: () => Promise<Record<string, unknown>> };
        const style = await styled.getStyle();
        if (cancelled || map.getLayer(LAYER_ID)) return;
        map.addLayer({ ...(style as object), id: LAYER_ID, source: SOURCE_ID } as never);
      } else {
        map.addLayer({ id: LAYER_ID, type: 'raster', source: SOURCE_ID });
      }
    };
    void addLayer();

    return () => {
      cancelled = true;
    };
  }, [service, kind]);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Portal Item (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Resolve an ArcGIS portal item id with the <code>usePortalItem</code> hook — it returns
            the resolved service, kind and url and manages cleanup.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {loading && <span style={createBadgeStyle('#fde68a', '#78350f')}>Resolving item…</span>}
          {error && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>Error: {error.message}</span>
          )}
          {!loading && !error && kind && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>
              {title} → {kind}
            </span>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Presets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PRESETS.map(preset => (
              <button
                key={preset.itemId}
                onClick={() => setItemId(preset.itemId)}
                disabled={!mapState || loading}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: itemId === preset.itemId ? '#2563eb' : '#ffffff',
                  color: itemId === preset.itemId ? '#ffffff' : '#1f2937',
                  cursor: !mapState || loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {url && (
          <div>
            <h3 style={DEMO_SECTION_TITLE_STYLE}>Resolved URL</h3>
            <code style={{ fontSize: '11px', color: '#4b5563', wordBreak: 'break-all' }}>
              {url}
            </code>
          </div>
        )}

        <div style={DEMO_FOOTER_STYLE}>
          The hook adds the service source to the map; this demo adds the matching layer for the
          resolved kind.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default PortalHooksDemo;
