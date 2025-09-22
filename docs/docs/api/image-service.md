# ImageService

For accessing [ArcGIS Image Services](https://developers.arcgis.com/rest/services-reference/image-service.htm) that provide analytical raster data with advanced rendering capabilities.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the MapLibre GL source |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Esri ImageService (see below) |
| rasterSourceOptions | `object` | Optional MapLibre GL raster source options |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the ImageService |
| renderingRule | `object` | | Raster function and parameters for visualization |
| mosaicRule | `object` | | Controls which images are displayed from a mosaic dataset |
| format | `string` | `'jpgpng'` | Output format (`jpg`, `png`, `jpgpng`, `gif`, `bmp`) |
| interpolation | `string` | | Resampling method (`RSP_BilinearInterpolation`, `RSP_CubicConvolution`, etc.) |
| compressionQuality | `number` | | JPEG compression quality (1-100) |
| bandIds | `Array<number>` | | Specific bands to display |
| pixelType | `string` | | Output pixel type |
| noData | `number` | | NoData value |
| token | `string` | | Authentication token |
| fetchOptions | `object` | | Fetch request options |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `identify(lngLat, options?)` | `Promise<IdentifyResponse>` | Get pixel values at a point |
| `setRenderingRule(rule)` | `void` | Update rendering rule |
| `setMosaicRule(rule)` | `void` | Update mosaic rule |
