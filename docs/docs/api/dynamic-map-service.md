# DynamicMapService

For accessing [ArcGIS Dynamic Map Services](https://developers.arcgis.com/rest/services-reference/map-service.htm) as raster tile sources with advanced server-side styling and filtering capabilities.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the [MapLibre GL source](https://maplibre.org/maplibre-gl-js-docs/api/map/#map#addsource) |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options passed when requesting the Esri MapService (see below) |
| rasterSourceOptions | `object` | Optional object passed to the MapLibre GL [raster source](https://maplibre.org/maplibre-style-spec/sources/#raster) |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the MapService (Note: Map Service URLs do not end in a number) |
| fetchOptions | `object` | | Options passed to the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) method for authorization headers |
| layers | `Array<string>` | | Array of layer IDs to restrict which layers to show (e.g., `[1, 2, 3]`) |
| dynamicLayers | `Array<DynamicLayer>` | | Server-side layer styling and filtering configuration |
| format | `string` | `'png24'` | Output format of the image |
| transparent | `boolean` | `true` | Allow the server to produce transparent images |
| layerDefs | `object` | | SQL filters for features. Object with keys mapping queries to layers (e.g., `{ 3: "STATE_NAME='Kansas'", 9: "POP2007>25000" }`) |
| from | `Date` | | Start date for time-enabled layers |
| to | `Date` | | End date for time-enabled layers |
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

### Dynamic Layer Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setDynamicLayers(layers)` | `void` | Set complete dynamic layers configuration |
| `setLayerRenderer(layerId, renderer)` | `void` | Apply custom renderer/styling to a layer |
| `setLayerVisibility(layerId, visible)` | `void` | Show/hide a specific layer |
| `setLayerDefinition(layerId, expression)` | `void` | Apply SQL filter to a layer |
| `setLayerFilter(layerId, filter)` | `void` | Apply structured filter to a layer |

### Advanced Labeling Methods

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

### Metadata Discovery Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `generateLegend(layerIds?)` | `Promise<LegendInfo[]>` | Retrieve layer symbology information |
| `getLayerInfo(layerId)` | `Promise<LayerMetadata>` | Get detailed layer metadata and capabilities |
| `getLayerFields(layerId)` | `Promise<FieldInfo[]>` | Get field definitions and types |
| `getLayerExtent(layerId)` | `Promise<Extent>` | Get spatial extent of a layer |
| `discoverLayers()` | `Promise<LayerInfo[]>` | Discover all layers in the service |

### Batch Operation Methods

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
// Apply blue fill to States layer
service.setLayerRenderer(2, {
  type: 'simple',
  symbol: {
    type: 'esriSFS',
    style: 'esriSFSSolid',
    color: [0, 122, 255, 90],
    outline: {
      type: 'esriSLS',
      style: 'esriSLSSolid',
      color: [0, 82, 204, 255],
      width: 1
    }
  }
});
```

### Structured Filters

```typescript
// Filter to Pacific states
service.setLayerFilter(2, {
  field: 'SUB_REGION',
  op: '=',
  value: 'Pacific'
});

// Complex filter with multiple conditions
service.setLayerFilter(2, {
  op: 'AND',
  filters: [
    { field: 'POP2000', op: '>', value: 1000000 },
    { field: 'SUB_REGION', op: '=', value: 'Pacific' }
  ]
});
```

### Advanced Labeling

```typescript
// Apply custom labels to States layer
service.setLayerLabels(2, {
  labelExpression: '[STATE_NAME]',
  symbol: {
    type: 'esriTS',
    color: [255, 255, 255, 255],
    backgroundColor: [0, 0, 0, 128],
    font: {
      family: 'Arial',
      size: 12,
      weight: 'bold'
    },
    horizontalAlignment: 'center'
  },
  minScale: 0,
  maxScale: 25000000,
  labelPlacement: 'esriServerPolygonPlacementAlwaysHorizontal'
});

// Toggle label visibility
service.setLayerLabelsVisible(2, false);
```

### Time-Aware Layers

```typescript
// Configure time-enabled layer
service.setLayerTimeOptions(1, {
  useTime: true,
  timeExtent: [Date.now() - 86400000, Date.now()], // Last 24 hours
  timeOffset: 0,
  timeOffsetUnits: 'esriTimeUnitsHours'
});

// Animate through time
const startTime = new Date('2023-01-01');
const endTime = new Date('2023-12-31');

await service.animateTime({
  from: startTime,
  to: endTime,
  intervalMs: 1000,
  loop: true,
  onFrame: (currentTime, progress) => {
    console.log(`Animation progress: ${(progress * 100).toFixed(1)}%`);
  }
});
```

### Statistics & Queries

```typescript
// Get statistical analysis
const stats = await service.getLayerStatistics(2, [
  {
    statisticType: 'count',
    onStatisticField: 'OBJECTID',
    outStatisticFieldName: 'total_states'
  },
  {
    statisticType: 'sum',
    onStatisticField: 'POP2000',
    outStatisticFieldName: 'total_population'
  },
  {
    statisticType: 'avg',
    onStatisticField: 'POP2000',
    outStatisticFieldName: 'avg_population'
  }
], {
  where: 'POP2000 > 1000000'
});

// Query features with spatial filter
const features = await service.queryLayerFeatures(2, {
  where: 'POP2000 > 5000000',
  geometry: {
    type: 'Polygon',
    coordinates: [[[-125, 32], [-114, 32], [-114, 42], [-125, 42], [-125, 32]]]
  },
  spatialRel: 'esriSpatialRelIntersects',
  outFields: ['STATE_NAME', 'POP2000', 'SUB_REGION'],
  orderByFields: 'POP2000 DESC',
  resultRecordCount: 10
});
```

### Map Export

```typescript
// Export current map view as high-resolution image
const blob = await service.exportMapImage({
  bbox: [-125, 32, -114, 42], // West, South, East, North
  size: [1200, 800],
  format: 'png',
  dpi: 300,
  transparent: true
});

// Download the exported image
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'exported-map.png';
link.click();
```

### Metadata Discovery

```typescript
// Generate legend for all layers
const legend = await service.generateLegend();
console.log('Legend:', legend);

// Get detailed layer information
const layerInfo = await service.getLayerInfo(2);
console.log('Layer fields:', layerInfo.fields);
console.log('Layer extent:', layerInfo.extent);

// Discover all available layers
const allLayers = await service.discoverLayers();
console.log('Available layers:', allLayers);

// Get field definitions
const fields = await service.getLayerFields(2);
console.log('Field types:', fields.map(f => `${f.name}: ${f.type}`));
```

### Batch Operations

```typescript
// Apply multiple changes atomically
service.setBulkLayerProperties([
  {
    layerId: 1,
    operation: 'visibility',
    value: true
  },
  {
    layerId: 2,
    operation: 'renderer',
    value: {
      type: 'simple',
      symbol: { type: 'esriSFS', color: [255, 0, 0, 128] }
    }
  },
  {
    layerId: 2,
    operation: 'filter',
    value: {
      field: 'POP2000',
      op: '>',
      value: 5000000
    }
  }
]);

// Transaction-based updates
service.beginUpdate();

// Make multiple changes (won't update map until commit)
service.setLayerVisibility(1, false);
service.setLayerRenderer(2, customRenderer);
service.setLayerFilter(3, populationFilter);

// Commit all changes at once
service.commitUpdate();

// Or rollback if needed
// service.rollbackUpdate();
```