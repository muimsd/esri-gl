# DynamicMapLayer

The `DynamicMapLayer` is designed to work with ArcGIS Dynamic Map Services, providing server-side rendering capabilities.

## Constructor

```typescript
new DynamicMapLayer(id: string, map: Map, options: DynamicMapLayerOptions)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for the layer |
| `map` | `Map` | MapLibre GL JS or Mapbox GL JS map instance |
| `options` | `DynamicMapLayerOptions` | Configuration options |

### Options

```typescript
interface DynamicMapLayerOptions {
  url?: string
  layers?: number[]
  layerDefs?: { [key: number]: string }
  format?: 'png' | 'png8' | 'png24' | 'jpg' | 'pdf' | 'bmp' | 'gif' | 'svg'
  transparent?: boolean
  time?: number | [number, number]
  dpi?: number
  bbox?: [number, number, number, number]
  size?: [number, number]
  imageSR?: number
  opacity?: number
  visible?: boolean
}
```

## Methods

### `setLayerDefinitions(layerDefs: { [key: number]: string })`
Set definition expressions for specific layers.

```typescript
dynamicLayer.setLayerDefinitions({
  0: "STATE_NAME = 'California'",
  1: "POPULATION > 100000"
})
```

### `setVisibleLayers(layers: number[])`
Control which layers are visible.

```typescript
dynamicLayer.setVisibleLayers([0, 2, 5])
```

### `setTime(time: number | [number, number])`
Set time filter for time-enabled services.

```typescript
// Single time
dynamicLayer.setTime(1609459200000)

// Time range
dynamicLayer.setTime([1609459200000, 1640995200000])
```

### `refresh()`
Force refresh the layer imagery.

```typescript
dynamicLayer.refresh()
```

### `identify(lngLat: LngLat, options?: IdentifyOptions)`
Perform identify operation at a point.

```typescript
const results = await dynamicLayer.identify(
  { lng: -118.2437, lat: 34.0522 },
  {
    tolerance: 3,
    returnGeometry: true,
    layers: 'all'
  }
)
```

## Example

```typescript
import { DynamicMapLayer } from 'esri-gl'
import maplibregl from 'maplibre-gl'

const map = new maplibregl.Map({
  container: 'map',
  center: [-95, 39],
  zoom: 4
})

map.on('load', () => {
  const dynamicLayer = new DynamicMapLayer('census', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
    layers: [0, 1, 2],
    layerDefs: {
      0: "STATE_NAME IN ('California', 'Nevada', 'Arizona')"
    },
    format: 'png24',
    transparent: true,
    opacity: 0.8
  })

  // Add click handler for identify
  map.on('click', async (e) => {
    const results = await dynamicLayer.identify(e.lngLat, {
      tolerance: 5,
      returnGeometry: true
    })
    console.log('Identify results:', results)
  })
})
```

## Working with Services

The `DynamicMapLayer` is typically used alongside `DynamicMapService`:

```typescript
import { DynamicMapService } from 'esri-gl'

// Service manages the data source
const service = new DynamicMapService('service-id', map, {
  url: 'https://example.com/MapServer'
})

// Layer handles the rendering
const layer = new DynamicMapLayer('layer-id', map, {
  url: 'https://example.com/MapServer',
  layers: [0, 1],
  format: 'png24'
})
```