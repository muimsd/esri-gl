# esri-gl

A TypeScript library that bridges Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS. It replicates Esri Leaflet's architecture patterns while being compatible with modern WebGL mapping libraries.

> **🚧 Development Notice**
> 
> This project is currently under active development. APIs may change between releases and some features may not be fully stable. Please use with caution in production environments and check the [changelog](CHANGES.md) for breaking changes between versions.

[![npm version](https://badge.fury.io/js/esri-gl.svg)](https://badge.fury.io/js/esri-gl)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🔗 Links

- **📚 [Documentation](https://esri-gl.netlify.app/)** - Complete API reference and guides
- **🎮 [Live Demos](https://esri-gl-demo.netlify.app/)** - Interactive examples and code samples

**Note**: This library is compatible with both **MapLibre GL JS** and **Mapbox GL JS**.

## Features

### Supported Services

- **Dynamic Map Services** - Server-rendered raster tiles from ArcGIS Map Services
- **Tiled Map Services** - Pre-cached tile services for optimal performance  
- **Image Services** - Analytical raster data with server-side processing
- **Vector Tile Services** - Client-rendered vector tiles for fast styling
- **Vector Basemap Styles** - Esri's vector basemap styles with custom styling
- **Feature Services** - Vector data with smart vector tile detection and GeoJSON fallback

### Advanced Features

- **Smart Vector Tile Detection** - Automatically detects vector tile endpoints with GeoJSON fallback
- **Dynamic Layer Management** - Add/remove layers dynamically with proper cleanup
- **Identify Tasks** - Query features and raster data at specific locations
- **Bounding Box Filtering** - Optimize performance with viewport-based data loading  
- **Layer Definitions** - Filter data server-side using SQL-like expressions
- **Time-aware Services** - Support for temporal data visualization
- **Attribution Management** - Automatic service attribution handling
- **React Integration** - Hooks and components for React applications
- **React Map GL Support** - Direct integration with react-map-gl
- **TypeScript Support** - Full type safety with comprehensive interfaces

## Installation

### Stable Release
```bash
npm install esri-gl
```



## Quick Start

### Basic Usage with MapLibre GL JS

```typescript
import { Map } from 'maplibre-gl';
import { DynamicMapService, VectorTileService, FeatureService } from 'esri-gl';

const map = new Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-95, 37],
  zoom: 4
});

map.on('load', () => {
  // Add a dynamic map service
  const dynamicService = new DynamicMapService('census-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer'
  });

  map.addLayer({
    id: 'census-layer',
    type: 'raster',
    source: 'census-source'
  });

  // Add a feature service with smart vector tile detection
  const featureService = new FeatureService('parcels-source', map, {
    url: 'https://services.arcgis.com/.../FeatureServer/0',
    useVectorTiles: true, // Automatically detects and falls back to GeoJSON if needed
    useBoundingBox: true, // Optimize with viewport filtering
    where: "STATUS = 'Active'", // Server-side filtering
    outFields: '*'
  });

  map.addLayer({
    id: 'parcels-layer',
    type: 'fill',
    source: 'parcels-source',
    paint: {
      'fill-color': '#007cbf',
      'fill-opacity': 0.5
    }
  });
});
```

### Using with Mapbox GL JS

```typescript
import mapboxgl from 'mapbox-gl';
import { VectorBasemapStyle, ImageService } from 'esri-gl';

mapboxgl.accessToken = 'your-mapbox-token';

const map = new mapboxgl.Map({
  container: 'map',
  center: [-95, 37],
  zoom: 4
});

map.on('load', () => {
  // Add Esri vector basemap style
  const basemapService = new VectorBasemapStyle('basemap-source', map, {
    style: 'arcgis/streets'
  });

  // Add image service for analytical raster data
  const imageService = new ImageService('elevation-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Elevation/ImageServer',
    renderingRule: {
      rasterFunction: 'Hillshade'
    }
  });

  map.addLayer({
    id: 'elevation-layer',
    type: 'raster',
    source: 'elevation-source'
  });
});
```

## Service Classes

### DynamicMapService
Server-rendered raster tiles from ArcGIS Map Services.

```typescript
const service = new DynamicMapService('source-id', map, {
  url: 'https://example.com/arcgis/rest/services/MyService/MapServer',
  layers: [0, 1, 2], // Specific layers to display
  layerDefs: {
    0: "POP2000 > 100000", // Filter layer 0
    1: "STATE_NAME = 'California'" // Filter layer 1
  },
  transparent: true,
  format: 'png32'
});
```

### TiledMapService  
Pre-cached tile services for optimal performance.

```typescript
const service = new TiledMapService('source-id', map, {
  url: 'https://example.com/arcgis/rest/services/MyTiledService/MapServer'
});
```

### FeatureService
Vector data with intelligent vector tile detection and automatic GeoJSON fallback.

```typescript
const service = new FeatureService('source-id', map, {
  url: 'https://example.com/arcgis/rest/services/MyService/FeatureServer/0',
  useVectorTiles: true, // Smart detection with fallback
  useBoundingBox: true, // Viewport-based loading
  where: '1=1',
  outFields: '*',
  maxRecordCount: 2000
});
```

### VectorTileService
Client-rendered vector tiles for fast styling and interaction.

```typescript
const service = new VectorTileService('source-id', map, {
  url: 'https://example.com/arcgis/rest/services/MyService/VectorTileServer'
});
```

### ImageService
Analytical raster data with server-side processing capabilities.

```typescript
const service = new ImageService('source-id', map, {
  url: 'https://example.com/arcgis/rest/services/MyImageService/ImageServer',
  renderingRule: {
    rasterFunction: 'Stretch',
    rasterFunctionArguments: {
      StretchType: 6,
      NumberOfStandardDeviations: 2
    }
  },
  mosaicRule: {
    mosaicMethod: 'esriMosaicLockRaster',
    lockRasterIds: [1, 2, 3]
  }
});
```

### VectorBasemapStyle
Esri's vector basemap styles with customization options.

```typescript
const service = new VectorBasemapStyle('source-id', map, {
  style: 'arcgis/streets', // or 'arcgis/navigation', 'arcgis/topographic', etc.
  language: 'en',
  worldview: 'USA'
});
```

## Task-Based Operations

Modeled after Esri Leaflet's chainable task pattern for querying and identifying features.

### IdentifyFeatures
Query vector features at specific locations.

```typescript
import { IdentifyFeatures } from 'esri-gl';

const identifyService = new IdentifyFeatures({
  url: 'https://example.com/arcgis/rest/services/MyService/MapServer'
});

// Identify features at a point
const results = await identifyService
  .at({ lng: -95, lat: 37 })
  .tolerance(5)
  .layers('all')
  .returnGeometry(true)
  .run(map);

console.log('Identified features:', results);
```

### IdentifyImage
Query raster values from image services.

```typescript
import { identifyImage } from 'esri-gl';

const results = await identifyImage({
  url: 'https://example.com/arcgis/rest/services/Elevation/ImageServer'
}).at({ lng: -120, lat: 40 });

console.log('Elevation value:', results.value);
```

### Query
Advanced feature querying with spatial and attribute filters.

```typescript
import { query } from 'esri-gl';

const results = await query({
  url: 'https://example.com/arcgis/rest/services/MyService/FeatureServer/0'
})
.where("STATE_NAME = 'California'")
.intersects({
  type: 'Point',
  coordinates: [-118, 34]
})
.run();
```

## React Integration

esri-gl provides comprehensive React support with hooks and components for both vanilla React and react-map-gl.

### React Hooks

```typescript
import { useDynamicMapService, useIdentifyFeatures } from 'esri-gl/react';

function MapComponent() {
  const [map, setMap] = useState<Map | null>(null);
  
  const { service, loading, error } = useDynamicMapService({
    sourceId: 'usa-service',
    map,
    options: {
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      layers: [0, 1, 2]
    }
  });

  const { identify } = useIdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 3
  });

  return <div>/* Your map component */</div>;
}
```

### React Map GL Components

```typescript
import { Map } from 'react-map-gl';
import { EsriDynamicLayer, EsriFeatureLayer } from 'esri-gl/react-map-gl';

function MapWithEsriLayers() {
  return (
    <Map
      initialViewState={{ longitude: -95, latitude: 37, zoom: 4 }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
    >
      <EsriDynamicLayer
        id="usa-layer"
        url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
        layers={[0, 1, 2]}
      />
      <EsriFeatureLayer
        id="states-layer"
        url="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_States/FeatureServer/0"
        paint={{ 'fill-color': '#627BC1', 'fill-opacity': 0.5 }}
      />
    </Map>
  );
}
```

See [REACT.md](REACT.md) for complete React integration documentation.

## Advanced Features

### Dynamic Layer Management

```typescript
// Add layers dynamically
const service = new DynamicMapService('census-source', map, {
  url: 'https://example.com/MapServer'
});

// Update visible layers
service.setLayers([0, 2, 5]);

// Update layer definitions
service.setLayerDefs({
  0: "POP2000 > 50000",
  2: "STATE_NAME IN ('California', 'Nevada')"
});

// Clean up
service.remove();
```

### Smart Vector Tile Detection

The `FeatureService` automatically detects vector tile availability:

```typescript
const service = new FeatureService('smart-source', map, {
  url: 'https://example.com/FeatureServer/0',
  useVectorTiles: true // Will automatically:
  // 1. Check for VectorTileServer endpoint
  // 2. Test various URL patterns
  // 3. Fall back to GeoJSON if vector tiles unavailable
  // 4. Log the decision process to console
});
```

### Performance Optimization

```typescript
const service = new FeatureService('optimized-source', map, {
  url: 'https://example.com/FeatureServer/0',
  useBoundingBox: true, // Only load features in current viewport
  maxRecordCount: 1000, // Limit records per request
  where: 'STATUS = "Active"', // Server-side filtering
  outFields: ['OBJECTID', 'NAME', 'STATUS'] // Limit fields
});
```

## Development

### Build System
- **Library Build**: Rollup with TypeScript, Babel, and Terser (UMD + ESM outputs)
- **Type Declarations**: Generated with rollup-plugin-dts in `dist/` directory
- **Demo Development**: Vite dev server with React and TypeScript
- **Documentation**: Docusaurus build system
- **Test Coverage**: 77.78% with 583 comprehensive test cases

### Development Commands

```bash
# Start demo development server
npm run dev

# Build library (both UMD and ESM)
npm run build

# Watch mode for library development  
npm run build:watch

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Build documentation
npm run build-docs
npm run dev:docs
```

### Project Structure

```
src/
├── Services/           # Core service classes
│   ├── DynamicMapService.ts
│   ├── FeatureService.ts
│   ├── ImageService.ts
│   ├── TiledMapService.ts
│   ├── VectorTileService.ts
│   └── VectorBasemapStyle.ts
├── Tasks/             # Task-based operations
│   ├── Find.ts
│   ├── IdentifyFeatures.ts
│   ├── IdentifyImage.ts
│   └── Query.ts
├── demo/              # Demo React components
├── tests/             # Comprehensive test suite (92.94% coverage)
└── types.ts           # TypeScript interfaces

dist/
├── index.d.ts         # Main TypeScript declarations
├── react.d.ts         # React integration declarations
├── react-map-gl.d.ts  # React Map GL declarations
├── index.js           # ESM build
├── index.umd.js       # UMD build
├── esri-gl.esm.js     # ESM build (legacy)
├── esri-gl.js         # UMD build (legacy)
└── esri-gl.min.js     # Minified UMD build
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (ES2018+)
- **MapLibre GL JS**: v2.0+ (recommended), v1.15+
- **Mapbox GL JS**: v2.0+ (recommended), v1.13+

## TypeScript Support

esri-gl is written in TypeScript and provides full type definitions consolidated in a single directory:

```typescript
import type { 
  DynamicMapServiceOptions,
  FeatureServiceOptions,
  IdentifyResult,
  EsriGeoJSONFeatureCollection 
} from 'esri-gl';

const options: FeatureServiceOptions = {
  url: 'https://example.com/FeatureServer/0',
  useVectorTiles: true,
  where: '1=1'
};
```

All type declarations are available in the `dist/` directory after building.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run validation: `npm run validate`
5. Commit changes: `git commit -m 'Add new feature'`
6. Push to branch: `git push origin feature/my-feature`
7. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgements

- **Esri Leaflet** - Inspiration for API design and architectural patterns
- **MapLibre GL JS** & **Mapbox GL JS** - Incredible WebGL mapping libraries
- **Esri ArcGIS Platform** - Comprehensive GIS services and APIs
- **[mapbox-gl-esri-sources](https://github.com/frontiersi/mapbox-gl-esri-sources/)** - Reference implementation for Esri service integration patterns

## Fork Notice

This project originated as a fork of **[frontiersi/mapbox-gl-esri-sources](https://github.com/frontiersi/mapbox-gl-esri-sources/)**. It has been substantially refactored and expanded:

- Migrated to a service + task architecture similar to Esri Leaflet
- Added unified TypeScript typing and consolidated build outputs (ESM + UMD)
- Introduced additional services (Dynamic, Image, Vector Basemap Styles, Identify / Query tasks, smart FeatureService vector tile detection, etc.)
- Implemented a React/Vite demo suite and extended test coverage

All original credit for the foundational concept and early integration patterns goes to the maintainers of the upstream repository. If you need the simpler original implementation, or want to compare behavior, please visit the upstream project.

