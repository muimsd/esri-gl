# TiledMapService

Pre-rendered cached map tiles from ArcGIS Tiled Map Services. Fast performance, consistent styling, ideal for basemaps.

## Live Demo

<iframe
  src="/examples/tiled-map-service.html"
  width="100%"
  height="500px"
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="TiledMapService Demo">
</iframe>

*Interactive demo showing pre-rendered cached map tiles with layer visibility controls.*

## Quick Start

```bash
npm install esri-gl maplibre-gl
```

```typescript
import { TiledMapService } from 'esri-gl';

const service = new TiledMapService('topo-source', map, {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
});

map.addLayer({
  id: 'topo-layer',
  type: 'raster',
  source: 'topo-source'
});
```

## Constructor

```typescript
new TiledMapService(id, map, esriServiceOptions, rasterSourceOptions?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique source ID for MapLibre |
| `map` | `Map` | MapLibre map instance |
| `esriServiceOptions` | `object` | Service configuration (see below) |
| `rasterSourceOptions` | `object` | Optional MapLibre raster source overrides |

## Options (`esriServiceOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | ArcGIS MapServer URL |
| `fetchOptions` | `object` | — | Custom fetch options (headers, etc.) |
| `token` | `string` | — | ArcGIS authentication token |
| `getAttributionFromService` | `boolean` | `true` | Fetch copyright text from service metadata |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getMetadata()` | `Promise<ServiceMetadata>` | Fetches service metadata (tile info, extent, attribution) |
| `setToken(token)` | `void` | Updates the authentication token |

## Examples

### Opacity Control
```typescript
map.setPaintProperty('topo-layer', 'raster-opacity', 0.5);
```

### Layer Visibility
```typescript
map.setLayoutProperty('topo-layer', 'visibility', 'none');    // Hide
map.setLayoutProperty('topo-layer', 'visibility', 'visible'); // Show
```

### Service Information
```typescript
const info = await service.getServiceInfo();
console.log(info.tileInfo);      // Tile scheme information
console.log(info.fullExtent);    // Service extent
console.log(info.copyrightText); // Attribution text
```
