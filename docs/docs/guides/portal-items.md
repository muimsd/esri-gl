# Portal Items & Web Maps

esri-gl can resolve an ArcGIS **portal item id** directly into a ready-to-render service,
so you don't have to know the underlying service URL. This is powered by
[`@esri/arcgis-rest-portal`](https://github.com/Esri/arcgis-rest-js) and supports two
shapes: a single-layer item, and a full Web Map.

Both helpers accept the standard [authentication options](./authentication) (`token`,
`apiKey`, or `authentication`) plus an optional `portal` (sharing REST URL, defaults to
ArcGIS Online).

## Resolve a single item

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
