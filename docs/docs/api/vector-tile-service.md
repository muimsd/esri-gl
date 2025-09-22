# VectorTileService

For accessing [ArcGIS Vector Tile Services](https://developers.arcgis.com/rest/services-reference/vector-tile-service.htm) that provide pre-generated vector tiles for fast rendering and client-side styling.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the MapLibre GL source |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Vector Tile Service (see below) |
| vectorSourceOptions | `object` | Optional MapLibre GL vector source options |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the Vector Tile Service |
| token | `string` | | Authentication token for secured services |
| fetchOptions | `object` | | Additional fetch request options |

## Vector Source Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| minzoom | `number` | `0` | Minimum zoom level for tiles |
| maxzoom | `number` | `22` | Maximum zoom level for tiles |
| attribution | `string` | | Attribution text for the service |

