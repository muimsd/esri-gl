# React Hooks

React hooks for managing Esri service lifecycle and running spatial tasks. All hooks handle loading state, error handling, and cleanup automatically.

## Service Hooks

These hooks create and manage Esri service instances tied to a map. They all return `{ service, loading, error, reload }`.

### useEsriService

Base hook for managing any Esri service lifecycle. Used internally by all other service hooks.

| Parameter | Type | Description |
|-----------|------|-------------|
| createService | `(map: Map) => T` | Factory function to create a service instance |
| map | `Map \| null` | MapLibre GL or Mapbox GL map instance |

**Returns:** `UseEsriServiceResult<T>`

| Property | Type | Description |
|----------|------|-------------|
| service | `T \| null` | The service instance |
| loading | `boolean` | Whether the service is initializing |
| error | `Error \| null` | Any error during creation |
| reload | `() => void` | Recreate the service |

```tsx
const { service, loading, error } = useEsriService(
  (map) => new DynamicMapService('my-source', map, { url: serviceUrl }),
  map
);
```

### useDynamicMapService

Hook for [DynamicMapService](/docs/api/dynamic-map-service). Automatically updates `layers` and `layerDefs` when options change without recreating the service.

| Parameter | Type | Description |
|-----------|------|-------------|
| sourceId | `string` | Source ID for the map |
| map | `Map \| null` | Map instance |
| options | `EsriServiceOptions` | Service options including `url`, `layers`, `layerDefs`, etc. |
| sourceOptions | `Record<string, unknown>` | Optional raster source options |

**Returns:** `UseEsriServiceResult<DynamicMapService>`

```tsx
const { service, loading } = useDynamicMapService({
  sourceId: 'demographics',
  map,
  options: { url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer' },
});
```

### useTiledMapService

Hook for [TiledMapService](/docs/api/tiled-map-service).

| Parameter | Type | Description |
|-----------|------|-------------|
| sourceId | `string` | Source ID for the map |
| map | `Map \| null` | Map instance |
| options | `EsriServiceOptions` | Service options including `url` |
| sourceOptions | `Record<string, unknown>` | Optional raster source options |

**Returns:** `UseEsriServiceResult<TiledMapService>`

```tsx
const { service } = useTiledMapService({
  sourceId: 'basemap',
  map,
  options: { url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer' },
});
```

### useImageService

Hook for [ImageService](/docs/api/image-service).

| Parameter | Type | Description |
|-----------|------|-------------|
| sourceId | `string` | Source ID for the map |
| map | `Map \| null` | Map instance |
| options | `ImageServiceOptions` | Service options including `url`, `renderingRule`, `mosaicRule` |
| sourceOptions | `Record<string, unknown>` | Optional raster source options |

**Returns:** `UseEsriServiceResult<ImageService>`

```tsx
const { service } = useImageService({
  sourceId: 'elevation',
  map,
  options: { url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover/ImageServer' },
});
```

### useFeatureService

Hook for [FeatureService](/docs/api/feature-service).

| Parameter | Type | Description |
|-----------|------|-------------|
| sourceId | `string` | Source ID for the map |
| map | `Map \| null` | Map instance |
| options | `FeatureServiceOptions` | Service options including `url`, `where`, `outFields` |
| sourceOptions | `Record<string, unknown>` | Optional GeoJSON source options |

**Returns:** `UseEsriServiceResult<FeatureService>`

```tsx
const { service } = useFeatureService({
  sourceId: 'parcels',
  map,
  options: {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3',
    where: "STATE_NAME='California'",
  },
});
```

### useVectorTileService

Hook for [VectorTileService](/docs/api/vector-tile-service).

| Parameter | Type | Description |
|-----------|------|-------------|
| sourceId | `string` | Source ID for the map |
| map | `Map \| null` | Map instance |
| options | `VectorTileServiceOptions` | Service options including `url` |
| sourceOptions | `Record<string, unknown>` | Optional source options |

**Returns:** `UseEsriServiceResult<VectorTileService>`

```tsx
const { service } = useVectorTileService({
  sourceId: 'vtiles',
  map,
  options: { url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer' },
});
```

### useVectorBasemapStyle

Hook for [VectorBasemapStyle](/docs/api/vector-basemap-style). Uses a different constructor signature — no `sourceId` or `map` required.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| options.basemapEnum | `string` | `'arcgis/streets'` | Basemap style enum |
| options.token | `string` | | Authentication token |
| options.apiKey | `string` | | API key |
| options.language | `string` | | Label language |
| options.worldview | `string` | | Worldview |

**Returns:** `UseEsriServiceResult<VectorBasemapStyle>`

```tsx
const { service } = useVectorBasemapStyle({
  options: { basemapEnum: 'arcgis/navigation', token: 'YOUR_TOKEN' },
});
```

## Task Hooks

These hooks wrap spatial tasks with loading/error state management.

### useIdentifyFeatures

Hook for running [IdentifyFeatures](/docs/api/identify-features) tasks.

| Parameter | Type | Description |
|-----------|------|-------------|
| url | `string` | MapService URL |
| tolerance | `number` | Pixel tolerance for identify |
| returnGeometry | `boolean` | Include geometry in results |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| identify | `(point, additionalOptions?) => Promise<IdentifyResult>` | Run identify at a point |
| loading | `boolean` | Whether a request is in progress |
| error | `Error \| null` | Any error from the last request |

The `identify` function accepts a `{ lng, lat }` point and optional additional options including `{ map }` to scope results to the current map extent.

```tsx
const { identify, loading, error } = useIdentifyFeatures({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
  tolerance: 3,
  returnGeometry: true,
});

const results = await identify({ lng: -118.24, lat: 34.05 }, { map });
```

### useIdentifyImage

Hook for running [IdentifyImage](/docs/api/identify-image) tasks on image services.

| Parameter | Type | Description |
|-----------|------|-------------|
| url | `string` | ImageService URL |
| token | `string` | Optional authentication token |
| returnGeometry | `boolean` | Include geometry in results |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| identifyImage | `(point, additionalOptions?) => Promise<IdentifyImageResult>` | Run identify at a point |
| loading | `boolean` | Whether a request is in progress |
| error | `Error \| null` | Any error from the last request |

```tsx
const { identifyImage, loading } = useIdentifyImage({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover/ImageServer',
});

const result = await identifyImage({ lng: -118.24, lat: 34.05 });
```

### useQuery

Hook for running [Query](/docs/api/query) tasks with pagination support.

| Parameter | Type | Description |
|-----------|------|-------------|
| url | `string` | Feature layer URL |
| where | `string` | SQL WHERE clause |
| outFields | `string \| string[]` | Fields to return |
| returnGeometry | `boolean` | Include geometry in results |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| query | `(additionalOptions?) => Promise<QueryResult>` | Run a single-page query |
| queryAll | `(additionalOptions?) => Promise<QueryResult>` | Run a paginated query (supports `maxPages`) |
| loading | `boolean` | Whether a request is in progress |
| error | `Error \| null` | Any error from the last request |

```tsx
const { query, queryAll, loading } = useQuery({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3',
  where: "STATE_NAME='California'",
  outFields: ['STATE_NAME', 'POP2000'],
  returnGeometry: false,
});

const page = await query();
const all = await queryAll({ maxPages: 5 });
```

### useFind

Hook for running [Find](/docs/api/find) tasks to search across multiple layers.

| Parameter | Type | Description |
|-----------|------|-------------|
| url | `string` | MapService URL |
| searchText | `string` | Text to search for |
| layers | `string \| number[]` | Layer IDs to search |
| searchFields | `string \| string[]` | Fields to search in |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| find | `(additionalOptions?) => Promise<FindResult>` | Run the find operation |
| loading | `boolean` | Whether a request is in progress |
| error | `Error \| null` | Any error from the last request |

```tsx
const { find, loading } = useFind({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
  searchText: 'California',
  layers: [2, 3],
  searchFields: ['STATE_NAME'],
});

const results = await find();
```

### useFeatureEditing

Hook for editing features on a [FeatureService](/docs/api/feature-service).

| Parameter | Type | Description |
|-----------|------|-------------|
| service | `FeatureService \| null` | The FeatureService instance to edit |

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| addFeatures | `(features, options?) => Promise<EditResult[]>` | Add new features |
| updateFeatures | `(features, options?) => Promise<EditResult[]>` | Update existing features |
| deleteFeatures | `(params) => Promise<EditResult[]>` | Delete features by IDs or WHERE clause |
| applyEdits | `(edits, options?) => Promise<ApplyEditsResult>` | Batch add/update/delete in one call |
| loading | `boolean` | Whether an edit is in progress |
| error | `Error \| null` | Any error from the last edit |
| lastResult | `EditResult[] \| ApplyEditsResult \| null` | Result of the last edit operation |

```tsx
const { service } = useFeatureService({ sourceId: 'parcels', map, options: { url: featureUrl } });
const { addFeatures, deleteFeatures, loading } = useFeatureEditing(service);

await addFeatures([{ type: 'Feature', geometry: { type: 'Point', coordinates: [-118, 34] }, properties: { name: 'New' } }]);
await deleteFeatures({ objectIds: [42] });
```

## Context

### EsriServiceProvider

Context provider for sharing a map instance with child Esri components.

```tsx
import { EsriServiceProvider } from 'esri-gl/react';

function App() {
  const [map, setMap] = useState(null);
  return (
    <EsriServiceProvider map={map}>
      <MapView onLoad={setMap} />
      <LayerPanel />
    </EsriServiceProvider>
  );
}
```

### useEsriMap

Hook to access the map instance from `EsriServiceProvider`.

**Returns:** `Map | null`

```tsx
const map = useEsriMap();
```

### EsriLayer

Generic layer component that adds a MapLibre GL layer to the map. Must be used within `EsriServiceProvider`.

| Prop | Type | Description |
|------|------|-------------|
| sourceId | `string` | Source to use for the layer |
| layerId | `string` | Unique layer ID |
| type | `string` | Layer type: `'raster'`, `'fill'`, `'line'`, `'symbol'`, `'circle'`, etc. |
| paint | `Record<string, unknown>` | Paint properties |
| layout | `Record<string, unknown>` | Layout properties |
| beforeId | `string` | Insert layer before this layer ID |

```tsx
<EsriServiceProvider map={map}>
  <EsriLayer sourceId="parcels" layerId="parcels-fill" type="fill" paint={{ 'fill-color': '#0080ff', 'fill-opacity': 0.3 }} />
</EsriServiceProvider>
```
