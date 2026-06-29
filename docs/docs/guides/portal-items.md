# Portal Items & Web Maps

esri-gl can load layers from an ArcGIS **portal item id** as well as a service URL, so you
don't have to know the underlying service URL. This is powered by
[`@esri/arcgis-rest-portal`](https://github.com/Esri/arcgis-rest-js).

## Pass an item id as the service `url`

Every service accepts a portal **item id** (a 32-character hex string) anywhere it accepts a
service `url`. When the `url` is an item id, esri-gl fetches the item, resolves it to the
underlying service URL, and then creates the source — no separate code path required. This
works for the service classes, their [React hooks](../react/hooks), and the
[react-map-gl components](../react/react-map-gl).

```typescript
import { DynamicMapService } from 'esri-gl';

// `url` is a portal item id instead of a full MapServer URL
const service = new DynamicMapService('my-source', map, {
  url: 'd5e02a0c1f2b4ec399823fdd3c2fdebd',
  apiKey: 'AAPK…',
});

// The source is added once the id resolves:
await service.sourceReady;
map.addLayer({ id: 'my-layer', type: 'raster', source: 'my-source' });
```

Because you choose the service class (or hook / component), the **service type is explicit**.
Notes:

- `sourceReady` resolves once the source has been added — synchronously for a plain `url`, or
  after the id is resolved for an item id. (`FeatureService` always exposed this; it now exists
  on the raster and vector-tile services too.)
- Auth is the standard [authentication options](./authentication) (`token`, `apiKey`,
  `authentication`). Pass an optional `portal` (sharing REST URL, defaults to ArcGIS Online) for
  items on ArcGIS Enterprise.
- For a `FeatureService`, when the resolved item URL points at the service root, esri-gl targets
  sublayer `0` by default — pass `layerId` to choose another:
  `new FeatureService('src', map, { url: itemId, layerId: 2 })`.

You can call the resolver directly if you only need the URL:

```typescript
import { resolveServiceUrl, isPortalItemId } from 'esri-gl';

isPortalItemId('d5e02a0c1f2b4ec399823fdd3c2fdebd'); // → true
const url = await resolveServiceUrl('d5e02a0c1f2b4ec399823fdd3c2fdebd', { apiKey });
```

## Resolve a single item (auto-detect the type)

:::caution Deprecated
`serviceFromPortalItem` is deprecated. Prefer passing the item id as a service `url` (above)
when you know the service type. Reach for this helper only when the type must be **auto-detected**
from the item metadata.
:::

`serviceFromPortalItem(sourceId, map, itemId, options?)` fetches the item with `getItem`,
maps its `type` to the matching esri-gl service, constructs it, and adds its source to the map.

```typescript
import { serviceFromPortalItem } from 'esri-gl';

const { service, kind, url } = await serviceFromPortalItem(
  'my-source',
  map,
  'a1b2c3d4e5f6…', // portal item id
  { apiKey: 'AAPK…' }
);

map.addLayer({ id: 'my-layer', type: 'raster', source: 'my-source' });
```

The promise resolves to a `PortalServiceResult`:

| Field | Type | Description |
|-------|------|-------------|
| `service` | service instance | The constructed esri-gl service. |
| `kind` | `'dynamic' \| 'tiled' \| 'image' \| 'vector-tile' \| 'feature'` | Which service was created. |
| `sourceId` | `string` | The source id registered on the map. |
| `url` | `string` | The service URL the item resolved to. |
| `item` | `IItem` | The portal item metadata. |
| `title` | `string` | The item title. |

### Item type → service mapping

| Portal item type | esri-gl service |
|------------------|-----------------|
| `Feature Service` / `Feature Layer` | `FeatureService` |
| `Map Service` | `DynamicMapService` (or `TiledMapService` when the item is cached/tiled) |
| `Image Service` | `ImageService` |
| `Vector Tile Service` | `VectorTileService` |

For a multi-layer Feature Service whose item URL points at the service root, esri-gl targets
sublayer `0` by default — pass `layerId` to choose another:

```typescript
await serviceFromPortalItem('my-source', map, itemId, { apiKey, layerId: 2 });
```

### Options

`PortalItemServiceOptions` extends the auth options with:

| Option | Type | Description |
|--------|------|-------------|
| `portal` | `string` | Portal sharing REST URL (defaults to ArcGIS Online). |
| `layerId` | `number` | Feature Service sublayer to load (default `0`). |
| `serviceOptions` | `object` | Extra options merged into the constructed service. |
| `rasterSrcOptions` | `object` | Source options for Dynamic / Tiled / Image services. |
| `vectorSrcOptions` | `object` | Source options for the Vector Tile service. |
| `geojsonSourceOptions` | `object` | Source options for the Feature service. |

## Resolve a Web Map

`servicesFromWebMap(map, itemId, options?)` reads a Web Map's data with `getItemData` and
instantiates a service for **each** supported operational layer (optionally including the
basemap). Unsupported layer types are skipped.

```typescript
import { servicesFromWebMap } from 'esri-gl';

const layers = await servicesFromWebMap(map, 'webmap-item-id', {
  token: 'eyJ…',
  includeBasemap: false,
});

layers.forEach(({ service, kind, sourceId, title }) => {
  // add each service's source to the map as appropriate for its `kind`
  console.log(`${title} → ${kind} (${sourceId})`);
});
```

Each entry is a `PortalServiceResult` (without `item`). Source ids are generated as
`${prefix}-${layerId}` (the prefix defaults to the Web Map item id; override with
`sourceIdPrefix`).

### Web Map layer type → service mapping

| Operational layer `layerType` | esri-gl service |
|-------------------------------|-----------------|
| `ArcGISFeatureLayer` | `FeatureService` |
| `ArcGISMapServiceLayer` | `DynamicMapService` |
| `ArcGISTiledMapServiceLayer` | `TiledMapService` |
| `ArcGISImageServiceLayer` | `ImageService` |
| `VectorTileLayer` | `VectorTileService` |

### Options

`WebMapOptions` extends `PortalItemServiceOptions` with:

| Option | Type | Description |
|--------|------|-------------|
| `includeBasemap` | `boolean` | Also instantiate the Web Map's basemap layers (default `false`). |
| `sourceIdPrefix` | `string` | Prefix for generated source ids (default the Web Map item id). |
