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

```bash
npm install esri-gl maplibre-gl
```

```typescript
import { DynamicMapService } from 'esri-gl';

const service = new DynamicMapService('usa-source', map, {
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  layers: [0, 1, 2]
});

map.addLayer({
  id: 'usa-layer',
  type: 'raster',
  source: 'usa-source'
});
```

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the [MapLibre GL source](https://maplibre.org/maplibre-gl-js-docs/api/map/#map#addsource) |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options passed when requesting the Esri MapService (see below) |
| rasterSourceOptions | `object` | Optional object passed to the MapLibre GL [raster source](https://maplibre.org/maplibre-style-spec/sources/#raster) |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the MapService (does not end in a number) |
| fetchOptions | `object` | | Options passed to [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) for authorization headers |
| layers | `Array<string>` | | Array of layer IDs to restrict which layers to show (e.g., `[1, 2, 3]`) |
| dynamicLayers | `Array<DynamicLayer>` | | Server-side layer styling and filtering configuration |
| format | `string` | `'png24'` | Output format of the image |
| transparent | `boolean` | `true` | Allow the server to produce transparent images |
| layerDefs | `object` | | SQL filters for features (e.g., `{ 3: "STATE_NAME='Kansas'" }`) |
| from | `Date` | | Start date for time-enabled layers |
| to | `Date` | | End date for time-enabled layers |
| token | `string` | | Authentication token for secured services |
| getAttributionFromService | `boolean` | `true` | Retrieve copyrightText from service and add as map attribution |

## Dynamic Layers

The `dynamicLayers` parameter enables server-side styling and filtering of individual layers. When used, it overrides the default layer drawing for the specified layers.

### DynamicLayer Interface

| Property | Type | Description |
|----------|------|-------------|
| id | `number` | **Required** Layer ID to customize |
| visible | `boolean` | Show/hide the layer |
| source | `object` | Layer source configuration (defaults to `{type: 'mapLayer', mapLayerId: id}`) |
| definitionExpression | `string` | SQL WHERE clause to filter features |
| drawingInfo | `object` | Styling configuration including renderer and transparency |
| minScale | `number` | Minimum scale at which layer is visible |
| maxScale | `number` | Maximum scale at which layer is visible |

### Filter Types

Structured filter types for building SQL expressions:

```typescript
type LayerFilter =
  | ComparisonFilter  // { field: 'STATE_NAME', op: '=', value: 'California' }
  | BetweenFilter     // { field: 'POP2000', op: 'BETWEEN', from: 1000000, to: 5000000 }
  | InFilter          // { field: 'STATE_ABBR', op: 'IN', values: ['CA', 'OR', 'WA'] }
  | NullFilter        // { field: 'DESCRIPTION', op: 'IS NULL' }
  | GroupFilter       // { op: 'AND', filters: [filter1, filter2] }
  | string;           // Raw SQL expression
```

## Methods

### Basic Operations

| Method | Returns | Description |
|--------|---------|-------------|
| `identify(lngLat, returnGeometry?)` | `Promise<IdentifyResponse>` | Identify features at a point |
| `setLayers(layers)` | `void` | Update which layers are visible |
| `setLayerDefs(layerDefs)` | `void` | Update layer definition filters |
| `update()` | `void` | Refresh tiles with current parameters |
| `remove()` | `void` | Remove the service source and layers from the map |

### Dynamic Layer Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setDynamicLayers(layers)` | `void` | Set complete dynamic layers configuration (pass `false` to reset) |
| `setLayerRenderer(layerId, renderer)` | `void` | Apply custom renderer/styling to a layer |
| `setLayerVisibility(layerId, visible)` | `void` | Show/hide a specific layer |
| `setLayerDefinition(layerId, expression)` | `void` | Apply SQL filter to a layer |
| `setLayerFilter(layerId, filter)` | `void` | Apply structured filter to a layer |
| `setToken(token)` | `void` | Update the authentication token and refresh tiles |

### Labeling Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setLayerLabels(layerId, labelingInfo)` | `void` | Apply server-side text labels with custom styling |
| `setLayerLabelsVisible(layerId, visible)` | `void` | Toggle label visibility for a layer |

### Time-Aware Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setLayerTimeOptions(layerId, timeOptions)` | `void` | Configure temporal data settings for a layer |
| `animateTime(options)` | `Promise<void>` | Animate through time extents with frame callbacks |

### Query & Statistics Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getLayerStatistics(layerId, statisticFields, options?)` | `Promise<StatisticResult[]>` | Get statistical analysis (count, sum, avg, etc.) |
| `queryLayerFeatures(layerId, options?)` | `Promise<FeatureSet>` | Query features with spatial/attribute filters |

### Export Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `exportMapImage(options)` | `Promise<Blob>` | Export high-resolution map images |

### Metadata Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getMetadata()` | `Promise<ServiceMetadata>` | Retrieve full service metadata |
| `setAttributionFromService()` | `Promise<void>` | Set map attribution from service copyrightText |
| `generateLegend(layerIds?)` | `Promise<LegendInfo[]>` | Retrieve layer symbology information |
| `getLayerInfo(layerId)` | `Promise<LayerMetadata>` | Get detailed layer metadata and capabilities |
| `getLayerFields(layerId)` | `Promise<FieldInfo[]>` | Get field definitions and types |
| `getLayerExtent(layerId)` | `Promise<Extent>` | Get spatial extent of a layer |
| `discoverLayers()` | `Promise<LayerInfo[]>` | Discover all layers in the service |

### Batch Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setBulkLayerProperties(operations)` | `void` | Apply multiple layer operations atomically |
| `beginUpdate()` | `void` | Begin a batch update transaction |
| `commitUpdate()` | `void` | Commit all pending updates |
| `rollbackUpdate()` | `void` | Rollback pending updates |
| `isInTransaction` | `boolean` | Check if currently in a transaction |

## Examples

### Server-side Styling

```typescript
// Polygon fill
service.setLayerRenderer(2, {
  type: 'simple',
  symbol: {
    type: 'esriSFS',
    style: 'esriSFSSolid',
    color: [0, 122, 255, 90],
    outline: { type: 'esriSLS', style: 'esriSLSSolid', color: [0, 82, 204, 255], width: 1 }
  }
});

// Point symbols
service.setLayerRenderer(0, {
  type: 'simple',
  symbol: {
    type: 'esriSMS',
    style: 'esriSMSCircle',
    color: [255, 0, 0, 255],
    size: 8,
    outline: { color: [255, 255, 255, 255], width: 2 }
  }
});
```

### Structured Filters

```typescript
service.setLayerFilter(2, { field: 'STATE_NAME', op: '=', value: 'California' });

service.setLayerFilter(2, { field: 'POP2000', op: 'BETWEEN', from: 1000000, to: 5000000 });

service.setLayerFilter(2, { field: 'STATE_ABBR', op: 'IN', values: ['CA', 'OR', 'WA'] });

// Grouped conditions
service.setLayerFilter(2, {
  op: 'AND',
  filters: [
    { field: 'POP2000', op: '>', value: 1000000 },
    { field: 'SUB_REGION', op: '=', value: 'Pacific' }
  ]
});
```

### Identify Features

```typescript
map.on('click', async (e) => {
  const results = await service.identify(e.lngLat, true);
  results.features.forEach(feature => {
    console.log(`Layer ${feature.layerId}:`, feature.attributes);
  });
});
```

### Dynamic Layer Configuration

```typescript
service.setDynamicLayers([
  {
    id: 0,
    visible: true,
    definitionExpression: "POP_2000 > 100000",
    drawingInfo: {
      renderer: {
        type: 'simple',
        symbol: { type: 'esriSMS', style: 'esriSMSCircle', color: [255, 0, 0, 255], size: 8 }
      }
    }
  },
  {
    id: 2,
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
      }
    }
  }
]);

// Reset to default server styling
service.setDynamicLayers(false);
```
