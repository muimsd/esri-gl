# VectorTileService

Provides access to ArcGIS Vector Tile Services, which deliver high-performance, scalable vector data as compressed tiles. Vector tiles are ideal for detailed datasets like parcels, roads, and administrative boundaries that maintain crisp rendering at all zoom levels.

## Live Demo

<iframe 
  src="/examples/vector-tile-service.html" 
  width="100%" 
  height="500px" 
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="VectorTileService Demo">
</iframe>

*Interactive demo showing scalable vector tiles with dynamic layer addition and removal controls.*

## Quick Start

### Installation

```bash
npm install esri-gl maplibre-gl
```

### Basic Usage

```typescript
import { VectorTileService } from 'esri-gl';

// Create the service
const service = new VectorTileService('parcels-source', map, {
  url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer'
});

// Get the style and add layer
const style = await service.getStyle();
map.addLayer({
  id: 'parcels-layer',
  type: style.type,
  source: 'parcels-source',
  'source-layer': style['source-layer'],
  paint: style.paint
});
```

## Key Features

- **Scalable Performance** - Optimized vector tile delivery for large datasets
- **Crisp Rendering** - Vector graphics scale perfectly at any zoom level
- **Style Flexibility** - Supports server-defined styles and custom styling
- **Efficient Bandwidth** - Compressed vector data reduces transfer size
- **Interactive Features** - Queryable vector features with properties

## Common Operations

### Dynamic Layer Management
```typescript
// Add vector tile layer
const style = await service.getStyle();
map.addLayer({
  id: 'vector-layer',
  type: style.type,
  source: 'parcels-source',
  'source-layer': style['source-layer'],
  paint: style.paint
});

// Remove layer
map.removeLayer('vector-layer');
```

### Custom Styling
```typescript
// Override default style
map.addLayer({
  id: 'custom-parcels',
  type: 'fill',
  source: 'parcels-source',
  'source-layer': 'Santa_Monica_Mountains_Parcels',
  paint: {
    'fill-color': '#ff6b6b',
    'fill-opacity': 0.7,
    'fill-outline-color': '#fff'
  }
});
```

### Feature Queries
```typescript
// Query features at a point
map.on('click', 'vector-layer', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['vector-layer']
  });
  
  if (features.length > 0) {
    console.log('Feature properties:', features[0].properties);
  }
});
```

### Style Updates
```typescript
// Update paint properties
map.setPaintProperty('vector-layer', 'fill-color', '#4CAF50');
map.setPaintProperty('vector-layer', 'fill-opacity', 0.8);
```

## Use Cases

- **Property Management** - Parcel boundaries, land ownership, and zoning
- **Transportation** - Road networks, transit routes, and traffic analysis
- **Urban Planning** - Building footprints, infrastructure, and development
- **Environmental** - Land cover, watersheds, and conservation areas
- **Administrative** - Political boundaries, districts, and jurisdictions

For detailed API documentation, see [VectorTileService API Reference](../api/vector-tile-service).