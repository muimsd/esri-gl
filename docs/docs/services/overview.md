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

Every source-creating service follows this signature:

```typescript
new ServiceClass(sourceId: string, map: Map, esriOptions: Options, sourceOptions?: SourceOptions)
```

[VectorBasemapStyle](./vector-basemap-style) is the exception: it produces a whole map *style*
rather than a source, so it takes `new VectorBasemapStyle(styleName, auth)` and is applied with
`map.setStyle(...)`.

### Authentication

Every service accepts `token`, `apiKey`, or an `authentication` manager. Requests run on
[ArcGIS REST JS](https://github.com/Esri/arcgis-rest-js):

```typescript
new DynamicMapService('source', map, { url: '...', apiKey: 'AAPK…' });
```

See the [Authentication guide](../guides/authentication) for auth managers and the
`authenticationrequired` event.

### From a Portal item

Don't have the service URL? Pass an ArcGIS **portal item id** (a 32-character hex string)
anywhere a service `url` is expected — esri-gl resolves it to the underlying service URL before
creating the source. Await `service.sourceReady` before adding the layer:

```typescript
const service = new DynamicMapService('source', map, { url: 'd5e02a0c1f2b4ec399823fdd3c2fdebd' });
await service.sourceReady;
map.addLayer({ id: 'layer-id', type: 'raster', source: 'source' });
```

To resolve a Web Map, or to auto-detect the service type from an item, see
[Portal Items & Web Maps](../guides/portal-items).

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
// Identify at a click location — resolves to the raw ArcGIS response
const response = await dynamicService.identify(e.lngLat, true);
response.results.forEach(result => console.log(result.layerName, result.attributes));

// Standalone task with chaining — resolves to a GeoJSON FeatureCollection
const featureCollection = await new IdentifyFeatures({ url: '...' })
  .at({ lng: -95, lat: 37 })
  .on(map)
  .layers('visible:0,1,2')
  .tolerance(5)
  .run();
```

See individual service pages for detailed documentation, live demos, and examples.
