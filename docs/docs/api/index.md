# API Reference

Complete API documentation for esri-gl library classes, interfaces, and type definitions.

## Services

Services create and manage MapLibre/Mapbox GL sources for different types of ArcGIS services.

### [Dynamic Map Service](./dynamic-map-service.md)
Server-rendered raster tiles with advanced styling, labeling, and filtering capabilities.
- **Class**: `DynamicMapService`
- **Use case**: ArcGIS Map Services with real-time server-side rendering
- **Features**: Dynamic styling, labeling, time animation, statistical queries

### [Tiled Map Service](./tiled-map-service.md)
Pre-cached tile services for optimal performance.
- **Class**: `TiledMapService`
- **Use case**: ArcGIS Tiled Map Services and cached basemaps
- **Features**: Fast tile loading, attribution management

### [Image Service](./image-service.md)
Raster imagery and analysis services with band manipulation.
- **Class**: `ImageService`
- **Use case**: Satellite imagery, elevation data, scientific rasters
- **Features**: Band visualization, pixel identification, dynamic processing

### [Feature Service](./feature-service.md)
Vector data services returning GeoJSON-compatible features.
- **Class**: `FeatureService`
- **Use case**: Points, lines, polygons from ArcGIS Feature Services
- **Features**: Real-time updates, attribute queries, spatial filtering

### [Vector Tile Service](./vector-tile-service.md)
Vector tile services with client-side styling capabilities.
- **Class**: `VectorTileService`
- **Use case**: Mapbox/MapLibre vector tiles from ArcGIS
- **Features**: Fast rendering, interactive styling, scalable display

### [Vector Basemap Style](./vector-basemap-style.md)
Esri's vector basemap styles with complete styling definitions.
- **Class**: `VectorBasemapStyle`
- **Use case**: Esri's designed basemap styles (Streets, Satellite, etc.)
- **Features**: Complete style sheets, consistent branding

## Tasks

Task classes provide functionality for interacting with ArcGIS services through REST API operations.

### [Identify Features](./identify-features.md)
Identify and retrieve feature information at specific map locations.
- **Class**: `IdentifyFeatures`
- **Use case**: Click-to-identify, popup content, feature inspection
- **Features**: Multi-layer identification, tolerance settings, geometry options

### [Identify Image](./identify-image.md)
Retrieve pixel values and metadata from raster imagery services.
- **Class**: `IdentifyImage`
- **Use case**: Pixel value extraction, raster analysis, scientific data
- **Features**: Band value extraction, coordinate transformation

### [Query](./query.md)
Execute spatial and attribute queries against feature services.
- **Class**: `Query`
- **Use case**: Data filtering, spatial analysis, attribute searches
- **Features**: SQL queries, spatial relationships, result pagination

### [Find](./find.md)
Search for features containing specific text values.
- **Class**: `Find`
- **Use case**: Text-based search, feature discovery, content lookup
- **Features**: Multi-field search, case-insensitive matching

## Advanced Features

### [Dynamic Layers](./dynamic-layers.md)
Server-side layer configuration for advanced rendering and styling.

### [Advanced Features Guide](./advanced-features.md)
Comprehensive guide to time animation, statistics, export, and other advanced capabilities.

## Type Definitions

### [Types](./types.md)
Complete TypeScript interface definitions for all classes, options, and return types.

## Type Definitions

### [Types](./types.md)
Complete TypeScript interface definitions for all classes, options, and return types.

## Quick Reference

### Services
- **DynamicMapService** - Server-rendered maps with advanced styling
- **TiledMapService** - Pre-cached tiles for performance
- **ImageService** - Raster imagery and analysis  
- **FeatureService** - Vector data as GeoJSON
- **VectorTileService** - Vector tiles with client styling
- **VectorBasemapStyle** - Esri's designed basemap styles

### Tasks
- **IdentifyFeatures** - Click-to-identify feature information
- **IdentifyImage** - Extract pixel values from imagery
- **Query** - Spatial and attribute queries
- **Find** - Text-based feature search

### Key Concepts
- **Services** create and manage map data sources
- **Tasks** perform operations against ArcGIS REST APIs
- **Dynamic Layers** enable server-side styling and rendering
- **TypeScript interfaces** provide complete type safety

## Getting Started

1. Choose the appropriate **Service** class for your data type
2. Use **Task** classes for analysis and interaction
3. Reference **Type Definitions** for TypeScript development
4. Explore **Advanced Features** for complex scenarios

Each API page includes complete method documentation, usage examples, and TypeScript interfaces.