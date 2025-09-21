# Services Overview

<!-- Example viewer is not available. The embedded example will be added soon. -->

esri-gl provides a comprehensive suite of service classes that integrate Esri ArcGIS REST services with MapLibre GL JS and Mapbox GL JS. Each service follows a consistent architectural pattern while being optimized for specific data types and use cases.

## Core Architecture

### Service-Source Pattern

Services create MapLibre/Mapbox GL sources and manage their lifecycle:

```typescript
// Services create sources that get added to the map
const service = new DynamicMapService('source-id', map, { url: '...' })
map.addLayer({ id: 'layer-id', type: 'raster', source: 'source-id' })
```

### Universal Constructor Pattern

All services follow this signature:

```typescript
new ServiceClass(sourceId: string, map: Map, esriOptions: Options, sourceOptions?: SourceOptions)
```

## Available Services

### Raster Services

#### [DynamicMapService](./dynamic-map-service)
Server-rendered raster tiles from ArcGIS Dynamic Map Services with real-time customization.

- **Use Cases**: Interactive layers, real-time data, custom symbology
- **Performance**: ⭐⭐⭐ Moderate (server-rendered)
- **Customization**: ⭐⭐⭐⭐⭐ Full (layers, definitions, time)
- **Data Freshness**: ⭐⭐⭐⭐⭐ Real-time

```typescript
const dynamicService = new DynamicMapService('dynamic-source', map, {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_Population_Density/MapServer',
  layers: [0, 1, 2],
  layerDefs: { 0: 'POP_DENSITY > 100' }
});
```

#### [TiledMapService](./tiled-map-service)
Pre-cached raster tiles from ArcGIS Tiled Map Services for fast performance.

- **Use Cases**: Basemaps, background layers, reference maps
- **Performance**: ⭐⭐⭐⭐⭐ Excellent (cached)
- **Customization**: ⭐⭐ Limited (static cache)
- **Data Freshness**: ⭐⭐ Cached

```typescript
const tiledService = new TiledMapService('tiled-source', map, {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
});
```

#### [ImageService](./image-service)
Analytical raster data from ArcGIS Image Services with rendering rules and temporal support.

- **Use Cases**: Satellite imagery, elevation data, scientific rasters
- **Performance**: ⭐⭐⭐ Variable (analysis-dependent)
- **Customization**: ⭐⭐⭐⭐⭐ Full (rendering rules, temporal)
- **Data Freshness**: ⭐⭐⭐⭐⭐ Real-time

```typescript
const imageService = new ImageService('image-source', map, {
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
  renderingRule: { rasterFunction: 'Natural Color' },
  from: new Date('2023-01-01'),
  to: new Date('2023-12-31')
});
```

### Vector Services  

#### [VectorTileService](./vector-tile-service)
High-performance vector tiles from ArcGIS Vector Tile Services.

- **Use Cases**: Detailed datasets, scalable vector graphics, interactive features
- **Performance**: ⭐⭐⭐⭐⭐ Excellent (vector tiles)
- **Customization**: ⭐⭐⭐⭐⭐ Full (client-side styling)
- **Data Freshness**: ⭐⭐⭐ Cached

```typescript
const vectorService = new VectorTileService('vector-source', map, {
  url: 'https://vectortileservices3.arcgis.com/.../VectorTileServer'
});

// Apply service's default style
const style = await vectorService.getStyle();
map.addLayer({
  id: 'vector-layer',
  type: style.type,
  source: 'vector-source',
  'source-layer': style['source-layer'],
  layout: style.layout,
  paint: style.paint
});
```

#### [VectorBasemapStyle](./vector-basemap-style)
Professional Esri Vector Basemap Styles with global coverage.

- **Use Cases**: Professional cartographic basemaps, theme switching
- **Performance**: ⭐⭐⭐⭐⭐ Excellent (optimized)
- **Customization**: ⭐⭐⭐ Themed variations
- **Data Freshness**: ⭐⭐⭐⭐ Regularly updated

```typescript
const basemapStyle = new VectorBasemapStyle('ArcGIS:Streets', 'YOUR_API_KEY');
const response = await fetch(basemapStyle.styleUrl);
const style = await response.json();
map.setStyle(style);
```

### Feature Services

#### FeatureService
GeoJSON features from ArcGIS Feature Services for client-side rendering.

- **Use Cases**: Point data, interactive features, client-side analysis
- **Performance**: ⭐⭐⭐⭐ Good (client-rendered)
- **Customization**: ⭐⭐⭐⭐⭐ Full (client-side)
- **Data Freshness**: ⭐⭐⭐⭐⭐ Real-time

*Documentation coming soon*

## Service Comparison Matrix

| Service | Data Type | Performance | Customization | Use Case |
|---------|-----------|-------------|---------------|----------|
| **DynamicMapService** | Server Raster | Moderate | Full | Interactive layers |
| **TiledMapService** | Cached Raster | Excellent | Limited | Basemaps |
| **ImageService** | Analytical Raster | Variable | Full | Imagery/Analysis |
| **VectorTileService** | Vector Tiles | Excellent | Full | Detailed datasets |
| **VectorBasemapStyle** | Style Definition | Excellent | Themed | Professional basemaps |
| **FeatureService** | GeoJSON | Good | Full | Point/polygon features |

## Task-Based Operations

Services support advanced task-based operations modeled after Esri Leaflet's chainable pattern:

### Identify Operations

```typescript
// Service direct method
const results = await dynamicService.identify({ lng: -95, lat: 37 }, true);

// Standalone task with advanced options
const identifyTask = new IdentifyFeatures({ 
  url: 'https://services.arcgisonline.com/.../MapServer' 
});
const results = await identifyTask.at({ lng: -95, lat: 37 }, map);
```

### Query Operations

```typescript
// Feature queries with SQL-like syntax
const queryTask = new QueryFeatures({
  url: 'https://services.arcgisonline.com/.../FeatureServer/0'
});

const results = await queryTask
  .where("STATE_NAME='California'")
  .orderBy('POPULATION DESC')
  .request();
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
- Comprehensive error handling and retry logic

## Common Patterns

### Service Lifecycle Management

```typescript
// Create service
const service = new DynamicMapService('my-source', map, { url: '...' });

// Add layer
map.addLayer({ id: 'my-layer', type: 'raster', source: 'my-source' });

// Update service parameters
service.setLayerDefs({ 0: 'NEW_FILTER = 1' });

// Remove service
service.remove(); // Removes source from map
```

### Error Handling

```typescript
try {
  const service = new DynamicMapService('error-prone', map, { url: '...' });
  const metadata = await service.getMetadata();
} catch (error) {
  if (error.message.includes('404')) {
    console.error('Service not found');
  } else if (error.message.includes('CORS')) {
    console.error('Cross-origin request blocked');
  } else {
    console.error('Service error:', error);
  }
}
```

### Performance Optimization

```typescript
// Cache metadata for better performance
const metadata = await service.getMetadata();
console.log('Service capabilities:', metadata.capabilities);

// Use appropriate tile sizes
const tiledService = new TiledMapService('optimized', map, { url: '...' }, {
  tileSize: 512, // Match service tile cache
  maxzoom: 18,   // Limit zoom to available scales
  minzoom: 2
});
```

## Best Practices

1. **Choose the right service** for your data type and performance requirements
2. **Handle errors gracefully** with proper fallback mechanisms
3. **Cache metadata** to reduce server requests
4. **Use appropriate zoom bounds** to match service capabilities
5. **Monitor service health** and implement retry logic
6. **Consider bandwidth** and client capabilities for mobile applications
7. **Follow Esri attribution requirements** for public-facing applications

## Next Steps

- Explore individual service documentation for detailed examples
- Check out the [demo components](https://github.com/muimsd/esri-map-gl/tree/master/src/demo/components) for working implementations
- Review the API reference documentation for complete method signatures
- Join the community discussions for support and feature requests