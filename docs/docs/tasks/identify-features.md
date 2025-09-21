# IdentifyFeatures

Identify features at a point across multiple map services, with advanced tolerance and filtering options.

## Interactive Demo

*Note: Demo would show identify functionality with layer controls - implementation pending*

## Quick Start

```typescript
import { IdentifyFeatures } from 'esri-gl';

// Create identify task
const identifyTask = new IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
});

// Configure and execute
const results = await identifyTask
  .at({ lng: -100, lat: 40 }, map)
  .layers([0, 1, 2])
  .tolerance(5)
  .returnGeometry(true);
```

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

### `.at(point, map)`
Execute identification at a geographic point.
- **point**: `{lng: number, lat: number}` or `[lng, lat]`
- **map**: MapLibre GL or Mapbox GL map instance

### `.layers(layers)`
Set which layers to identify.
- **layers**: `number[]` | `string` - Layer IDs or 'all'

### `.tolerance(pixels)`
Set search tolerance in pixels.
- **pixels**: `number` - Search radius from click point

### `.returnGeometry(include)`
Include feature geometry in results.
- **include**: `boolean` - Whether to return geometry

### `.token(authToken)`
Set authentication token.
- **authToken**: `string` - ArcGIS authentication token

## Usage Examples

### Basic Identification
```javascript
const identifyTask = new EsriGL.IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
});

map.on('click', async (e) => {
  const results = await identifyTask.at(e.lngLat, map);
  console.log('Identified features:', results);
});
```

### With Layer Filtering
```javascript
const identifyTask = new EsriGL.IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})
.layers([0, 1, 2]) // Only identify layers 0, 1, and 2
.tolerance(10)     // 10 pixel tolerance
.returnGeometry(true);

const results = await identifyTask.at({ lng: -95, lat: 37 }, map);
```

### Advanced Configuration
```javascript
const identifyTask = new EsriGL.IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  returnFieldName: true,
  returnUnformattedValues: true
})
.layers('visible') // Only identify visible layers
.tolerance(5)
.returnGeometry(true);

// Execute with custom map extent
const results = await identifyTask.at(
  { lng: -100, lat: 40 }, 
  map,
  {
    mapExtent: map.getBounds(),
    imageDisplay: {
      width: map.getContainer().offsetWidth,
      height: map.getContainer().offsetHeight,
      dpi: 96
    }
  }
);
```

### Integration with Services
```javascript
// Use with DynamicMapService
const service = new EsriGL.DynamicMapService('usa-source', map, {
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  layers: [0, 1, 2, 3]
});

// Create identify task for same service
const identifyTask = new EsriGL.IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})
.layers([0, 1, 2, 3]) // Match service layers
.tolerance(5);

map.on('click', async (e) => {
  // Option 1: Task-based (more flexible)
  const taskResults = await identifyTask.at(e.lngLat, map);
  
  // Option 2: Service method (simpler)
  const serviceResults = await service.identify(e.lngLat, true);
});
```

## Key Features

- **Flexible Layer Targeting** - Identify specific layers or all visible layers
- **Tolerance Control** - Adjust search radius for different use cases
- **Geometry Options** - Include or exclude feature geometry in results
- **Chainable Interface** - Fluent API for configuration
- **Service Integration** - Works with any ArcGIS MapServer
- **Advanced Filtering** - Support for dynamic layers and complex queries

## API Reference

For detailed parameter specifications, see [IdentifyFeatures API Reference](../api/identify-features).