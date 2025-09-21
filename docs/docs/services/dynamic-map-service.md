# DynamicMapService

Integrates ArcGIS Dynamic Map Services with MapLibre GL JS and Mapbox GL JS, providing server-rendered raster tiles with dynamic layer control, identify operations, and real-time styling capabilities.

## Live Demo

<iframe 
  src="/examples/dynamic-map-service.html" 
  width="100%" 
  height="500px" 
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="DynamicMapService Demo">
</iframe>

*Interactive demo showing server-rendered map tiles with dynamic layer controls and click-to-identify functionality.*

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
  layers: 'show:0,1,2'
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
- **Identify Operations** - Click-to-identify features with detailed attribute information
- **Real-time Updates** - Change layer definitions, symbology, and filters dynamically
- **Multiple Formats** - Support for PNG, JPG, and other image formats

## Common Operations

### Layer Control
```typescript
// Control visible layers
service.setLayers('show:0,2'); // Show only layers 0 and 2
service.setLayers('show:'); // Hide all layers
service.setLayers([0, 1, 2]); // Alternative array syntax
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

### Layer Definitions
```typescript
// Filter features with SQL-like expressions
service.setLayerDefs({
  0: "STATE_NAME = 'California'", // Filter cities to California only
  2: "AREA > 50000" // Show only large states
});
```

### Dynamic Updates
```typescript
// Update service parameters
service.updateOptions({
  format: 'png32',
  transparent: true,
  dpi: 96
});
```

## Use Cases

- **Administrative Maps** - Government boundaries, census data, and public services
- **Infrastructure Layers** - Transportation networks, utilities, and facilities
- **Environmental Data** - Land use, natural resources, and hazard information
- **Business Intelligence** - Sales territories, market analysis, and demographic data

For detailed API documentation, see [DynamicMapService API Reference](../api/dynamic-map-service).