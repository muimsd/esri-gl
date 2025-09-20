# BasemapLayer

The `BasemapLayer` provides functionality for managing basemap styling and configuration.

## Constructor

```typescript
new BasemapLayer(id: string, map: Map, options: BasemapLayerOptions)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for the layer |
| `map` | `Map` | MapLibre GL JS or Mapbox GL JS map instance |
| `options` | `BasemapLayerOptions` | Configuration options |

### Options

```typescript
interface BasemapLayerOptions {
  style?: string | StyleSpecification
  attribution?: string
  opacity?: number
  visible?: boolean
}
```

## Methods

### `setStyle(style: string | StyleSpecification)`
Update the basemap style.

```typescript
basemapLayer.setStyle('mapbox://styles/mapbox/streets-v11')
```

### `setOpacity(opacity: number)`
Set the layer opacity (0-1).

```typescript
basemapLayer.setOpacity(0.8)
```

### `show()` / `hide()`
Control layer visibility.

```typescript
basemapLayer.hide()
basemapLayer.show()
```

### `remove()`
Remove the layer from the map.

```typescript
basemapLayer.remove()
```

## Example

```typescript
import { BasemapLayer } from 'esri-gl'
import maplibregl from 'maplibre-gl'

const map = new maplibregl.Map({
  container: 'map',
  center: [-74.5, 40],
  zoom: 9
})

const basemapLayer = new BasemapLayer('basemap', map, {
  style: {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256
      }
    },
    layers: [{
      id: 'osm',
      type: 'raster', 
      source: 'osm'
    }]
  },
  opacity: 1.0,
  visible: true
})
```