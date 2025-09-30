import { useState, useCallback } from 'react';
import { useDynamicMapService, useIdentifyFeatures } from 'esri-gl/react';

export default function AdvancedFeaturesExample() {
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  const [layerConfig, setLayerConfig] = useState({
    layers: [0, 1, 2] as number[],
    layerDefs: {} as Record<string, string>,
    format: 'png24',
    dpi: 96,
    transparent: true
  });
  const [identifyResults, setIdentifyResults] = useState<Array<{
    layerId: number;
    layerName?: string;
    attributes?: Record<string, unknown>;
  }>>([]);

  // Dynamic Map Service Hook
  const { service: dynamicService } = useDynamicMapService({
    sourceId: 'advanced-dynamic-source',
    map: mapElement as unknown as import('esri-gl').Map,
    options: {
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      ...layerConfig
    }
  });

  // Identify Features Hook
  const { identify, loading: identifyLoading } = useIdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 5,
    returnGeometry: true
  });

  const handleLayerDefsChange = useCallback((layerId: string, definition: string) => {
    setLayerConfig(prev => ({
      ...prev,
      layerDefs: definition.trim() 
        ? { ...prev.layerDefs, [layerId]: definition }
        : Object.fromEntries(Object.entries(prev.layerDefs).filter(([id]) => id !== layerId))
    }));
  }, []);

  const handleLayersChange = useCallback((layers: number[]) => {
    setLayerConfig(prev => ({ ...prev, layers }));
  }, []);

  const handleFormatChange = useCallback((format: string) => {
    setLayerConfig(prev => ({ ...prev, format }));
  }, []);

  const handleDpiChange = useCallback((dpi: number) => {
    setLayerConfig(prev => ({ ...prev, dpi }));
  }, []);

  const handleMapClick = useCallback(async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!mapElement) return;
    
    const rect = mapElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert screen coordinates to map coordinates (simplified)
    // In a real implementation, you'd use the map's projection
    const lng = -180 + (x / rect.width) * 360;
    const lat = 85 - (y / rect.height) * 170; // Rough mercator approximation
    
    try {
      const results = await identify({ lng, lat });
      // Simplified result handling for demo
      const features = results?.features || [];
      setIdentifyResults(features.map((feature: { properties?: Record<string, unknown> }, index: number) => ({
        layerId: index,
        layerName: `Feature ${index}`,
        attributes: feature.properties || {}
      })));
    } catch (error) {
      console.error('Identify failed:', error);
      setIdentifyResults([]);
    }
  }, [mapElement, identify, setIdentifyResults]);

  return (
    <div className="example-section">
      <h2>Advanced Features Example</h2>
      <p>
        This example demonstrates advanced configuration options and React hooks integration.
        Configure layer parameters in real-time and see the effects immediately.
      </p>

      {/* Configuration Panel */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <div>
          <h4>Layer Configuration</h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label><strong>Visible Layers:</strong></label>
            <div style={{ marginTop: '5px' }}>
              {[0, 1, 2, 3].map(layerId => (
                <label key={layerId} style={{ marginRight: '15px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={layerConfig.layers.includes(layerId)}
                    onChange={(e) => {
                      const newLayers = e.target.checked
                        ? [...layerConfig.layers, layerId].sort((a, b) => a - b)
                        : layerConfig.layers.filter(id => id !== layerId);
                      handleLayersChange(newLayers);
                    }}
                    style={{ marginRight: '5px' }}
                  />
                  Layer {layerId}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>Image Format:</strong></label>
            <select 
              value={layerConfig.format} 
              onChange={(e) => handleFormatChange(e.target.value)}
              style={{ marginLeft: '10px', padding: '4px' }}
            >
              <option value="png24">PNG24</option>
              <option value="png32">PNG32</option>
              <option value="jpg">JPEG</option>
              <option value="gif">GIF</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><strong>DPI:</strong></label>
            <select 
              value={layerConfig.dpi} 
              onChange={(e) => handleDpiChange(parseInt(e.target.value))}
              style={{ marginLeft: '10px', padding: '4px' }}
            >
              <option value={96}>96 (Standard)</option>
              <option value={150}>150 (High)</option>
              <option value={300}>300 (Print)</option>
            </select>
          </div>

          <div>
            <label><strong>Transparency:</strong></label>
            <input
              type="checkbox"
              checked={layerConfig.transparent}
              onChange={(e) => setLayerConfig(prev => ({ ...prev, transparent: e.target.checked }))}
              style={{ marginLeft: '10px' }}
            />
          </div>
        </div>

        <div>
          <h4>Layer Definitions (SQL Filters)</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <label><strong>States (Layer 0):</strong></label>
            <input
              type="text"
              placeholder="e.g., POP2000 > 1000000"
              onChange={(e) => handleLayerDefsChange('0', e.target.value)}
              style={{ 
                width: '100%', 
                marginTop: '5px', 
                padding: '6px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Highways (Layer 1):</strong></label>
            <input
              type="text"
              placeholder="e.g., ROUTE_NUM LIKE 'I-%'"
              onChange={(e) => handleLayerDefsChange('1', e.target.value)}
              style={{ 
                width: '100%', 
                marginTop: '5px', 
                padding: '6px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label><strong>Cities (Layer 2):</strong></label>
            <input
              type="text"
              placeholder="e.g., POP_RANGE > 5"
              onChange={(e) => handleLayerDefsChange('2', e.target.value)}
              style={{ 
                width: '100%', 
                marginTop: '5px', 
                padding: '6px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            <strong>Tip:</strong> Use SQL WHERE clause syntax (e.g., POPULATION {`>`} 500000, STATE_NAME = 'California')
          </div>
        </div>
      </div>

      {/* Map Display Area */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <div
          ref={setMapElement}
          onClick={handleMapClick}
          style={{
            width: '100%',
            height: '400px',
            border: '2px solid #007ACC',
            borderRadius: '8px',
            background: dynamicService 
              ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
              : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            backgroundSize: 'cover',
            cursor: 'crosshair',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {!dynamicService ? 'Initializing map service...' : 'Click anywhere to identify features'}
        </div>
        
        {identifyLoading && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 122, 204, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Identifying...
          </div>
        )}
      </div>

      {/* Identify Results */}
      {identifyResults && identifyResults.length > 0 && (
        <div style={{ 
          marginBottom: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h4>Identify Results ({identifyResults.length} features found):</h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            {identifyResults.slice(0, 5).map((result, index) => (
              <div key={index} style={{ 
                padding: '10px',
                background: 'white',
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {result.layerName || `Layer ${result.layerId}`}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {Object.entries(result.attributes || {})
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '2px' }}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          {identifyResults.length > 5 && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              ... and {identifyResults.length - 5} more features
            </div>
          )}
        </div>
      )}

      {/* Current Configuration Display */}
      <div style={{ 
        padding: '15px',
        background: '#e8f5e8',
        borderRadius: '8px',
        border: '1px solid #c3e6c3'
      }}>
        <h4>Current Configuration</h4>
        <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
          <div><strong>Service Status:</strong> {dynamicService ? 'Initialized' : 'Not initialized'}</div>
          <div><strong>Layers:</strong> [{layerConfig.layers.join(', ')}]</div>
          <div><strong>Format:</strong> {layerConfig.format}</div>
          <div><strong>DPI:</strong> {layerConfig.dpi}</div>
          <div><strong>Transparent:</strong> {layerConfig.transparent ? 'Yes' : 'No'}</div>
          {Object.keys(layerConfig.layerDefs).length > 0 && (
            <div><strong>Layer Definitions:</strong> {JSON.stringify(layerConfig.layerDefs, null, 2)}</div>
          )}
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <h5>React Hooks Features Demonstrated:</h5>
          <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '14px' }}>
            <li>✅ Real-time layer configuration</li>
            <li>✅ Dynamic SQL filtering (layer definitions)</li>
            <li>✅ Format and quality control</li>
            <li>✅ Interactive identify functionality</li>
            <li>✅ Automatic service lifecycle management</li>
            <li>✅ React state integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}