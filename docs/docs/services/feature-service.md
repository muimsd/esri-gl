# FeatureService

Integrates ArcGIS Feature Services with MapLibre GL JS and Mapbox GL JS. Provides vector data with smart vector tile detection, GeoJSON fallback, server-side filtering, feature editing, and attachments.

## Live Demo

<iframe
    src="/examples/feature-service-basic.html"
    width="100%"
    height="500px"
    frameBorder="0"
    title="Basic FeatureService Demo">
</iframe>

*Interactive example showing FeatureService with various ArcGIS Feature Services*

## Quick Start

```typescript
import { FeatureService } from 'esri-gl';

const featureService = new FeatureService('features-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0'
});

map.addLayer({
  id: 'features-layer',
  type: 'circle',
  source: 'features-source',
  paint: {
    'circle-radius': 5,
    'circle-color': '#007cbf',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff'
  }
});
```

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| `id` | `string` | An id to assign to the MapLibre GL source |
| `map` | `Map` | A MapLibre GL or Mapbox GL map instance |
| `esriServiceOptions` | `object` | Options for the Feature Service (see below) |
| `geoJsonSourceOptions` | `object` | Optional MapLibre GL GeoJSON source options |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | | **Required.** URL of the FeatureService layer |
| `where` | `string` | `'1=1'` | SQL WHERE clause to filter features |
| `outFields` | `Array<string> \| string` | `'*'` | Fields to include in response |
| `geometry` | `object` | | Geometry to spatially filter features |
| `geometryType` | `string` | | Type of geometry filter |
| `spatialRel` | `string` | `'esriSpatialRelIntersects'` | Spatial relationship |
| `outSR` | `number` | `4326` | Output spatial reference |
| `returnGeometry` | `boolean` | `true` | Include geometry in response |
| `maxRecordCount` | `number` | | Maximum features to return |
| `resultOffset` | `number` | | Starting record for pagination |
| `orderByFields` | `string` | | Fields to sort results by |
| `token` | `string` | | Authentication token (URL parameter) |
| `apiKey` | `string` | | API key for `X-Esri-Authorization` header auth |
| `fetchOptions` | `object` | | Fetch request options |
| `useVectorTiles` | `boolean` | `false` | Enable smart vector tile detection with GeoJSON fallback |
| `useBoundingBox` | `boolean` | `true` | Enable viewport-based data loading for performance |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `query(options?)` | `Promise<GeoJSON.FeatureCollection>` | Query features with custom parameters |
| `updateQuery(options)` | `void` | Update query parameters and refresh |
| `refresh()` | `void` | Refresh data from service |
| `setBoundingBox(enabled)` | `void` | Enable/disable bounding box filtering |
| `identify(lngLat, returnGeometry?)` | `Promise<IdentifyResult[]>` | Identify features at a point |
| `remove()` | `void` | Remove service and clean up resources |

## Editing Methods

Methods for creating, updating, and deleting features on editable Feature Services.

### `addFeatures(features, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `features` | `GeoJSON.Feature[]` | Features to add |
| `options` | `{ gdbVersion?: string }` | Optional geodatabase version |

**Returns:** `Promise<EditResult[]>`

### `updateFeatures(features, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `features` | `GeoJSON.Feature[]` | Features to update (must include OBJECTID) |
| `options` | `{ gdbVersion?: string }` | Optional geodatabase version |

**Returns:** `Promise<EditResult[]>`

### `deleteFeatures(params)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `params.objectIds` | `number[]` | Object IDs to delete |
| `params.where` | `string` | SQL WHERE clause to select features for deletion |

**Returns:** `Promise<EditResult[]>`

### `applyEdits(edits, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `edits.adds` | `GeoJSON.Feature[]` | Features to add |
| `edits.updates` | `GeoJSON.Feature[]` | Features to update |
| `edits.deletes` | `number[]` | Object IDs to delete |
| `options` | `{ gdbVersion?: string }` | Optional geodatabase version |

**Returns:** `Promise<ApplyEditsResult>`

```typescript
const service = new FeatureService('editable-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  token: 'your-agol-token'
});

// Batch edits in a single request
const results = await service.applyEdits({
  adds: [{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-118.24, 34.05] },
    properties: { name: 'Los Angeles' }
  }],
  updates: [{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-118.24, 34.05] },
    properties: { OBJECTID: 1, population: 4000000 }
  }],
  deletes: [10, 11, 12]
});
```

## Attachment Methods

### `queryAttachments(objectId, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `objectId` | `number` | Object ID of the feature |

**Returns:** `Promise<AttachmentInfo[]>`

### `addAttachment(objectId, file, fileName?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `objectId` | `number` | Object ID of the feature |
| `file` | `Blob \| File` | The file to attach |
| `fileName` | `string` | Optional file name |

**Returns:** `Promise<EditResult>`

### `deleteAttachments(objectId, attachmentIds)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `objectId` | `number` | Object ID of the feature |
| `attachmentIds` | `number[]` | IDs of attachments to delete |

**Returns:** `Promise<EditResult[]>`

## Events

| Event | Description |
|-------|-------------|
| `authenticationrequired` | Fired when the service receives a 498/499 auth error. ArcGIS Online returns these as HTTP 200 with a JSON error body; the service detects and surfaces them automatically. |

```typescript
service.on('authenticationrequired', async (error) => {
  const newToken = await refreshToken();
  service.setToken(newToken);
});
```

## Examples

### Smart Vector Tile Detection

```typescript
const service = new FeatureService('smart-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  useVectorTiles: true // Detects vector tile support, falls back to GeoJSON
});
```

### Server-Side Filtering

```typescript
const filtered = new FeatureService('filtered-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  where: "SPECIES = 'Oak' AND HEIGHT > 20",
  outFields: 'SPECIES,HEIGHT,DIAMETER'
});
```

### Automatic Styling with getStyle()

Returns a layer style matching the service geometry type (circle for points, line for lines, fill for polygons). For vector tile sources, includes the appropriate `source-layer`.

```typescript
const layerStyle = await featureService.getStyle();
map.addLayer({ id: 'auto-styled-layer', ...layerStyle });
```

### Authentication

```typescript
// Token auth (URL parameter)
const service = new FeatureService('source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  token: 'your-auth-token'
});

// API key auth (X-Esri-Authorization header)
const service2 = new FeatureService('source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  apiKey: 'your-api-key'
});

// Update token dynamically
service.setToken('refreshed-token');
```
