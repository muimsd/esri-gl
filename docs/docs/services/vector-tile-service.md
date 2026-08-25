# VectorTileService

High-performance vector tiles from ArcGIS Vector Tile Services. Crisp rendering at all zoom levels, client-side styling, and queryable features.

## Live Demo

<iframe
  src="/examples/vector-tile-service.html"
  width="100%"
  height="500px"
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="VectorTileService Demo">
</iframe>

*Interactive demo showing scalable vector tiles with dynamic layer addition and removal controls.*

## Quick Start

```bash
npm install esri-gl maplibre-gl
```

```typescript
import { VectorTileService } from 'esri-gl';

const service = new VectorTileService('parcels-source', map, {
  url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer'
});

const style = await service.getStyle();
map.addLayer({
  id: 'parcels-layer',
  ...style // { type, source, 'source-layer', layout, paint }
});
```

`getStyle()` returns the **first** layer of the service's style document, with `source` already set
to this service's source id. For full fidelity, fetch the style document yourself and add every
layer it defines.

## Constructor

```typescript
new VectorTileService(id, map, esriServiceOptions, vectorSourceOptions?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique source ID for MapLibre |
| `map` | `Map` | MapLibre map instance |
| `esriServiceOptions` | `object` | Service configuration (see below) |
| `vectorSourceOptions` | `object` | Optional MapLibre vector source overrides (see below) |

## Service Options (`esriServiceOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | ArcGIS VectorTileServer URL, or an ArcGIS [portal item id](../guides/portal-items) |
| `portal` | `string` | — | Portal sharing REST URL used to resolve an item id `url` (defaults to ArcGIS Online) |
| `getAttributionFromService` | `boolean` | `true` | Fetch copyright text from service metadata |
| `token` | `string` | — | ArcGIS authentication token |
| `apiKey` | `string` | — | ArcGIS Location Platform API key (sent as the `token` parameter) |
| `authentication` | `IAuthenticationManager \| string` | — | ArcGIS REST JS auth manager (preferred for OAuth/user sign-in) |
| `fetchOptions` | `object` | — | Deprecated — no longer forwarded to requests; use `authentication` instead. |

> Authentication runs on [ArcGIS REST JS](https://github.com/Esri/arcgis-rest-js). See the [Authentication guide](../guides/authentication) for tokens, API keys, and auth managers.

## Vector Source Options (`vectorSourceOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minzoom` | `number` | `0` | Minimum zoom level |
| `maxzoom` | `number` | `22` | Maximum zoom level |
| `bounds` | `[number, number, number, number]` | — | Extent the source covers |
| `scheme` | `'xyz' \| 'tms'` | `'xyz'` | Tile addressing scheme |
| `attribution` | `string` | — | Custom attribution text |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getStyle()` | `Promise<StyleData>` | The first layer of the service's style document, re-pointed at this source |
| `getMetadata()` | `Promise<ServiceMetadata>` | Fetches (and caches) the service metadata document |
| `update()` | `void` | No-op — vector tile sources don't need dynamic updates |
| `remove()` | `void` | Removes the service source and its layers from the map |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `sourceReady` | `Promise<void>` | Resolves once the source has been added to the map (deferred when `url` is a portal item id) |
| `defaultStyle` | `StyleData` | The mapped style layer — only valid after `getStyle()` resolves |

## Examples

### Custom Styling
```typescript
map.addLayer({
  id: 'custom-parcels',
  type: 'fill',
  source: 'parcels-source',
  'source-layer': 'Santa_Monica_Mountains_Parcels',
  paint: {
    'fill-color': '#ff6b6b',
    'fill-opacity': 0.7,
    'fill-outline-color': '#fff'
  }
});
```

### Feature Queries
```typescript
map.on('click', 'parcels-layer', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['parcels-layer']
  });

  if (features.length > 0) {
    console.log('Feature properties:', features[0].properties);
  }
});
```

### Style Updates
```typescript
map.setPaintProperty('parcels-layer', 'fill-color', '#4CAF50');
map.setPaintProperty('parcels-layer', 'fill-opacity', 0.8);
```
