# DynamicMapService

Integrates ArcGIS Dynamic Map Services with MapLibre GL JS and Mapbox GL JS, providing server-rendered raster tiles with dynamic layer control, server-side styling, advanced filtering, and identify operations.

## Live Demo

<iframe 
  src="/examples/dynamic-map-service.html" 
  width="100%" 
  height="500px" 
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="DynamicMapService Demo">
</iframe>

*Interactive demo showing server-rendered map tiles with dynamic layer controls, server-side styling, filtering, and click-to-identify functionality.*

## Quick Start

### Installation

```bash
npm install esri-gl maplibre-gl
```

### Basic Usage

```typescript
import { DynamicMapService } from 'esri-gl';

// Create the service
const service = new DynamicMapService('usa-source', map, {
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  layers: [0, 1, 2]
});

// Add layer to display the service
map.addLayer({
  id: 'usa-layer',
  type: 'raster',
  source: 'usa-source'
});
```

## Key Features

- **Server-rendered Tiles** - High-quality raster tiles generated on ArcGIS Server
- **Dynamic Layer Control** - Show/hide individual layers without reloading
- **Server-side Styling** - Apply custom renderers and symbology via dynamicLayers
- **Advanced Filtering** - Structured and SQL-based feature filtering
- **Identify Operations** - Click-to-identify features with detailed attribute information
- **Real-time Updates** - Change layer definitions, symbology, and filters dynamically
- **Multiple Formats** - Support for PNG, JPG, and other image formats

## Common Operations

### Layer Control
```typescript
// Control visible layers
service.setLayers([0, 2]); // Show only layers 0 and 2
service.setLayers([]); // Hide all layers
service.setLayers([0, 1, 2]); // Show multiple layers
```

### Server-side Styling

Apply custom renderers and symbology without client-side styling:

```typescript
// Apply blue fill to States layer (layer 2)
service.setLayerRenderer(2, {
  type: 'simple',
  symbol: {
    type: 'esriSFS',
    style: 'esriSFSSolid',
    color: [0, 122, 255, 90], // RGBA: Blue with transparency
    outline: {
      type: 'esriSLS',
      style: 'esriSLSSolid',
      color: [0, 82, 204, 255], // Dark blue outline
      width: 1
    }
  }
});

// Apply custom point symbols
service.setLayerRenderer(0, {
  type: 'simple',
  symbol: {
    type: 'esriSMS',
    style: 'esriSMSCircle',
    color: [255, 0, 0, 255], // Red circles
    size: 8,
    outline: {
      color: [255, 255, 255, 255], // White outline
      width: 2
    }
  }
});
```

### Advanced Filtering

#### Structured Filters
```typescript
// Simple comparison filter
service.setLayerFilter(2, {
  field: 'STATE_NAME',
  op: '=',
  value: 'California'
});

// Numeric range filter
service.setLayerFilter(2, {
  field: 'POP2000',
  op: 'BETWEEN',
  from: 1000000,
  to: 5000000
});

// Multiple values filter
service.setLayerFilter(2, {
  field: 'STATE_ABBR',
  op: 'IN',
  values: ['CA', 'OR', 'WA'] // Pacific states
});

// Complex grouped conditions
service.setLayerFilter(2, {
  op: 'AND',
  filters: [
    { field: 'POP2000', op: '>', value: 1000000 },
    { field: 'SUB_REGION', op: '=', value: 'Pacific' }
  ]
});
```

#### SQL Definition Expressions
```typescript
// Raw SQL expressions for complex filtering
service.setLayerDefinition(2, "STATE_NAME LIKE 'C%' AND POP2000 > 5000000");
```

### Dynamic Layer Configuration

For advanced use cases, configure complete dynamic layer specifications:

```typescript
service.setDynamicLayers([
  {
    id: 0, // Cities layer
    visible: true,
    drawingInfo: {
      renderer: {
        type: 'simple',
        symbol: { type: 'esriSMS', color: [255, 0, 0, 255], size: 6 }
      }
    }
  },
  {
    id: 2, // States layer
    visible: true,
    definitionExpression: "SUB_REGION = 'Pacific'",
    drawingInfo: {
      renderer: {
        type: 'simple',
        symbol: {
          type: 'esriSFS',
          color: [0, 122, 255, 90],
          outline: { color: [0, 82, 204, 255], width: 2 }
        }
      },
      transparency: 50
    }
  }
]);
```

### Identify Features
```typescript
// Click-to-identify features
map.on('click', async (e) => {
  const results = await service.identify(e.lngLat, true);
  results.features.forEach(feature => {
    console.log(`Layer ${feature.layerId}:`, feature.attributes);
  });
});
```

### Legacy Layer Definitions
```typescript
// Filter features with SQL-like expressions (legacy approach)
service.setLayerDefs({
  0: "STATE_NAME = 'California'", // Filter cities to California only
  2: "AREA > 50000" // Show only large states
});
```

### Dynamic Updates
```typescript
// Reset all customizations
service.setDynamicLayers(false); // Revert to default server styling

// Update service parameters
service.updateOptions({
  format: 'png32',
  transparent: true,
  dpi: 96
});
```

## Use Cases

### Administrative Maps
- **Government Boundaries** - Styled boundaries with custom colors and transparency
- **Census Data Visualization** - Population-based styling and filtering
- **Public Services** - Custom symbols for facilities and service areas

### Infrastructure Layers
- **Transportation Networks** - Highway styling with traffic-based filtering
- **Utilities Management** - Infrastructure symbology with status indicators
- **Facility Mapping** - Custom markers for different facility types

### Environmental Data
- **Land Use Analysis** - Category-based styling and area filtering
- **Natural Resources** - Resource availability visualization
- **Hazard Information** - Risk-based symbology and alert filtering

### Business Intelligence
- **Sales Territory Analysis** - Performance-based coloring and regional filtering
- **Market Analysis** - Demographic filtering with custom visualizations
- **Customer Analytics** - Location-based insights with dynamic styling

### Advanced Scenarios
- **Real-time Dashboards** - Dynamic filtering based on live data
- **Thematic Mapping** - Server-side choropleth and graduated symbols
- **Multi-criteria Analysis** - Complex filter combinations for decision support
- **Custom Cartography** - Professional map styling without client-side processing

## Technical Advantages

### Server-side Processing
- **Performance** - Styling and filtering processed on ArcGIS Server
- **Scalability** - No client-side rendering overhead for complex symbology
- **Consistency** - Identical rendering across different clients and devices

### Dynamic Capabilities
- **Live Updates** - Change styling and filters without map reload
- **Layer Preservation** - Maintain visibility of other layers during customization
- **Memory Efficiency** - Reduced client-side memory usage for complex styling

For detailed API documentation, see [DynamicMapService API Reference](../api/dynamic-map-service).