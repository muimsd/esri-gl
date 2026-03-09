# esri-gl

A TypeScript library that bridges Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS.

[![npm version](https://badge.fury.io/js/esri-gl.svg)](https://badge.fury.io/js/esri-gl)
[![CI](https://github.com/muimsd/esri-gl/actions/workflows/ci.yml/badge.svg)](https://github.com/muimsd/esri-gl/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[Documentation](https://esri-gl.pages.dev/)** · **[Live Demos](https://esri-gl-demo.pages.dev/)** · **[npm](https://www.npmjs.com/package/esri-gl)**

## Features

### Services
- **DynamicMapService** — Server-rendered raster tiles with dynamic styling, filtering, labeling, and identify
- **TiledMapService** — Pre-cached tiles for fast basemaps
- **ImageService** — Analytical raster data with rendering rules and temporal support
- **FeatureService** — Vector data with smart vector tile detection, GeoJSON fallback, editing, and attachments
- **VectorTileService** — Client-rendered vector tiles
- **VectorBasemapStyle** — Esri's professional basemap styles

### Tasks
- **IdentifyFeatures / IdentifyImage** — Query features and pixel values at map locations
- **Query** — Spatial and attribute queries with automatic pagination
- **Find** — Text-based feature search across layers

### Integrations
- **React Hooks** — `useDynamicMapService`, `useFeatureService`, `useQuery`, etc.
- **react-map-gl** — Declarative `<EsriDynamicLayer>`, `<EsriFeatureLayer>`, etc.
- **TypeScript** — Full type safety with comprehensive interfaces

## Installation

```bash
npm install esri-gl
```

### Entry Points

| Import | Use Case |
|--------|----------|
| `esri-gl` | Core services and tasks |
| `esri-gl/react` | React hooks |
| `esri-gl/react-map-gl` | react-map-gl components |

### CDN (UMD)

```html
<script src="https://unpkg.com/esri-gl@latest/dist/index.umd.js"></script>
<script>
  const service = new esrigl.DynamicMapService('source', map, { url: '...' });
</script>
```

## Quick Start

```typescript
import { DynamicMapService } from 'esri-gl';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-95, 37],
  zoom: 4
});

map.on('load', () => {
  const service = new DynamicMapService('usa-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    layers: [0, 1, 2],
    transparent: true
  });

  map.addLayer({ id: 'usa-layer', type: 'raster', source: 'usa-source' });
});
```

## Service Examples

### FeatureService

```typescript
const service = new FeatureService('features-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  where: "STATUS = 'Active'",
  outFields: 'NAME,STATUS',
  token: 'your-token' // optional
});

map.addLayer({
  id: 'features-layer',
  type: 'circle',
  source: 'features-source',
  paint: { 'circle-radius': 5, 'circle-color': '#007cbf' }
});

// Edit features
await service.addFeatures([feature]);
await service.applyEdits({ adds: [], updates: [], deletes: [1, 2] });
```

### ImageService

```typescript
const service = new ImageService('landsat-source', map, {
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
  renderingRule: { rasterFunction: 'Natural Color' }
});
```

### VectorBasemapStyle

```typescript
VectorBasemapStyle.applyStyle(map, 'arcgis/streets', { apiKey: 'YOUR_KEY' });
```

## Tasks

```typescript
import { IdentifyFeatures, query } from 'esri-gl';

// Identify features at a point
const results = await new IdentifyFeatures('https://.../MapServer')
  .at({ lng: -95, lat: 37 })
  .on(map)
  .layers('all')
  .tolerance(5)
  .run();

// Query with pagination
const all = await query({ url: 'https://.../FeatureServer/0' })
  .where("STATE_NAME = 'California'")
  .runAll();
```

## React Integration

### Hooks

```typescript
import { useDynamicMapService, useIdentifyFeatures } from 'esri-gl/react';

const { service, loading, error } = useDynamicMapService({
  sourceId: 'usa-service',
  map,
  options: {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    layers: [0, 1, 2]
  }
});
```

### react-map-gl Components

```tsx
import { EsriDynamicLayer, EsriFeatureLayer } from 'esri-gl/react-map-gl';

<Map mapStyle="mapbox://styles/mapbox/streets-v11">
  <EsriDynamicLayer
    id="census"
    url="https://.../Census/MapServer"
    layers={[0, 1]}
    opacity={0.8}
  />
  <EsriFeatureLayer
    id="states"
    url="https://.../FeatureServer/0"
    paint={{ 'fill-color': '#627BC1', 'fill-opacity': 0.6 }}
  />
</Map>
```

## Examples

Working examples in [`examples/`](examples/):

| Example | Description |
|---------|-------------|
| [maplibre-esm](examples/maplibre-esm/) | All services and tasks with vanilla MapLibre |
| [maplibre-react-hooks](examples/maplibre-react-hooks/) | React hooks with MapLibre |
| [maplibre-react-map-gl](examples/maplibre-react-map-gl/) | react-map-gl components |

```bash
cd examples/maplibre-esm && npm install && npm run dev
```

## Development

```bash
npm run dev          # Start demo dev server
npm run build        # Build library (ESM + UMD)
npm run test         # Run tests (727 tests, 31 suites)
npm run type-check   # TypeScript check
npm run lint         # ESLint
npm run build:docs   # Build documentation site
npm run build:demo   # Build demo site
```

## Contributing

1. Fork and create a feature branch
2. Make changes and add tests
3. Run `npm run test && npm run type-check && npm run lint`
4. Submit a pull request

Pre-commit hooks automatically run formatting, linting, and tests via [Husky](https://typicode.github.io/husky/).

## License

MIT — see [LICENSE](LICENSE)

## Acknowledgements

- **[Esri Leaflet](https://esri.github.io/esri-leaflet/)** — API design inspiration
- **[mapbox-gl-esri-sources](https://github.com/frontiersi/mapbox-gl-esri-sources/)** — Foundational integration patterns (this project originated as a fork)
- **[mapbox-gl-arcgis-featureserver](https://github.com/rowanwins/mapbox-gl-arcgis-featureserver)** by Rowan Winsemius — FeatureService PBF implementation
