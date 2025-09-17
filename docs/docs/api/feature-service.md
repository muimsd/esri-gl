# FeatureService

For accessing [ArcGIS Feature Services](https://developers.arcgis.com/rest/services-reference/feature-service.htm) that provide GeoJSON-compatible vector features.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the MapLibre GL source |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Feature Service (see below) |
| geoJsonSourceOptions | `object` | Optional MapLibre GL GeoJSON source options |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the FeatureService layer |
| where | `string` | `'1=1'` | SQL WHERE clause to filter features |
| outFields | `Array<string> \| string` | `'*'` | Fields to include in response |
| geometry | `object` | | Geometry to spatially filter features |
| geometryType | `string` | | Type of geometry filter |
| spatialRel | `string` | `'esriSpatialRelIntersects'` | Spatial relationship |
| outSR | `number` | `4326` | Output spatial reference |
| returnGeometry | `boolean` | `true` | Include geometry in response |
| maxRecordCount | `number` | | Maximum features to return |
| resultOffset | `number` | | Starting record for pagination |
| orderByFields | `string` | | Fields to sort results by |
| token | `string` | | Authentication token |
| fetchOptions | `object` | | Fetch request options |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `query(options?)` | `Promise<GeoJSON.FeatureCollection>` | Query features with custom parameters |
| `updateQuery(options)` | `void` | Update query parameters and refresh |
| `refresh()` | `void` | Refresh data from service |

## Basic Example

```typescript
import { FeatureService } from 'esri-gl'

// US States
const statesService = new FeatureService('states-source', map, {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
    where: '1=1',
    outFields: ['STATE_NAME', 'POP2000', 'AREA']
})

// Add fill layer
map.addLayer({
    id: 'states-fill',
    type: 'fill',
    source: 'states-source',
    paint: {
        'fill-color': '#088',
        'fill-opacity': 0.6
    }
})

// Add stroke layer
map.addLayer({
    id: 'states-stroke',
    type: 'line',
    source: 'states-source', 
    paint: {
        'line-color': '#000',
        'line-width': 1
    }
})
```

## Filtered Query

```typescript
// Large states only
const largeStatesService = new FeatureService('large-states-source', map, {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
    where: 'AREA > 100000',
    outFields: ['STATE_NAME', 'AREA'],
    orderByFields: 'AREA DESC'
})

map.addLayer({
    id: 'large-states',
    type: 'fill',
    source: 'large-states-source',
    paint: {
        'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'AREA'],
            50000, '#ffffcc',
            200000, '#a1dab4', 
            400000, '#41b6c4',
            600000, '#225ea8'
        ]
    }
})
```

## Point Features

```typescript
// Cities with population data
const citiesService = new FeatureService('cities-source', map, {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0',
    where: 'POP_RANK <= 3',
    outFields: ['CITY_NAME', 'POP', 'COUNTRY'],
    orderByFields: 'POP DESC'
})

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
            100000, 4,
            1000000, 8,
            10000000, 16
        ],
        'circle-color': '#ff6b6b',
        'circle-stroke-color': '#333',
        'circle-stroke-width': 1
    }
})

// Add labels
map.addLayer({
    id: 'cities-labels',
    type: 'symbol',
    source: 'cities-source',
    layout: {
        'text-field': ['get', 'CITY_NAME'],
        'text-font': ['Open Sans Regular'],
        'text-size': 12,
        'text-offset': [0, 2]
    },
    paint: {
        'text-color': '#333',
        'text-halo-color': '#fff',
        'text-halo-width': 1
    }
})
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
        ymax: 49
    },
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*'
})
```

## Dynamic Querying

```typescript
// Update query based on user input
function filterByState(stateName: string) {
    statesService.updateQuery({
        where: `STATE_NAME = '${stateName}'`,
        outFields: ['STATE_NAME', 'POP2000', 'AREA']
    })
}

// Advanced query with multiple conditions
function complexQuery() {
    statesService.updateQuery({
        where: "POP2000 > 5000000 AND STATE_NAME LIKE 'C%'",
        orderByFields: 'POP2000 DESC',
        maxRecordCount: 10
    })
}
```

## Pagination

```typescript
// Load features in pages
async function loadNextPage(offset: number = 0) {
    const pageSize = 1000
    
    const features = await citiesService.query({
        where: '1=1',
        outFields: '*',
        resultOffset: offset,
        maxRecordCount: pageSize,
        orderByFields: 'OBJECTID'
    })
    
    console.log(`Loaded ${features.features.length} features`)
    
    // Load more if available
    if (features.features.length === pageSize) {
        await loadNextPage(offset + pageSize)
    }
}

loadNextPage()
```

## Real-time Updates

```typescript
// Refresh data periodically
setInterval(() => {
    statesService.refresh()
}, 30000) // Every 30 seconds

// Listen for source data updates
map.on('sourcedata', (e) => {
    if (e.sourceId === 'states-source' && e.isSourceLoaded) {
        console.log('States data updated')
    }
})
```

## Error Handling

```typescript
try {
    const service = new FeatureService('test-source', map, {
        url: 'https://services.arcgis.com/invalid/FeatureServer/0',
        where: '1=1'
    })
} catch (error) {
    console.error('Failed to create service:', error)
}

// Handle query errors
map.on('error', (e) => {
    if (e.error?.message?.includes('FeatureServer')) {
        console.error('Feature service error:', e.error)
    }
})
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