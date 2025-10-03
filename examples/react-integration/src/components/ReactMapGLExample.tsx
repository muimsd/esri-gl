import { useState, useCallback } from 'react';
import Map, { NavigationControl, ScaleControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { EsriDynamicLayer, EsriFeatureLayer, EsriTiledLayer, EsriImageLayer } from 'esri-gl/react-map-gl';

// Demo token for examples - replace with your own in production
const DEMO_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'your-mapbox-token-here';

export default function ReactMapGLExample() {
  const [viewState, setViewState] = useState({
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 4
  });
  const [visibleLayers, setVisibleLayers] = useState({
    dynamic: true,
    features: false,
    tiled: false,
    imagery: false
  });
  const [layerConfig, setLayerConfig] = useState({
    dynamicLayers: [0, 1, 2] as number[],
    layerDefs: {} as Record<string, string>,
    featureWhere: "1=1",
  });

  const handleLayerToggle = useCallback((layerType: keyof typeof visibleLayers) => {
    setVisibleLayers(prev => ({ ...prev, [layerType]: !prev[layerType] }));
  }, []);

  const handleDynamicLayerChange = useCallback((layers: number[]) => {
    setLayerConfig(prev => ({ ...prev, dynamicLayers: layers }));
  }, []);

  const handleLayerDefChange = useCallback((layerId: string, definition: string) => {
    setLayerConfig(prev => ({
      ...prev,
      layerDefs: { ...prev.layerDefs, [layerId]: definition }
    }));
  }, []);

  const needsToken = DEMO_TOKEN === 'your-mapbox-token-here';

  return (
    <div className="example-section">
      <h2>React Map GL Integration</h2>
      <p>
        This example shows how to use esri-gl components directly with react-map-gl.
        Toggle layers on/off to see how they integrate seamlessly.
      </p>

      <div className="controls">
        <button 
          onClick={() => handleLayerToggle('dynamic')}
          style={{ 
            background: visibleLayers.dynamic ? '#007ACC' : '#f0f0f0',
            color: visibleLayers.dynamic ? 'white' : '#333'
          }}
        >
          {visibleLayers.dynamic ? 'Hide' : 'Show'} Dynamic Layer
        </button>
        <button 
          onClick={() => handleLayerToggle('features')}
          style={{ 
            background: visibleLayers.features ? '#007ACC' : '#f0f0f0',
            color: visibleLayers.features ? 'white' : '#333'
          }}
        >
          {visibleLayers.features ? 'Hide' : 'Show'} Feature Layer
        </button>
        <button 
          onClick={() => handleLayerToggle('tiled')}
          style={{ 
            background: visibleLayers.tiled ? '#007ACC' : '#f0f0f0',
            color: visibleLayers.tiled ? 'white' : '#333'
          }}
        >
          {visibleLayers.tiled ? 'Hide' : 'Show'} Tiled Layer
        </button>
        <button 
          onClick={() => handleLayerToggle('imagery')}
          style={{ 
            background: visibleLayers.imagery ? '#007ACC' : '#f0f0f0',
            color: visibleLayers.imagery ? 'white' : '#333'
          }}
        >
          {visibleLayers.imagery ? 'Hide' : 'Show'} Imagery Layer
        </button>
      </div>

      {/* Advanced Controls */}
      <div style={{ margin: '10px 0', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Advanced Controls:</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Dynamic Layer Sublayers: </label>
          <select
            multiple
            value={layerConfig.dynamicLayers.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
              handleDynamicLayerChange(selected);
            }}
            style={{ marginLeft: '5px' }}
          >
            <option value="0">States (0)</option>
            <option value="1">Highways (1)</option>
            <option value="2">Cities (2)</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Layer Definition (Layer 0): </label>
          <input
            type="text"
            placeholder="e.g., POP2000 > 1000000"
            onChange={(e) => handleLayerDefChange('0', e.target.value)}
            style={{ marginLeft: '5px', width: '200px' }}
          />
        </div>

        <div>
          <label>Feature Layer Where Clause: </label>
          <input
            type="text"
            value={layerConfig.featureWhere}
            onChange={(e) => setLayerConfig(prev => ({ ...prev, featureWhere: e.target.value }))}
            placeholder="e.g., STATE_NAME LIKE 'C%'"
            style={{ marginLeft: '5px', width: '200px' }}
          />
        </div>
      </div>

      <div className="map-container">
        {needsToken ? (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#f5f5f5',
            border: '2px dashed #ccc'
          }}>
            <div style={{ textAlign: 'center', color: '#666' }}>
              <h3>Mapbox Token Required</h3>
              <p>Please add your Mapbox access token to see this example.</p>
              <p>Set <code>VITE_MAPBOX_TOKEN</code> environment variable or edit the component.</p>
            </div>
          </div>
        ) : (
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapboxAccessToken={DEMO_TOKEN}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v10"
          >
            {/* Navigation and Scale Controls */}
            <NavigationControl position="top-right" />
            <ScaleControl position="bottom-left" />
            {/* Dynamic Map Service Layer */}
            {visibleLayers.dynamic && (
              <EsriDynamicLayer
                id="usa-dynamic-layer"
                url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
                layers={layerConfig.dynamicLayers}
                layerDefs={Object.keys(layerConfig.layerDefs).length > 0 ? layerConfig.layerDefs : undefined}
                visible={true}
              />
            )}

            {/* Feature Service Layer */}
            {visibleLayers.features && (
              <EsriFeatureLayer
                id="states-feature-layer"
                url="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_States/FeatureServer/0"
                where={layerConfig.featureWhere}
                paint={{
                  'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'POP2000'],
                    0, '#FFF5F0',
                    1000000, '#FD8D3C',
                    5000000, '#BD0026'
                  ],
                  'fill-opacity': 0.7,
                  'fill-outline-color': '#333'
                }}
                visible={true}
              />
            )}

            {/* Tiled Map Service Layer */}
            {visibleLayers.tiled && (
              <EsriTiledLayer
                id="world-topo-layer"
                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
                visible={true}
              />
            )}

            {/* Image Service Layer */}
            {visibleLayers.imagery && (
              <EsriImageLayer
                id="world-imagery-layer"
                url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
                visible={true}
              />
            )}
          </Map>
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4>Active Layers:</h4>
            <ul>
              <li><strong>Dynamic Layer:</strong> {visibleLayers.dynamic ? 'Visible' : 'Hidden'} - USA MapServer
                {visibleLayers.dynamic && <span style={{ color: '#007ACC' }}> (Layers: {layerConfig.dynamicLayers.join(', ')})</span>}
              </li>
              <li><strong>Feature Layer:</strong> {visibleLayers.features ? 'Visible' : 'Hidden'} - US States with data-driven styling
                {visibleLayers.features && <span style={{ color: '#007ACC' }}> (Where: {layerConfig.featureWhere})</span>}
              </li>
              <li><strong>Tiled Layer:</strong> {visibleLayers.tiled ? 'Visible' : 'Hidden'} - World Topographic Map</li>
              <li><strong>Imagery Layer:</strong> {visibleLayers.imagery ? 'Visible' : 'Hidden'} - World Imagery Service</li>
            </ul>
          </div>
          
          <div>
            <h4>React Map GL Features:</h4>
            <ul>
              <li>✅ Automatic source management</li>
              <li>✅ Layer lifecycle handling</li>
              <li>✅ Dynamic layer configuration</li>
              <li>✅ Where clause filtering</li>
              <li>✅ Data-driven styling</li>
              <li>✅ Map navigation controls</li>
              <li>✅ TypeScript support</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 5px 0' }}>🚀 Advanced Integration Example</h4>
          <p style={{ margin: 0 }}>
            This demonstrates seamless integration between Esri ArcGIS services and react-map-gl.
            Try adjusting the dynamic layer sublayers, applying layer definitions, or modifying the feature where clause 
            to see real-time updates. The components automatically handle source lifecycle, layer rendering, 
            and state synchronization.
          </p>
        </div>
      </div>
    </div>
  );
}