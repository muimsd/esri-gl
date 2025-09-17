# GitHub Copilot Instructions

## Project Overview

**esri-gl** is a TypeScript library that bridges Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS. It replicates Esri Leaflet's architecture patterns while being compatible with modern WebGL mapping libraries.

## Architecture & Key Concepts

### Service-Source Pattern
Services create MapLibre/Mapbox GL sources and manage their lifecycle:

```typescript
// Services create sources that get added to the map
const service = new DynamicMapService('source-id', map, { url: '...' })
map.addLayer({ id: 'layer-id', type: 'raster', source: 'source-id' })
```

### Core Service Classes
- **`DynamicMapService`** - ArcGIS Dynamic Map Services (server-rendered raster tiles)
- **`TiledMapService`** - ArcGIS Tiled Map Services (pre-cached tiles) 
- **`ImageService`** - ArcGIS Image Services with analytical capabilities
- **`VectorTileService`** - ArcGIS Vector Tile Services
- **`VectorBasemapStyle`** - Esri Vector Basemap Styles
- **`FeatureService`** - ArcGIS Feature Services (GeoJSON-compatible)

### Task-Based Operations
Modeled after Esri Leaflet's chainable task pattern:

```typescript
const identifyService = new IdentifyFeatures({ url: '...' })
const results = await identifyService.at({ lng: -95, lat: 37 }, map)
```

## Development Workflow

### Build System
- **Primary**: Rollup for library builds (`npm run build`)
- **Demo**: Vite for development server (`npm run dev`)
- **Docs**: Webpack for documentation site

### Key Commands
```bash
npm run dev                 # Start demo development server
npm run build              # Build library (UMD + ESM)
npm run build:watch        # Watch mode for library
npm run type-check         # TypeScript validation
npm run lint              # ESLint validation
npm run test              # Jest tests
```

### Path Aliases
- `@/` → `src/` (configured in tsconfig.json, rollup.config.js, vite.config.js)
- `@/types` → `src/types.ts` (NOT `types/types.ts`)

## Project-Specific Patterns

### Service Constructor Pattern
All services follow this signature:
```typescript
new ServiceClass(sourceId: string, map: Map, esriOptions: Options, sourceOptions?: SourceOptions)
```

### Dual Import Pattern
The codebase supports both distribution and source imports:
- **Production**: `import { DynamicMapService } from 'esri-gl'`
- **Development**: `import { DynamicMapService } from '../../main'` (demo components)

### Identify vs IdentifyFeatures
- **`service.identify(lngLat, returnGeometry)`** - Direct method on services
- **`new IdentifyFeatures().at(point, map)`** - Standalone task with advanced options

### Dynamic Source Updates
Services use undocumented MapLibre/Mapbox methods for live updates:
```typescript
private _updateSource() {
  const src = this._map.getSource(this._sourceId)
  src.setTiles ? src.setTiles(tiles) : this._clearAndUpdate()
}
```

## Integration Points

### MapLibre/Mapbox Compatibility  
- Uses duck-typing for map compatibility (`Map` interface in types.ts)
- Handles both libraries' source management differences
- External dependencies: `maplibre-gl` and `mapbox-gl` (peer dependencies)

### Esri Service Integration
- Follows ArcGIS REST API patterns for parameters (`f=json`, `bboxSR=3857`)
- Automatic service metadata fetching for attribution
- Layer definition filtering with SQL-like syntax

## Working Demo Components

**Critical**: Use `src/demo/components/` as the source of truth for API patterns. These React/TypeScript components show real working implementations:

- **DynamicMapServiceDemo.tsx** - Layer controls, identify functionality
- **IdentifyFeaturesDemo.tsx** - Advanced identify with tolerance settings
- **VectorTileServiceDemo.tsx** - Dynamic layer addition/removal

### Demo Development
```bash
npm run dev  # Starts Vite dev server on port 5173
```

Demo components import from `../../main` (source) rather than `../../../dist/esri-gl.esm.js` (built) for immediate feedback during development.

## Testing Strategy

- **Jest** for unit tests
- **Demo components** for integration testing  
- **Live services** using `sampleserver6.arcgisonline.com` endpoints

## Type Safety

- All services and options are fully typed
- `Map` interface provides MapLibre/Mapbox compatibility layer
- Avoid `any` types - use proper interfaces from `types.ts`

This codebase prioritizes Esri Leaflet API compatibility while leveraging modern WebGL mapping capabilities.
