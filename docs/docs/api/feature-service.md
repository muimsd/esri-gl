# FeatureService

<iframe src="/examples/dashboard-example.html" width="100%" height="400" frameBorder="0" style={{border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px'}}></iframe>

For accessing [ArcGIS Feature Services](https://developers.arcgis.com/rest/services-reference/feature-service.htm) that provide GeoJSON-compatible vector features with intelligent vector tile detection and automatic fallback.

## Constructor

| Argument             | Type     | Description                                 |
| -------------------- | -------- | ------------------------------------------- |
| id                   | `string` | An id to assign to the MapLibre GL source   |
| map                  | `Map`    | A MapLibre GL or Mapbox GL map instance     |
| esriServiceOptions   | `object` | Options for the Feature Service (see below) |
| geoJsonSourceOptions | `object` | Optional MapLibre GL GeoJSON source options |

## Esri Service Options

| Option             | Type                      | Default                      | Description                                                      |
| ------------------ | ------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| url                | `string`                  |                              | **Required** URL of the FeatureService layer                     |
| where              | `string`                  | `'1=1'`                      | SQL WHERE clause to filter features                              |
| outFields          | `Array<string> \| string` | `'*'`                        | Fields to include in response                                    |
| geometry           | `object`                  |                              | Geometry to spatially filter features                            |
| geometryType       | `string`                  |                              | Type of geometry filter                                          |
| spatialRel         | `string`                  | `'esriSpatialRelIntersects'` | Spatial relationship                                             |
| outSR              | `number`                  | `4326`                       | Output spatial reference                                         |
| returnGeometry     | `boolean`                 | `true`                       | Include geometry in response                                     |
| maxRecordCount     | `number`                  |                              | Maximum features to return                                       |
| resultOffset       | `number`                  |                              | Starting record for pagination                                   |
| orderByFields      | `string`                  |                              | Fields to sort results by                                        |
| token              | `string`                  |                              | Authentication token                                             |
| fetchOptions       | `object`                  |                              | Fetch request options                                            |
| **useVectorTiles** | `boolean`                 | `false`                      | **NEW** Enable smart vector tile detection with GeoJSON fallback |
| **useBoundingBox** | `boolean`                 | `true`                       | **NEW** Enable viewport-based data loading for performance       |

## Advanced Features

### Smart Vector Tile Detection

The FeatureService automatically detects if vector tiles are available for the service and falls back to GeoJSON if not:

```typescript
import { FeatureService } from 'esri-gl';

const service = new FeatureService('parcels-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  useVectorTiles: true, // Automatically detects vector tile support
  useBoundingBox: true, // Optimize with viewport filtering
  where: "STATUS = 'Active'",
  outFields: '*',
});

// The service will:
// 1. Check for VectorTileServer endpoint
// 2. Test various URL patterns
// 3. Fall back to GeoJSON if vector tiles unavailable
// 4. Log the decision process to console
```

### Bounding Box Filtering

Optimize performance by only loading features in the current viewport:

```typescript
const optimizedService = new FeatureService('big-dataset-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  useBoundingBox: true, // Only load features in viewport
  maxRecordCount: 1000, // Limit records per request
  where: 'STATUS = "Active"', // Server-side filtering
  outFields: ['OBJECTID', 'NAME', 'STATUS'], // Limit fields
});

// Automatically updates when map moves
map.on('moveend', () => {
  // Service automatically refreshes with new bbox
});
```

## Methods

| Method                              | Returns                              | Description                           |
| ----------------------------------- | ------------------------------------ | ------------------------------------- |
| `query(options?)`                   | `Promise<GeoJSON.FeatureCollection>` | Query features with custom parameters |
| `updateQuery(options)`              | `void`                               | Update query parameters and refresh   |
| `refresh()`                         | `void`                               | Refresh data from service             |
| `setBoundingBox(enabled)`           | `void`                               | Enable/disable bounding box filtering |
| `identify(lngLat, returnGeometry?)` | `Promise<IdentifyResult[]>`          | Identify features at point            |
| `remove()`                          | `void`                               | Remove service and clean up resources |

## Usage Examples

### Basic Implementation

```typescript
import { Map } from 'maplibre-gl';
import { FeatureService } from 'esri-gl';

const map = new Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-95, 37],
  zoom: 4,
});

map.on('load', () => {
  // US States with basic configuration
  const statesService = new FeatureService('states-source', map, {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
    where: '1=1',
    outFields: ['STATE_NAME', 'POP2000', 'AREA'],
  });

  map.addLayer({
    id: 'states-fill',
    type: 'fill',
    source: 'states-source',
    paint: {
      'fill-color': '#007cbf',
      'fill-opacity': 0.5,
    },
  });

  map.addLayer({
    id: 'states-stroke',
    type: 'line',
    source: 'states-source',
    paint: {
      'line-color': '#004494',
      'line-width': 2,
    },
  });
});
```

### High-Performance Large Datasets

```typescript
// Optimized for large datasets with millions of features
const parcelsService = new FeatureService('parcels-source', map, {
  url: 'https://services.arcgis.com/.../Parcels/FeatureServer/0',
  useVectorTiles: true, // Try vector tiles first for performance
  useBoundingBox: true, // Only load viewport data
  maxRecordCount: 2000, // Reasonable chunk size
  where: "ZONING NOT IN ('VAC', 'UND')", // Filter server-side
  outFields: ['OBJECTID', 'PARCEL_ID', 'OWNER', 'ADDRESS', 'ZONING', 'ACRES', 'ASSESSED_VALUE'],
  orderByFields: 'ASSESSED_VALUE DESC', // Load high-value parcels first
});

// Add layers with zoom-based visibility
map.addLayer({
  id: 'parcels-overview',
  type: 'fill',
  source: 'parcels-source',
  maxzoom: 12, // Only show overview at low zoom
  paint: {
    'fill-color': [
      'case',
      ['>', ['get', 'ASSESSED_VALUE'], 1000000],
      '#ff4444',
      ['>', ['get', 'ASSESSED_VALUE'], 500000],
      '#ff8844',
      '#44aaff',
    ],
    'fill-opacity': 0.6,
  },
});

map.addLayer({
  id: 'parcels-detailed',
  type: 'fill',
  source: 'parcels-source',
  minzoom: 12, // Detailed view at high zoom
  paint: {
    'fill-color': ['get', 'ZONING'],
    'fill-opacity': 0.7,
  },
});
```

### Dynamic Filtering and Updates

```typescript
class FeatureServiceManager {
  private service: FeatureService;
  private map: Map;

  constructor(map: Map, serviceUrl: string) {
    this.map = map;
    this.service = new FeatureService('dynamic-source', map, {
      url: serviceUrl,
      useVectorTiles: true,
      useBoundingBox: true,
      where: '1=1',
      outFields: '*',
    });
  }

  // Update filters dynamically
  updateFilters(whereClause: string) {
    this.service.updateQuery({
      where: whereClause,
    });
  }

  // Toggle bounding box optimization
  toggleBoundingBox(enabled: boolean) {
    this.service.setBoundingBox(enabled);
  }

  // Search for specific features
  async search(searchText: string, field: string = 'NAME') {
    const results = await this.service.query({
      where: `${field} LIKE '%${searchText}%'`,
      returnGeometry: true,
      maxRecordCount: 50,
    });

    // Zoom to results
    if (results.features.length > 0) {
      const bounds = this.calculateBounds(results);
      this.map.fitBounds(bounds);
    }

    return results;
  }

  // Feature identification
  async identifyAt(lngLat: [number, number]) {
    const results = await this.service.identify(lngLat, true);

    // Show popup with results
    if (results.length > 0) {
      const feature = results[0];
      new maplibregl.Popup()
        .setLngLat(lngLat)
        .setHTML(this.formatFeaturePopup(feature))
        .addTo(this.map);
    }

    return results;
  }

  private calculateBounds(featureCollection: GeoJSON.FeatureCollection) {
    // Calculate bounds from feature collection
    // Implementation here...
  }

  private formatFeaturePopup(feature: any) {
    return `
      <div class="feature-popup">
        <h3>${feature.attributes.NAME || 'Feature'}</h3>
        ${Object.entries(feature.attributes)
          .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
          .join('')}
      </div>
    `;
  }
}

// Usage
const featureManager = new FeatureServiceManager(
  map,
  'https://services.arcgis.com/.../FeatureServer/0'
);

// Update filters based on user input
document.getElementById('filter-input').addEventListener('input', e => {
  const value = e.target.value;
  featureManager.updateFilters(`NAME LIKE '%${value}%'`);
});

// Click to identify
map.on('click', e => {
  featureManager.identifyAt([e.lngLat.lng, e.lngLat.lat]);
});
```

### Vector Tile vs GeoJSON Comparison

```typescript
// The service automatically chooses the best format
const smartService = new FeatureService('smart-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  useVectorTiles: true, // Enables smart detection
  useBoundingBox: true,
});

// Monitor what format is being used
map.on('sourcedata', e => {
  if (e.sourceId === 'smart-source' && e.isSourceLoaded) {
    const source = map.getSource('smart-source');
    console.log('Source type:', source.type); // 'vector' or 'geojson'

    // Vector tiles provide:
    // - Better performance for large datasets
    // - Client-side styling capabilities
    // - Smooth zoom interactions

    // GeoJSON provides:
    // - Feature properties access
    // - Better popup/identify support
    // - Dynamic filtering capabilities
  }
});
```

### Temporal Data Visualization

```typescript
// Time-enabled feature service
const timeEnabledService = new FeatureService('temporal-source', map, {
  url: 'https://services.arcgis.com/.../TimeEnabledFeatureServer/0',
  useVectorTiles: true,
  useBoundingBox: true,
  where: "DATE_FIELD >= date '2023-01-01' AND DATE_FIELD < date '2024-01-01'",
  outFields: '*',
  orderByFields: 'DATE_FIELD',
});

// Time slider integration
class TimeSlider {
  constructor(service: FeatureService) {
    this.service = service;
    this.setupSlider();
  }

  setupSlider() {
    const slider = document.getElementById('time-slider') as HTMLInputElement;
    slider.addEventListener('input', e => {
      const year = parseInt(e.target.value);
      this.updateTimeFilter(year);
    });
  }

  updateTimeFilter(year: number) {
    const whereClause = `DATE_FIELD >= date '${year}-01-01' AND DATE_FIELD < date '${year + 1}-01-01'`;
    this.service.updateQuery({ where: whereClause });
  }
}

const timeSlider = new TimeSlider(timeEnabledService);
```

## Performance Optimization

### Memory Management

```typescript
class OptimizedFeatureService {
  private service: FeatureService;
  private dataCache = new Map<string, GeoJSON.FeatureCollection>();
  private currentZoom = 0;

  constructor(map: Map, url: string) {
    this.service = new FeatureService('optimized-source', map, {
      url,
      useVectorTiles: true,
      useBoundingBox: true,
    });

    // Monitor zoom changes for level-of-detail
    map.on('zoomend', () => {
      this.handleZoomChange(map.getZoom());
    });
  }

  private handleZoomChange(newZoom: number) {
    const zoomDiff = Math.abs(newZoom - this.currentZoom);

    if (zoomDiff > 2) {
      // Significant zoom change, adjust detail level
      const maxRecordCount = newZoom > 12 ? 5000 : 1000;
      const outFields = newZoom > 15 ? '*' : ['OBJECTID', 'NAME'];

      this.service.updateQuery({
        maxRecordCount,
        outFields,
      });
    }

    this.currentZoom = newZoom;
  }

  cleanup() {
    this.service.remove();
    this.dataCache.clear();
  }
}
```

### Clustering for Point Features

```typescript
// For point feature services, add clustering
const pointService = new FeatureService(
  'points-source',
  map,
  {
    url: 'https://services.arcgis.com/.../PointFeatureServer/0',
    useVectorTiles: false, // Use GeoJSON for clustering
    useBoundingBox: true,
    maxRecordCount: 10000,
  },
  {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  }
);

// Add cluster layers
map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'points-source',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 20, '#f1f075', 50, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 20, 30, 50, 40],
  },
});

map.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  source: 'points-source',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12,
  },
});

map.addLayer({
  id: 'unclustered-point',
  type: 'circle',
  source: 'points-source',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 4,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff',
  },
});
```

## Error Handling

```typescript
const createRobustFeatureService = async (map: Map, url: string) => {
  try {
    const service = new FeatureService('robust-source', map, {
      url,
      useVectorTiles: true,
      useBoundingBox: true,
      maxRecordCount: 1000,
    });

    // Monitor source events
    map.on('sourcedata', e => {
      if (e.sourceId === 'robust-source') {
        if (e.isSourceLoaded) {
          console.log('✓ Features loaded successfully');
        }
      }
    });

    map.on('error', e => {
      console.error('✗ Feature service error:', e);

      // Implement fallback strategy
      if (e.error?.message?.includes('vector tiles')) {
        console.log('Falling back to GeoJSON...');
        service.updateQuery({ useVectorTiles: false });
      }
    });

    return service;
  } catch (error) {
    console.error('Failed to create feature service:', error);

    // Return null or fallback service
    return null;
  }
};

// Usage with error handling
const service = await createRobustFeatureService(
  map,
  'https://services.arcgis.com/.../FeatureServer/0'
);

if (service) {
  // Proceed with service
  map.addLayer({
    id: 'features-layer',
    type: 'fill',
    source: 'robust-source',
    paint: { 'fill-color': '#007cbf' },
  });
} else {
  // Show error message to user
  console.log('Failed to load data source');
}
```

## Best Practices

1. **Vector Tile Detection**: Always enable `useVectorTiles: true` for better performance when available
2. **Bounding Box Filtering**: Use `useBoundingBox: true` for large datasets to improve loading times
3. **Field Selection**: Specify `outFields` to only load necessary data
4. **Server-side Filtering**: Use `where` clauses to filter data at the server level
5. **Zoom-based Detail**: Adjust `maxRecordCount` and field selection based on zoom level
6. **Memory Management**: Always call `remove()` when cleaning up services
7. **Error Handling**: Implement fallback strategies for network or service failures

## Troubleshooting

### Common Issues

**Problem**: "useVectorTiles is true but the layer is still using geojson"  
**Solution**: This is expected behavior - most FeatureServers don't have VectorTileServer endpoints. The automatic fallback is working correctly.

**Problem**: Features not updating when map moves  
**Solution**: Ensure `useBoundingBox: true` is set and check console for any errors

**Problem**: Poor performance with large datasets  
**Solution**: Enable bounding box filtering, reduce `maxRecordCount`, and limit `outFields`

**Problem**: Vector tile styling not working  
**Solution**: Check that `source-layer` matches the layer name from service metadata

### Debugging

```typescript
// Enable verbose logging
const service = new FeatureService('debug-source', map, {
  url: 'https://example.com/FeatureServer/0',
  useVectorTiles: true,
  useBoundingBox: true,
});

// Check service metadata
fetch('https://example.com/FeatureServer/0?f=json')
  .then(r => r.json())
  .then(metadata => {
    console.log('Service info:', metadata);
    console.log('Geometry type:', metadata.geometryType);
    console.log('Fields:', metadata.fields);
  });

// Monitor map sources
console.log('Map sources:', map.getStyle().sources);
console.log('Map layers:', map.getStyle().layers);

// Check vector tile support
fetch('https://example.com/VectorTileServer?f=json')
  .then(r => r.json())
  .then(data => console.log('Vector tile support:', data))
  .catch(() => console.log('No vector tile support'));

// Add fill layer
map.addLayer({
  id: 'states-fill',
  type: 'fill',
  source: 'states-source',
  paint: {
    'fill-color': '#088',
    'fill-opacity': 0.6,
  },
});

// Add stroke layer
map.addLayer({
  id: 'states-stroke',
  type: 'line',
  source: 'states-source',
  paint: {
    'line-color': '#000',
    'line-width': 1,
  },
});
```

## Filtered Query

```typescript
// Large states only
const largeStatesService = new FeatureService('large-states-source', map, {
  url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
  where: 'AREA > 100000',
  outFields: ['STATE_NAME', 'AREA'],
  orderByFields: 'AREA DESC',
});

map.addLayer({
  id: 'large-states',
  type: 'fill',
  source: 'large-states-source',
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'AREA'],
      50000,
      '#ffffcc',
      200000,
      '#a1dab4',
      400000,
      '#41b6c4',
      600000,
      '#225ea8',
    ],
  },
});
```

## Point Features

```typescript
// Cities with population data
const citiesService = new FeatureService('cities-source', map, {
  url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0',
  where: 'POP_RANK <= 3',
  outFields: ['CITY_NAME', 'POP', 'COUNTRY'],
  orderByFields: 'POP DESC',
});

// Add circle layer for cities
map.addLayer({
  id: 'cities-circle',
  type: 'circle',
  source: 'cities-source',
  paint: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['get', 'POP'],
      100000,
      4,
      1000000,
      8,
      10000000,
      16,
    ],
    'circle-color': '#ff6b6b',
    'circle-stroke-color': '#333',
    'circle-stroke-width': 1,
  },
});

// Add labels
map.addLayer({
  id: 'cities-labels',
  type: 'symbol',
  source: 'cities-source',
  layout: {
    'text-field': ['get', 'CITY_NAME'],
    'text-font': ['Open Sans Regular'],
    'text-size': 12,
    'text-offset': [0, 2],
  },
  paint: {
    'text-color': '#333',
    'text-halo-color': '#fff',
    'text-halo-width': 1,
  },
});
```

## Spatial Filtering

```typescript
// Features within a bounding box
const boundedService = new FeatureService('bounded-source', map, {
  url: 'https://services.arcgis.com/example/FeatureServer/0',
  geometry: {
    xmin: -125,
    ymin: 25,
    xmax: -65,
    ymax: 49,
  },
  geometryType: 'esriGeometryEnvelope',
  spatialRel: 'esriSpatialRelIntersects',
  outFields: '*',
});
```

## Dynamic Querying

```typescript
// Update query based on user input
function filterByState(stateName: string) {
  statesService.updateQuery({
    where: `STATE_NAME = '${stateName}'`,
    outFields: ['STATE_NAME', 'POP2000', 'AREA'],
  });
}

// Advanced query with multiple conditions
function complexQuery() {
  statesService.updateQuery({
    where: "POP2000 > 5000000 AND STATE_NAME LIKE 'C%'",
    orderByFields: 'POP2000 DESC',
    maxRecordCount: 10,
  });
}
```

## Pagination

```typescript
// Load features in pages
async function loadNextPage(offset: number = 0) {
  const pageSize = 1000;

  const features = await citiesService.query({
    where: '1=1',
    outFields: '*',
    resultOffset: offset,
    maxRecordCount: pageSize,
    orderByFields: 'OBJECTID',
  });

  console.log(`Loaded ${features.features.length} features`);

  // Load more if available
  if (features.features.length === pageSize) {
    await loadNextPage(offset + pageSize);
  }
}

loadNextPage();
```

## Real-time Updates

```typescript
// Refresh data periodically
setInterval(() => {
  statesService.refresh();
}, 30000); // Every 30 seconds

// Listen for source data updates
map.on('sourcedata', e => {
  if (e.sourceId === 'states-source' && e.isSourceLoaded) {
    console.log('States data updated');
  }
});
```

## Error Handling

```typescript
try {
  const service = new FeatureService('test-source', map, {
    url: 'https://services.arcgis.com/invalid/FeatureServer/0',
    where: '1=1',
  });
} catch (error) {
  console.error('Failed to create service:', error);
}

// Handle query errors
map.on('error', e => {
  if (e.error?.message?.includes('FeatureServer')) {
    console.error('Feature service error:', e.error);
  }
});
```

## Performance Tips

1. **Limit fields**: Only request needed fields with `outFields`
2. **Use spatial filtering**: Filter by geometry to reduce data transfer
3. **Apply WHERE clauses**: Filter at the server level when possible
4. **Implement pagination**: Use `maxRecordCount` and `resultOffset` for large datasets
5. **Cache results**: Store frequently accessed data locally
6. **Use appropriate geometry**: Simplify complex geometries if full detail isn't needed

## SQL WHERE Clause Examples

```sql
-- Simple equality
STATE_NAME = 'California'

-- Numeric comparison
POP2000 > 1000000

-- String patterns
CITY_NAME LIKE 'San%'

-- Date ranges
DATE_FIELD >= DATE '2023-01-01'

-- Multiple conditions
POP2000 > 500000 AND STATE_NAME IN ('CA', 'TX', 'NY')

-- Null checks
FIELD_NAME IS NOT NULL
```
