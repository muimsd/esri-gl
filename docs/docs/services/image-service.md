# ImageService

Dynamic raster imagery from ArcGIS Image Services with server-side rendering rules, temporal filtering, and pixel-level analysis.

## Live Demo

<iframe
  src="/examples/image-service.html"
  width="100%"
  height="500px"
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="ImageService Demo">
</iframe>

*Interactive demo showing dynamic raster imagery with rendering rule controls for different visualization styles.*

## Quick Start

```bash
npm install esri-gl maplibre-gl
```

```typescript
import { ImageService } from 'esri-gl';

const service = new ImageService('landsat-source', map, {
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
  format: 'jpg'
});

map.addLayer({
  id: 'landsat-layer',
  type: 'raster',
  source: 'landsat-source'
});
```

## Constructor

```typescript
new ImageService(id, map, esriServiceOptions, rasterSourceOptions?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique source ID for MapLibre |
| `map` | `Map` | MapLibre map instance |
| `esriServiceOptions` | `object` | Service configuration (see below) |
| `rasterSourceOptions` | `object` | Optional MapLibre raster source overrides |

## Options (`esriServiceOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | ArcGIS ImageServer URL, or an ArcGIS [portal item id](../guides/portal-items) |
| `portal` | `string` | — | Portal sharing REST URL used to resolve an item id `url` (defaults to ArcGIS Online) |
| `renderingRule` | `object \| false` | — | Server-side rendering rule |
| `mosaicRule` | `object \| false` | — | Mosaic rule for image selection |
| `format` | `string` | `'jpgpng'` | Output format (`'jpgpng'`, `'png'`, `'png8'`, `'png24'`, `'png32'`, `'jpg'`, `'bmp'`, `'gif'`, `'tiff'`, `'bip'`, `'bsq'`, `'lerc'`) |
| `dpi` | `number` | `96` | Resolution of the exported image |
| `from` | `Date \| number` | — | Start of the time extent (applied together with `to`) |
| `to` | `Date \| number` | — | End of the time extent |
| `getAttributionFromService` | `boolean` | `true` | Fetch copyright text from service metadata |
| `token` | `string` | — | ArcGIS authentication token |
| `apiKey` | `string` | — | ArcGIS Location Platform API key (sent as the `token` parameter) |
| `authentication` | `IAuthenticationManager \| string` | — | ArcGIS REST JS auth manager (preferred for OAuth/user sign-in) |
| `fetchOptions` | `object` | — | Deprecated — no longer forwarded to requests; use `authentication` instead. |

> Authentication runs on [ArcGIS REST JS](https://github.com/Esri/arcgis-rest-js). See the [Authentication guide](../guides/authentication) for tokens, API keys, and auth managers.

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `identify(lngLat, returnGeometry?)` | `Promise<unknown>` | Raw ArcGIS `/identify` response for the pixel at a location. For a chainable API (pixel size, rendering rules, catalog items) use the [IdentifyImage task](../tasks/identify-image). |
| `setRenderingRule(rule)` | `void` | Applies a new rendering rule and refreshes tiles |
| `setMosaicRule(rule)` | `void` | Applies a new mosaic rule and refreshes tiles |
| `setDate(from, to)` | `void` | Sets the time extent and refreshes tiles |
| `setToken(token)` | `void` | Updates the authentication token |
| `getMetadata()` | `Promise<ServiceMetadata>` | Fetches (and caches) the service metadata document |
| `setAttributionFromService()` | `Promise<void>` | Sets map attribution from the service `copyrightText` |
| `update()` | `void` | Refreshes tiles with the current parameters |
| `remove()` | `void` | Removes the service source and its layers from the map |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `sourceReady` | `Promise<void>` | Resolves once the source has been added to the map (deferred when `url` is a portal item id) |

## Examples

### Rendering Rules
```typescript
service.setRenderingRule({ rasterFunction: 'Natural Color' });
service.setRenderingRule({ rasterFunction: 'Color Infrared' });
service.setRenderingRule({}); // Reset to default
```

### Temporal Filtering
```typescript
const service = new ImageService('temporal-source', map, {
  url: 'https://your-server.com/ImageServer',
  from: new Date('2023-01-01'),
  to: new Date('2023-12-31')
});

// …or change the time extent later
service.setDate(new Date('2024-01-01'), new Date('2024-12-31'));
```

### Identify Pixels
```typescript
const response = await service.identify({ lng: -95, lat: 37 });
console.log(response.value);        // Pixel value at the location
console.log(response.catalogItems); // Raster catalog info (when requested)
```

For pixel size, rendering rules, or catalog items, use the
[IdentifyImage task](../tasks/identify-image):

```typescript
import { IdentifyImage } from 'esri-gl';

const result = await new IdentifyImage({ url: imageServerUrl })
  .at({ lng: -95, lat: 37 })
  .returnCatalogItems(true)
  .run();
```

### Layer Opacity
```typescript
map.setPaintProperty('landsat-layer', 'raster-opacity', 0.6);
```
