# FeatureService Example

The `FeatureService` class allows you to add Esri Feature Services as GeoJSON sources to your mapbox-gl or maplibre-gl map.

## Basic Usage

```javascript
import { FeatureService } from 'esri-gl'

// Create a FeatureService instance
const featureService = new FeatureService(
  'my-feature-source', // source ID
  map, // mapbox-gl or maplibre-gl map instance
  {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
    where: '1=1',
    outFields: '*',
    f: 'geojson'
  }
)

// Add a layer to display the features
map.addLayer({
  id: 'my-feature-layer',
  type: 'fill',
  source: 'my-feature-source',
  paint: {
    'fill-color': '#088',
    'fill-opacity': 0.8
  }
})
```

## Advanced Options

```javascript
const featureService = new FeatureService(
  'advanced-source',
  map,
  {
    url: 'https://services.arcgis.com/example/FeatureServer/0',
    where: 'STATE_NAME = "California"',
    outFields: ['STATE_NAME', 'POP2000', 'AREA'],
    layers: [0],
    f: 'geojson',
    maxRecordCount: 1000,
    returnGeometry: true,
    spatialRel: 'esriSpatialRelIntersects',
    token: 'your-token-here' // if authentication is required
  },
  {
    // GeoJSON source options
    maxzoom: 14,
    buffer: 64,
    tolerance: 0.375
  }
)
```

## Dynamic Queries

```javascript
// Update the where clause
featureService.setWhere('POP2000 > 1000000')

// Update output fields
featureService.setOutFields(['STATE_NAME', 'POP2000'])

// Set specific layers
featureService.setLayers([0, 1])

// Set spatial filter
featureService.setGeometry({
  xmin: -120,
  ymin: 35,
  xmax: -115,
  ymax: 40
}, 'esriGeometryEnvelope')

// Clear spatial filter
featureService.clearGeometry()

// Set maximum record count
featureService.setMaxRecordCount(500)
```

## Query Features

```javascript
// Query features with custom options
const results = await featureService.queryFeatures({
  where: 'STATE_NAME LIKE "C%"',
  outFields: ['STATE_NAME'],
  returnGeometry: false
})

console.log(results.features)
```

## Cleanup

```javascript
// Remove the source and associated layers
featureService.remove()
```

## Feature Service Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `url` | `string` | Feature service URL (required) | - |
| `layers` | `number[]` \| `number` | Layer IDs to query | - |
| `where` | `string` | SQL where clause | `'1=1'` |
| `outFields` | `string` \| `string[]` | Fields to return | `'*'` |
| `f` | `'json'` \| `'geojson'` \| `'pbf'` | Response format | `'geojson'` |
| `returnGeometry` | `boolean` | Include geometry | `true` |
| `spatialRel` | `string` | Spatial relationship | `'esriSpatialRelIntersects'` |
| `geometry` | `object` | Spatial filter geometry | - |
| `geometryType` | `string` | Geometry type | `'esriGeometryEnvelope'` |
| `inSR` | `string` | Input spatial reference | `'4326'` |
| `outSR` | `string` | Output spatial reference | `'4326'` |
| `maxRecordCount` | `number` | Maximum features to return | `1000` |
| `token` | `string` | Authentication token | - |
| `getAttributionFromService` | `boolean` | Use service attribution | `true` |

## GeoJSON Source Options

All standard mapbox-gl GeoJSON source options are supported:

- `maxzoom` - Maximum zoom level
- `buffer` - Tile buffer on each side
- `tolerance` - Douglas-Peucker simplification tolerance
- `cluster` - Enable clustering
- `clusterRadius` - Cluster radius
- `clusterMaxZoom` - Maximum zoom for clustering
- `lineMetrics` - Enable line distance metrics
- `generateId` - Generate feature IDs
