# IdentifyFeatures

Identify features at a point across multiple layers in an ArcGIS MapServer.

## Interactive Demo

<iframe src="/examples/identify-features-task.html" width="100%" height="400" frameBorder="0" style={{border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px'}}></iframe>

_Click anywhere on the map to identify features. Use the layer checkboxes to control which layers are queryable._

## Quick Start

```typescript
import { IdentifyFeatures } from 'esri-gl';

const identifyTask = new IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

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
| url | `string` | | **Required.** MapServer URL |
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

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.layers(layers)` | `number[] \| string` | Set layers to identify (IDs or `'all'`, `'visible'`) |
| `.tolerance(pixels)` | `number` | Set search radius in pixels |
| `.returnGeometry(include)` | `boolean` | Include feature geometry in results |
| `.returnFieldName(include)` | `boolean` | Return field names with values |
| `.token(authToken)` | `string` | Set authentication token |

## Execution Methods

### `.at(point, map, callback?)`

Execute identification at a geographic point. Returns a `Promise` with results.

- **point**: `{lng: number, lat: number}` or `[lng, lat]`
- **map**: MapLibre GL or Mapbox GL map instance
- **callback**: Optional callback function

### `.on(map)`

Bind identify to map click events.

- **map**: MapLibre GL or Mapbox GL map instance

### `.run()`

Execute the configured identify request manually.

## Examples

### Basic Identification

```javascript
const identifyTask = new IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

map.on('click', async e => {
  const results = await identifyTask.at(e.lngLat, map);
  console.log('Identified features:', results);
});
```

### With Layer Filtering

```javascript
const identifyTask = new IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
})
  .layers([0, 1, 2])
  .tolerance(10)
  .returnGeometry(true);

const results = await identifyTask.at({ lng: -95, lat: 37 }, map);
```
