# Services Overview

esri-gl provides service classes that integrate Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS.

## Architecture

### Service-Source Pattern

Services create MapLibre/Mapbox GL sources and manage their lifecycle:

```typescript
const service = new DynamicMapService('source-id', map, { url: '...' })
map.addLayer({ id: 'layer-id', type: 'raster', source: 'source-id' })
```

### Universal Constructor

All services follow this signature:

```typescript
new ServiceClass(sourceId: string, map: Map, esriOptions: Options, sourceOptions?: SourceOptions)
```

## Service Comparison

| Service | Data Type | Performance | Customization | Best For |
|---------|-----------|-------------|---------------|----------|
| [DynamicMapService](./dynamic-map-service) | Server raster | Moderate | Full | Interactive layers, real-time data |
| [TiledMapService](./tiled-map-service) | Cached raster | Excellent | Limited | Basemaps, reference layers |
| [ImageService](./image-service) | Analytical raster | Variable | Full | Satellite imagery, elevation |
| [FeatureService](./feature-service) | GeoJSON / Vector tiles | Good | Full | Editable features, client-side styling |
| [VectorTileService](./vector-tile-service) | Vector tiles | Excellent | Full | Large vector datasets |
| [VectorBasemapStyle](./vector-basemap-style) | Style definition | Excellent | Themed | Professional basemaps |

## Common Patterns

### Service Lifecycle

```typescript
// Create
const service = new DynamicMapService('my-source', map, { url: '...' });
map.addLayer({ id: 'my-layer', type: 'raster', source: 'my-source' });

// Update
service.setLayerDefs({ 0: 'NEW_FILTER = 1' });

// Remove
service.remove();
```

### Task-Based Operations

Services support identify and query operations:

```typescript
// Identify at a click location
const results = await dynamicService.identify(e.lngLat, true);

// Standalone task with chaining
const results = await new IdentifyFeatures({ url: '...' })
  .at({ lng: -95, lat: 37 })
  .on(map)
  .layers('visible:0,1,2')
  .tolerance(5)
  .run();
```

See individual service pages for detailed documentation, live demos, and examples.
