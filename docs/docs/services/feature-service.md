# FeatureService

Integrates ArcGIS Feature Services with MapLibre GL JS and Mapbox GL JS. Features are requested per
viewport tile and fed into a MapLibre GeoJSON source — using the layer's binary **PBF** query format
when the service advertises it, and falling back to **GeoJSON** when it doesn't. Also supports
server-side filtering, feature editing, and attachments.

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

These options shape the tile requests the service makes as the map moves.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | | **Required.** URL of the FeatureService **layer** (ends in a layer index), or an ArcGIS [portal item id](../guides/portal-items) |
| `portal` | `string` | | Portal sharing REST URL used to resolve an item id `url` (defaults to ArcGIS Online) |
| `layerId` | `number` | `0` | Sublayer appended when an item id resolves to a service root |
| `where` | `string` | `'1=1'` | SQL WHERE clause to filter features |
| `outFields` | `Array<string> \| string` | `'*'` | Fields to include in the response (the layer's unique id field is always added) |
| `from` | `Date \| number \| null` | `null` | Start of the time extent (applied together with `to`) |
| `to` | `Date \| number \| null` | `null` | End of the time extent |
| `minZoom` | `number` | `2` (`7` when `useStaticZoomLevel`) | Zoom below which no features are requested |
| `useStaticZoomLevel` | `boolean` | `false` | Always request tiles at `minZoom` instead of tracking the map's zoom |
| `simplifyFactor` | `number` | `0.3` | Geometry simplification factor (0–1) |
| `precision` | `number` | `8` | Decimal precision of returned coordinates |
| `useServiceBounds` | `boolean` | `true` | Skip tiles outside the service extent |
| `projectionEndpoint` | `string` | derived from `url` | GeometryServer `project` endpoint used to reproject the service extent |
| `setAttributionFromService` | `boolean` | `true` | Fetch copyright text from service metadata |
| `token` | `string` | | Authentication token (sent as the `token` parameter) |
| `apiKey` | `string` | | ArcGIS Location Platform API key (sent as the `token` parameter) |
| `authentication` | `IAuthenticationManager \| string` | | ArcGIS REST JS auth manager (preferred for OAuth/user sign-in) |
| `fetchOptions` | `object` | | Deprecated — no longer forwarded to requests; use `authentication` instead. |

The remaining query fields (`geometry`, `geometryType`, `spatialRel`, `inSR`, `outSR`,
`orderByFields`, `outStatistics`, `having`, `resultOffset`, `resultRecordCount`, …) are defaults for
[`queryFeatures()`](#methods) rather than for the map source.

:::caution Ignored options
`useVectorTiles`, `useBoundingBox` and `maxRecordCount` are accepted for backwards compatibility but
are **not applied**. The query format is negotiated from the layer's `supportedQueryFormats`, viewport
loading is always on (toggle it with `disableRequests()` / `enableRequests()`), and page size is
governed by the server's own `maxRecordCount`.
:::

> Authentication runs on [ArcGIS REST JS](https://github.com/Esri/arcgis-rest-js). See the [Authentication guide](../guides/authentication) for tokens, API keys, and auth managers.

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `queryFeatures(options?)` | `Promise<GeoJSON.FeatureCollection>` | Run a one-off query with custom parameters (does not change the map source). Always requests `f=geojson`, so use the [Query task](../tasks/query) for `outStatistics` queries, which services only answer as `f=json`. |
| `getFeaturesByLonLat(lngLat, radius?, returnGeometry?)` | `Promise<GeoJSON.FeatureCollection>` | Features within `radius` metres (default `20`) of a point |
| `getFeaturesByObjectIds(objectIds, returnGeometry?)` | `Promise<GeoJSON.FeatureCollection>` | Features for a list of object ids |
| `getStyle()` | `Promise<StyleData>` | A layer style matching the service geometry type |
| `setWhere(where)` | `void` | Replace the WHERE clause and reload the visible tiles |
| `clearWhere()` | `void` | Reset the WHERE clause to `'1=1'` and reload |
| `setOutFields(fields)` | `void` | Replace the output fields and reload |
| `setDate(to, from?)` | `void` | Set the time extent and reload. **Note the argument order** — `to` first, unlike `DynamicMapService.setDate(from, to)` |
| `setToken(token)` | `void` | Update the authentication token and reload |
| `enableRequests()` | `void` | Start loading features on map `moveend` (on by default) |
| `disableRequests()` | `void` | Stop loading features on map movement |
| `queryRelatedRecords(options)` | `Promise<IQueryRelatedResponse>` | Query records related through a relationship class |
| `decodeValues(queryResponse, fields?)` | `Promise<IQueryFeaturesResponse>` | Replace coded-value-domain codes with their labels |
| `remove()` | `void` | Remove service and clean up resources |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `sourceReady` | `Promise<void>` | Resolves once the source is on the map and the layer metadata has loaded; rejects if the layer supports neither PBF nor GeoJSON |
| `serviceMetadata` | `object \| null` | The layer definition document, once loaded |
| `supportsPbf` / `supportsGeojson` | `boolean` | Which query formats the layer advertises |
| `defaultStyle` | `StyleData` | Style for the layer's geometry type (available after metadata loads) |

:::note Deprecated aliases
`updateSource()`, `updateData()`, `setBoundingBoxFilter(enabled)`, `setLayers()`, `setGeometry()` and
`clearGeometry()` remain for backwards compatibility. Use `setWhere()` / `enableRequests()` /
`disableRequests()` / `queryFeatures()` instead.
:::

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

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticationrequired` | `{ authenticate: (token: string) => void }` | Fired when a tile request fails with a 498/499 auth error. ArcGIS Online returns these as HTTP 200 with a JSON error body; the service detects and surfaces them automatically. |

```typescript
service.on('authenticationrequired', async ({ authenticate }) => {
  const newToken = await refreshToken();
  authenticate(newToken); // same as service.setToken(newToken)
});
```

## Examples

### Query Format Detection

The query format is chosen from the layer's `supportedQueryFormats` — no option required. PBF is
used when the layer advertises it (smaller payloads, quantized geometry), GeoJSON otherwise:

```typescript
const service = new FeatureService('smart-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0'
});

await service.sourceReady;
console.log(service.supportsPbf, service.supportsGeojson);
```

### Server-Side Filtering

```typescript
const filtered = new FeatureService('filtered-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  where: "SPECIES = 'Oak' AND HEIGHT > 20",
  outFields: 'SPECIES,HEIGHT,DIAMETER'
});
```

### Filtering after construction

```typescript
service.setWhere("SPECIES = 'Oak'"); // re-requests the visible tiles
service.setOutFields(['SPECIES', 'HEIGHT']);
service.clearWhere();
```

### Automatic Styling with getStyle()

Returns a layer style matching the service geometry type — `circle` for points, `line` for lines,
`fill` for polygons — with `source` already set to the service's source id.

```typescript
const layerStyle = await featureService.getStyle();
map.addLayer({ id: 'auto-styled-layer', ...layerStyle });
```

### One-off queries

`queryFeatures()` runs an independent query against the layer; it does not change what the map
source displays.

```typescript
const fc = await featureService.queryFeatures({
  where: 'HEIGHT > 20',
  outFields: ['SPECIES', 'HEIGHT'],
  resultRecordCount: 50
});

const nearby = await featureService.getFeaturesByLonLat({ lng: -118.24, lat: 34.05 }, 500);
const byId = await featureService.getFeaturesByObjectIds([1, 2, 3]);
```

### Authentication

```typescript
// Token auth (URL parameter)
const service = new FeatureService('source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  token: 'your-auth-token'
});

// API key auth (sent as the token parameter)
const service2 = new FeatureService('source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  apiKey: 'your-api-key'
});

// Update token dynamically
service.setToken('refreshed-token');
```
