import React, { useMemo, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriDynamicLayer } from '../../../react-map-gl';
import { MAPLIBRE_MAP_LIB } from './maplib';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';

const DYNAMIC_SERVICE_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';

const layerOptions = [
  { id: 0, name: 'Cities' },
  { id: 1, name: 'Highways' },
  { id: 2, name: 'States' },
];

type FilterMode = 'none' | 'pacific' | 'population';

const DynamicMapServiceReactMapGLDemo: React.FC = () => {
  const [activeLayers, setActiveLayers] = useState<number[]>([0, 1, 2]);
  const [filterMode, setFilterMode] = useState<FilterMode>('none');

  const layerDefs = useMemo<Record<string, string> | false>(() => {
    if (filterMode === 'pacific') {
      return { '2': "sub_region = 'Pacific'" };
    }
    if (filterMode === 'population') {
      return { '2': 'pop2000 > 5000000' };
    }
    return false;
  }, [filterMode]);

  const layerSummary = useMemo(() => {
    if (!activeLayers.length) {
      return 'No sublayers selected';
    }
    return activeLayers
      .map(
        layerId => layerOptions.find(option => option.id === layerId)?.name ?? `Layer ${layerId}`
      )
      .join(' • ');
  }, [activeLayers]);

  const filterSummary =
    filterMode === 'pacific'
      ? 'Filtered: Pacific region states only'
      : filterMode === 'population'
        ? 'Filtered: States with population > 5M'
        : 'Server default drawing';

  const toggleLayer = (layerId: number) => {
    setActiveLayers(prev => {
      if (prev.includes(layerId)) {
        const next = prev.filter(id => id !== layerId);
        return next.length ? next : [];
      }
      return [...prev, layerId].sort((a, b) => a - b);
    });
  };

  const layersParam = activeLayers.length ? activeLayers : false;

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
            Dynamic Map Service (react-map-gl)
          </h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Render ArcGIS Dynamic MapServer content directly inside <code>react-map-gl</code> using
            the <code>EsriDynamicLayer</code> bridge component.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Live USA Dynamic MapServer</span>
          <p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '13px' }}>{layerSummary}</p>
          <p style={{ margin: '4px 0 0 0', color: '#4b5563', fontSize: '13px' }}>{filterSummary}</p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Sublayers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {layerOptions.map(option => (
              <label key={option.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.includes(option.id)}
                  onChange={() => toggleLayer(option.id)}
                />
                {option.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Filters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setFilterMode('none')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: filterMode === 'none' ? '#2563eb' : '#ffffff',
                color: filterMode === 'none' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Server Default
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pacific')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: filterMode === 'pacific' ? '#2563eb' : '#ffffff',
                color: filterMode === 'pacific' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Pacific States Only
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('population')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: filterMode === 'population' ? '#2563eb' : '#ffffff',
                color: filterMode === 'population' ? '#ffffff' : '#1f2937',
                cursor: 'pointer',
              }}
            >
              Population &gt; 5M
            </button>
          </div>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          Layers are requested directly from the ArcGIS Dynamic MapServer and rendered by MapLibre
          via react-map-gl.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <Map
          mapLib={MAPLIBRE_MAP_LIB}
          initialViewState={{ longitude: -98, latitude: 39.5, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          <EsriDynamicLayer
            id="react-map-gl-dynamic"
            url={DYNAMIC_SERVICE_URL}
            layers={layersParam}
            layerDefs={layerDefs}
          />
        </Map>
      </div>
    </div>
  );
};

export default DynamicMapServiceReactMapGLDemo;
