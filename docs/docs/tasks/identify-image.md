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
new IdentifyImage(urlOrOptions: string | IdentifyImageOptions)
identifyImage(urlOrOptions: string | IdentifyImageOptions) // convenience factory
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required.** Image Service URL |
| geometry | `object` | | Location to identify (usually set with `.at()`) |
| geometryType | `string` | `'esriGeometryPoint'` | Type of the input geometry |
| sr | `string \| number` | `4326` | Spatial reference of the input/output geometry |
| mosaic | `boolean` | | Identify against the mosaicked image rather than each raster |
| renderingRules | `object[]` | | Rendering rules applied to the identify |
| pixelSize | `[number, number]` | | Pixel size / resolution of the identify |
| returnGeometry | `boolean` | `false` | Include geometry in results |
| returnCatalogItems | `boolean` | `false` | Include catalog items in results |
| f | `string` | `'json'` | Response format |
| token | `string` | | Authentication token |
| apiKey | `string` | | ArcGIS Location Platform API key |
| authentication | `IAuthenticationManager \| string` | | ArcGIS REST JS auth manager ([guide](../guides/authentication)) |

## Chainable Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.at(lngLat)` | `{lng, lat}` or `[lng, lat]` | Set the geographic location to query |
| `.geometry(geometry, type?)` | `object, string` | Set a custom geometry (default type `'esriGeometryPoint'`) |
| `.pixelSize(size)` | `[number, number]` or `{x, y}` | Set pixel size / resolution |
| `.renderingRule(rule)` | `object` | Apply a rendering rule for processing |
| `.mosaicRule(rule)` | `object` | Apply a mosaic rule for multi-temporal data |
| `.returnGeometry(include)` | `boolean` | Include geometry in results |
| `.returnCatalogItems(include)` | `boolean` | Include catalog items in results |
| `.token(authToken)` | `string` | Set authentication token |

Every method above returns the task for chaining — the request is only sent by an execution method.

## Execution Methods

### `.run()` → `Promise<IdentifyImageResponse>`

Execute the identify request. Returns a promise with the response:

```typescript
interface IdentifyImageResponse {
  results: Array<{
    objectId?: number;
    name?: string;
    value?: string;
    attributes?: Record<string, unknown>;
    catalogItems?: unknown[];
  }>;
  location?: {
    x: number;
    y: number;
    spatialReference?: { wkid: number; latestWkid?: number };
  };
}
```

Services that answer with a bare `value` / `values` payload are normalised into the same
`results` shape.

### `.getPixelValues()` → `Promise<Array<string | number | null>>`

Run the identify and return just the pixel values, coerced to numbers where possible.

### `.getPixelData()` → `Promise<IdentifyImageResult[]>`

Run the identify and return only the `results` array.

## Examples

### Basic Elevation Query

```typescript
import { identifyImage } from 'esri-gl';

const result = await identifyImage({
  url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
})
  .at({ lng: -118.2437, lat: 34.0522 })
  .run();

console.log(`Elevation: ${result.results[0].value} meters`);
```

### Multi-band Image Analysis

```typescript
const satelliteTask = new IdentifyImage({
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
});

const spectralData = await satelliteTask
  .at([-122.4194, 37.7749])
  .renderingRule({ rasterFunction: 'None' })
  .run();

console.log('Spectral bands:', spectralData.results[0]?.value);
```
