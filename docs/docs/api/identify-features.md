# IdentifyFeatures

Task for identifying features at a point across multiple map services with advanced tolerance and filtering options.

## Constructor

```typescript
new IdentifyFeatures(options: IdentifyOptions)
```

| Argument | Type | Description |
|----------|------|-------------|
| options | `IdentifyOptions` | Configuration options for the identify operation |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** MapService URL |
| layers | `Array<number>` \| `string` | `'all'` | Layers to identify |
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

**Parameters:**
- `point` (`LngLat`) - Geographic coordinates
- `map` (`Map`) - MapLibre GL or Mapbox GL map instance
- `callback` (`Function`, optional) - Callback function for results

**Returns:** `Promise<FeatureCollection>`

### `.on(map)`

Set the map instance for the identify operation.

**Parameters:**
- `map` (`Map`) - MapLibre GL or Mapbox GL map instance

**Returns:** `IdentifyFeatures` (for chaining)

### `.run()`

Execute the identify operation with current parameters.

**Returns:** `Promise<FeatureCollection>`

## Basic Example

```typescript
import { IdentifyFeatures } from 'esri-gl'

// Create and execute identify task
const identify = new IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})

const results = await identify
  .at({ lng: -95, lat: 37 })
  .on(map)
  .layers('visible:0,1,2')
  .tolerance(5)
  .run()
```

## Advanced Usage

```typescript
// With custom configuration
const identifyTask = new IdentifyFeatures({
  url: 'https://services.arcgis.com/my-service/MapServer',
  tolerance: 10,
  returnGeometry: true,
  returnFieldName: true,
  token: 'your-token'
})

// Chain multiple configurations
const result = await identifyTask
  .layers([0, 2, 4])
  .tolerance(15)
  .returnGeometry(true)
  .at({ lng: -118.2437, lat: 34.0522 }, map)
```

## Response Format

The identify operation returns a GeoJSON FeatureCollection:

```typescript
interface IdentifyResponse {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry?: Geometry
    properties: Record<string, any>
    layerId?: number
    layerName?: string
  }>
}
```