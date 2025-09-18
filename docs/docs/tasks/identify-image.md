# IdentifyImage Task

Query pixel values and analytical information from ArcGIS Image Services at specific geographic locations. Perfect for extracting elevation, temperature, precipitation, and other raster data values.

## Constructor

```typescript
new IdentifyImage(options)
identifyImage(options) // Convenience function
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the Image Service |
| token | `string` | | Authentication token |
| fetchOptions | `object` | | Additional fetch request options |

## Chainable Methods

### `.at(lngLat)`
Set the geographic location for identification.

```typescript
task.at({ lng: -118.2437, lat: 34.0522 })
task.at([-118.2437, 34.0522]) // Array format also supported
```

### `.format(format)`
Set the output format for results.

| Format | Description |
|--------|-------------|
| `'json'` | JSON response (default) |
| `'image'` | Image response for visualization |

### `.mosaic(mosaicRule)`
Apply mosaic rule for multi-temporal datasets.

```typescript
task.mosaic({
  mosaicMethod: 'esriMosaicLockRaster',
  lockRasterIds: [1, 2, 3]
})
```

### `.pixelSize(size)`
Set pixel size for analysis.

```typescript
task.pixelSize({ x: 30, y: 30 }) // 30m resolution
```

### `.rendering(renderingRule)`
Apply rendering rule for analytical processing.

```typescript
task.rendering({
  rasterFunction: 'Stretch',
  rasterFunctionArguments: {
    StretchType: 6,
    NumberOfStandardDeviations: 2
  }
})
```

## Usage Examples

### Basic Elevation Query

```typescript
import { identifyImage } from 'esri-gl';

// Get elevation at a specific point
const elevation = await identifyImage({
  url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
}).at({ lng: -118.2437, lat: 34.0522 });

console.log(`Elevation: ${elevation.value} meters`);
```

### Multi-band Image Analysis

```typescript
// Analyze multi-spectral satellite imagery
const satelliteTask = new IdentifyImage({
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
});

const spectralData = await satelliteTask
  .at([-122.4194, 37.7749])
  .rendering({
    rasterFunction: 'None' // Get raw band values
  });

console.log('Spectral bands:', spectralData.properties);
```

### Weather Data Query

```typescript
// Get temperature from weather raster
const temperature = await identifyImage({
  url: 'https://services.arcgisonline.com/arcgis/rest/services/Specialty/Temp/ImageServer'
})
.at({ lng: -95, lat: 40 })
.mosaic({
  mosaicMethod: 'esriMosaicAttribute',
  sortField: 'Date',
  sortValue: '2023-12-01'
});

console.log(`Temperature: ${temperature.value}°C`);
```

### Time-Series Analysis

```typescript
class TimeSeriesAnalyzer {
  private imageService: string;
  private location: [number, number];

  constructor(serviceUrl: string, location: [number, number]) {
    this.imageService = serviceUrl;
    this.location = location;
  }

  async getValueAtDates(dates: string[]) {
    const results = [];
    
    for (const date of dates) {
      const value = await identifyImage({
        url: this.imageService
      })
      .at(this.location)
      .mosaic({
        mosaicMethod: 'esriMosaicAttribute',
        sortField: 'AcquisitionDate',
        sortValue: date
      });
      
      results.push({
        date,
        value: value.value,
        properties: value.properties
      });
    }
    
    return results;
  }

  async getTrendAnalysis(startDate: string, endDate: string) {
    const monthlyDates = this.generateMonthlyDates(startDate, endDate);
    const values = await this.getValueAtDates(monthlyDates);
    
    return {
      data: values,
      trend: this.calculateTrend(values),
      statistics: this.calculateStats(values)
    };
  }

  private generateMonthlyDates(start: string, end: string): string[] {
    const dates = [];
    const current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setMonth(current.getMonth() + 1);
    }
    
    return dates;
  }

  private calculateTrend(values: any[]): 'increasing' | 'decreasing' | 'stable' {
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, v) => sum + v.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v.value, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'increasing' : 'decreasing';
  }

  private calculateStats(values: any[]) {
    const nums = values.map(v => v.value);
    return {
      min: Math.min(...nums),
      max: Math.max(...nums),
      avg: nums.reduce((a, b) => a + b, 0) / nums.length,
      stdDev: this.standardDeviation(nums)
    };
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b) / values.length);
  }
}

// Usage
const analyzer = new TimeSeriesAnalyzer(
  'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer',
  [-118.2437, 34.0522]
);

const trend = await analyzer.getTrendAnalysis('2020-01-01', '2023-12-31');
console.log('Trend analysis:', trend);
```

### Batch Location Analysis

```typescript
// Analyze multiple locations efficiently
const batchIdentify = async (locations: Array<[number, number]>, serviceUrl: string) => {
  const results = await Promise.all(
    locations.map(async ([lng, lat]) => {
      try {
        const result = await identifyImage({ url: serviceUrl })
          .at({ lng, lat });
        
        return {
          location: [lng, lat],
          value: result.value,
          success: true
        };
      } catch (error) {
        return {
          location: [lng, lat],
          error: error.message,
          success: false
        };
      }
    })
  );

  return {
    successful: results.filter(r => r.success),
    failed: results.filter(r => !r.success),
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
};

// Usage
const locations: Array<[number, number]> = [
  [-118.2437, 34.0522], // Los Angeles
  [-74.0060, 40.7128],  // New York
  [-87.6298, 41.8781],  // Chicago
  [-122.4194, 37.7749]  // San Francisco
];

const elevations = await batchIdentify(
  locations,
  'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
);

console.log('Elevation analysis:', elevations);
```

## Integration Patterns

### With React Hooks

```tsx
import React, { useState, useCallback } from 'react';
import { identifyImage } from 'esri-gl';

const useImageIdentify = (serviceUrl: string) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const identify = useCallback(async (lngLat: [number, number]) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await identifyImage({ url: serviceUrl }).at(lngLat);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceUrl]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { identify, result, loading, error, reset };
};

// Component usage
const ElevationTool: React.FC = () => {
  const { identify, result, loading, error } = useImageIdentify(
    'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
  );

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    identify([e.lngLat.lng, e.lngLat.lat]);
  }, [identify]);

  return (
    <div>
      <p>Click on the map to get elevation</p>
      {loading && <p>Querying elevation...</p>}
      {error && <p>Error: {error}</p>}
      {result && (
        <div>
          <h3>Elevation Data</h3>
          <p>Value: {result.value} meters</p>
          <p>Location: {result.location?.x}, {result.location?.y}</p>
        </div>
      )}
    </div>
  );
};
```

### Map Integration

```typescript
import { Map, Popup } from 'maplibre-gl';
import { identifyImage } from 'esri-gl';

class ImageIdentifyControl {
  private map: Map;
  private popup: Popup;
  private services: Array<{ name: string; url: string; unit?: string }>;

  constructor(map: Map) {
    this.map = map;
    this.popup = new Popup({ closeOnClick: false });
    this.services = [
      {
        name: 'Elevation',
        url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
        unit: 'm'
      },
      {
        name: 'Temperature',
        url: 'https://services.arcgisonline.com/arcgis/rest/services/Specialty/Temp/ImageServer',
        unit: '°C'
      }
    ];

    this.addClickHandler();
  }

  private addClickHandler() {
    this.map.on('click', async (e) => {
      this.popup
        .setLngLat(e.lngLat)
        .setHTML('<div>Querying data...</div>')
        .addTo(this.map);

      try {
        const results = await this.queryAllServices(e.lngLat);
        this.popup.setHTML(this.formatResults(results));
      } catch (error) {
        this.popup.setHTML(`<div>Error: ${error.message}</div>`);
      }
    });
  }

  private async queryAllServices(lngLat: any) {
    const promises = this.services.map(async service => {
      try {
        const result = await identifyImage({ url: service.url }).at(lngLat);
        return {
          name: service.name,
          value: result.value,
          unit: service.unit || '',
          success: true
        };
      } catch (error) {
        return {
          name: service.name,
          error: error.message,
          success: false
        };
      }
    });

    return await Promise.all(promises);
  }

  private formatResults(results: any[]): string {
    const html = results.map(result => {
      if (result.success) {
        return `<p><strong>${result.name}:</strong> ${result.value}${result.unit}</p>`;
      } else {
        return `<p><strong>${result.name}:</strong> Error - ${result.error}</p>`;
      }
    }).join('');

    return `<div class="identify-results">${html}</div>`;
  }
}

// Initialize
const identifyControl = new ImageIdentifyControl(map);
```

## Response Format

The identify response includes:

```typescript
interface IdentifyImageResult {
  value: number;           // Pixel value
  location?: {             // Query location
    x: number;
    y: number;
    spatialReference: any;
  };
  properties?: {           // Additional metadata
    [key: string]: any;
  };
}
```

## Error Handling

```typescript
const robustIdentify = async (lngLat: [number, number], serviceUrl: string) => {
  try {
    const result = await identifyImage({ url: serviceUrl })
      .at(lngLat)
      .timeout(10000); // 10 second timeout

    // Validate result
    if (result.value === null || result.value === undefined) {
      throw new Error('No data available at this location');
    }

    return result;
  } catch (error) {
    if (error.message.includes('timeout')) {
      console.error('Request timed out, service may be slow');
    } else if (error.message.includes('404')) {
      console.error('Service not found or unavailable');
    } else {
      console.error('Identify error:', error.message);
    }
    
    // Return null or default value
    return null;
  }
};
```

## Best Practices

1. **Handle NoData Values**: Check for null/undefined values in responses
2. **Use Appropriate Pixel Size**: Match analysis needs with resolution
3. **Batch Requests**: Group multiple nearby locations for efficiency  
4. **Error Handling**: Always implement timeout and error recovery
5. **Caching**: Cache results for repeated queries at same locations
6. **Performance**: Use mosaic rules to query specific time periods efficiently

## Common Use Cases

- **Elevation Profiles**: Query elevation along a path
- **Environmental Monitoring**: Track temperature, precipitation over time
- **Agricultural Analysis**: Monitor crop health with NDVI data
- **Urban Planning**: Analyze land surface temperature in cities
- **Climate Studies**: Extract weather data for research
- **Route Planning**: Get terrain difficulty for hiking/cycling routes