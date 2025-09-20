# RasterLayer

The `RasterLayer` handles raster data sources including tiles, images, and other raster formats.

## Constructor

```typescript
new RasterLayer(id: string, map: Map, options: RasterLayerOptions)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for the layer |
| `map` | `Map` | MapLibre GL JS or Mapbox GL JS map instance |
| `options` | `RasterLayerOptions` | Configuration options |

### Options

```typescript
interface RasterLayerOptions {
  tiles?: string[]
  tileSize?: number
  url?: string
  coordinates?: [[number, number], [number, number], [number, number], [number, number]]
  attribution?: string
  minzoom?: number
  maxzoom?: number
  opacity?: number
  visible?: boolean
}
```

## Methods

### `setTiles(tiles: string[])`
Update the tile URL templates.

```typescript
rasterLayer.setTiles([
  'https://server1.example.com/{z}/{x}/{y}.png',
  'https://server2.example.com/{z}/{x}/{y}.png'
])
```

### `setOpacity(opacity: number)`
Set the layer opacity (0-1).

```typescript
rasterLayer.setOpacity(0.7)
```

### `setBounds(coordinates: [[number, number], [number, number], [number, number], [number, number]])`
Set the bounds for an image source.

```typescript
rasterLayer.setBounds([
  [-180, 85.051129],  // top-left
  [180, 85.051129],   // top-right  
  [180, -85.051129],  // bottom-right
  [-180, -85.051129]  // bottom-left
])
```

### `refresh()`
Force refresh the layer tiles.

```typescript
rasterLayer.refresh()
```

## Examples

### Tile-based Raster

```typescript
import { RasterLayer } from 'esri-gl'
import maplibregl from 'maplibre-gl'

const map = new maplibregl.Map({
  container: 'map',
  center: [0, 0],
  zoom: 2
})

map.on('load', () => {
  const satelliteLayer = new RasterLayer('satellite', map, {
    tiles: [
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    tileSize: 256,
    attribution: 'Esri, Maxar, GeoEye, Earthstar Geographics',
    minzoom: 0,
    maxzoom: 19,
    opacity: 1.0
  })
})
```

### Image-based Raster

```typescript
import { RasterLayer } from 'esri-gl'

const imageLayer = new RasterLayer('weather-radar', map, {
  url: 'https://example.com/weather-overlay.png',
  coordinates: [
    [-80.425, 46.437], // top-left
    [-71.516, 46.437], // top-right
    [-71.516, 37.936], // bottom-right
    [-80.425, 37.936]  // bottom-left
  ],
  opacity: 0.8
})
```

### With Attribution

```typescript
const terrainLayer = new RasterLayer('terrain', map, {
  tiles: ['https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png'],
  tileSize: 256,
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>',
  maxzoom: 18
})
```

## Working with Services

The `RasterLayer` can work with various raster services:

```typescript
import { TiledMapService, ImageService } from 'esri-gl'

// With TiledMapService
const tiledService = new TiledMapService('tiled-source', map, {
  url: 'https://example.com/MapServer'
})

// With ImageService  
const imageService = new ImageService('image-source', map, {
  url: 'https://example.com/ImageServer'
})

// RasterLayer can display either
const rasterLayer = new RasterLayer('display', map, {
  // Configuration depends on the service type
})
```