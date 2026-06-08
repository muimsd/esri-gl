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

### Authentication

esri-gl runs every ArcGIS request through the official
[ArcGIS REST JS](https://github.com/Esri/arcgis-rest-js) client. Pass a `token`, an
`apiKey`, or an `authentication` manager to any service or task:

```typescript
import { DynamicMapService, ArcGISIdentityManager } from 'esri-gl';

new DynamicMapService('source', map, { url, apiKey: 'AAPK…' });

const session = await ArcGISIdentityManager.signIn({ username, password });
new DynamicMapService('source', map, { url, authentication: session });
```

See the [Authentication guide](./guides/authentication) for details.

### Resolve from a Portal item

You can also resolve an ArcGIS portal item id — or a whole Web Map — directly to services:

```typescript
import { serviceFromPortalItem } from 'esri-gl';

await serviceFromPortalItem('usa-source', map, 'PORTAL_ITEM_ID', { apiKey: 'AAPK…' });
map.addLayer({ id: 'usa-layer', type: 'raster', source: 'usa-source' });
```

See the [Portal Items guide](./guides/portal-items).

### CDN Usage

Load the package via CDN:

```html
<script src="https://unpkg.com/esri-gl/dist/index.umd.js"></script>
```

```javascript
new esrigl.DynamicMapService('usa-source', map, {
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

map.addLayer({
  id: 'usa-layer',
  type: 'raster',
  source: 'usa-source',
});
```

## What's Next?

- [Authentication](./guides/authentication) — Tokens, API keys, and auth managers
- [Portal Items](./guides/portal-items) — Resolve item ids and Web Maps to services
- [Services](./services/overview) — Core service classes and API reference
- [Tasks](./tasks/overview) — Identify, Query, and Find operations
- [Examples](./examples/html-viewer) — Interactive demos and code samples
