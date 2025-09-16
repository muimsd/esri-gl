# TiledMapService

For accessing [ArcGIS Tiled Map Services](https://developers.arcgis.com/rest/services-reference/map-service.htm) that provide pre-cached raster tiles.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the MapLibre GL source |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Esri MapService (see below) |
| rasterSourceOptions | `object` | Optional MapLibre GL raster source options |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the Tiled MapService |
| fetchOptions | `object` | | Options for fetch requests (headers, etc.) |
| token | `string` | | Authentication token if required |
| getAttributionFromService | `boolean` | `true` | Retrieve attribution from service metadata |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getMetadata()` | `Promise<ServiceMetadata>` | Fetch service metadata |

## Basic Example

```typescript
import { TiledMapService } from 'esri-map-gl'

// World Imagery basemap
const imageryService = new TiledMapService('imagery-source', map, {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
})

map.addLayer({
    id: 'imagery-layer',
    type: 'raster',
    source: 'imagery-source'
})
```

## Street Map Example

```typescript
// World Street Map
const streetService = new TiledMapService('street-source', map, {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
})

map.addLayer({
    id: 'street-layer',
    type: 'raster',
    source: 'street-source'
})
```

## Authenticated Service

```typescript
// Private tiled service requiring authentication
const privateService = new TiledMapService('private-source', map, {
    url: 'https://myserver.com/arcgis/rest/services/Private/MapServer',
    token: 'your-auth-token',
    fetchOptions: {
        headers: {
            'Authorization': 'Bearer your-token'
        }
    }
})

map.addLayer({
    id: 'private-layer', 
    type: 'raster',
    source: 'private-source'
})
```

## Custom Tile Options

```typescript
// Custom raster source options
const customService = new TiledMapService('custom-source', map, {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
}, {
    // MapLibre GL raster source options
    tileSize: 256,
    maxzoom: 18,
    attribution: 'Custom attribution'
})

map.addLayer({
    id: 'custom-layer',
    type: 'raster', 
    source: 'custom-source',
    paint: {
        'raster-opacity': 0.8
    }
})
```

## Comparison with DynamicMapService

| Feature | TiledMapService | DynamicMapService |
|---------|-----------------|-------------------|
| **Performance** | ⚡ Fast (pre-cached) | 🐌 Slower (server-rendered) |
| **Customization** | ❌ Fixed styling | ✅ Dynamic styling |
| **Layer Control** | ❌ All layers | ✅ Individual layers |
| **Real-time Data** | ❌ Cached data | ✅ Live data |
| **Bandwidth** | 💾 Lower | 📡 Higher |

## When to Use

**Use TiledMapService when:**
- You need fast performance and smooth panning/zooming
- Data doesn't change frequently 
- You want to use the service as a basemap
- Bandwidth is a concern

**Use DynamicMapService when:**
- You need real-time data updates
- You want to control individual layers
- You need custom styling or filtering
- Data changes frequently