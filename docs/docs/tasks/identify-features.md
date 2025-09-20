# IdentifyFeatures

Identify features at a point across multiple map services, with advanced tolerance and filtering options.

## Constructor

```typescript
new IdentifyFeatures(options: IdentifyOptions)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** MapService URL |
| layers | `Array<number> \| string` | `'all'` | Layers to identify |
| tolerance | `number` | `3` | Search tolerance in pixels |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| dynamicLayers | `Array<object>` | | Dynamic layer definitions |
| mapExtent | `object` | | Current map extent |
| imageDisplay | `object` | | Map image parameters |
| returnFieldName | `boolean` | `false` | Return field names with values |
| returnUnformattedValues | `boolean` | `false` | Return raw field values |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
task.tolerance(5).layers([0, 1]).returnGeometry(true)
```

### Configuration Methods

| Method | Description |
|--------|-------------|
| `layers(layers)` | Set layers to identify |
| `tolerance(pixels)` | Set search tolerance |
| `returnGeometry(boolean)` | Include geometry in results |
| `returnFieldName(boolean)` | Include field names |
| `token(token)` | Set authentication token |

## Execution Methods

### `.at(point, map, callback?)`

Identify features at a geographic point.

```typescript
// Promise-based
const results = await task.at({ lng: -95.7, lat: 37.1 }, map)

// Callback-based  
task.at({ lng: -95.7, lat: 37.1 }, map, (error, results) => {
    if (error) {
        console.error(error)
    } else {
        console.log(results)
    }
})
```

**Parameters:**
- `point` - `{lng: number, lat: number}` - Geographic coordinates
- `map` - MapLibre/Mapbox GL map instance
- `callback` - Optional callback function

## Interactive Identify Features Demo

Here's a complete example based on our demo implementation, showing how to build an interactive identify interface with layer controls:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Map, Popup } from 'maplibre-gl';
import { DynamicMapService, IdentifyFeatures } from 'esri-gl';

const IdentifyFeaturesDemo = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const service = useRef<DynamicMapService | null>(null);
  const popup = useRef<Popup | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);
  const [tolerance, setTolerance] = useState(5);
  const [returnGeometry, setReturnGeometry] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre GL JS map
    map.current = new Map({
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
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
          },
        ],
      },
      center: [-95.7129, 37.0902],
      zoom: 4,
    });

    // Initialize popup
    popup.current = new Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '400px'
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Create Dynamic Map Service
      service.current = new DynamicMapService('dynamic-source', map.current, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: selectedLayers,
        format: 'png32',
        transparent: true,
      });

      // Add layer to display the service
      map.current.addLayer({
        id: 'dynamic-layer',
        type: 'raster',
        source: 'dynamic-source',
      });

      // Add click handler for identify
      map.current.on('click', handleMapClick);

      // Change cursor on hover
      map.current.on('mouseenter', 'dynamic-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'dynamic-layer', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update service when layers change
  useEffect(() => {
    if (service.current && selectedLayers.length > 0) {
      service.current.setLayers(selectedLayers);
    }
  }, [selectedLayers]);

  const handleMapClick = async (e: any) => {
    if (!service.current || !map.current || !popup.current) return;

    try {
      // Show loading cursor
      map.current.getCanvas().style.cursor = 'wait';

      // Create identify task
      const identify = new IdentifyFeatures({
        url: service.current.esriServiceOptions.url,
        tolerance,
        returnGeometry,
        layers: selectedLayers.length > 0 ? `visible:${selectedLayers.join(',')}` : 'all'
      });

      // Execute identify
      const results = await identify.at(
        { lng: e.lngLat.lng, lat: e.lngLat.lat },
        map.current
      );

      // Process results
      if (results.features && results.features.length > 0) {
        const feature = results.features[0];
        const content = formatPopupContent(feature, results.features.length);
        
        popup.current
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(map.current);

        // Highlight identified features if geometry is returned
        if (returnGeometry && feature.geometry) {
          highlightFeature(feature);
        }
      } else {
        popup.current
          .setLngLat(e.lngLat)
          .setHTML('<div style="padding: 10px; color: #666;">No features found at this location</div>')
          .addTo(map.current);
      }
    } catch (error) {
      console.error('Identify failed:', error);
      popup.current
        .setLngLat(e.lngLat)
        .setHTML(`<div style="padding: 10px; color: #dc3545;">Error: ${error.message}</div>`)
        .addTo(map.current);
    } finally {
      // Reset cursor
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    }
  };

  const formatPopupContent = (feature: GeoJSON.Feature, totalCount: number): string => {
    const props = feature.properties || {};
    
    let content = '<div style="max-width: 350px; font-family: Arial, sans-serif;">';
    
    // Header
    content += '<div style="background: #f8f9fa; padding: 10px; margin: -10px -10px 10px -10px; border-bottom: 1px solid #dee2e6;">';
    content += `<h4 style="margin: 0; color: #495057;">Feature Information</h4>`;
    if (totalCount > 1) {
      content += `<small style="color: #6c757d;">Showing 1 of ${totalCount} features</small>`;
    }
    content += '</div>';

    // Properties
    let hasVisibleProps = false;
    Object.entries(props).forEach(([key, value]) => {
      if (value !== null && value !== '' && typeof value !== 'object' && key !== 'OBJECTID') {
        content += `
          <div style="margin-bottom: 8px; padding: 5px 0; border-bottom: 1px solid #f1f3f4;">
            <div style="font-weight: 600; color: #495057; font-size: 12px; text-transform: uppercase; margin-bottom: 2px;">
              ${key.replace(/_/g, ' ')}
            </div>
            <div style="color: #212529;">${value}</div>
          </div>
        `;
        hasVisibleProps = true;
      }
    });

    if (!hasVisibleProps) {
      content += '<div style="color: #6c757d; font-style: italic;">No displayable properties</div>';
    }

    // Footer with layer info
    if (feature.properties && feature.properties.layerName) {
      content += `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6; font-size: 11px; color: #6c757d;">
          Layer: ${feature.properties.layerName}
        </div>
      `;
    }

    content += '</div>';
    return content;
  };

  const highlightFeature = (feature: GeoJSON.Feature) => {
    if (!map.current || !feature.geometry) return;

    // Remove existing highlight
    if (map.current.getLayer('highlight-feature')) {
      map.current.removeLayer('highlight-feature');
      map.current.removeSource('highlight-feature');
    }

    // Add highlight
    map.current.addSource('highlight-feature', {
      type: 'geojson',
      data: feature
    });

    // Style based on geometry type
    const geometryType = feature.geometry.type;
    if (geometryType === 'Point') {
      map.current.addLayer({
        id: 'highlight-feature',
        type: 'circle',
        source: 'highlight-feature',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff4444',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });
    } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      map.current.addLayer({
        id: 'highlight-feature',
        type: 'fill',
        source: 'highlight-feature',
        paint: {
          'fill-color': '#ff4444',
          'fill-opacity': 0.3,
          'fill-outline-color': '#ff0000'
        }
      });
    } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
      map.current.addLayer({
        id: 'highlight-feature',
        type: 'line',
        source: 'highlight-feature',
        paint: {
          'line-color': '#ff4444',
          'line-width': 3
        }
      });
    }

    // Remove highlight after 3 seconds
    setTimeout(() => {
      if (map.current?.getLayer('highlight-feature')) {
        map.current.removeLayer('highlight-feature');
        map.current.removeSource('highlight-feature');
      }
    }, 3000);
  };

  const handleLayerToggle = (layerId: number) => {
    setSelectedLayers(prev => {
      return prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId].sort((a, b) => a - b);
    });
  };

  const layerOptions = [
    { id: 0, name: 'Cities' },
    { id: 1, name: 'Highways' },
    { id: 2, name: 'States' },
    { id: 3, name: 'Counties' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Controls Panel */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Interactive Identify Features Demo</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Layer Controls */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Visible Layers:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {layerOptions.map(layer => (
                <label key={layer.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  backgroundColor: selectedLayers.includes(layer.id) ? '#e7f3ff' : 'transparent',
                  borderRadius: '4px',
                  border: '1px solid #d1ecf1'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedLayers.includes(layer.id)}
                    onChange={() => handleLayerToggle(layer.id)}
                    style={{ margin: 0 }}
                  />
                  <span>{layer.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tolerance Control */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Tolerance: {tolerance}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={tolerance}
              onChange={e => setTolerance(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
              Search radius around click point
            </div>
          </div>

          {/* Geometry Control */}
          <div>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              <input
                type="checkbox"
                checked={returnGeometry}
                onChange={e => setReturnGeometry(e.target.checked)}
              />
              Return Geometry
            </label>
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
              Include geometry for highlighting
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#155724'
        }}>
          💡 <strong>Instructions:</strong> Click anywhere on the map to identify features at that location. 
          Use the layer checkboxes to control which layers are searched.
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} style={{ flex: 1 }} />
    </div>
  );
};

export default IdentifyFeaturesDemo;
```

## Basic Example

```typescript
import { IdentifyFeatures } from 'esri-gl'

// Create identify task
const identifyTask = new IdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 5,
    returnGeometry: true,
    layers: 'all'
})

// Handle map clicks
map.on('click', async (e) => {
    try {
        const results = await identifyTask.at(e.lngLat, map)
        
        if (results.results.length > 0) {
            console.log('Identified features:', results.results)
            showPopup(e.lngLat, results.results)
        } else {
            console.log('No features found')
        }
    } catch (error) {
        console.error('Identify failed:', error)
    }
})
```

## Advanced Configuration

```typescript
// Configure with chained methods
const advancedTask = new IdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer'
})
.layers([0, 1, 2]) // Specific layers only
.tolerance(10) // Larger search area
.returnGeometry(true) // Include feature shapes
.returnFieldName(true) // Include field names
.returnUnformattedValues(true) // Raw values

// Execute identify
const results = await advancedTask.at({ lng: -95.7, lat: 37.1 }, map)
```

## Multiple Services

```typescript
// Identify across multiple services
const services = [
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer'
]

async function identifyMultiple(point, map) {
    const tasks = services.map(url => 
        new IdentifyFeatures({ url })
            .tolerance(5)
            .returnGeometry(true)
    )
    
    const results = await Promise.all(
        tasks.map(task => task.at(point, map))
    )
    
    // Combine results from all services
    const allFeatures = results.flatMap(result => result.results)
    return allFeatures
}
```

## Custom Popup Display

```typescript
function showPopup(lngLat, features) {
    // Create popup content
    const content = features.map(feature => {
        const { layerName, attributes } = feature
        
        const rows = Object.entries(attributes)
            .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
            .join('')
            
        return `
            <div>
                <h3>${layerName}</h3>
                <table>
                    ${rows}
                </table>
            </div>
        `
    }).join('<hr>')
    
    // Show popup
    new maplibregl.Popup()
        .setLngLat(lngLat)
        .setHTML(content)
        .addTo(map)
}
```

## Response Format

```typescript
interface IdentifyResponse {
    results: IdentifyResult[]
}

interface IdentifyResult {
    layerId: number
    layerName: string
    value: string
    displayFieldName: string
    attributes: Record<string, any>
    geometry?: GeoJSON.Geometry
    geometryType?: string
    feature?: GeoJSON.Feature
}
```

## Error Handling

```typescript
// Handle different types of errors
map.on('click', async (e) => {
    try {
        const results = await identifyTask.at(e.lngLat, map)
        handleResults(results)
    } catch (error) {
        if (error.code === 400) {
            console.error('Invalid request parameters')
        } else if (error.code === 404) {
            console.error('Service not found')
        } else if (error.name === 'NetworkError') {
            console.error('Network connection failed')
        } else {
            console.error('Unexpected error:', error.message)
        }
    }
})
```

## Performance Tips

1. **Set appropriate tolerance**: Balance accuracy vs. performance
2. **Limit layers**: Only identify needed layers
3. **Avoid geometry**: Skip geometry if not needed for display
4. **Cache tasks**: Reuse task instances for multiple identifies
5. **Debounce clicks**: Prevent rapid successive requests

```typescript
// Debounced identify
let identifyTimeout
map.on('click', (e) => {
    clearTimeout(identifyTimeout)
    identifyTimeout = setTimeout(async () => {
        const results = await identifyTask.at(e.lngLat, map)
        handleResults(results)
    }, 250)
})
```

## Integration with Services

```typescript
// Use with DynamicMapService
import { DynamicMapService, IdentifyFeatures } from 'esri-gl'

const service = new DynamicMapService('usa-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    layers: [0, 1, 2, 3]
})

// Create identify task for same service
const identifyTask = new IdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})
.layers([0, 1, 2, 3]) // Match service layers
.tolerance(5)

// Alternative: use service's built-in identify method
map.on('click', async (e) => {
    // Option 1: Task-based (more flexible)
    const taskResults = await identifyTask.at(e.lngLat, map)
    
    // Option 2: Service method (simpler)
    const serviceResults = await service.identify(e.lngLat, true)
})
```