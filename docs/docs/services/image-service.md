# ImageService

The `ImageService` class provides access to ArcGIS Image Services, which serve dynamic raster imagery with powerful analytical capabilities. Image Services support rendering rules, temporal data, mosaic rules, and pixel-level identify operations, making them ideal for satellite imagery, elevation data, and analytical rasters.

## Key Features

- **Dynamic rendering** - Server-side image processing with rendering rules
- **Temporal support** - Time-based data filtering and animation
- **Analytical capabilities** - Pixel-level identify and statistical analysis
- **Mosaic rules** - Control how overlapping rasters are composited
- **Multiple formats** - Support for JPG, PNG, TIFF, LERC, and other formats
- **Real-time updates** - Dynamic parameter changes without reloading

## Constructor

```typescript
new ImageService(sourceId: string, map: Map, esriOptions: ImageServiceOptions, sourceOptions?: RasterSourceOptions)
```

### Parameters

- **`sourceId`** (`string`) - Unique identifier for the MapLibre/Mapbox GL source
- **`map`** (`Map`) - MapLibre GL or Mapbox GL map instance  
- **`esriOptions`** (`ImageServiceOptions`) - Esri service configuration
- **`sourceOptions`** (`RasterSourceOptions`, optional) - Additional raster source options

### ImageServiceOptions

```typescript
interface ImageServiceOptions extends EsriServiceOptions {
  url: string;                         // ArcGIS Image Service URL
  renderingRule?: Record<string, any> | false;  // Rendering rule for image processing
  mosaicRule?: Record<string, any> | false;     // Mosaic rule for overlapping imagery
  bbox?: [number, number, number, number];      // Bounding box [west, south, east, north]
  size?: [number, number];             // Image size [width, height]
  bboxSR?: string;                     // Bounding box spatial reference
  imageSR?: string;                    // Output image spatial reference
  format?: 'jpgpng' | 'png' | 'jpg' | 'tiff' | 'lerc' | ...; // Image format
  time?: Date[] | number[] | false;   // Time extent for temporal data
  from?: Date | number;                // Time range start
  to?: Date | number;                  // Time range end
  getAttributionFromService?: boolean; // Fetch attribution (default: true)
  transparent?: boolean;               // Transparency support (default: true)
  dpi?: number;                       // Output resolution (default: 96)
  fetchOptions?: RequestInit;         // Custom fetch options
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
import { ImageService } from 'esri-gl';
import maplibregl from 'maplibre-gl';

const map = new maplibregl.Map({
  container: 'map',
  center: [-95.7129, 37.0902],
  zoom: 4
});

map.on('load', () => {
  // Create the image service
  const imageService = new ImageService('landsat-imagery', map, {
    url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
  });

  // Add a layer using the service source
  map.addLayer({
    id: 'landsat-layer',
    type: 'raster',
    source: 'landsat-imagery',
    paint: {
      'raster-opacity': 0.8
    }
  });
});
```

## Advanced Usage

### Rendering Rules

```typescript
const imageService = new ImageService('multispectral', map, {
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
  renderingRule: {
    rasterFunction: 'Natural Color',
    rasterFunctionArguments: {
      BandIds: [4, 3, 2]  // Red, Green, Blue bands
    }
  }
});

// Change rendering rule dynamically
imageService.setRenderingRule({
  rasterFunction: 'Color Infrared',
  rasterFunctionArguments: {
    BandIds: [5, 4, 3]  // Near-infrared, Red, Green
  }
});

// Apply NDVI calculation
imageService.setRenderingRule({
  rasterFunction: 'BandArithmetic',
  rasterFunctionArguments: {
    Method: 0,
    BandIndexes: '(b5 - b4) / (b5 + b4)'  // NDVI formula
  }
});
```

### Temporal Data

```typescript
// Create service with initial time range
const temporalService = new ImageService('temporal-data', map, {
  url: 'https://myserver.com/arcgis/rest/services/TemporalImagery/ImageServer',
  from: new Date('2020-01-01'),
  to: new Date('2020-12-31')
});

// Update time range dynamically
temporalService.setDate(
  new Date('2021-01-01'),
  new Date('2021-12-31')
);

// Animate through time
const animateTime = () => {
  const startYear = 2015;
  const endYear = 2023;
  let currentYear = startYear;

  const interval = setInterval(() => {
    imageService.setDate(
      new Date(`${currentYear}-01-01`),
      new Date(`${currentYear}-12-31`)
    );
    
    currentYear++;
    if (currentYear > endYear) {
      clearInterval(interval);
    }
  }, 1000); // Change every second
};
```

### Mosaic Rules

```typescript
const imageService = new ImageService('aerial-mosaic', map, {
  url: 'https://myserver.com/arcgis/rest/services/Aerial/ImageServer',
  mosaicRule: {
    mosaicMethod: 'esriMosaicNorthwest',  // Prioritize northwest images
    sortField: 'AcquisitionDate',         // Sort by date
    sortValue: '2023-06-01',             // Prefer images near this date
    ascending: false,                     // Most recent first
    mosaicOperation: 'MT_FIRST'          // Use first matching image
  }
});

// Update mosaic rule to get latest imagery
imageService.setMosaicRule({
  mosaicMethod: 'esriMosaicAttribute',
  sortField: 'AcquisitionDate',
  ascending: false,
  mosaicOperation: 'MT_FIRST'
});
```

### Pixel Identification

```typescript
// Click handler for pixel identification
map.on('click', async (e) => {
  try {
    const results = await imageService.identify({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat
    }, true); // Return geometry
    
    if (results.value !== 'NoData') {
      console.log('Pixel value:', results.value);
      console.log('Location:', results.location);
      console.log('Properties:', results.properties);
    }
  } catch (error) {
    console.error('Identify failed:', error);
  }
});
```

## Methods

### setRenderingRule(rule)

Applies a rendering rule to dynamically change how the imagery is processed and displayed.

```typescript
// Natural color composite
imageService.setRenderingRule({
  rasterFunction: 'Composite',
  rasterFunctionArguments: {
    BandIds: [4, 3, 2]
  }
});

// Stretch enhancement
imageService.setRenderingRule({
  rasterFunction: 'Stretch',
  rasterFunctionArguments: {
    StretchType: 0,      // StandardDeviations
    NumberOfStandardDeviations: 2,
    DRA: true            // Dynamic Range Adjustment
  }
});

// Clear rendering rule (use default)
imageService.setRenderingRule(false);
```

### setMosaicRule(rule)

Controls how overlapping rasters are combined in multi-raster image services.

```typescript
// Get imagery closest to a specific date
imageService.setMosaicRule({
  mosaicMethod: 'esriMosaicAttribute',
  sortField: 'AcquisitionDate',
  sortValue: '2023-08-15',
  ascending: true,
  mosaicOperation: 'MT_FIRST'
});

// Seamline mosaic for best visual result  
imageService.setMosaicRule({
  mosaicMethod: 'esriMosaicSeamline',
  mosaicOperation: 'MT_BLEND'
});
```

### setDate(from, to)

Updates the temporal filter for time-enabled image services.

```typescript
// Set specific time range
imageService.setDate(
  new Date('2023-01-01'),
  new Date('2023-12-31')
);

// Use timestamp numbers
imageService.setDate(1672531200000, 1704067199000);

// Single time instant
imageService.setDate(new Date('2023-06-15'), new Date('2023-06-15'));
```

### identify(lngLat, returnGeometry)

Performs a pixel-level identify operation to get raster values at a point.

```typescript
const result = await imageService.identify(
  { lng: -118.2437, lat: 34.0522 },
  true // Return geometry
);

console.log('Pixel value:', result.value);
console.log('Catalogues:', result.catalogItems);
```

### getMetadata()

Retrieves comprehensive service metadata including bands, statistics, and capabilities.

```typescript
const metadata = await imageService.getMetadata();

console.log('Band count:', metadata.bandCount);
console.log('Pixel type:', metadata.pixelType);
console.log('Extent:', metadata.extent);
console.log('Spatial reference:', metadata.spatialReference);
```

### update()

Forces a refresh of the image source with current parameters.

```typescript
imageService.update(); // Refresh tiles with current settings
```

### remove()

Removes the service source from the map.

```typescript
imageService.remove(); // Removes 'landsat-imagery' source
```

## Interactive Demo

```jsx
import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { ImageService } from 'esri-gl';

const ImageServiceDemo = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const service = useRef(null);
  const [renderingRule, setRenderingRule] = useState('Natural Color');
  const [opacity, setOpacity] = useState(0.8);

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
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    map.current.on('load', () => {
      service.current = new ImageService('landsat', map.current, {
        url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
      });

      map.current.addLayer({
        id: 'landsat-layer',
        type: 'raster',
        source: 'landsat',
        paint: { 'raster-opacity': opacity }
      });
    });

    // Click handler for pixel identification
    map.current.on('click', async (e) => {
      if (service.current) {
        try {
          const result = await service.current.identify({
            lng: e.lngLat.lng,
            lat: e.lngLat.lat
          });
          console.log('Pixel value:', result);
        } catch (error) {
          console.error('Identify error:', error);
        }
      }
    });

    return () => map.current?.remove();
  }, []);

  // Update rendering rule
  useEffect(() => {
    if (service.current) {
      const rules = {
        'Natural Color': { rasterFunction: 'Natural Color' },
        'Color Infrared': { rasterFunction: 'Color Infrared' },
        'NDVI': { 
          rasterFunction: 'BandArithmetic',
          rasterFunctionArguments: {
            Method: 0,
            BandIndexes: '(b5 - b4) / (b5 + b4)'
          }
        }
      };
      service.current.setRenderingRule(rules[renderingRule] || false);
    }
  }, [renderingRule]);

  // Update opacity
  useEffect(() => {
    if (map.current && map.current.getLayer('landsat-layer')) {
      map.current.setPaintProperty('landsat-layer', 'raster-opacity', opacity);
    }
  }, [opacity]);

  return (
    <div style={{ position: 'relative', height: '400px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <div>
          <label>Rendering Rule:</label>
          <select 
            value={renderingRule}
            onChange={e => setRenderingRule(e.target.value)}
          >
            <option>Natural Color</option>
            <option>Color Infrared</option>
            <option>NDVI</option>
          </select>
        </div>
        <div>
          <label>Opacity:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={e => setOpacity(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};
```

## Common Patterns

### Multi-Band Analysis

```typescript
const analysisService = new ImageService('analysis', map, {
  url: 'https://myserver.com/arcgis/rest/services/Multispectral/ImageServer'
});

// Function to apply different band combinations
const applyBandCombination = (bands, name) => {
  analysisService.setRenderingRule({
    rasterFunction: 'Composite',
    rasterFunctionArguments: {
      BandIds: bands
    }
  });
  console.log(`Applied ${name} band combination:`, bands);
};

// Predefined band combinations
const combinations = {
  'True Color': [3, 2, 1],      // RGB
  'False Color': [4, 3, 2],     // NIR, Red, Green  
  'Color Infrared': [5, 4, 3],  // SWIR, NIR, Red
  'Agriculture': [6, 5, 2],     // SWIR, NIR, Blue
  'Urban': [7, 6, 4]            // SWIR2, SWIR1, NIR
};

// Apply combinations dynamically
Object.entries(combinations).forEach(([name, bands]) => {
  // applyBandCombination(bands, name);
});
```

### Time Series Visualization

```typescript
class TimeSeriesPlayer {
  private currentIndex = 0;
  private isPlaying = false;
  
  constructor(
    private service: ImageService,
    private dates: Date[]
  ) {}

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    const playInterval = setInterval(() => {
      const currentDate = this.dates[this.currentIndex];
      
      this.service.setDate(currentDate, currentDate);
      this.currentIndex = (this.currentIndex + 1) % this.dates.length;
      
      if (!this.isPlaying) {
        clearInterval(playInterval);
      }
    }, 500);
  }

  stop() {
    this.isPlaying = false;
  }

  goToDate(date: Date) {
    this.service.setDate(date, date);
  }
}

// Usage
const monthlyDates = Array.from({ length: 12 }, (_, i) => 
  new Date(2023, i, 1)
);

const player = new TimeSeriesPlayer(imageService, monthlyDates);
player.play(); // Start animation
```

### Statistical Analysis

```typescript
// Create a class for statistical operations
class ImageStatistics {
  constructor(private service: ImageService) {}

  async getPixelValue(lng: number, lat: number) {
    try {
      const result = await this.service.identify({ lng, lat });
      return result.value;
    } catch (error) {
      console.error('Failed to get pixel value:', error);
      return null;
    }
  }

  async samplePixels(points: Array<{ lng: number, lat: number }>) {
    const values = await Promise.all(
      points.map(point => this.getPixelValue(point.lng, point.lat))
    );
    
    return values.filter(v => v !== null && v !== 'NoData');
  }

  calculateStatistics(values: number[]) {
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, min, max, stdDev, count: values.length };
  }
}
```

## Performance Tips

1. **Use appropriate formats** - JPG for photos, PNG for transparency, LERC for scientific data
2. **Optimize tile size** - Match your service's tile cache (256 or 512px typically)
3. **Cache rendering rules** - Complex rules can be computationally expensive
4. **Limit temporal queries** - Use reasonable time ranges to avoid large datasets
5. **Handle errors gracefully** - Network issues and service limits are common

## Error Handling

```typescript
const imageService = new ImageService('error-handling', map, {
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
});

// Handle rendering rule errors
try {
  imageService.setRenderingRule({
    rasterFunction: 'NonexistentFunction'
  });
} catch (error) {
  console.error('Invalid rendering rule:', error);
  // Fallback to default
  imageService.setRenderingRule(false);
}

// Handle identify errors
map.on('click', async (e) => {
  try {
    const result = await imageService.identify({
      lng: e.lngLat.lng,
      lat: e.lngLat.lat
    });
    
    if (result.error) {
      console.warn('Service error:', result.error);
    } else {
      console.log('Pixel data:', result);
    }
  } catch (error) {
    if (error.message.includes('404')) {
      console.error('Service endpoint not found');
    } else if (error.message.includes('timeout')) {
      console.error('Request timed out - service may be busy');
    } else {
      console.error('Identify failed:', error);
    }
  }
});

// Handle metadata loading
imageService.getMetadata()
  .then(metadata => {
    if (!metadata.capabilities.includes('Image')) {
      console.warn('Service does not support imaging operations');
    }
  })
  .catch(error => {
    console.error('Could not load service metadata:', error);
  });
```

## Comparison with Other Services

| Feature | ImageService | DynamicMapService | TiledMapService |
|---------|--------------|-------------------|-----------------|
| **Data Type** | Raster imagery | Vector + Raster | Cached tiles |
| **Customization** | ⭐⭐⭐⭐⭐ Full | ⭐⭐⭐⭐ High | ⭐ Limited |
| **Performance** | ⭐⭐⭐ Variable | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐⭐ Fast |
| **Analysis** | ⭐⭐⭐⭐⭐ Full | ⭐⭐ Basic | ❌ None |
| **Temporal** | ⭐⭐⭐⭐⭐ Full | ⭐⭐⭐ Limited | ❌ None |

## Best Practices

- Use ImageService for **satellite imagery**, **elevation data**, and **analytical rasters**
- Use DynamicMapService for **mixed content** (vector + raster) layers  
- Use TiledMapService for **basemaps** and **cached reference** layers
- Always handle pixel identify operations asynchronously
- Cache commonly used rendering rules for better performance
- Use appropriate image formats based on data type (scientific vs. visual)
- Test temporal queries with reasonable date ranges
- Monitor service capabilities and adjust functionality accordingly

---

*For more examples, see the [ImageService demo component](https://github.com/muimsd/esri-map-gl/blob/master/src/demo/components/ImageServiceDemo.tsx) in the repository.*