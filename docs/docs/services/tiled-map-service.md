# TiledMapService

Provides access to ArcGIS Tiled Map Services, which are pre-rendered cached map tiles that offer fast performance and consistent styling. Ideal for basemaps and background layers.

## Live Demo

<iframe 
  src="/examples/tiled-map-service.html" 
  width="100%" 
  height="500px" 
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="TiledMapService Demo">
</iframe>

*Interactive demo showing pre-rendered cached map tiles with layer visibility controls.*

## Quick Start

### Installation

```bash
npm install esri-gl maplibre-gl
```

### Basic Usage

```typescript
import { TiledMapService } from 'esri-gl';

// Create the service
const service = new TiledMapService('topo-source', map, {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
});

// Add layer to display the service
map.addLayer({
  id: 'topo-layer',
  type: 'raster',
  source: 'topo-source'
});
```

## Key Features

- **Pre-cached Tiles** - Fast loading from ArcGIS Server tile cache
- **High Performance** - Optimized tile delivery with CDN support  
- **Consistent Styling** - Server-rendered tiles ensure visual consistency
- **Wide Zoom Ranges** - Supports detailed zoom levels when cached
- **Attribution Support** - Automatic copyright text from service metadata

## Common Operations

### Layer Visibility
```typescript
// Toggle layer visibility
map.setLayoutProperty('topo-layer', 'visibility', 'none'); // Hide
map.setLayoutProperty('topo-layer', 'visibility', 'visible'); // Show
```

### Opacity Control
```typescript
// Adjust layer opacity
map.setPaintProperty('topo-layer', 'raster-opacity', 0.5); // 50% transparent
```

### Service Information
```typescript
// Get service metadata
const info = await service.getServiceInfo();
console.log(info.tileInfo); // Tile scheme information
console.log(info.fullExtent); // Service extent
console.log(info.copyrightText); // Attribution text
```

## Use Cases

- **Basemap Services** - World topographic, imagery, and street maps
- **Reference Layers** - Administrative boundaries, transportation networks
- **Historical Maps** - Cached historical imagery and map tiles
- **Custom Cartography** - Organization-specific styled base layers

For detailed API documentation, see [TiledMapService API Reference](../api/tiled-map-service).