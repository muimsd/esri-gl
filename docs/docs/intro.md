---
sidebar_position: 1
---

# esri-map-gl Documentation

A TypeScript library that bridges Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS, replicating Esri Leaflet's architecture patterns.

## Quick Start

esri-map-gl helps you create `sources` for use within MapLibre GL JS and Mapbox GL JS. It supports a range of raster and vector datasources provided by the Esri/ArcGIS ecosystem.

### Installation

```bash
npm install esri-map-gl
```

### Basic Usage

Import the desired service class and create sources that are automatically added to your map:

```typescript
import { TiledMapService } from 'esri-map-gl'

// Create the source
new TiledMapService('imagery-source', map, {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
})

// Add it as a layer to your map
map.addLayer({
    id: 'imagery-layer',
    type: 'raster',
    source: 'imagery-source'
})
```

### CDN Usage

Load the package via CDN:

```html
<script src="https://unpkg.com/esri-map-gl/dist/esri-map-gl.js"></script>
```

```javascript
new esriMapGL.TiledMapService('imagery-source', map, {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
})

map.addLayer({
    id: 'imagery-layer',
    type: 'raster',
    source: 'imagery-source'
})
```

## What's Next?

- 📚 [Learn about Services](./services/overview) - Core service classes
- 🎯 [Explore Examples](./examples/basic) - Interactive demos  
- 🔧 [API Reference](./api/dynamic-map-service) - Detailed documentation
