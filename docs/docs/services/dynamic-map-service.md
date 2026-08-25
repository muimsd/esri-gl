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
| url | `string` | | **Required** URL of the MapService (does not end in a number), or an ArcGIS [portal item id](../guides/portal-items) |
| portal | `string` | | Portal sharing REST URL used to resolve an item id `url` (defaults to ArcGIS Online) |
| fetchOptions | `object` | | Deprecated — no longer forwarded to requests; use `authentication` instead. |
| layers | `Array<number> \| number \| false` | | Layer IDs to restrict which layers to show (e.g., `[1, 2, 3]`) |
| dynamicLayers | `Array<DynamicLayer> \| false` | | Server-side layer styling and filtering configuration |
| format | `string` | `'png24'` | Output format of the image |
| dpi | `number` | `96` | Resolution of the exported image |
| transparent | `boolean` | `true` | Allow the server to produce transparent images |
| layerDefs | `object \| false` | | SQL filters for features (e.g., `{ 3: "STATE_NAME='Kansas'" }`) |
| from | `Date \| number` | | Start date for time-enabled layers (applied together with `to`) |
| to | `Date \| number` | | End date for time-enabled layers |
| token | `string` | | Authentication token for secured services |
| apiKey | `string` | | ArcGIS Location Platform API key (sent as the `token` parameter) |
| authentication | `IAuthenticationManager \| string` | | ArcGIS REST JS auth manager (preferred for OAuth/user sign-in) |
| getAttributionFromService | `boolean` | `true` | Retrieve copyrightText from service and add as map attribution |

> Authentication runs on [ArcGIS REST JS](https://github.com/Esri/arcgis-rest-js). See the [Authentication guide](../guides/authentication) for tokens, API keys, and auth managers.

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
| `identify(lngLat, returnGeometry?)` | `Promise<unknown>` | Identify features at a point. Resolves to the raw ArcGIS `/identify` response — `{ results: [...] }`, not GeoJSON. For a GeoJSON `FeatureCollection`, use the [IdentifyFeatures task](../tasks/identify-features). |
| `setLayers(layers)` | `void` | Update which layers are visible |
| `setLayerDefs(layerDefs)` | `void` | Update layer definition filters |
| `setDate(from, to)` | `void` | Set the time extent for time-enabled layers |
| `update()` | `void` | Refresh tiles with current parameters |
| `remove()` | `void` | Remove the service source and layers from the map |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `sourceReady` | `Promise<void>` | Resolves once the source has been added to the map — already settled for a plain `url`, resolved after resolution for a [portal item id](../guides/portal-items) `url` |
| `esriServiceOptions` | `object` | The options the service was constructed with (with `url` resolved) |

### Dynamic Layer Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setDynamicLayers(layers)` | `void` | Set complete dynamic layers configuration (pass `false` to reset) |
| `setLayerDrawingInfo(layerId, drawingInfo)` | `void` | Merge `drawingInfo` (renderer, transparency, labels) into a layer |
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

`identify()` resolves to the raw ArcGIS response, so results are on `results.results`:

```typescript
map.on('click', async (e) => {
  const response = await service.identify(e.lngLat, true);
  response.results.forEach(result => {
    console.log(`Layer ${result.layerId} (${result.layerName}):`, result.attributes);
  });
});
```

Prefer the [IdentifyFeatures task](../tasks/identify-features) when you want GeoJSON back:

```typescript
import { IdentifyFeatures } from 'esri-gl';

const featureCollection = await new IdentifyFeatures(service.esriServiceOptions.url)
  .at(e.lngLat)
  .on(map)
  .layers('visible:0,1,2')
  .run();
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
