# Layers Overview

Layers in esri-gl provide the foundation for rendering different types of map content. They work in conjunction with Services to manage data sources and rendering.

## Available Layers

### BasemapLayer
Base layer for styling and managing basemap content.

```typescript
import { BasemapLayer } from 'esri-gl'

const basemapLayer = new BasemapLayer('basemap-id', map, {
  // Configuration options
})
```

### DynamicMapLayer  
Layer for rendering dynamic map services with server-side rendering.

```typescript
import { DynamicMapLayer } from 'esri-gl'

const dynamicLayer = new DynamicMapLayer('dynamic-id', map, {
  // Configuration options
})
```

### RasterLayer
Layer for displaying raster data sources including tiles and images.

```typescript
import { RasterLayer } from 'esri-gl'

const rasterLayer = new RasterLayer('raster-id', map, {
  // Configuration options  
})
```

### Layer (Base Class)
The base class that all other layers extend from, providing common functionality.

```typescript
import { Layer } from 'esri-gl'

// Typically used for extending custom layers
class CustomLayer extends Layer {
  // Custom implementation
}
```

## Common Methods

All layers inherit common methods from the base `Layer` class:

- `remove()` - Remove the layer from the map
- `show()` - Make the layer visible
- `hide()` - Hide the layer
- `setOpacity(opacity: number)` - Set layer opacity (0-1)

## Usage Patterns

### With Services
Layers are typically used in conjunction with Services:

```typescript
import { DynamicMapService } from 'esri-gl'

// Service creates the source and manages data
const service = new DynamicMapService('service-id', map, {
  url: 'https://example.com/MapServer'
})

// Add a layer that uses the service source
map.addLayer({
  id: 'layer-id',
  type: 'raster',
  source: 'service-id'
})
```

### Standalone Usage
Some layers can be used independently:

```typescript
import { RasterLayer } from 'esri-gl'

const layer = new RasterLayer('standalone-id', map, {
  tiles: ['https://example.com/{z}/{x}/{y}.png'],
  tileSize: 256
})
```