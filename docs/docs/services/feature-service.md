# FeatureService

Integrates ArcGIS Feature Services with MapLibre GL JS and Mapbox GL JS, providing vector data with smart vector tile detection, GeoJSON fallback, and advanced querying capabilities.

## Live Demo

<iframe 
    src="/examples/feature-service-basic.html"
    width="100%" 
    height="500px"
    frameBorder="0"
    title="Basic FeatureService Demo">
</iframe>

*Interactive example showing FeatureService with various ArcGIS Feature Services*

## Overview

FeatureService provides intelligent integration with ArcGIS Feature Services by automatically detecting the best data format:

- **Smart Vector Tile Detection** - Automatically detects and uses vector tile endpoints when available
- **GeoJSON Fallback** - Falls back to GeoJSON queries for services without vector tiles
- **Dynamic Querying** - Server-side filtering with SQL-like where clauses
- **Bounding Box Optimization** - Loads only data within the current viewport
- **Real-time Updates** - Supports live data refresh and dynamic styling

## Basic Usage

```typescript
import { FeatureService } from 'esri-gl';

// Create FeatureService
const featureService = new FeatureService('features-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0'
});

// Add as vector layer
map.addLayer({
  id: 'features-layer',
  type: 'circle',
  source: 'features-source',
  paint: {
    'circle-radius': 5,
    'circle-color': '#007cbf',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff'
  }
});
```

## Configuration Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | **required** | ArcGIS Feature Service URL |
| `where` | `string` | `'1=1'` | SQL WHERE clause for server-side filtering |
| `outFields` | `string` | `'*'` | Comma-separated list of fields to return |
| `maxRecordCount` | `number` | `1000` | Maximum features per request |

### Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bbox` | `boolean` | `true` | Enable bounding box filtering |
| `useVectorTiles` | `boolean` | `auto` | Force vector tiles (auto-detected by default) |
| `refreshInterval` | `number` | `0` | Auto-refresh interval in milliseconds |
| `simplificationFactor` | `number` | `0.5` | Geometry simplification (0-1) |

## Smart Vector Tile Detection

FeatureService automatically detects vector tile capabilities:

```typescript
// Automatically uses vector tiles if available
const smartService = new FeatureService('smart-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0'
  // Vector tiles will be used automatically if supported
});

// Force GeoJSON mode
const geoJsonService = new FeatureService('geojson-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0',
  useVectorTiles: false
});
```

## Server-Side Filtering

Apply SQL-like filters to reduce data transfer:

```typescript
// Filter by attribute
const filteredService = new FeatureService('filtered-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0',
  where: "SPECIES = 'Oak' AND HEIGHT > 20",
  outFields: 'SPECIES,HEIGHT,DIAMETER'
});

// Date-based filtering
const recentService = new FeatureService('recent-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Incidents/FeatureServer/0',
  where: "DATE_CREATED > date '2023-01-01'"
});
```

## Dynamic Updates

```typescript
const dynamicService = new FeatureService('dynamic-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/LiveData/FeatureServer/0',
  refreshInterval: 30000, // Refresh every 30 seconds
  where: 'STATUS = \'ACTIVE\''
});

// Update filter dynamically
dynamicService.setWhere('STATUS = \'PENDING\'');

// Update fields
dynamicService.setOutFields('STATUS,PRIORITY,TIMESTAMP');
```

## Automatic Styling with getStyle()

FeatureService provides a `getStyle()` method that automatically returns appropriate styling based on the service's geometry type:

```typescript
const featureService = new FeatureService('census-source', map, {
  url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_Populated_Places/FeatureServer/0'
});

// Wait for source to be ready
await new Promise((resolve) => {
  const checkSource = () => {
    if (map.getSource('census-source')) {
      resolve();
    } else {
      setTimeout(checkSource, 100);
    }
  };
  checkSource();
});

// Get appropriate style for the geometry type
const layerStyle = await featureService.getStyle();

// Add layer with auto-generated styling
map.addLayer({
  id: 'census-layer',
  ...layerStyle
});
```

**Auto-Generated Styles by Geometry Type:**
- **Points** → `circle` layer with radius and stroke
- **Lines** → `line` layer with color and width  
- **Polygons** → `fill` layer with color and outline
- **Vector Tiles** → Includes appropriate `source-layer` configuration

## Custom Styling Vector Data

FeatureService works seamlessly with MapLibre/Mapbox styling:

```typescript
// Point features
map.addLayer({
  id: 'points-layer',
  type: 'circle',
  source: 'features-source',
  paint: {
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 
      10, 3,
      15, 8
    ],
    'circle-color': [
      'case',
      ['==', ['get', 'STATUS'], 'HIGH'], '#ff0000',
      ['==', ['get', 'STATUS'], 'MEDIUM'], '#ffaa00', 
      '#00ff00'
    ]
  }
});

// Line features
map.addLayer({
  id: 'lines-layer',
  type: 'line',
  source: 'features-source',
  paint: {
    'line-width': 3,
    'line-color': '#007cbf'
  }
});

// Polygon features
map.addLayer({
  id: 'polygons-layer',
  type: 'fill',
  source: 'features-source',
  paint: {
    'fill-color': 'rgba(0, 124, 191, 0.3)',
    'fill-outline-color': '#007cbf'
  }
});
```

## Querying Features

Use built-in identify and query capabilities:

```typescript
// Click to identify
map.on('click', 'features-layer', async (e) => {
  const features = await featureService.identify(e.lngLat);
  if (features.length > 0) {
    // Show popup with feature properties
    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${features[0].properties.NAME}</strong>`)
      .addTo(map);
  }
});

// Programmatic querying
const results = await featureService.query({
  where: 'POPULATION > 100000',
  geometry: boundingBox,
  spatialRel: 'esriSpatialRelIntersects'
});
```

## Performance Considerations

### Vector Tiles vs GeoJSON

- **Vector Tiles**: Better for large datasets, client-side styling
- **GeoJSON**: Better for small datasets, complex server-side queries

### Optimization Tips

```typescript
// Limit fields for better performance
const optimizedService = new FeatureService('optimized-source', map, {
  url: 'https://services.arcgis.com/example/FeatureServer/0',
  outFields: 'NAME,STATUS', // Only needed fields
  maxRecordCount: 500,      // Reasonable limit
  simplificationFactor: 0.8 // Simplify geometry
});

// Use bounding box filtering
const bboxService = new FeatureService('bbox-source', map, {
  url: 'https://services.arcgis.com/example/FeatureServer/0',
  bbox: true // Only load features in viewport
});
```

## Error Handling

```typescript
try {
  const featureService = new FeatureService('features-source', map, {
    url: 'https://services.arcgis.com/example/FeatureServer/0'
  });
  
  map.addLayer({
    id: 'features-layer',
    type: 'circle',
    source: 'features-source'
  });
} catch (error) {
  console.error('FeatureService error:', error);
  // Fallback handling
}
```

## Feature Editing

FeatureService supports creating, updating, and deleting features on editable ArcGIS Feature Services:

```typescript
const service = new FeatureService('editable-source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  token: 'your-agol-token'
});

// Add new features
const addResults = await service.addFeatures([
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-118.24, 34.05] },
    properties: { name: 'Los Angeles', population: 3979576 }
  }
]);

// Update existing features (must include OBJECTID)
const updateResults = await service.updateFeatures([
  {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-118.24, 34.05] },
    properties: { OBJECTID: 1, population: 4000000 }
  }
]);

// Delete features by ID
const deleteResults = await service.deleteFeatures({ objectIds: [1, 2, 3] });

// Or delete by WHERE clause
const deleteByQuery = await service.deleteFeatures({ where: "STATUS = 'INACTIVE'" });

// Batch edits in a single request
const batchResults = await service.applyEdits({
  adds: [newFeature1, newFeature2],
  updates: [updatedFeature],
  deletes: [10, 11, 12]
});
```

## Attachments

Query, add, and delete file attachments on features:

```typescript
// Query attachments for a feature
const attachments = await service.queryAttachments(objectId);
console.log(attachments); // [{ id: 1, name: 'photo.jpg', contentType: 'image/jpeg', size: 12345 }]

// Add an attachment
const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
const result = await service.addAttachment(objectId, file);

// Delete attachments
await service.deleteAttachments(objectId, [1, 2]);
```

## Authentication

FeatureService supports multiple authentication methods:

```typescript
// Token-based authentication (URL parameter)
const tokenService = new FeatureService('source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  token: 'your-auth-token'
});

// Update token dynamically
tokenService.setToken('refreshed-token');

// API Key authentication (X-Esri-Authorization header)
const apiKeyService = new FeatureService('source', map, {
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  apiKey: 'your-api-key'
});

// Listen for authentication errors
apiKeyService.on('authenticationrequired', async (error) => {
  console.log('Auth required, refreshing token...');
  const newToken = await refreshToken();
  apiKeyService.setToken(newToken);
});
```

## AGOL Error Handling

The service automatically detects ArcGIS Online error responses (HTTP 200 with JSON error body) and surfaces them as proper errors:

```typescript
try {
  const results = await service.addFeatures([feature]);
} catch (error) {
  if (error.code === 498 || error.code === 499) {
    // Token expired or invalid - refresh and retry
    service.setToken(await refreshToken());
  } else {
    console.error('Service error:', error.message, error.details);
  }
}
```

## Next Steps

- 📚 [API Reference](../api/feature-service) - Complete FeatureService API
- 🎯 [Query Task](../tasks/query) - Advanced querying capabilities  
- 🔍 [Find Task](../tasks/find) - Text-based search functionality
