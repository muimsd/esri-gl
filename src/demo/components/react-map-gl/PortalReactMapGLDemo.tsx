import React, { useState } from 'react';
import { Map, NavigationControl } from 'react-map-gl/maplibre';
import { EsriPortalLayer } from '../../../react-map-gl';
import type { PortalServiceResult } from '@/index';
import { MAPLIBRE_MAP_LIB } from './maplib';
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

const PortalReactMapGLDemo: React.FC = () => {
  const [itemId, setItemId] = useState(PRESETS[0].itemId);
  const [resolved, setResolved] = useState<PortalServiceResult | null>(null);

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Portal Item (react-map-gl)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Resolve an ArcGIS portal item id to a layer declaratively with the{' '}
            <code>EsriPortalLayer</code> component — the item type selects the renderer.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {resolved ? (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>
              {resolved.title} → {resolved.kind}
            </span>
          ) : (
            <span style={createBadgeStyle('#fde68a', '#78350f')}>Resolving item…</span>
          )}
          {resolved && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: '11px',
                color: '#4b5563',
                wordBreak: 'break-all',
              }}
            >
              {resolved.url}
            </p>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Presets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {PRESETS.map(preset => (
              <button
                key={preset.itemId}
                onClick={() => {
                  setResolved(null);
                  setItemId(preset.itemId);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: itemId === preset.itemId ? '#2563eb' : '#ffffff',
                  color: itemId === preset.itemId ? '#ffffff' : '#1f2937',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          <code>EsriPortalLayer</code> resolves the item with <code>serviceFromPortalItem</code> and
          adds a renderer-appropriate layer (raster, vector-tile or geojson).
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -98, latitude: 39.5, zoom: 3 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-left" />
          <EsriPortalLayer id="react-map-gl-portal" itemId={itemId} onResolve={setResolved} />
        </Map>
      </div>
    </div>
  );
};

export default PortalReactMapGLDemo;
