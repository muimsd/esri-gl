# Services Overview

<iframe src="/examples/basic-viewer.html" width="100%" height="400" frameborder="0" style={{ border: "1px solid #ccc", borderRadius: "8px", marginBottom: "20px" }}></iframe>

esri-gl provides several service classes that integrate Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS. Each service follows a consistent pattern for creating and managing map sources.

## Core Architecture

### Service-Source Pattern

Services create MapLibre/Mapbox GL sources and manage their lifecycle:

```typescript
// Services create sources that get added to the map
const service = new DynamicMapService('source-id', map, { url: '...' })
map.addLayer({ id: 'layer-id', type: 'raster', source: 'source-id' })
```

### Service Constructor Pattern

All services follow this signature:

```typescript
new ServiceClass(sourceId: string, map: Map, esriOptions: Options, sourceOptions?: SourceOptions)
```

## Available Services

### Raster Services

- **[DynamicMapService](../api/dynamic-map-service)** - Server-rendered raster tiles from ArcGIS Dynamic Map Services
- **[TiledMapService](../api/tiled-map-service)** - Pre-cached raster tiles from ArcGIS Tiled Map Services  
- **[ImageService](../api/image-service)** - Analytical raster data from ArcGIS Image Services

### Vector Services  

- **[VectorTileService](#)** - Vector tiles from ArcGIS Vector Tile Services
- **[VectorBasemapStyle](#)** - Complete Esri Vector Basemap Styles
- **[FeatureService](../api/feature-service)** - GeoJSON features from ArcGIS Feature Services

## Task-Based Operations

Services support task-based operations modeled after Esri Leaflet's chainable task pattern:

```typescript
const identifyService = new IdentifyFeatures({ url: '...' })
const results = await identifyService.at({ lng: -95, lat: 37 }, map)
```

## Integration Points

### MapLibre/Mapbox Compatibility  
- Uses duck-typing for map compatibility (`Map` interface)
- Handles both libraries' source management differences
- External dependencies: `maplibre-gl` and `mapbox-gl` (peer dependencies)

### Esri Service Integration
- Follows ArcGIS REST API patterns for parameters (`f=json`, `bboxSR=3857`)
- Automatic service metadata fetching for attribution
- Layer definition filtering with SQL-like syntax