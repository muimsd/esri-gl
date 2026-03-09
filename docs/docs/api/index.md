# API Reference

Complete API documentation for esri-gl library classes, interfaces, and type definitions.

## Services

Services create and manage MapLibre/Mapbox GL sources for different types of ArcGIS services.

| Class | Description |
|-------|-------------|
| [DynamicMapService](./dynamic-map-service.md) | Server-rendered raster tiles with dynamic styling, labeling, and filtering |
| [TiledMapService](./tiled-map-service.md) | Pre-cached tile services for optimal performance |
| [ImageService](./image-service.md) | Raster imagery and analysis with band manipulation |
| [FeatureService](./feature-service.md) | Vector data as GeoJSON with editing and attachments |
| [VectorTileService](./vector-tile-service.md) | Vector tiles with client-side styling |
| [VectorBasemapStyle](./vector-basemap-style.md) | Esri's professionally designed basemap styles |

## Tasks

Task classes perform operations against ArcGIS REST APIs.

| Class | Description |
|-------|-------------|
| [IdentifyFeatures](./identify-features.md) | Click-to-identify features at map locations |
| [IdentifyImage](./identify-image.md) | Extract pixel values from raster imagery |
| [Query](./query.md) | Spatial and attribute queries with pagination |
| [Find](./find.md) | Text-based feature search across layers |

## Advanced

| Guide | Description |
|-------|-------------|
| [Dynamic Layers](./dynamic-layers.md) | Server-side styling, filtering, and rendering configuration |
| [Advanced Features](./advanced-features.md) | Time animation, statistics, export, and batch operations |

## Type Definitions

### [Types](./types.md)
Complete TypeScript interface definitions for all classes, options, and return types.
