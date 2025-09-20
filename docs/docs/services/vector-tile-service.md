# VectorTileService

The `VectorTileService` class provides access to ArcGIS Vector Tile Services, which deliver high-performance, scalable vector data as compressed tiles. Vector tiles are ideal for detailed datasets like parcels, roads, and administrative boundaries that need to maintain crisp rendering at all zoom levels.

## Key Features

- **Scalable performance** - Optimized vector tile delivery for large datasets
- **Crisp rendering** - Vector graphics scale perfectly at any zoom level
- **Style flexibility** - Supports server-defined styles and custom styling
- **Efficient bandwidth** - Compressed vector data reduces transfer size
- **Interactive features** - Queryable vector features with properties
- **Multi-layer support** - Single service can contain multiple data layers

## Constructor

```typescript
new VectorTileService(sourceId: string, map: Map, esriOptions: VectorTileServiceOptions, sourceOptions?: VectorSourceOptions)
```

### Parameters

- **`sourceId`** (`string`) - Unique identifier for the MapLibre/Mapbox GL source
- **`map`** (`Map`) - MapLibre GL or Mapbox GL map instance
- **`esriOptions`** (`VectorTileServiceOptions`) - Esri service configuration
- **`sourceOptions`** (`VectorSourceOptions`, optional) - Additional vector source options

### VectorTileServiceOptions

```typescript
interface VectorTileServiceOptions {
  url: string;                         // ArcGIS Vector Tile Service URL
  getAttributionFromService?: boolean; // Fetch attribution from service (default: true)
  useDefaultStyle?: boolean;           // Use service's default style (default: true)
  fetchOptions?: RequestInit;          // Custom fetch options for requests
}
```

### VectorSourceOptions

```typescript
interface VectorSourceOptions {
  attribution?: string;        // Custom attribution text
  bounds?: [number, number, number, number]; // Geographic bounds
  minzoom?: number;           // Minimum zoom level
  maxzoom?: number;           // Maximum zoom level
  scheme?: 'xyz' | 'tms';     // Tile coordinate scheme
  promoteId?: string;         // Property to promote to feature id
}
```

## Basic Usage

```typescript
import { VectorTileService } from 'esri-gl';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  center: [-118.805, 34.027],
  zoom: 12
});

map.on('load', () => {
  // Create the vector tile service
  const vectorService = new VectorTileService('parcels', map, {
    url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer'
  });

  // Get the service's default style and add layer
  vectorService.getStyle().then(style => {
    map.addLayer({
      id: 'parcels-layer',
      type: style.type as any, // 'fill', 'line', 'symbol', etc.
      source: 'parcels',
      'source-layer': style['source-layer'],
      layout: style.layout,
      paint: style.paint
    });
  });
});
```

## Advanced Usage

### Custom Styling

```typescript
const vectorService = new VectorTileService('roads', map, {
  url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer'
});

// Add multiple styled layers from the same service
map.on('load', () => {
  // Major roads
  map.addLayer({
    id: 'major-roads',
    type: 'line',
    source: 'roads',
    'source-layer': 'Road',
    filter: ['>=', 'ROAD_CLASS', 1],
    paint: {
      'line-color': '#ff6b6b',
      'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 15, 8],
      'line-opacity': 0.8
    }
  });

  // Minor roads
  map.addLayer({
    id: 'minor-roads',
    type: 'line',
    source: 'roads',
    'source-layer': 'Road',
    filter: ['<', 'ROAD_CLASS', 1],
    paint: {
      'line-color': '#4ecdc4',
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, 3],
      'line-opacity': 0.6
    }
  });
});
```

### Multi-Layer Service

```typescript
const adminService = new VectorTileService('admin-boundaries', map, {
  url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Administrative_Boundaries_vtl/VectorTileServer'
});

// Get service metadata to understand available layers
adminService.getMetadata().then(metadata => {
  console.log('Available layers:', metadata.layers);
  
  // Add states layer
  map.addLayer({
    id: 'states-fill',
    type: 'fill',
    source: 'admin-boundaries',
    'source-layer': 'states',
    paint: {
      'fill-color': '#627BC1',
      'fill-opacity': 0.5
    }
  });

  // Add states outline
  map.addLayer({
    id: 'states-line',
    type: 'line',
    source: 'admin-boundaries',
    'source-layer': 'states',
    paint: {
      'line-color': '#627BC1',
      'line-width': 2
    }
  });

  // Add counties at higher zoom
  map.addLayer({
    id: 'counties',
    type: 'line',
    source: 'admin-boundaries',
    'source-layer': 'counties',
    minzoom: 6,
    paint: {
      'line-color': '#888',
      'line-width': 1,
      'line-opacity': 0.5
    }
  });
});
```

### Interactive Features

```typescript
// Click handler for feature selection
map.on('click', 'parcels-layer', (e) => {
  if (e.features && e.features.length > 0) {
    const feature = e.features[0];
    
    // Create popup with feature properties
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <h3>Parcel Information</h3>
        <p><strong>APN:</strong> ${feature.properties.APN}</p>
        <p><strong>Owner:</strong> ${feature.properties.OWNER_NAME}</p>
        <p><strong>Land Use:</strong> ${feature.properties.LAND_USE}</p>
        <p><strong>Acreage:</strong> ${feature.properties.ACRES}</p>
      `)
      .addTo(map);

    // Highlight selected feature
    map.setFilter('parcels-highlight', ['==', 'APN', feature.properties.APN]);
  }
});

// Add highlight layer
map.addLayer({
  id: 'parcels-highlight',
  type: 'line',
  source: 'parcels',
  'source-layer': 'Santa_Monica_Mountains_Parcels',
  filter: ['==', 'APN', ''],
  paint: {
    'line-color': '#ff0000',
    'line-width': 3
  }
});

// Change cursor on hover
map.on('mouseenter', 'parcels-layer', () => {
  map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'parcels-layer', () => {
  map.getCanvas().style.cursor = '';
});
```

## Methods

### getStyle()

Retrieves the service's default style definition for rendering vector tiles.

```typescript
const style = await vectorService.getStyle();

console.log('Layer type:', style.type);         // 'fill', 'line', 'symbol', etc.
console.log('Source layer:', style['source-layer']); // Data layer name
console.log('Layout:', style.layout);          // Layout properties
console.log('Paint:', style.paint);           // Paint properties

// Apply the style
map.addLayer({
  id: 'styled-layer',
  type: style.type as any,
  source: 'vector-source',
  'source-layer': style['source-layer'],
  layout: style.layout,
  paint: style.paint
});
```

### getMetadata()

Retrieves comprehensive service metadata including available layers and capabilities.

```typescript
const metadata = await vectorService.getMetadata();

console.log('Service info:', {
  name: metadata.name,
  description: metadata.description,
  copyrightText: metadata.copyrightText,
  maxzoom: metadata.maxzoom,
  minzoom: metadata.minzoom
});

// Available source layers
metadata.layers?.forEach(layer => {
  console.log(`Layer: ${layer.name}`, {
    id: layer.id,
    geometryType: layer.geometryType,
    minScale: layer.minScale,
    maxScale: layer.maxScale
  });
});
```

### update()

Updates the vector tile source (primarily for testing purposes).

```typescript
vectorService.update(); // Refresh source configuration
```

### remove()

Removes the service source from the map.

```typescript
vectorService.remove(); // Removes 'parcels' source
```

## Interactive Demo

```jsx
import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { VectorTileService } from 'esri-gl';

const VectorTileDemo = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const service = useRef(null);
  const [layerAdded, setLayerAdded] = useState(false);
  const [layerType, setLayerType] = useState('default');

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [-118.805, 34.027],
      zoom: 12
    });

    map.current.on('load', () => {
      service.current = new VectorTileService('parcels', map.current, {
        url: 'https://vectortileservices3.arcgis.com/.../VectorTileServer'
      });
    });

    return () => map.current?.remove();
  }, []);

  const addLayer = async () => {
    if (!service.current || layerAdded) return;
    
    try {
      const style = await service.current.getStyle();
      
      const layerConfig = {
        id: 'vector-layer',
        source: 'parcels',
        'source-layer': style['source-layer']
      };

      if (layerType === 'default') {
        map.current.addLayer({
          ...layerConfig,
          type: style.type,
          layout: style.layout,
          paint: style.paint
        });
      } else if (layerType === 'custom') {
        map.current.addLayer({
          ...layerConfig,
          type: 'fill',
          paint: {
            'fill-color': '#ff6b6b',
            'fill-opacity': 0.6,
            'fill-outline-color': '#ffffff'
          }
        });
      }

      setLayerAdded(true);
    } catch (error) {
      console.error('Error adding layer:', error);
    }
  };

  const removeLayer = () => {
    if (layerAdded && map.current.getLayer('vector-layer')) {
      map.current.removeLayer('vector-layer');
      setLayerAdded(false);
    }
  };

  return (
    <div style={{ position: 'relative', height: '400px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <div>
          <label>Style:</label>
          <select 
            value={layerType}
            onChange={e => setLayerType(e.target.value)}
            disabled={layerAdded}
          >
            <option value="default">Default Style</option>
            <option value="custom">Custom Style</option>
          </select>
        </div>
        <div>
          <button onClick={layerAdded ? removeLayer : addLayer}>
            {layerAdded ? 'Remove Layer' : 'Add Layer'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Common Patterns

### Basemap Replacement

```typescript
// Replace raster basemap with vector tiles for better performance
const basemapService = new VectorTileService('vector-basemap', map, {
  url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer'
});

// Get all layers from service metadata
const addBasemapLayers = async () => {
  const metadata = await basemapService.getMetadata();
  
  // Add layers in proper order (background to foreground)
  const layerOrder = ['land', 'water', 'roads', 'buildings', 'labels'];
  
  layerOrder.forEach(layerName => {
    const layer = metadata.layers.find(l => l.name === layerName);
    if (layer) {
      map.addLayer({
        id: `basemap-${layerName}`,
        type: 'fill', // or appropriate type based on geometry
        source: 'vector-basemap',
        'source-layer': layer.name,
        paint: getStyleForLayer(layerName) // Custom styling function
      });
    }
  });
};
```

### Data Visualization

```typescript
// Choropleth mapping with vector tiles
const censusService = new VectorTileService('census-data', map, {
  url: 'https://services.arcgis.com/.../Census_Tracts_VTL/VectorTileServer'
});

// Create data-driven styling
const addChoroplethLayer = (dataField: string) => {
  map.addLayer({
    id: 'choropleth',
    type: 'fill',
    source: 'census-data',
    'source-layer': 'census_tracts',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', dataField],
        0, '#f7fbff',
        25000, '#deebf7', 
        50000, '#c6dbef',
        75000, '#9ecae1',
        100000, '#6baed6',
        125000, '#4292c6',
        150000, '#2171b5',
        175000, '#08519c',
        200000, '#08306b'
      ],
      'fill-opacity': 0.8
    }
  });

  // Add outline
  map.addLayer({
    id: 'choropleth-outline',
    type: 'line',
    source: 'census-data',
    'source-layer': 'census_tracts',
    paint: {
      'line-color': '#ffffff',
      'line-width': 0.5
    }
  });
};
```

### Layer Filtering

```typescript
// Dynamic filtering of vector tile layers
class VectorTileFilter {
  constructor(private map: Map, private layerId: string) {}

  filterByAttribute(field: string, value: any) {
    this.map.setFilter(this.layerId, ['==', field, value]);
  }

  filterByRange(field: string, min: number, max: number) {
    this.map.setFilter(this.layerId, [
      'all',
      ['>=', ['get', field], min],
      ['<=', ['get', field], max]
    ]);
  }

  filterByMultipleValues(field: string, values: any[]) {
    this.map.setFilter(this.layerId, ['in', ['get', field], ...values]);
  }

  clearFilter() {
    this.map.setFilter(this.layerId, null);
  }
}

// Usage
const filter = new VectorTileFilter(map, 'parcels-layer');
filter.filterByAttribute('LAND_USE', 'Residential');
filter.filterByRange('ACRES', 1, 10);
```

## Performance Tips

1. **Use appropriate zoom ranges** - Set `minzoom`/`maxzoom` to match data detail levels
2. **Layer ordering** - Place more detailed layers on top using `beforeId` parameter
3. **Filter efficiently** - Use vector tile filters instead of processing all features
4. **Style caching** - Cache service styles to avoid repeated requests
5. **Source layer names** - Always specify the correct `source-layer` from service metadata

## Error Handling

```typescript
const vectorService = new VectorTileService('error-handling', map, {
  url: 'https://services.arcgis.com/.../VectorTileServer'
});

// Handle style loading errors
try {
  const style = await vectorService.getStyle();
  
  if (!style['source-layer']) {
    throw new Error('Style missing source-layer information');
  }
  
  map.addLayer({
    id: 'vector-layer',
    type: style.type || 'fill', // Fallback type
    source: 'error-handling',
    'source-layer': style['source-layer'],
    layout: style.layout || {},
    paint: style.paint || {}
  });
  
} catch (error) {
  console.error('Style error:', error);
  
  // Fallback to basic styling
  map.addLayer({
    id: 'vector-layer',
    type: 'fill',
    source: 'error-handling',
    'source-layer': 'default_layer', // Known layer name
    paint: {
      'fill-color': '#088',
      'fill-opacity': 0.8
    }
  });
}

// Handle metadata loading errors
vectorService.getMetadata()
  .then(metadata => {
    if (!metadata.layers || metadata.layers.length === 0) {
      console.warn('Service has no available layers');
    }
  })
  .catch(error => {
    if (error.message.includes('404')) {
      console.error('Vector tile service not found');
    } else if (error.message.includes('CORS')) {
      console.error('Cross-origin request blocked');
    } else {
      console.error('Metadata error:', error);
    }
  });
```

## Comparison with Other Services

| Feature | VectorTileService | DynamicMapService | TiledMapService |
|---------|-------------------|-------------------|-----------------|
| **Data Type** | Vector geometry | Mixed content | Raster tiles |
| **Scalability** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Very Good |
| **Styling** | ⭐⭐⭐⭐⭐ Full control | ⭐⭐⭐ Limited | ⭐ Fixed |
| **Interactivity** | ⭐⭐⭐⭐⭐ Rich features | ⭐⭐⭐ Basic | ❌ None |
| **Bandwidth** | ⭐⭐⭐⭐ Efficient | ⭐⭐⭐ Variable | ⭐⭐⭐⭐ Efficient |

## Best Practices

- Use VectorTileService for **detailed datasets** that need crisp rendering at all scales
- Use DynamicMapService for **mixed content** and **real-time data**
- Use TiledMapService for **basemaps** and **static reference** layers
- Always specify the correct `source-layer` from service metadata
- Use data-driven styling for thematic mapping and visualization
- Implement proper error handling for style and metadata loading
- Test performance with realistic data volumes and zoom levels
- Consider bandwidth and client capabilities for mobile applications

---

*For more examples, see the [VectorTileService demo component](https://github.com/muimsd/esri-map-gl/blob/master/src/demo/components/VectorTileServiceDemo.tsx) in the repository.*