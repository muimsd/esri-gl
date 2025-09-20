# DynamicMapService

Integrates ArcGIS Dynamic Map Services with MapLibre GL JS and Mapbox GL JS, providing server-rendered raster tiles with dynamic layer control, identify operations, and real-time styling capabilities.

## Interactive Demo

Here's a complete example based on our demo implementation, showing layer controls and identify operations:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Map, Popup } from 'maplibre-gl';
import { DynamicMapService, IdentifyFeatures } from 'esri-gl';

const DynamicMapServiceDemo = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const service = useRef<DynamicMapService | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);
  const [opacity, setOpacity] = useState(1.0);

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
      center: [-95.7129, 37.0902], // Center of USA
      zoom: 4,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Create Dynamic Map Service
      service.current = new DynamicMapService('usa-dynamic', map.current, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: selectedLayers,
        format: 'png32',
        transparent: true,
        dpi: 96,
        layerDefs: {
          2: "POP2000 > 1000000" // Filter states by population
        }
      });

      // Add layer to display the dynamic service
      map.current.addLayer({
        id: 'usa-dynamic-layer',
        type: 'raster',
        source: 'usa-dynamic',
        paint: {
          'raster-opacity': opacity
        }
      });

      // Add click handler for identify operations
      map.current.on('click', handleMapClick);

      // Change cursor on hover
      map.current.on('mouseenter', 'usa-dynamic-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'usa-dynamic-layer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update layers when selection changes
  useEffect(() => {
    if (service.current && selectedLayers.length >= 0) {
      service.current.setLayers(selectedLayers);
    }
  }, [selectedLayers]);

  // Update opacity
  useEffect(() => {
    if (map.current && map.current.getLayer('usa-dynamic-layer')) {
      map.current.setPaintProperty('usa-dynamic-layer', 'raster-opacity', opacity);
    }
  }, [opacity]);

  const handleMapClick = async (e: any) => {
    if (!service.current || !map.current) return;

    try {
      // Use the IdentifyFeatures task for feature identification
      const identify = new IdentifyFeatures({
        url: service.current.esriServiceOptions.url,
        tolerance: 5,
        returnGeometry: false,
        layers: selectedLayers.length > 0 ? `visible:${selectedLayers.join(',')}` : 'all'
      });

      const results = await identify.at(
        { lng: e.lngLat.lng, lat: e.lngLat.lat },
        map.current
      );

      if (results.features && results.features.length > 0) {
        const feature = results.features[0];
        const props = feature.properties || {};
        
        let content = '<div style="max-width: 300px; font-family: Arial, sans-serif;">';
        content += '<h4 style="margin: 0 0 10px 0; color: #333;">Feature Information</h4>';
        
        Object.entries(props).forEach(([key, value]) => {
          if (value !== null && value !== '' && typeof value !== 'object') {
            content += `<div style="margin-bottom: 5px;">`;
            content += `<strong style="color: #666;">${key}:</strong> ${value}`;
            content += `</div>`;
          }
        });
        content += '</div>';

        new Popup()
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(map.current);
      } else {
        new Popup()
          .setLngLat(e.lngLat)
          .setHTML('<div style="padding: 10px;">No features found</div>')
          .addTo(map.current);
      }
    } catch (error) {
      console.error('Identify operation failed:', error);
    }
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
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Dynamic Map Service Demo</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
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
                  backgroundColor: selectedLayers.includes(layer.id) ? '#e3f2fd' : 'transparent',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
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

          {/* Opacity Control */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Opacity: {Math.round(opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={e => setOpacity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
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
          💡 <strong>Instructions:</strong> Toggle layers to control visibility, adjust opacity, 
          and click anywhere on the map to identify features.
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} style={{ flex: 1 }} />
    </div>
  );
};
```

## Constructor

```typescript
new DynamicMapService(sourceId: string, map: Map, esriOptions: DynamicMapServiceOptions, sourceOptions?: SourceOptions)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `sourceId` | `string` | Unique identifier for the MapLibre/Mapbox GL source |
| `map` | `Map` | MapLibre GL or Mapbox GL map instance |
| `esriOptions` | `DynamicMapServiceOptions` | Esri-specific configuration options |
| `sourceOptions` | `SourceOptions` | Optional MapLibre/Mapbox GL source options |

### DynamicMapServiceOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | | **Required** URL of the ArcGIS Dynamic Map Service |
| `layers` | `number[]` | `[]` | Array of layer IDs to display |
| `layerDefs` | `object` | | Layer definition expressions (SQL WHERE clauses) |
| `time` | `[number, number]` | | Time extent for temporal data |
| `format` | `string` | `'png'` | Image format (`png`, `png8`, `png24`, `png32`, `jpg`, `pdf`, `bmp`, `gif`, `svg`) |
| `transparent` | `boolean` | `false` | Enable transparency |
| `dpi` | `number` | `96` | Dots per inch for image generation |
| `dynamicLayers` | `object[]` | | Dynamic layer definitions |
| `mapScale` | `number` | | Map scale for rendering |
| `token` | `string` | | Authentication token |
| `proxy` | `string` | | Proxy URL for cross-domain requests |

## Methods

### Core Methods

#### `.setLayers(layerIds: number[])`

Update which layers are visible in the service.

```typescript
service.setLayers([0, 2, 4]); // Show only layers 0, 2, and 4
service.setLayers([]); // Hide all layers
```

#### `.setLayerDefs(definitions: Record<number, string>)`

Set layer definition expressions for filtering features.

```typescript
service.setLayerDefs({
  0: "POPULATION > 50000",           // Cities with population > 50k
  2: "STATE_NAME = 'California'",    // Only California state
  3: "AREA_SQMI > 100"              // Counties larger than 100 sq miles
});
```

#### `.setTime(timeExtent: [number, number] | null)`

Set temporal extent for time-enabled layers.

```typescript
// Show data from January 1, 2023 to December 31, 2023
service.setTime([
  new Date('2023-01-01').getTime(),
  new Date('2023-12-31').getTime()
]);

// Clear time filter
service.setTime(null);
```

#### `.setOpacity(opacity: number)`

Control the opacity of the entire service (0-1).

```typescript
service.setOpacity(0.5); // 50% transparent
service.setOpacity(1.0); // Fully opaque
```

#### `.identify(point: LngLat, options?: IdentifyOptions)`

Identify features at a geographic point.

```typescript
const results = await service.identify(
  { lng: -118.2437, lat: 34.0522 },
  {
    tolerance: 3,
    returnGeometry: true,
    layers: [0, 1, 2]
  }
);
```

### Utility Methods

#### `.getServiceInfo()`

Retrieve service metadata information.

```typescript
const info = await service.getServiceInfo();
console.log(info.layers); // Available layers
console.log(info.spatialReference); // Spatial reference
console.log(info.capabilities); // Service capabilities
```

#### `.getLayers()`

Get current layer configuration.

```typescript
const currentLayers = service.getLayers();
console.log('Active layers:', currentLayers);
```

#### `.getUrl()`

Get the current service URL.

```typescript
const serviceUrl = service.getUrl();
console.log('Service URL:', serviceUrl);
```

## Advanced Usage Examples

### Time-Enabled Dynamic Service

```typescript
// Weather service with temporal data
const weatherService = new DynamicMapService('weather-data', map, {
  url: 'https://services.arcgis.com/.../Weather/MapServer',
  layers: [0], // Temperature layer
  format: 'png32',
  transparent: true
});

// Show weather for specific time period
const startTime = new Date('2023-06-01T00:00:00Z').getTime();
const endTime = new Date('2023-06-01T23:59:59Z').getTime();
weatherService.setTime([startTime, endTime]);

// Update time every hour
setInterval(() => {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600000);
  weatherService.setTime([hourAgo.getTime(), now.getTime()]);
}, 3600000);
```

### Filtered Demographic Data

```typescript
// Census data with population filters
const censusService = new DynamicMapService('census-data', map, {
  url: 'https://services.arcgis.com/.../Census/MapServer',
  layers: [0, 1], // Counties and States
  layerDefs: {
    0: "POP2020 > 100000 AND AREA_SQMI > 500", // Large populous counties
    1: "REGION = 'West'"                        // Western states only
  },
  format: 'png32',
  transparent: true
});

// Update filters based on user input
const updateFilters = (populationThreshold: number, region: string) => {
  censusService.setLayerDefs({
    0: `POP2020 > ${populationThreshold}`,
    1: `REGION = '${region}'`
  });
};
```

### Multi-Service Layer Management

```typescript
class ServiceManager {
  private services: Map<string, DynamicMapService> = new Map();
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  addService(id: string, url: string, layers: number[] = []) {
    const service = new DynamicMapService(`${id}-source`, this.map, {
      url,
      layers,
      format: 'png32',
      transparent: true
    });

    // Add corresponding map layer
    this.map.addLayer({
      id: `${id}-layer`,
      type: 'raster',
      source: `${id}-source`,
      layout: {
        visibility: 'visible'
      }
    });

    this.services.set(id, service);
    return service;
  }

  toggleService(id: string, visible: boolean) {
    if (this.map.getLayer(`${id}-layer`)) {
      this.map.setLayoutProperty(
        `${id}-layer`,
        'visibility',
        visible ? 'visible' : 'none'
      );
    }
  }

  updateServiceLayers(id: string, layers: number[]) {
    const service = this.services.get(id);
    if (service) {
      service.setLayers(layers);
    }
  }

  async identifyAllServices(point: { lng: number, lat: number }) {
    const identifyPromises = Array.from(this.services.entries()).map(
      async ([id, service]) => {
        try {
          const results = await service.identify(point, { tolerance: 3 });
          return { serviceId: id, results };
        } catch (error) {
          return { serviceId: id, error: error.message };
        }
      }
    );

    return await Promise.all(identifyPromises);
  }
}

// Usage
const manager = new ServiceManager(map);

// Add multiple services
manager.addService('demographics', 'https://services.arcgis.com/.../Demographics/MapServer', [0, 1]);
manager.addService('transportation', 'https://services.arcgis.com/.../Transportation/MapServer', [0, 2, 3]);
manager.addService('environment', 'https://services.arcgis.com/.../Environment/MapServer', [1]);

// Identify across all services
map.on('click', async (e) => {
  const results = await manager.identifyAllServices(e.lngLat);
  console.log('Multi-service identify results:', results);
});
```

## Error Handling

```typescript
const createRobustDynamicService = async (serviceUrl: string) => {
  try {
    // Validate service before creating
    const response = await fetch(`${serviceUrl}?f=json`);
    if (!response.ok) {
      throw new Error(`Service unreachable: ${response.status}`);
    }

    const serviceInfo = await response.json();
    if (serviceInfo.error) {
      throw new Error(`Service error: ${serviceInfo.error.message}`);
    }

    // Create service with error handling
    const service = new DynamicMapService('robust-service', map, {
      url: serviceUrl,
      layers: serviceInfo.layers?.map((_, index) => index) || [],
      format: 'png32',
      transparent: true
    });

    // Add retry logic for identify operations
    const robustIdentify = async (point: any, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await service.identify(point, { timeout: 5000 });
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };

    return { service, robustIdentify };
  } catch (error) {
    console.error('Failed to create dynamic service:', error);
    throw new Error(`Service initialization failed: ${error.message}`);
  }
};
```

## Performance Considerations

1. **Layer Management**: Only request necessary layers to reduce image size
2. **Format Selection**: Use `png8` for simple graphics, `png32` for complex imagery  
3. **Caching**: Enable browser caching for repeated requests
4. **DPI Settings**: Use appropriate DPI for display resolution
5. **Time Filters**: Limit temporal queries to reduce server load

## Best Practices

- **Service Validation**: Always validate service URLs and layer IDs before use
- **Error Handling**: Implement retry logic for network operations
- **Layer Optimization**: Use layer definitions to filter data server-side
- **User Feedback**: Provide loading indicators for slow operations
- **Memory Management**: Remove unused services and clear timeouts
- **Security**: Use tokens for secured services and validate user inputs

## Common Use Cases

- **Demographic Analysis**: Population, income, education data visualization
- **Environmental Monitoring**: Weather, air quality, natural disasters
- **Urban Planning**: Zoning, land use, transportation networks  
- **Emergency Response**: Real-time incident mapping and resource allocation
- **Business Intelligence**: Market analysis, site selection, customer analytics
- **Historical Analysis**: Time-series data visualization and trend analysis