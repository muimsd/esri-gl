# ImageService

Provides access to ArcGIS Image Services, which serve dynamic raster imagery with powerful analytical capabilities. Image Services support rendering rules, temporal data, and pixel-level operations, making them ideal for satellite imagery, elevation data, and analytical rasters.

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

### Installation

```bash
npm install esri-gl maplibre-gl
```

### Basic Usage

```typescript
import { ImageService } from 'esri-gl';

// Create the service
const service = new ImageService('landsat-source', map, {
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
  format: 'jpg'
});

// Add layer to display the service
map.addLayer({
  id: 'landsat-layer',
  type: 'raster',
  source: 'landsat-source'
});
```

## Key Features

- **Dynamic Rendering** - Server-side image processing with rendering rules
- **Temporal Support** - Time-based data filtering and animation
- **Analytical Capabilities** - Pixel-level identify and statistical analysis
- **Multiple Formats** - Support for JPG, PNG, TIFF, LERC formats
- **Real-time Updates** - Dynamic parameter changes without reloading

## Common Operations

### Apply Rendering Rules
```typescript
// Apply predefined rendering rules
service.setRenderingRule({ rasterFunction: 'Natural Color' });
service.setRenderingRule({ rasterFunction: 'Color Infrared' });
service.setRenderingRule({}); // Reset to default
```

### Temporal Filtering
```typescript
// Filter by time range
const service = new ImageService('temporal-source', map, {
  url: 'https://your-server.com/ImageServer',
  time: [new Date('2023-01-01'), new Date('2023-12-31')]
});
```

### Identify Pixels
```typescript
// Get pixel values at a location
const results = await service.identify({ lng: -95, lat: 37 }, map);
console.log(results.pixel); // Pixel values
console.log(results.catalog); // Raster catalog info
```

### Layer Opacity
```typescript
// Adjust layer transparency
map.setPaintProperty('landsat-layer', 'raster-opacity', 0.6); // 60% opacity
```

## Use Cases

- **Satellite Imagery** - Landsat, Sentinel, and other earth observation data
- **Elevation Data** - Digital elevation models (DEMs) and terrain analysis
- **Weather Data** - Radar, temperature, and atmospheric imagery
- **Scientific Analysis** - Environmental monitoring and change detection
- **Historical Imagery** - Time-series analysis and temporal visualization

For detailed API documentation, see [ImageService API Reference](../api/image-service).