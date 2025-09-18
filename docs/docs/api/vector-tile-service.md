# VectorTileService

For accessing [ArcGIS Vector Tile Services](https://developers.arcgis.com/rest/services-reference/vector-tile-service.htm) that provide pre-generated vector tiles for fast rendering and client-side styling.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the MapLibre GL source |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Vector Tile Service (see below) |
| vectorSourceOptions | `object` | Optional MapLibre GL vector source options |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the Vector Tile Service |
| token | `string` | | Authentication token for secured services |
| fetchOptions | `object` | | Additional fetch request options |

## Vector Source Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| minzoom | `number` | `0` | Minimum zoom level for tiles |
| maxzoom | `number` | `22` | Maximum zoom level for tiles |
| attribution | `string` | | Attribution text for the service |

## Usage

### Basic Example

```typescript
import { Map } from 'maplibre-gl';
import { VectorTileService } from 'esri-gl';

const map = new Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-118, 34],
  zoom: 10
});

map.on('load', () => {
  // Create the vector tile service
  const vectorService = new VectorTileService('parcels-source', map, {
    url: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels/VectorTileServer'
  });

  // Add a layer using the vector tiles
  map.addLayer({
    id: 'parcels-fill',
    type: 'fill',
    source: 'parcels-source',
    'source-layer': 'Santa Monica Mountains Parcels', // Layer name from the service
    paint: {
      'fill-color': '#007cbf',
      'fill-opacity': 0.6
    }
  });

  // Add stroke for parcel boundaries
  map.addLayer({
    id: 'parcels-stroke',
    type: 'line',
    source: 'parcels-source',
    'source-layer': 'Santa Monica Mountains Parcels',
    paint: {
      'line-color': '#004494',
      'line-width': 1
    }
  });
});
```

### Advanced Styling

```typescript
// Create service with custom options
const vectorService = new VectorTileService('roads-source', map, {
  url: 'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/world_countries/VectorTileServer'
}, {
  minzoom: 2,
  maxzoom: 18,
  attribution: '© My Custom Attribution'
});

// Add multiple styled layers from the same source
map.addLayer({
  id: 'countries-fill',
  type: 'fill',
  source: 'roads-source',
  'source-layer': 'countries',
  paint: {
    'fill-color': [
      'case',
      ['==', ['get', 'NAME'], 'United States'], '#ff0000',
      ['==', ['get', 'NAME'], 'Canada'], '#00ff00',
      '#cccccc'
    ],
    'fill-opacity': 0.7
  }
});

map.addLayer({
  id: 'countries-borders',
  type: 'line',
  source: 'roads-source',
  'source-layer': 'countries',
  paint: {
    'line-color': '#333333',
    'line-width': 2
  }
});

// Add labels
map.addLayer({
  id: 'countries-labels',
  type: 'symbol',
  source: 'roads-source',
  'source-layer': 'countries',
  layout: {
    'text-field': ['get', 'NAME'],
    'text-font': ['Open Sans Bold'],
    'text-size': 12
  },
  paint: {
    'text-color': '#333333',
    'text-halo-color': '#ffffff',
    'text-halo-width': 2
  }
});
```

### Dynamic Layer Management

```typescript
class VectorTileManager {
  private service: VectorTileService;
  private map: Map;

  constructor(map: Map) {
    this.map = map;
    this.service = new VectorTileService('dynamic-source', map, {
      url: 'https://example.com/VectorTileServer'
    });
  }

  addLayer(layerConfig: any) {
    this.map.addLayer({
      ...layerConfig,
      source: 'dynamic-source'
    });
  }

  removeLayer(layerId: string) {
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
  }

  updateLayerStyle(layerId: string, property: string, value: any) {
    this.map.setPaintProperty(layerId, property, value);
  }

  cleanup() {
    this.service.remove();
  }
}
```

## Methods

### `remove()`

Removes the vector tile source and cleans up resources.

```typescript
const service = new VectorTileService('temp-source', map, { url: '...' });

// Later, remove the service
service.remove();
```

### `update(options)`

Updates the service options and refreshes the tiles.

```typescript
service.update({
  url: 'https://new-service-url.com/VectorTileServer'
});
```

## Integration with MapLibre/Mapbox GL

Vector tiles work seamlessly with MapLibre GL JS and Mapbox GL JS styling:

### Feature State

```typescript
// Set feature state for dynamic styling
map.on('click', 'parcels-fill', (e) => {
  if (e.features.length > 0) {
    map.setFeatureState(
      { 
        source: 'parcels-source', 
        sourceLayer: 'Santa Monica Mountains Parcels',
        id: e.features[0].id 
      },
      { clicked: true }
    );
  }
});

// Use feature state in paint properties
map.setPaintProperty('parcels-fill', 'fill-color', [
  'case',
  ['boolean', ['feature-state', 'clicked'], false],
  '#ff0000',
  '#007cbf'
]);
```

### Popup Integration

```typescript
map.on('click', 'parcels-fill', (e) => {
  const coordinates = e.lngLat;
  const properties = e.features[0].properties;

  new maplibregl.Popup()
    .setLngLat(coordinates)
    .setHTML(`
      <h3>${properties.OWNER_NAME}</h3>
      <p><strong>Parcel ID:</strong> ${properties.PARCEL_ID}</p>
      <p><strong>Area:</strong> ${properties.AREA_SQFT} sq ft</p>
    `)
    .addTo(map);
});
```

## Performance Considerations

### Zoom-Based Layer Visibility

```typescript
// Show different layers at different zoom levels
map.addLayer({
  id: 'parcels-overview',
  type: 'fill',
  source: 'parcels-source',
  'source-layer': 'parcels',
  maxzoom: 12,
  paint: {
    'fill-color': '#007cbf',
    'fill-opacity': 0.3
  }
});

map.addLayer({
  id: 'parcels-detailed',
  type: 'fill',
  source: 'parcels-source',
  'source-layer': 'parcels',
  minzoom: 12,
  paint: {
    'fill-color': '#007cbf',
    'fill-opacity': 0.6
  }
});
```

### Memory Management

```typescript
// Clean up when switching between different datasets
const switchDataset = (newUrl: string) => {
  // Remove existing layers
  ['parcels-fill', 'parcels-stroke'].forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });

  // Remove and recreate service
  service.remove();
  service = new VectorTileService('parcels-source', map, {
    url: newUrl
  });

  // Add layers back
  addParcelLayers();
};
```

## Error Handling

```typescript
try {
  const service = new VectorTileService('test-source', map, {
    url: 'https://invalid-service.com/VectorTileServer'
  });
} catch (error) {
  console.error('Failed to create vector tile service:', error);
}

// Listen for source events
map.on('sourcedata', (e) => {
  if (e.sourceId === 'test-source') {
    if (e.isSourceLoaded) {
      console.log('Vector tiles loaded successfully');
    }
  }
});

map.on('sourcedataloading', (e) => {
  if (e.sourceId === 'test-source') {
    console.log('Loading vector tiles...');
  }
});

map.on('error', (e) => {
  console.error('Map error:', e);
});
```

## Best Practices

1. **Source Layer Names**: Always check the service metadata for correct source layer names
2. **Zoom Levels**: Use appropriate min/max zoom levels to optimize performance
3. **Feature State**: Use feature state for dynamic styling instead of data-driven styling when possible
4. **Memory Management**: Always call `remove()` when cleaning up services
5. **Attribution**: Include proper attribution for Esri services

## Troubleshooting

### Common Issues

**Problem**: Layers not appearing  
**Solution**: Verify the `source-layer` name matches the layer name from the service metadata

**Problem**: Poor performance with complex styling  
**Solution**: Use zoom-based layer visibility and simplify paint expressions

**Problem**: Features not clickable  
**Solution**: Ensure the layer type supports interaction (fill, line, circle, symbol)

### Debugging

```typescript
// Check service metadata
fetch('https://your-service.com/VectorTileServer?f=json')
  .then(r => r.json())
  .then(metadata => {
    console.log('Available layers:', metadata.layers);
    console.log('Tile info:', metadata.tileInfo);
  });

// Debug map sources
console.log('Map sources:', map.getStyle().sources);
console.log('Map layers:', map.getStyle().layers);
```