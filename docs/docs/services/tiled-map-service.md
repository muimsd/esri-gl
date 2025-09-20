# TiledMapService

The `TiledMapService` class provides access to ArcGIS Tiled Map Services, which are pre-rendered cached map tiles that offer fast performance and consistent styling. These services are ideal for basemaps and background layers.

## Key Features

- **Pre-cached tiles** - Fast loading from ArcGIS Server tile cache
- **High performance** - Optimized tile delivery with CDN support
- **Consistent styling** - Server-rendered tiles ensure visual consistency
- **Wide zoom ranges** - Supports detailed zoom levels when cached
- **Attribution support** - Automatic copyright text from service metadata

## Constructor

```typescript
new TiledMapService(sourceId: string, map: Map, esriOptions: TiledMapServiceOptions, sourceOptions?: RasterSourceOptions)
```

### Parameters

- **`sourceId`** (`string`) - Unique identifier for the MapLibre/Mapbox GL source
- **`map`** (`Map`) - MapLibre GL or Mapbox GL map instance
- **`esriOptions`** (`TiledMapServiceOptions`) - Esri service configuration
- **`sourceOptions`** (`RasterSourceOptions`, optional) - Additional raster source options

### TiledMapServiceOptions

```typescript
interface TiledMapServiceOptions extends EsriServiceOptions {
  url: string;                    // ArcGIS Tiled Map Service URL
  getAttributionFromService?: boolean; // Fetch attribution from service (default: true)
  fetchOptions?: RequestInit;     // Custom fetch options for metadata requests
}
```

### RasterSourceOptions

```typescript
interface RasterSourceOptions {
  tileSize?: number;     // Tile size in pixels (default: 256)
  attribution?: string;  // Custom attribution text
  bounds?: number[];     // Geographic bounds [west, south, east, north]
  minzoom?: number;     // Minimum zoom level
  maxzoom?: number;     // Maximum zoom level
}
```

## Basic Usage

```typescript
import { TiledMapService } from 'esri-gl';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  center: [-95.7129, 37.0902],
  zoom: 4
});

map.on('load', () => {
  // Create the tiled map service
  const tiledService = new TiledMapService('world-topo', map, {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
  });

  // Add a layer using the service source
  map.addLayer({
    id: 'topo-layer',
    type: 'raster',
    source: 'world-topo',
    paint: {
      'raster-opacity': 0.8
    }
  });
});
```

## Advanced Usage

### Custom Tile Size and Bounds

```typescript
const tiledService = new TiledMapService('custom-tiled', map, {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
}, {
  tileSize: 512,           // Use 512px tiles
  minzoom: 2,             // Minimum zoom level
  maxzoom: 18,            // Maximum zoom level
  bounds: [-180, -85, 180, 85] // World bounds
});
```

### Error Handling

```typescript
try {
  const tiledService = new TiledMapService('error-prone', map, {
    url: 'https://invalid-server.com/MapServer'
  });
  
  // Get service metadata with error handling
  tiledService.getMetadata()
    .then(metadata => {
      console.log('Service info:', metadata);
    })
    .catch(error => {
      console.error('Failed to load service metadata:', error);
    });
    
} catch (error) {
  console.error('Failed to create service:', error.message);
}
```

### Dynamic Layer Visibility

```typescript
let isVisible = true;

// Toggle layer visibility
function toggleTiledLayer() {
  isVisible = !isVisible;
  map.setLayoutProperty(
    'topo-layer', 
    'visibility', 
    isVisible ? 'visible' : 'none'
  );
}

// Control opacity
function setOpacity(opacity: number) {
  map.setPaintProperty('topo-layer', 'raster-opacity', opacity);
}
```

## Methods

### getMetadata()

Retrieves service metadata including attribution, spatial reference, and capabilities.

```typescript
tiledService.getMetadata()
  .then((metadata: ServiceMetadata) => {
    console.log('Copyright:', metadata.copyrightText);
    console.log('Spatial Reference:', metadata.spatialReference);
    console.log('Tile Info:', metadata.tileInfo);
  })
  .catch(error => {
    console.error('Metadata error:', error);
  });
```

### setAttributionFromService()

Updates map attribution with copyright text from the service.

```typescript
tiledService.setAttributionFromService()
  .then(() => {
    console.log('Attribution updated');
  })
  .catch(error => {
    console.error('Attribution error:', error);
  });
```

### update()

Updates the service source (primarily for testing and source management).

```typescript
tiledService.update();
```

### remove()

Removes the service source from the map.

```typescript
tiledService.remove(); // Removes 'world-topo' source
```

## Interactive Demo

```jsx
import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { TiledMapService } from 'esri-gl';

const TiledMapDemo = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const service = useRef(null);
  const [opacity, setOpacity] = useState(0.8);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: []
      },
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    map.current.on('load', () => {
      // Create tiled service
      service.current = new TiledMapService('world-topo', map.current, {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
      });

      // Add layer
      map.current.addLayer({
        id: 'topo-layer',
        type: 'raster',
        source: 'world-topo',
        paint: {
          'raster-opacity': opacity
        }
      });
    });

    return () => map.current?.remove();
  }, []);

  // Update opacity
  useEffect(() => {
    if (map.current && map.current.getLayer('topo-layer')) {
      map.current.setPaintProperty('topo-layer', 'raster-opacity', opacity);
    }
  }, [opacity]);

  // Toggle visibility
  const toggleVisibility = () => {
    setIsVisible(prev => {
      const next = !prev;
      if (map.current && map.current.getLayer('topo-layer')) {
        map.current.setLayoutProperty(
          'topo-layer', 
          'visibility', 
          next ? 'visible' : 'none'
        );
      }
      return next;
    });
  };

  return (
    <div style={{ position: 'relative', height: '400px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <button onClick={toggleVisibility}>
          {isVisible ? 'Hide' : 'Show'} Tiled Layer
        </button>
        <br />
        <label>
          Opacity: 
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={e => setOpacity(parseFloat(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
};
```

## Common Patterns

### Multiple Tiled Services

```typescript
const services = [
  {
    id: 'world-topo',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
    name: 'World Topographic'
  },
  {
    id: 'world-imagery',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    name: 'World Imagery'
  },
  {
    id: 'world-street',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
    name: 'World Street Map'
  }
];

services.forEach((config, index) => {
  const service = new TiledMapService(config.id, map, {
    url: config.url
  });

  map.addLayer({
    id: `${config.id}-layer`,
    type: 'raster',
    source: config.id,
    layout: {
      visibility: index === 0 ? 'visible' : 'none' // Show first by default
    }
  });
});
```

### Basemap Switcher

```typescript
class BasemapSwitcher {
  private activeBasemap = 'topo';
  private basemaps = new Map();

  constructor(private map: Map) {
    this.setupBasemaps();
  }

  private setupBasemaps() {
    const configs = [
      { id: 'topo', name: 'Topographic', url: '.../World_Topo_Map/MapServer' },
      { id: 'imagery', name: 'Imagery', url: '.../World_Imagery/MapServer' },
      { id: 'streets', name: 'Streets', url: '.../World_Street_Map/MapServer' }
    ];

    configs.forEach(config => {
      const service = new TiledMapService(config.id, this.map, {
        url: config.url
      });
      
      this.basemaps.set(config.id, service);
      
      this.map.addLayer({
        id: `${config.id}-layer`,
        type: 'raster',
        source: config.id,
        layout: {
          visibility: config.id === this.activeBasemap ? 'visible' : 'none'
        }
      });
    });
  }

  switchTo(basemapId: string) {
    // Hide current basemap
    this.map.setLayoutProperty(
      `${this.activeBasemap}-layer`,
      'visibility',
      'none'
    );

    // Show new basemap
    this.map.setLayoutProperty(
      `${basemapId}-layer`,
      'visibility',
      'visible'
    );

    this.activeBasemap = basemapId;
  }
}
```

## Performance Tips

1. **Use appropriate tile sizes** - Match your service's tile size (usually 256 or 512px)
2. **Set zoom bounds** - Limit zoom levels to available cached scales
3. **Cache metadata** - The service automatically caches metadata after first request
4. **Monitor attribution** - Enable `getAttributionFromService` for proper attribution

## Error Handling

```typescript
const tiledService = new TiledMapService('error-handling', map, {
  url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer'
});

// Handle metadata loading errors
tiledService.getMetadata()
  .then(metadata => {
    if (!metadata.singleFusedMapCache) {
      console.warn('Service is not tiled - consider using DynamicMapService instead');
    }
  })
  .catch(error => {
    if (error.message.includes('404')) {
      console.error('Service not found - check URL');
    } else if (error.message.includes('CORS')) {
      console.error('CORS error - service may not allow cross-origin requests');
    } else {
      console.error('Service error:', error);
    }
  });
```

## Comparison with Other Services

| Feature | TiledMapService | DynamicMapService | ImageService |
|---------|-----------------|-------------------|--------------|
| **Performance** | ⭐⭐⭐⭐⭐ Fast | ⭐⭐⭐ Moderate | ⭐⭐ Slower |
| **Customization** | ⭐⭐ Limited | ⭐⭐⭐⭐⭐ Full | ⭐⭐⭐⭐ High |
| **Data Freshness** | ⭐⭐ Cached | ⭐⭐⭐⭐⭐ Real-time | ⭐⭐⭐⭐⭐ Real-time |
| **Use Cases** | Basemaps, backgrounds | Dynamic layers | Analysis, imagery |

## Best Practices

- Use TiledMapService for **basemaps** and **background layers**
- Use DynamicMapService for **interactive layers** that need customization
- Always handle metadata loading errors gracefully
- Set appropriate zoom bounds to match cached scales
- Consider using multiple tiled services for basemap switching
- Monitor service health and provide fallback options

---

*For more examples, see the [TiledMapService demo component](https://github.com/muimsd/esri-map-gl/blob/master/src/demo/components/TiledMapServiceDemo.tsx) in the repository.*