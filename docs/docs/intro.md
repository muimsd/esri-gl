---
sidebar_position: 1
---

# Documentation

<iframe src="/examples/minimal-example.html" width="100%" height="400" frameBorder="0" style={{border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px'}}></iframe>

A TypeScript library that bridges Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS, replicating Esri Leaflet's architecture patterns.


## Quick Start

esri-gl helps you create `sources` for use within MapLibre GL JS and Mapbox GL JS. It supports a range of raster and vector datasources provided by the Esri/ArcGIS ecosystem.

### Installation

```bash
npm install esri-gl
```

### Basic Usage

Import the desired service class and create sources that are automatically added to your map:

```typescript
import { DynamicMapService } from 'esri-gl';

// Create the source
new DynamicMapService('usa-source', map, {
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

// Add it as a layer to your map
map.addLayer({
  id: 'usa-layer',
  type: 'raster',
  source: 'usa-source',
});
```

### CDN Usage

Load the package via CDN:

```html
<script src="https://unpkg.com/esri-gl/dist/esri-gl.js"></script>
```

```javascript
new DynamicMapService('usa-source', map, {
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

map.addLayer({
  id: 'usa-layer',
  type: 'raster',
  source: 'usa-source',
});
```

## What's Next?

- 📚 [Learn about Services](./services/overview) - Core service classes
- 🎯 [Explore Examples](./examples/basic) - Interactive demos
- 🔧 [API Reference](./api/dynamic-map-service) - Detailed documentation
