# IdentifyImage

Query pixel values from ArcGIS Image Services at specific geographic locations. Useful for extracting elevation, temperature, precipitation, and other raster data.

## Interactive Demo

<iframe
  src="/examples/identify-image-task.html"
  style={{width: '100%', height: '500px', border: '1px solid #ccc', borderRadius: '4px'}}
  title="IdentifyImage Task Demo"
></iframe>

_Click anywhere on the map to query image pixel values. Use the service dropdown to switch between datasets._

## Constructor

```typescript
new IdentifyImage(options)
identifyImage(options) // Convenience function
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required.** Image Service URL |
| token | `string` | | Authentication token |
| fetchOptions | `object` | | Additional fetch request options |

## Chainable Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.at(lngLat)` | `{lng, lat}` or `[lng, lat]` | Set the geographic location to query |
| `.pixelSize(size)` | `{x: number, y: number}` | Set pixel size / resolution |
| `.rendering(rule)` | `object` | Apply a rendering rule for processing |
| `.mosaic(rule)` | `object` | Apply a mosaic rule for multi-temporal data |
| `.format(fmt)` | `'json' \| 'image'` | Set output format (default: `'json'`) |
| `.returnGeometry(include)` | `boolean` | Include geometry in results |
| `.returnCatalogItems(include)` | `boolean` | Include catalog items in results |
| `.token(authToken)` | `string` | Set authentication token |

## Execution Method

### `.run()` → `Promise<IdentifyImageResponse>`

Execute the identify request. Returns a promise with the response:

```typescript
interface IdentifyImageResponse {
  results: Array<{
    value: string;
    attributes: object;
  }>;
  location?: {
    x: number;
    y: number;
    spatialReference: object;
  };
  properties?: Record<string, any>;
}
```

## Examples

### Basic Elevation Query

```typescript
import { identifyImage } from 'esri-gl';

const result = await identifyImage({
  url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
}).at({ lng: -118.2437, lat: 34.0522 });

console.log(`Elevation: ${result.results[0].value} meters`);
```

### Multi-band Image Analysis

```typescript
const satelliteTask = new IdentifyImage({
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
});

const spectralData = await satelliteTask
  .at([-122.4194, 37.7749])
  .rendering({ rasterFunction: 'None' });

console.log('Spectral bands:', spectralData.properties);
```
