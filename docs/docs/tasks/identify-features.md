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
  .at({ lng: -100, lat: 40 })
  .on(map)
  .layers([0, 1, 2])
  .tolerance(5)
  .returnGeometry(true)
  .run();
```

`run()` resolves to a GeoJSON `FeatureCollection`; each feature's `properties` carry the ArcGIS
attributes plus `layerId`, `layerName`, `displayFieldName` and `value`.

## Constructor

```typescript
new IdentifyFeatures(urlOrOptions: string | IdentifyFeaturesOptions | Service)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required.** MapServer URL |
| layers | `Array<number> \| number \| string` | `'all'` | Layers to identify (`'all'`, `'top'`, `'visible'`, `'visible:0,1'`, or ids) |
| layerDefs | `object` | | SQL filters keyed by layer id |
| tolerance | `number` | `3` | Search tolerance in pixels |
| returnGeometry | `boolean` | `true` | Include feature geometry |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| dynamicLayers | `Array<object>` | | Dynamic layer definitions |
| mapExtent | `[number, number, number, number]` | | Current map extent (set for you by `.on(map)`) |
| imageDisplay | `[number, number, number]` | | Map image width, height, DPI (set for you by `.on(map)`) |
| dpi | `number` | `96` | DPI used when `.on(map)` builds `imageDisplay` |
| sr | `string \| number` | `4326` | Spatial reference of the input/output geometry |
| token | `string` | | Authentication token |
| apiKey | `string` | | ArcGIS Location Platform API key |
| authentication | `IAuthenticationManager \| string` | | ArcGIS REST JS auth manager ([guide](../guides/authentication)) |

## Chainable Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.at(point)` | `{lng, lat}` or `[lng, lat]` | Set the point to identify at |
| `.on(map)` | `Map` | Read `mapExtent` and `imageDisplay` from a live map (required by the ArcGIS identify API) |
| `.layers(layers)` | `number[] \| number \| string` | Set layers to identify (ids or `'all'`, `'top'`, `'visible:0,1'`) |
| `.tolerance(pixels)` | `number` | Set search radius in pixels |
| `.returnGeometry(include)` | `boolean` | Include feature geometry in results |
| `.precision(places)` | `number` | Decimal places for returned geometry (`geometryPrecision`) |
| `.layerDef(layerId, where)` | `number \| string, string` | Add a SQL filter for one layer (call repeatedly to add more) |
| `.layerScales(scales)` | `Record<number, { minScale?, maxScale? }>` | Skip layers that aren't visible at the map's current scale |
| `.simplify(map, factor)` | `Map, number` | Set `maxAllowableOffset` from the map resolution |
| `.format(formatted)` | `boolean` | `false` returns raw field values (`returnUnformattedValues`) |
| `.token(authToken)` | `string` | Set authentication token |

All of the above return the task for chaining — none of them send the request.

## Execution Method

### `.run()` → `Promise<GeoJSON.FeatureCollection>`

Send the configured identify request and convert the response to GeoJSON.

When `layerScales()` has been set and a map was supplied via `on()`, layers that aren't visible at
the current scale are dropped from the request; if none are visible, an empty `FeatureCollection` is
returned without a network round trip.

## Examples

### Basic Identification

```javascript
const identifyTask = new IdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

map.on('click', async e => {
  const results = await identifyTask.at(e.lngLat).on(map).run();
  console.log('Identified features:', results.features);
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

const results = await identifyTask.at({ lng: -95, lat: 37 }).on(map).run();
```

### Skipping Out-of-Scale Layers

```javascript
const results = await identifyTask
  .layerScales({
    0: { minScale: 1000000, maxScale: 0 },      // Cities: only below 1:1M
    1: { minScale: 5000000, maxScale: 500000 }, // Highways: 1:5M – 1:500K
    2: { minScale: 0, maxScale: 0 },            // States: always visible
  })
  .at({ lng: -95, lat: 37 })
  .on(map)
  .run();
```
