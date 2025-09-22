# TiledMapService

For accessing [ArcGIS Tiled Map Services](https://developers.arcgis.com/rest/services-reference/map-service.htm) that provide pre-cached raster tiles.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the MapLibre GL source |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Esri MapService (see below) |
| rasterSourceOptions | `object` | Optional MapLibre GL raster source options |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the Tiled MapService |
| fetchOptions | `object` | | Options for fetch requests (headers, etc.) |
| token | `string` | | Authentication token if required |
| getAttributionFromService | `boolean` | `true` | Retrieve attribution from service metadata |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getMetadata()` | `Promise<ServiceMetadata>` | Fetch service metadata |
