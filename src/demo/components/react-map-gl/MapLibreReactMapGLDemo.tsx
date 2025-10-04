import React, { useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { EsriDynamicLayer, EsriFeatureLayer, EsriVectorTileLayer } from '../../../react-map-gl';

const CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  height: '100%',
  width: '100%',
};

const SIDEBAR_STYLE: React.CSSProperties = {
  width: '320px',
  padding: '16px',
  borderRight: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  margin: '0 0 6px 0',
  fontSize: '14px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#6b7280',
};

const BADGE_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: '#bbf7d0',
  color: '#064e3b',
};

const ReactMapGLMapLibreDemo: React.FC = () => {
  const [showDynamic, setShowDynamic] = useState(true);
  const [showFeature, setShowFeature] = useState(true);
  const [showVector, setShowVector] = useState(false);

  const layerSummary = useMemo(() => {
    const summaries = [] as string[];
    if (showDynamic) summaries.push('USA Dynamic MapServer (layers 0,1,2)');
    if (showFeature) summaries.push('US States FeatureServer (fill style)');
    if (showVector) summaries.push('World Cities Vector Tiles');
    return summaries.length ? summaries.join(' • ') : 'No Esri layers enabled';
  }, [showDynamic, showFeature, showVector]);

  return (
    <div style={CONTAINER_STYLE}>
      <aside style={SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>react-map-gl Integration</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Toggle live Esri services rendered through the <code>esri-gl/react-map-gl</code>{' '}
            components while MapLibre rendering is managed by <code>react-map-gl</code>.
          </p>
        </div>

        <div>
          <h3 style={SECTION_TITLE_STYLE}>Active Layers</h3>
          <span style={BADGE_STYLE}>Layer Bridge Active</span>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563' }}>{layerSummary}</p>
        </div>

        <div>
          <h3 style={SECTION_TITLE_STYLE}>Toggles</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showDynamic}
              onChange={e => setShowDynamic(e.target.checked)}
            />
            Dynamic Map Service
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showFeature}
              onChange={e => setShowFeature(e.target.checked)}
            />
            Feature Service (GeoJSON)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showVector}
              onChange={e => setShowVector(e.target.checked)}
            />
            Vector Tile Service
          </label>
        </div>

        <div style={{ marginTop: 'auto', fontSize: '12px', color: '#9ca3af' }}>
          Powered by react-map-gl v8 + MapLibre GL v5.
        </div>
      </aside>

      <div style={{ flex: 1 }}>
        <Map
          mapLib={maplibregl}
          initialViewState={{ longitude: -98, latitude: 39.5, zoom: 4 }}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-left" visualizePitch />
          <ScaleControl position="bottom-left" maxWidth={120} unit="imperial" />

          {showDynamic && (
            <EsriDynamicLayer
              id="react-map-gl-dynamic"
              url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
              layers={[0, 1, 2]}
            />
          )}

          {showFeature && (
            <EsriFeatureLayer
              id="react-map-gl-feature"
              url="https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/USA_State_Boundaries/FeatureServer/0"
              paint={{
                'fill-color': '#2563eb',
                'fill-opacity': 0.3,
                'fill-outline-color': '#1d4ed8',
              }}
            />
          )}

          {showVector && (
            <EsriVectorTileLayer
              id="react-map-gl-vector"
              url="https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer"
            />
          )}
        </Map>
      </div>
    </div>
  );
};

export default ReactMapGLMapLibreDemo;
