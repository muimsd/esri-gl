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
| `url` | `string` | *required* | ArcGIS ImageServer URL |
| `renderingRule` | `object` | — | Server-side rendering rule |
| `mosaicRule` | `object` | — | Mosaic rule for image selection |
| `format` | `string` | `'jpgpng'` | Output format (`'jpg'`, `'png'`, `'jpgpng'`, etc.) |
| `interpolation` | `string` | — | Resampling interpolation method |
| `compressionQuality` | `number` | — | JPEG compression quality (0-100) |
| `bandIds` | `Array<number>` | — | Band combination (e.g., `[3, 2, 1]`) |
| `pixelType` | `string` | — | Output pixel type |
| `noData` | `number` | — | NoData value for transparency |
| `token` | `string` | — | ArcGIS authentication token |
| `fetchOptions` | `object` | — | Custom fetch options (headers, etc.) |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `identify(lngLat, options?)` | `Promise<IdentifyResponse>` | Returns pixel values and catalog info at a location |
| `setRenderingRule(rule)` | `void` | Applies a new rendering rule and refreshes tiles |
| `setMosaicRule(rule)` | `void` | Applies a new mosaic rule and refreshes tiles |
| `setToken(token)` | `void` | Updates the authentication token |

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
  time: [new Date('2023-01-01'), new Date('2023-12-31')]
});
```

### Identify Pixels
```typescript
const results = await service.identify({ lng: -95, lat: 37 }, map);
console.log(results.pixel);   // Pixel values
console.log(results.catalog); // Raster catalog info
```

### Layer Opacity
```typescript
map.setPaintProperty('landsat-layer', 'raster-opacity', 0.6);
```
