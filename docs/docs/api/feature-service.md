# FeatureService

For accessing [ArcGIS Feature Services](https://developers.arcgis.com/rest/services-reference/feature-service.htm) that provide GeoJSON-compatible vector features with intelligent vector tile detection and automatic fallback.

## Constructor

| Argument             | Type     | Description                                 |
| -------------------- | -------- | ------------------------------------------- |
| id                   | `string` | An id to assign to the MapLibre GL source   |
| map                  | `Map`    | A MapLibre GL or Mapbox GL map instance     |
| esriServiceOptions   | `object` | Options for the Feature Service (see below) |
| geoJsonSourceOptions | `object` | Optional MapLibre GL GeoJSON source options |

## Esri Service Options

| Option             | Type                      | Default                      | Description                                                      |
| ------------------ | ------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| url                | `string`                  |                              | **Required** URL of the FeatureService layer                     |
| where              | `string`                  | `'1=1'`                      | SQL WHERE clause to filter features                              |
| outFields          | `Array<string> \| string` | `'*'`                        | Fields to include in response                                    |
| geometry           | `object`                  |                              | Geometry to spatially filter features                            |
| geometryType       | `string`                  |                              | Type of geometry filter                                          |
| spatialRel         | `string`                  | `'esriSpatialRelIntersects'` | Spatial relationship                                             |
| outSR              | `number`                  | `4326`                       | Output spatial reference                                         |
| returnGeometry     | `boolean`                 | `true`                       | Include geometry in response                                     |
| maxRecordCount     | `number`                  |                              | Maximum features to return                                       |
| resultOffset       | `number`                  |                              | Starting record for pagination                                   |
| orderByFields      | `string`                  |                              | Fields to sort results by                                        |
| token              | `string`                  |                              | Authentication token                                             |
| apiKey             | `string`                  |                              | API key for X-Esri-Authorization header auth                     |
| fetchOptions       | `object`                  |                              | Fetch request options                                            |
| **useVectorTiles** | `boolean`                 | `false`                      | **NEW** Enable smart vector tile detection with GeoJSON fallback |
| **useBoundingBox** | `boolean`                 | `true`                       | **NEW** Enable viewport-based data loading for performance       |


### Smart Vector Tile Detection

The FeatureService automatically detects if vector tiles are available for the service and falls back to GeoJSON if not:

```typescript
const service = new FeatureService('smart-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  useVectorTiles: true, // Automatically detects vector tile support
  useBoundingBox: true, // Optimize with viewport filtering
  where: "STATUS = 'Active'",
  outFields: '*',
});

// The service will:
// 1. Check for VectorTileServer endpoint
// 2. Test various URL patterns
// 3. Fall back to GeoJSON if vector tiles unavailable
// 4. Log the decision process to console
```

### Bounding Box Filtering

Optimize performance by only loading features in the current viewport:

```typescript
const optimizedService = new FeatureService('big-dataset-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  useBoundingBox: true, // Only load features in viewport
  maxRecordCount: 1000, // Limit records per request
  where: 'STATUS = "Active"', // Server-side filtering
  outFields: ['OBJECTID', 'NAME', 'STATUS'], // Limit fields
});

// Automatically updates when map moves
map.on('moveend', () => {
  // Service automatically refreshes with new bbox
});
```

## Methods

| Method                              | Returns                              | Description                           |
| ----------------------------------- | ------------------------------------ | ------------------------------------- |
| `query(options?)`                   | `Promise<GeoJSON.FeatureCollection>` | Query features with custom parameters |
| `updateQuery(options)`              | `void`                               | Update query parameters and refresh   |
| `refresh()`                         | `void`                               | Refresh data from service             |
| `setBoundingBox(enabled)`           | `void`                               | Enable/disable bounding box filtering |
| `identify(lngLat, returnGeometry?)` | `Promise<IdentifyResult[]>`          | Identify features at point            |
| `remove()`                          | `void`                               | Remove service and clean up resources |

## Editing Methods

Methods for creating, updating, and deleting features on editable Feature Services.

### `addFeatures(features, options?)`

Add new features to the service.

| Parameter | Type | Description |
|-----------|------|-------------|
| features | `GeoJSON.Feature[]` | Features to add |
| options | `{ gdbVersion?: string }` | Optional geodatabase version |

**Returns:** `Promise<EditResult[]>`

### `updateFeatures(features, options?)`

Update existing features.

| Parameter | Type | Description |
|-----------|------|-------------|
| features | `GeoJSON.Feature[]` | Features to update (must include OBJECTID) |
| options | `{ gdbVersion?: string }` | Optional geodatabase version |

**Returns:** `Promise<EditResult[]>`

### `deleteFeatures(params)`

Delete features by object IDs or WHERE clause.

| Parameter | Type | Description |
|-----------|------|-------------|
| params.objectIds | `number[]` | Object IDs to delete |
| params.where | `string` | SQL WHERE clause to select features for deletion |

**Returns:** `Promise<EditResult[]>`

### `applyEdits(edits, options?)`

Apply batch edits (add, update, and delete in a single request).

| Parameter | Type | Description |
|-----------|------|-------------|
| edits.adds | `GeoJSON.Feature[]` | Features to add |
| edits.updates | `GeoJSON.Feature[]` | Features to update |
| edits.deletes | `number[]` | Object IDs to delete |
| options | `{ gdbVersion?: string }` | Optional geodatabase version |

**Returns:** `Promise<ApplyEditsResult>`

## Attachment Methods

### `queryAttachments(objectId, options?)`

Query attachments for a feature.

| Parameter | Type | Description |
|-----------|------|-------------|
| objectId | `number` | Object ID of the feature |

**Returns:** `Promise<AttachmentInfo[]>`

### `addAttachment(objectId, file, fileName?)`

Add an attachment to a feature.

| Parameter | Type | Description |
|-----------|------|-------------|
| objectId | `number` | Object ID of the feature |
| file | `Blob \| File` | The file to attach |
| fileName | `string` | Optional file name |

**Returns:** `Promise<EditResult>`

### `deleteAttachments(objectId, attachmentIds)`

Delete attachments from a feature.

| Parameter | Type | Description |
|-----------|------|-------------|
| objectId | `number` | Object ID of the feature |
| attachmentIds | `number[]` | IDs of attachments to delete |

**Returns:** `Promise<EditResult[]>`

## Events

### `on(event, callback)` / `off(event, callback)`

Listen for service events.

| Event | Description |
|-------|-------------|
| `authenticationrequired` | Fired when the service receives a 498/499 auth error |

```typescript
service.on('authenticationrequired', async (error) => {
  // Handle token refresh
  const newToken = await refreshToken();
  service.setToken(newToken);
});
```
